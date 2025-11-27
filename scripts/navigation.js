// Navigation Module
import { loadPage } from './loader.js';

export function initializeNavigation() {
    // Navigation button handlers
    const navButtons = {
        'dashboardNav': { 
            page: 'pages/dashboard.html', 
            title: 'Dashboard', 
            subtitle: 'Overview of your business performance' 
        },
        'inventoryNav': { 
            page: 'pages/inventory.html', 
            title: 'Inventory', 
            subtitle: 'Manage your products and stock levels' 
        },
        'roomRentalNav': { 
            page: 'pages/rooms.html', 
            title: 'Room Rentals', 
            subtitle: 'Manage rooms and leases' 
        },
        'accountingNav': { 
            page: 'pages/accounting.html', 
            title: 'Accounting', 
            subtitle: 'Financial overview and transactions' 
        },
        'paymentSummaryNav': { 
            page: 'pages/payment-summary.html', 
            title: 'Payment & Credit Tracker', 
            subtitle: 'Monitor overdue payments, track balances, and manage due dates' 
        }
    };

    Object.keys(navButtons).forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', async () => {
                const { page, title, subtitle } = navButtons[buttonId];
                
                // Update active state
                document.querySelectorAll('nav button').forEach(btn => {
                    btn.classList.remove('bg-yellow-accent', 'text-gray-900');
                    btn.classList.add('text-gray-600', 'hover:bg-gray-100');
                });
                button.classList.add('bg-yellow-accent', 'text-gray-900');
                button.classList.remove('text-gray-600', 'hover:bg-gray-100');

                // Update page title
                document.getElementById('pageTitle').textContent = title;
                document.getElementById('pageSubtitle').textContent = subtitle;

                // Load page content
                await loadPage(page, 'mainContent');

                // Trigger page-specific initializations
                if (buttonId === 'inventoryNav') {
                    window.initInventoryPage();
                } else if (buttonId === 'roomRentalNav') {
                    window.initRoomsPage();
                } else if (buttonId === 'accountingNav') {
                    window.initAccountingPage();
                } else if (buttonId === 'paymentSummaryNav') {
                    window.initPaymentSummaryPage();
                } else if (buttonId === 'dashboardNav') {
                    window.initDashboardPage();
                }
            });
        }
    });

    // Set current date and time (Philippine Time)
    function updateDateTime() {
        const now = new Date();
        
        // Philippine Time
        const phTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
        
        const currentDateElement = document.getElementById('currentDate');
        if (currentDateElement) {
            const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
            currentDateElement.textContent = phTime.toLocaleDateString('en-US', dateOptions);
        }
        
        const currentTimeElement = document.getElementById('currentTime');
        if (currentTimeElement) {
            const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
            currentTimeElement.textContent = phTime.toLocaleTimeString('en-US', timeOptions) + ' PH';
        }
    }
    
    // Update immediately and then every second
    updateDateTime();
    setInterval(updateDateTime, 1000);
}
