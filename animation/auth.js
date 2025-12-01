// Authentication Guard - Protect index.html from unauthorized access
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_CONFIG } from "../config/credentials.js";

const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// Double-check authentication status on page load (redundant security layer)
window.addEventListener("DOMContentLoaded", async () => {
    // Get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession();

    // If no valid session, redirect to login (should never reach here due to inline check)
    if (!session || error) {
        console.log("⚠️ No valid session found. Redirecting to login...");
        
        // Clear any stale localStorage data
        localStorage.clear();
        sessionStorage.clear();
        
        // Force redirect to login page
        window.location.replace("Log In.html");
        return;
    }

    // Valid session exists - ensure page content is visible
    document.body.style.display = '';
    
    // Store user data in localStorage for quick access
    const user = session.user;
    localStorage.setItem("userEmail", user.email);
    localStorage.setItem("userId", user.id);
    localStorage.setItem("isLoggedIn", "true");
    
    if (user.user_metadata) {
        localStorage.setItem("userFullName", user.user_metadata.full_name || "");
        localStorage.setItem("userOfficeUnit", user.user_metadata.office_unit || "");
    }
    
    // Update welcome message with user's full name
    const welcomeMessageEl = document.getElementById("welcomeMessage");
    if (welcomeMessageEl) {
        const displayName = user.user_metadata?.full_name || user.email.split('@')[0];
        welcomeMessageEl.textContent = `Welcome, ${displayName}`;
    }

    console.log("✅ User authenticated:", user.email);
    console.log("👤 Display name:", user.user_metadata?.full_name || user.email.split('@')[0]);
});

// Listen for auth state changes (logout, token expiration, etc.)
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || !session) {
        console.log("User signed out. Redirecting to login...");
        
        // Clear localStorage
        localStorage.clear();
        
        // Redirect to login
        window.location.href = "Log In.html";
    }
});
