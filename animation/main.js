// ✅ Initialize Supabase Client
const supabaseUrl = "https://ikfkurukbbtjpgkjqsvx.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlrZmt1cnVrYmJ0anBna2pxc3Z4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyMjczMTEsImV4cCI6MjA3NTgwMzMxMX0.djdhKIf3XAdtslvxHSQAgtpIJZBs_flWwoegXfvYSgk";
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ...existing code from the script section...
// (Copy all the JavaScript code from the HTML file here)

// 🔸 Local array to hold live data
let inventory = [];

// 🔸 Function: Load inventory from Supabase
async function loadInventory() {
    const { data, error } = await supabase.from("inventory").select("*").order("id", { ascending: true });

    if (error) {
        console.error("❌ Failed to load inventory:", error.message);
        alert("Error loading inventory — check console.");
        return;
    }

    inventory = data || [];
    console.log(`✅ Loaded ${inventory.length} items from Supabase.`);
    renderInventory();
}

// ...rest of the JavaScript code...
