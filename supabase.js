// Supabase project URL
const SUPABASE_URL = "https://srevfiolvgegiukoanin.supabase.co"

// Public anon key (safe to expose in frontend)
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyZXZmaW9sdmdlZ2l1a29hbmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNTI5NjIsImV4cCI6MjA4ODcyODk2Mn0.wECjk4RIWCojyn9o7N0svy8aE9OaoYzh3Y9Yhg_SnRk"

// Create Supabase client instance
// This allows the frontend to talk to Supabase
const supabase = window.supabase.createClient(
 SUPABASE_URL,
 SUPABASE_KEY
)