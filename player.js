// Retrieve stored player id if the user already joined
let playerId = localStorage.getItem("player_id")

// Track current round
let currentRound = 1


// UI Elements
const joinScreen = document.getElementById("joinScreen")
const gameScreen = document.getElementById("gameScreen")

const scenarioText = document.getElementById("scenario")
const timerText = document.getElementById("timer")

const answerBox = document.getElementById("answerBox")
const submitBtn = document.getElementById("submitBtn")

const statusMsg = document.getElementById("statusMsg")


// If player already joined previously (stored in browser)
if(playerId){

 joinScreen.style.display="none"
 gameScreen.style.display="block"

}


// Join game button
document.getElementById("joinBtn").onclick = async ()=>{

 const code = document.getElementById("codeInput").value
 const name = document.getElementById("nameInput").value
 const table = document.getElementById("tableInput").value

 // Simple game code check
 if(code !== "LOVE2026"){

   alert("Invalid Game Code")
   return

 }

 const {data} = await supabaseClient
 .from("players")
 .insert({
   name:name,
   table_number:table,
   created_at:new Date()
 })
 .select()
 .single()

 playerId = data.id

 localStorage.setItem("player_id",playerId)

 joinScreen.style.display="none"
 gameScreen.style.display="block"

}


// Submit answer button
submitBtn.onclick = async ()=>{

 // Insert answer into database
 await supabaseClient
 .from("answers")
 .insert({

  player_id:playerId,
  round_number:currentRound,
  answer_text:answerBox.value

 })

 // Lock input after submission
 answerBox.disabled=true
 submitBtn.disabled=true

 statusMsg.innerText="Answer submitted!"

}


// Enable typing
function enableInput(){

 answerBox.disabled=false
 submitBtn.disabled=false

}


// Disable typing
function disableInput(){

 answerBox.disabled=true
 submitBtn.disabled=true

}


// Load scenario from database
async function loadScenario(round){

 const {data}=await supabaseClient
 .from("scenarios")
 .select("*")
 .eq("round_number",round)
 .single()

 scenarioText.innerText=data.scenario_text

}


// Countdown timer
function startTimer(endTime){

 const interval=setInterval(()=>{

  const now=Date.now()
  const end=new Date(endTime).getTime()

  const remaining=Math.floor((end-now)/1000)

  timerText.innerText="Time Left: "+remaining+"s"

  // Stop timer when time is up
  if(remaining<=0){

   disableInput()
   clearInterval(interval)

  }

 },1000)

}


// Handle game session updates
function handleSession(session){

 currentRound=session.current_round

 // Round is active
 if(session.status==="playing"){

  loadScenario(currentRound)

  enableInput()

  startTimer(session.round_end_time)

 }

 // AI judging phase
 if(session.status==="revealing"){

  disableInput()

  statusMsg.innerText="AI judging answers..."

 }

 // Game finished
 if(session.status==="finished"){

  disableInput()

  statusMsg.innerText="Game Over!"

 }

}


// Realtime listener for game state updates
supabaseClient
.channel("session")
.on(
 "postgres_changes",
 {
  event:"UPDATE",
  schema:"public",
  table:"game_sessions"
 },
 payload=>{

  handleSession(payload.new)

 }
)
.subscribe()
