// Current round number
let currentRound = 1

// Answer counter for current round
let answerCount = 0

// UI elements
const scenarioText = document.getElementById("scenario")
const counter = document.getElementById("counter")


// Load scenario text
async function loadScenario(){

 const {data} = await supabaseClient
 .from("scenarios")
 .select("*")
 .eq("round_number",currentRound)
 .single()

 scenarioText.innerText = data.scenario_text

}


// Start game button
document.getElementById("startBtn").onclick = async ()=>{

 const endTime = new Date(Date.now() + 60000)

 const { data } = await supabaseClient
  .from("game_sessions")
  .select("*")
  .single()

 await supabaseClient
  .from("game_sessions")
  .update({
   status: "playing",
   current_round: 1,
   round_end_time: endTime
  })
  .eq("id", data.id)

}


// Next round button
document.getElementById("nextBtn").onclick = async ()=>{

 currentRound++

 if(currentRound>3){

  await supabaseClient
  .from("game_sessions")
  .update({status:"finished"})

  return

 }

 const endTime = new Date(Date.now()+60000)

 answerCount=0
 counter.innerText="Answers: 0"

 await supabaseClient
 .from("game_sessions")
 .update({

  status:"playing",
  current_round:currentRound,
  round_end_time:endTime

 })

 loadScenario()

}


// Realtime answer listener
supabaseClient
.channel("answers")
.on(
 "postgres_changes",
 {
  event:"INSERT",
  schema:"public",
  table:"answers"
 },
 payload=>{

  // Only count answers for current round
  if(payload.new.round_number === currentRound){

   answerCount++

   counter.innerText = "Answers: "+answerCount

  }

 }
)
.subscribe()


// AI evaluation button
document.getElementById("evaluateBtn").onclick = async ()=>{

 // Get scenario
 const {data:scenario} = await supabaseClient
 .from("scenarios")
 .select("*")
 .eq("round_number",currentRound)
 .single()

 // Get answers
 const {data:answers} = await supabaseClient
 .from("answers")
 .select(`
 answer_text,
 players(name)
 `)
 .eq("round_number",currentRound)


 // Format answers for AI
 const payload = answers.map(a=>({

  name:a.players.name,
  answer:a.answer_text

 }))


 // Call supabaseClient edge function
 const res = await fetch(

 `${supabaseClient_URL}/functions/v1/judge-round`,
 {

  method:"POST",

  headers:{
   "Content-Type":"application/json",
   "Authorization":"Bearer "+supabaseClient_KEY
  },

  body:JSON.stringify({

   scenario:scenario.scenario_text,
   answers:payload

  })

 }

 )


 const ai = await res.json()

 const result = JSON.parse(ai.choices[0].message.content)


 // Save AI results
 await supabaseClient
 .from("round_results")
 .insert({

  round_number:currentRound,
  funniest_player:result.funniest_player,
  funniest_answer:result.funniest_answer,
  best_player:result.best_player,
  best_answer:result.best_answer

 })


 // Move game state to revealing
 await supabaseClient
 .from("game_sessions")
 .update({status:"revealing"})

}


// Realtime results listener
supabaseClient
.channel("results")
.on(
 "postgres_changes",
 {
  event:"INSERT",
  schema:"public",
  table:"round_results"
 },
 payload=>{

  const r=payload.new

  document.getElementById("results").innerHTML=`

  <h2>😂 Funniest</h2>
  <p>${r.funniest_answer}</p>
  <p>${r.funniest_player}</p>

  <h2>💡 Best Advice</h2>
  <p>${r.best_answer}</p>
  <p>${r.best_player}</p>

  `

 }
)
.subscribe()
