import * as inventoryModule from './inventory-module.js';
import * as roomsModule from './rooms-module.js';
import * as bookingsModule from './bookings-module.js';

// Make modules available globally for onclick handlers
window.inventoryModule = inventoryModule;
window.roomsModule = roomsModule;
window.bookingsModule = bookingsModule;

// Initialize app when DOM is ready
window.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 SmartStock App Initializing...");
    
    // Load all data
    await Promise.all([
        inventoryModule.loadInventory(),
        roomsModule.loadRooms(),
        bookingsModule.loadBookings()
    ]);
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Update current date
    updateCurrentDate();
    
    console.log("✅ SmartStock App Ready");
});

function initializeEventListeners() {
    // Inventory filters
    document.getElementById('searchInput')?.addEventListener('input', inventoryModule.filterInventory);
    document.getElementById('categoryFilter')?.addEventListener('change', inventoryModule.filterInventory);
    document.getElementById('departmentFilter')?.addEventListener('change', inventoryModule.filterInventory);
    
    // Add more event listeners as needed
}

function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', options);
    }
}
