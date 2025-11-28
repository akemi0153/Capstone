// Main Application Script
import { loadComponent, loadPage } from './loader.js';
import { initializeNavigation } from './navigation.js';
import { loadInventory, renderInventory, deleteInventoryItem, filterInventory, recordStockTransaction, clearStockTransactions, populateMonthFilter, exportStockHistoryCSV } from './inventory.js';
import { loadRooms, renderRooms, deleteRoom, updateRoomDropdown, filterRooms } from './rooms.js';
import { loadBookings, renderBookings, cancelLease, deleteLease } from './bookings.js';

// Global state for stock operations
let selectedProductId = null;
let currentStockAction = '';

// Global window functions for onclick handlers
window.deleteInventoryItem = deleteInventoryItem;
window.deleteRoom = deleteRoom;
window.cancelLease = cancelLease;
window.deleteLease = deleteLease;

// Stock modal function
window.openStockModal = async function(productId, action) {
    const { supabase } = await import('./config.js');
    
    // Fetch product from database
    const { data: product, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('id', productId)
        .single();
    
    if (error || !product) {
        console.error('Failed to fetch product:', error);
        return;
    }

    selectedProductId = productId;
    currentStockAction = action;

    document.getElementById('stockProductName').value = product.name;
    document.getElementById('currentStock').value = product.stock;
    document.getElementById('currentStockDisplay').textContent = product.stock;
    document.getElementById('stockUpdateTitle').textContent = action === 'in' ? 'Stock In' : 'Stock Out';
    document.getElementById('confirmStockUpdate').textContent = action === 'in' ? 'Add Stock' : 'Remove Stock';
    document.getElementById('quantityActionLabel').textContent = action === 'in' ? 'Add' : 'Remove';
    document.getElementById('stockQuantity').value = '';
    document.getElementById('stockReason').value = '';
    document.getElementById('projectedStockDisplay').textContent = product.stock;
    document.getElementById('changeIndicator').textContent = '+0';
    
    const modal = document.getElementById('stockUpdateModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    
    // Add event listener for real-time stock tracker
    const quantityInput = document.getElementById('stockQuantity');
    quantityInput.addEventListener('input', function() {
        updateStockTracker(product.stock, action);
    });
};

// Function to update stock tracker in real-time
function updateStockTracker(currentStock, action) {
    const quantity = parseInt(document.getElementById('stockQuantity').value) || 0;
    let newStock = currentStock;
    let indicator = '';
    
    if (action === 'in') {
        newStock = currentStock + quantity;
        indicator = `+${quantity}`;
    } else {
        newStock = currentStock - quantity;
        indicator = `-${quantity}`;
    }
    
    document.getElementById('projectedStockDisplay').textContent = newStock;
    document.getElementById('changeIndicator').textContent = indicator;
}

// Page initialization functions
window.initInventoryPage = async function() {
    await loadInventory();
    
    // Attach event listeners for inventory page
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (searchInput) searchInput.addEventListener('input', filterInventory);
    if (categoryFilter) categoryFilter.addEventListener('change', filterInventory);
    if (departmentFilter) departmentFilter.addEventListener('change', filterInventory);
    
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', () => {
            const modal = document.getElementById('addProductModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Clear Activity History button
    const clearActivityBtn = document.getElementById('clearActivityBtn');
    if (clearActivityBtn) {
        clearActivityBtn.addEventListener('click', async () => {
            const result = await Swal.fire({
                title: 'Clear Activity History?',
                text: 'This will permanently delete all stock activity records.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc2626',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, clear all',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                await clearStockTransactions();
                Swal.fire({
                    toast: true,
                    position: 'bottom-end',
                    icon: 'success',
                    title: 'Activity history cleared',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        });
    }
    
    // Populate month filter for export
    populateMonthFilter();
    
    // Export Activity History button
    const exportActivityBtn = document.getElementById('exportActivityBtn');
    if (exportActivityBtn) {
        exportActivityBtn.addEventListener('click', () => {
            exportStockHistoryCSV();
        });
    }
    
    // Stock In/Out quick action buttons
    const stockInBtn = document.getElementById('stockInBtn');
    const stockOutBtn = document.getElementById('stockOutBtn');
    
    if (stockInBtn) {
        stockInBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Stock In',
                text: 'Click "Stock In" on any product in the table below to add stock',
                icon: 'info',
                confirmButtonColor: '#eab308'
            });
        });
    }
    
    if (stockOutBtn) {
        stockOutBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Stock Out',
                text: 'Click "Stock Out" on any product in the table below to remove stock',
                icon: 'info',
                confirmButtonColor: '#eab308'
            });
        });
    }
};

window.initRoomsPage = async function() {
    await loadRooms();
    await loadBookings();
    
    // Setup room filters
    const roomSearchInput = document.getElementById('roomSearchInput');
    const roomTypeFilter = document.getElementById('roomTypeFilter');
    
    if (roomSearchInput) roomSearchInput.addEventListener('input', filterRooms);
    if (roomTypeFilter) roomTypeFilter.addEventListener('change', filterRooms);
    
    // Attach event listeners for rooms page
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', () => {
            const modal = document.getElementById('addRoomModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    const newBookingBtn = document.getElementById('newBookingBtn');
    if (newBookingBtn) {
        newBookingBtn.addEventListener('click', () => {
            updateRoomDropdown(); // Update available rooms in dropdown
            const modal = document.getElementById('newBookingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Add Payment button
    const addPaymentBtn = document.getElementById('addPaymentBtn');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', async () => {
            console.log('Add Payment button clicked');
            // Close all other modals first
            closeModal('addCreditModal');
            
            await populateLeaseDropdown('paymentLease');
            generateReceiptNumber();
            openModal('addPaymentModal');
        });
    }
    
    // Add Credit button
    const addCreditBtn = document.getElementById('addCreditBtn');
    if (addCreditBtn) {
        addCreditBtn.addEventListener('click', async () => {
            try {
                console.log('Add Credit button clicked');
                // Close all other modals first
                closeModal('addPaymentModal');
                
                console.log('Populating lease dropdown...');
                await populateLeaseDropdown('creditLease');
                console.log('Opening credit modal...');
                openModal('addCreditModal');
            } catch (error) {
                console.error('Error opening credit modal:', error);
            }
        });
    } else {
        console.error('Add Credit button not found!');
    }
};

window.initAccountingPage = async function() {
    console.log('Accounting page initialized');
    await loadAccountingData();
    setupAccountingFilters();
};

// Load and display accounting data
async function loadAccountingData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all financial data
        const [paymentsResult, creditsResult, inventoryResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('credits').select('*').order('created_at', { ascending: false }),
            supabase.from('inventory').select('*'),
            supabase.from('bookings').select('*')
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        const inventory = inventoryResult.data || [];
        const bookings = bookingsResult.data || [];
        
        // Calculate totals
        const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCredits = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        const totalRevenue = totalPayments + totalCredits;
        
        // Calculate inventory value
        const inventoryValue = inventory.reduce((sum, item) => 
            sum + ((parseFloat(item.price) || 0) * (parseInt(item.stock) || 0)), 0
        );
        
        // Calculate monthly revenue
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        
        const thisMonthPayments = payments.filter(p => {
            const date = new Date(p.created_at || p.payment_date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const thisMonthCredits = credits.filter(c => {
            const date = new Date(c.created_at || c.credit_date);
            return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const monthlyRevenue = thisMonthPayments + thisMonthCredits;
        
        const lastMonthPayments = payments.filter(p => {
            const date = new Date(p.created_at || p.payment_date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const lastMonthCredits = credits.filter(c => {
            const date = new Date(c.created_at || c.credit_date);
            return date.getMonth() === lastMonth && date.getFullYear() === lastMonthYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const lastMonthRevenue = lastMonthPayments + lastMonthCredits;
        
        // Update dashboard cards
        document.getElementById('totalRevenue').textContent = `₱${totalRevenue.toLocaleString()}`;
        document.getElementById('monthlyRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        document.getElementById('inventoryValue').textContent = `₱${inventoryValue.toLocaleString()}`;
        
        // Revenue breakdown
        const rentPayments = payments.filter(p => p.payment_type === 'Rent' || p.lease_id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const deposits = payments.filter(p => p.payment_type === 'Deposit' || p.payment_type === 'Security Deposit').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const inventorySales = 0; // Placeholder for future inventory sales tracking
        
        document.getElementById('inventorySalesTotal').textContent = `₱${inventorySales.toLocaleString()}`;
        document.getElementById('rentalRevenueTotal').textContent = `₱${rentPayments.toLocaleString()}`;
        document.getElementById('depositsTotal').textContent = `₱${deposits.toLocaleString()}`;
        document.getElementById('totalRevenueBreakdown').textContent = `₱${totalRevenue.toLocaleString()}`;
        
        // Monthly performance
        document.getElementById('thisMonthRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        document.getElementById('lastMonthRevenue').textContent = `₱${lastMonthRevenue.toLocaleString()}`;
        
        // Calculate growth
        const growth = lastMonthRevenue > 0 
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
            : 0;
        const growthElement = document.getElementById('monthlyGrowth');
        growthElement.textContent = `${growth}%`;
        growthElement.className = `text-sm font-medium ${parseFloat(growth) >= 0 ? 'text-green-600' : 'text-red-600'}`;
        
        // Calculate daily average
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const dailyAverage = monthlyRevenue / daysInMonth;
        document.getElementById('dailyAverage').textContent = `₱${dailyAverage.toLocaleString(undefined, {maximumFractionDigits: 0})}`;
        
        // Load transaction history
        loadTransactionHistory(payments, credits);
        
        console.log('✅ Accounting data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading accounting data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load accounting data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load transaction history
function loadTransactionHistory(payments, credits) {
    const tableBody = document.getElementById('transactionsTable');
    if (!tableBody) return;
    
    // Combine payments and credits into transactions
    const transactions = [
        ...payments.map(p => ({
            date: new Date(p.created_at || p.payment_date),
            type: 'rental_payment',
            typeLabel: 'Rental Payment',
            description: `Payment - ${p.payment_method || 'Cash'} ${p.receipt_number ? `(${p.receipt_number})` : ''}`,
            amount: parseFloat(p.amount) || 0,
            notes: p.notes || ''
        })),
        ...credits.map(c => ({
            date: new Date(c.created_at || c.credit_date),
            type: 'rental_credit',
            typeLabel: 'Credit',
            description: `Credit - ${c.reason || 'Adjustment'}`,
            amount: parseFloat(c.amount) || 0,
            notes: c.notes || ''
        }))
    ].sort((a, b) => b.date - a.date);
    
    if (transactions.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                    No transactions found.
                </td>
            </tr>
        `;
        return;
    }
    
    // Calculate running balance
    let runningBalance = 0;
    
    tableBody.innerHTML = transactions.map(transaction => {
        runningBalance += transaction.amount;
        
        const typeColor = transaction.type === 'rental_payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
        
        return `
            <tr class="hover:bg-gray-50" data-type="${transaction.type}">
                <td class="px-6 py-4 text-sm text-gray-900">${transaction.date.toLocaleDateString()}</td>
                <td class="px-6 py-4">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColor}">
                        ${transaction.typeLabel}
                    </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">${transaction.description}</td>
                <td class="px-6 py-4 text-sm font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}">
                    ₱${transaction.amount.toLocaleString()}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                    ₱${runningBalance.toLocaleString()}
                </td>
            </tr>
        `;
    }).join('');
}

// Setup accounting filters
function setupAccountingFilters() {
    const filterSelect = document.getElementById('transactionFilter');
    const exportBtn = document.getElementById('exportTransactionsBtn');
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            const filterValue = this.value;
            const rows = document.querySelectorAll('#transactionsTable tr');
            
            rows.forEach(row => {
                const type = row.dataset.type;
                if (!filterValue || type === filterValue) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            exportAccountingToCSV();
        });
    }
}

// Export accounting data to CSV
async function exportAccountingToCSV() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all financial data
        const [paymentsResult, creditsResult] = await Promise.all([
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
            supabase.from('credits').select('*').order('created_at', { ascending: false })
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        
        // Combine into transactions
        const transactions = [
            ...payments.map(p => ({
                date: new Date(p.created_at || p.payment_date),
                type: 'Rental Payment',
                description: `Payment - ${p.payment_method || 'Cash'} ${p.receipt_number ? `(${p.receipt_number})` : ''}`,
                amount: parseFloat(p.amount) || 0,
                notes: (p.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
            })),
            ...credits.map(c => ({
                date: new Date(c.created_at || c.credit_date),
                type: 'Credit',
                description: `Credit - ${c.reason || 'Adjustment'}`,
                amount: parseFloat(c.amount) || 0,
                notes: (c.notes || '').replace(/,/g, ';').replace(/\n/g, ' ')
            }))
        ].sort((a, b) => b.date - a.date);
        
        if (transactions.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'No Data',
                text: 'No transactions available to export.',
                confirmButtonColor: '#eab308'
            });
            return;
        }
        
        // Calculate running balance
        let runningBalance = 0;
        const transactionsWithBalance = transactions.map(t => {
            runningBalance += t.amount;
            return { ...t, balance: runningBalance };
        });
        
        // Generate CSV content
        const csvHeaders = ['Date', 'Type', 'Description', 'Amount (₱)', 'Balance (₱)', 'Notes'];
        const csvRows = transactionsWithBalance.map(t => [
            t.date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            t.type,
            `"${t.description}"`,
            t.amount.toFixed(2),
            t.balance.toFixed(2),
            `"${t.notes}"`
        ]);
        
        // Create CSV string
        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.join(','))
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const currentDate = new Date();
        const dateStr = currentDate.toISOString().split('T')[0];
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Accounting_Report_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Successful',
            text: `Accounting report exported successfully!`,
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('❌ Error exporting accounting data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            text: 'Failed to export accounting data.',
            confirmButtonColor: '#eab308'
        });
    }
}

window.initPaymentSummaryPage = async function() {
    console.log('Payment & Credit Tracker page initialized');
    await loadPaymentSummaryData();
    setupPaymentExport();
};

// Load and display payment summary data
async function loadPaymentSummaryData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all data
        const [paymentsResult, creditsResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*, bookings(tenant, client_name, room_name)').order('created_at', { ascending: false }),
            supabase.from('credits').select('*, bookings(tenant, client_name, room_name)').order('created_at', { ascending: false }),
            supabase.from('bookings').select('*').eq('status', 'Active')
        ]);
        
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        const bookings = bookingsResult.data || [];
        
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        // Calculate paid this month
        const paidThisMonth = payments.filter(p => {
            const paymentDate = new Date(p.created_at || p.payment_date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        // Calculate overdue and upcoming payments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const oneWeekFromNow = new Date(today);
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);
        
        let overdueAmount = 0;
        let overdueCount = 0;
        let dueThisWeek = 0;
        let dueCount = 0;
        let totalBalance = 0;
        let onTimePayments = 0;
        let totalExpectedPayments = 0;
        
        const overdueLeases = [];
        
        bookings.forEach(booking => {
            const balance = parseFloat(booking.balance) || 0;
            totalBalance += balance;
            
            if (balance > 0) {
                // Calculate next due date (monthly rent)
                const leaseStart = new Date(booking.lease_start || booking.start_date);
                const monthlyRent = parseFloat(booking.monthly_rent || booking.rent) || 0;
                
                // Calculate which month we're in for the lease
                const monthsSinceStart = Math.floor((today - leaseStart) / (30 * 24 * 60 * 60 * 1000));
                const nextDueDate = new Date(leaseStart);
                nextDueDate.setMonth(nextDueDate.getMonth() + monthsSinceStart + 1);
                nextDueDate.setHours(0, 0, 0, 0);
                
                const daysOverdue = Math.floor((today - nextDueDate) / (24 * 60 * 60 * 1000));
                
                totalExpectedPayments++;
                
                if (today > nextDueDate) {
                    // Overdue
                    overdueAmount += balance;
                    overdueCount++;
                    
                    // Calculate late fee (₱50 per day after 3 days grace period)
                    const lateFee = daysOverdue > 3 ? (daysOverdue - 3) * 50 : 0;
                    
                    overdueLeases.push({
                        tenant: booking.tenant || booking.client_name || 'N/A',
                        room: booking.room_name || 'N/A',
                        dueDate: nextDueDate,
                        daysOverdue: daysOverdue,
                        amountDue: balance,
                        lateFee: lateFee,
                        totalDue: balance + lateFee,
                        monthlyRent: monthlyRent,
                        leaseId: booking.id,
                        contact: booking.contact || booking.client_contact || 'N/A',
                        email: booking.email || ''
                    });
                } else if (nextDueDate <= oneWeekFromNow) {
                    // Due this week
                    dueThisWeek += balance;
                    dueCount++;
                    
                    overdueLeases.push({
                        tenant: booking.tenant || booking.client_name || 'N/A',
                        room: booking.room_name || 'N/A',
                        dueDate: nextDueDate,
                        daysOverdue: 0,
                        amountDue: balance,
                        lateFee: 0,
                        totalDue: balance,
                        monthlyRent: monthlyRent,
                        leaseId: booking.id,
                        contact: booking.contact || booking.client_contact || 'N/A',
                        email: booking.email || '',
                        isDueSoon: true
                    });
                } else {
                    onTimePayments++;
                }
            } else {
                onTimePayments++;
            }
        });
        
        // Calculate collection rate
        const collectionRate = totalExpectedPayments > 0 
            ? Math.round((onTimePayments / totalExpectedPayments) * 100)
            : 100;
        
        // Update dashboard cards
        document.getElementById('psPaidThisMonth').textContent = `₱${paidThisMonth.toLocaleString()}`;
        document.getElementById('psOverdueAmount').textContent = `₱${overdueAmount.toLocaleString()}`;
        document.getElementById('psOverdueCount').textContent = overdueCount;
        document.getElementById('psDueThisWeek').textContent = `₱${dueThisWeek.toLocaleString()}`;
        document.getElementById('psDueCount').textContent = dueCount;
        document.getElementById('psTotalBalance').textContent = `₱${totalBalance.toLocaleString()}`;
        document.getElementById('psCollectionRate').textContent = `${collectionRate}%`;
        
        // Show/hide overdue alert
        const overdueAlert = document.getElementById('overdueAlert');
        const overdueMessage = document.getElementById('overdueMessage');
        if (overdueCount > 0) {
            overdueAlert.classList.remove('hidden');
            overdueMessage.textContent = `${overdueCount} tenant(s) have overdue payments totaling ₱${overdueAmount.toLocaleString()}. Late fees may apply after 3 days.`;
        } else {
            overdueAlert.classList.add('hidden');
        }
        
        // Load overdue table
        loadOverdueTable(overdueLeases);
        
        // Populate lease filter dropdown
        populateLeaseFilter(bookings);
        
        // Load activity table
        loadPaymentActivityTable(payments, credits);
        
        // Load charts
        loadPaymentCharts(payments, credits);
        
        // Setup filters
        setupPaymentFilters(payments, credits);
        
        console.log('✅ Payment & Credit Tracker data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading payment tracker data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load payment tracker data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Load overdue payments table
function loadOverdueTable(overdueLeases) {
    const tableBody = document.getElementById('psOverdueTable');
    if (!tableBody) return;
    
    // Sort by days overdue (highest first)
    overdueLeases.sort((a, b) => b.daysOverdue - a.daysOverdue);
    
    if (overdueLeases.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center justify-center">
                        <svg class="w-16 h-16 text-green-500 mb-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                        </svg>
                        <p class="text-lg font-semibold text-gray-900 mb-2">All Caught Up!</p>
                        <p class="text-sm text-gray-500">No overdue or upcoming payments at this time.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = overdueLeases.map(lease => {
        const statusBadge = lease.isDueSoon
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">Due Soon</span>'
            : lease.daysOverdue > 30
            ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Critical</span>'
            : '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">Overdue</span>';
        
        const rowClass = lease.isDueSoon ? 'bg-yellow-50' : lease.daysOverdue > 30 ? 'bg-red-50' : 'bg-orange-50';
        
        return `
            <tr class="${rowClass} hover:bg-opacity-75 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">${lease.tenant}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${lease.room}</td>
                <td class="px-6 py-4 text-sm text-gray-900">${lease.dueDate.toLocaleDateString()}</td>
                <td class="px-6 py-4 text-sm font-semibold ${lease.daysOverdue > 0 ? 'text-red-600' : 'text-green-600'}">
                    ${lease.daysOverdue > 0 ? `${lease.daysOverdue} days` : 'On Time'}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">₱${lease.amountDue.toLocaleString()}</td>
                <td class="px-6 py-4 text-sm font-semibold ${lease.lateFee > 0 ? 'text-red-600' : 'text-gray-500'}">
                    ${lease.lateFee > 0 ? `₱${lease.lateFee.toLocaleString()}` : '—'}
                </td>
                <td class="px-6 py-4 text-sm font-bold text-gray-900">₱${lease.totalDue.toLocaleString()}</td>
                <td class="px-6 py-4">${statusBadge}</td>
                <td class="px-6 py-4 text-center">
                    <button onclick="window.sendPaymentReminder(${lease.leaseId}, '${lease.tenant.replace(/'/g, "\\'") }', '${lease.contact}', '${lease.email}')" 
                        class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">
                        Send Reminder
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Send payment reminder function
window.sendPaymentReminder = async function(leaseId, tenantName, contact, email = '') {
    const result = await Swal.fire({
        title: 'Send Payment Reminder',
        html: `
            <div class="text-left space-y-3">
                <p class="mb-2">Send reminder to <strong>${tenantName}</strong></p>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                    <input type="tel" id="reminderContact" value="${contact || ''}" placeholder="09123456789" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Email Address (Optional)</label>
                    <input type="email" id="reminderEmail" value="${email || ''}" placeholder="tenant@example.com" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Reminder Message</label>
                    <textarea id="reminderMessage" class="w-full border border-gray-300 rounded-lg p-3 text-sm" rows="4" placeholder="Enter reminder message...">Dear ${tenantName},

This is a friendly reminder that your rent payment is overdue. Please settle your balance at your earliest convenience to avoid additional late fees.

Thank you!</textarea>
                </div>
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Send Reminder',
        confirmButtonColor: '#3b82f6',
        cancelButtonText: 'Cancel',
        width: '600px',
        preConfirm: () => {
            const message = document.getElementById('reminderMessage').value;
            const contactNum = document.getElementById('reminderContact').value;
            const emailAddr = document.getElementById('reminderEmail').value;
            
            if (!message.trim()) {
                Swal.showValidationMessage('Please enter a reminder message');
                return false;
            }
            
            if (!contactNum.trim() && !emailAddr.trim()) {
                Swal.showValidationMessage('Please provide at least a contact number or email');
                return false;
            }
            
            return { message, contact: contactNum, email: emailAddr };
        }
    });

    if (result.isConfirmed) {
        try {
            const { message, contact: contactNum, email: emailAddr } = result.value;
            const { supabase } = await import('./config.js');
            
            // Get current booking to append reminder note
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('notes, contact, email')
                .eq('id', leaseId)
                .single();
            
            if (fetchError) {
                console.error('Error fetching booking:', fetchError);
            }
            
            // Create reminder note with timestamp
            const timestamp = new Date().toLocaleString();
            const reminderNote = `[${timestamp}] REMINDER SENT: ${message}`;
            const existingNotes = booking?.notes || '';
            const updatedNotes = existingNotes 
                ? `${existingNotes}\n\n${reminderNote}` 
                : reminderNote;
            
            // Update booking with reminder note and contact info
            const updateData = {
                notes: updatedNotes
            };
            
            // Update contact if provided
            if (contactNum) {
                updateData.contact = contactNum;
            }
            
            // Update email if provided (add column if it doesn't exist)
            if (emailAddr) {
                updateData.email = emailAddr;
            }
            
            const { error: updateError } = await supabase
                .from('bookings')
                .update(updateData)
                .eq('id', leaseId);
            
            if (updateError) {
                console.error('Error updating booking:', updateError);
                throw updateError;
            }
            
            // In a real application, this would integrate with:
            // - SMS API (Twilio, Semaphore, etc.) for SMS to contactNum
            // - Email service (SendGrid, AWS SES, etc.) for email to emailAddr
            
            // Log the reminder (for demonstration)
            console.log('📧 Payment Reminder Sent:');
            console.log('Lease ID:', leaseId);
            console.log('Tenant:', tenantName);
            console.log('Contact:', contactNum);
            console.log('Email:', emailAddr);
            console.log('Message:', message);
            
            Swal.fire({
                icon: 'success',
                title: 'Reminder Sent!',
                html: `
                    <p class="mb-2">Payment reminder sent to <strong>${tenantName}</strong></p>
                    <div class="text-sm text-gray-600 space-y-1">
                        ${contactNum ? `<p>📱 SMS: ${contactNum}</p>` : ''}
                        ${emailAddr ? `<p>📧 Email: ${emailAddr}</p>` : ''}
                        <p class="mt-2 text-xs text-gray-500">Note added to lease record</p>
                    </div>
                `,
                confirmButtonColor: '#3b82f6'
            });
            
            // Reload payment summary data to show updated notes
            if (typeof loadPaymentSummaryData === 'function') {
                await loadPaymentSummaryData();
            }
            
        } catch (error) {
            console.error('Error sending reminder:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to Send',
                text: 'Could not send reminder. Please try again.',
                confirmButtonColor: '#ef4444'
            });
        }
    }
};

// Setup payment export
function setupPaymentExport() {
    const exportBtn = document.getElementById('psExportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            await exportPaymentTrackerCSV();
        });
    }
}

// Export payment tracker to CSV
async function exportPaymentTrackerCSV() {
    try {
        const { supabase } = await import('./config.js');
        
        const [paymentsResult, bookingsResult] = await Promise.all([
            supabase.from('payments').select('*, bookings(tenant, client_name, room_name, balance, monthly_rent)').order('created_at', { ascending: false }),
            supabase.from('bookings').select('*').eq('status', 'Active')
        ]);
        
        const payments = paymentsResult.data || [];
        const bookings = bookingsResult.data || [];
        
        // Prepare CSV data
        const csvData = [];
        
        // Add header
        csvData.push(['Tenant', 'Room', 'Payment Date', 'Amount Paid', 'Balance', 'Payment Method', 'Receipt Number', 'Notes']);
        
        // Add payment rows
        payments.forEach(p => {
            csvData.push([
                p.bookings?.tenant || p.bookings?.client_name || 'N/A',
                p.bookings?.room_name || 'N/A',
                new Date(p.created_at || p.payment_date).toLocaleDateString(),
                parseFloat(p.amount || 0).toFixed(2),
                parseFloat(p.bookings?.balance || 0).toFixed(2),
                p.payment_method || 'Cash',
                p.receipt_number || '—',
                `"${(p.notes || '').replace(/"/g, '""')}"`
            ]);
        });
        
        // Create CSV string
        const csvContent = csvData.map(row => row.join(',')).join('\n');
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', `Payment_Tracker_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Swal.fire({
            icon: 'success',
            title: 'Export Successful',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        console.error('❌ Error exporting payment tracker:', error);
        Swal.fire({
            icon: 'error',
            title: 'Export Failed',
            confirmButtonColor: '#eab308'
        });
    }
}

// Populate lease filter dropdown
function populateLeaseFilter(bookings) {
    const leaseFilter = document.getElementById('psFilterLease');
    if (!leaseFilter) return;
    
    leaseFilter.innerHTML = '<option value="">All leases</option>';
    bookings.forEach(booking => {
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `${booking.tenant || booking.client_name || 'Unknown'} - ${booking.room_name || 'N/A'}`;
        leaseFilter.appendChild(option);
    });
}

// Load payment activity table
function loadPaymentActivityTable(payments, credits) {
    const tableBody = document.getElementById('psActivityTable');
    if (!tableBody) return;
    
    // Combine payments and credits
    const activities = [
        ...payments.map(p => ({
            date: new Date(p.created_at || p.payment_date),
            tenant: p.bookings?.tenant || p.bookings?.client_name || 'N/A',
            room: p.bookings?.room_name || 'N/A',
            type: 'Payment',
            amount: parseFloat(p.amount) || 0,
            note: p.notes || p.payment_method || '—',
            lease_id: p.lease_id,
            raw_type: 'rental_payment'
        })),
        ...credits.map(c => ({
            date: new Date(c.created_at || c.credit_date),
            tenant: c.bookings?.tenant || c.bookings?.client_name || 'N/A',
            room: c.bookings?.room_name || 'N/A',
            type: 'Credit',
            amount: parseFloat(c.amount) || 0,
            note: c.notes || c.reason || '—',
            lease_id: c.lease_id,
            raw_type: 'rental_credit'
        }))
    ].sort((a, b) => b.date - a.date);
    
    if (activities.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    No payment or credit activity found.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = activities.map(activity => `
        <tr class="hover:bg-gray-50" data-lease-id="${activity.lease_id}" data-type="${activity.raw_type}">
            <td class="px-6 py-4 text-sm text-gray-900">${activity.date.toLocaleDateString()}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${activity.tenant}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${activity.room}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.type === 'Payment' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}">
                    ${activity.type}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-semibold ${activity.type === 'Payment' ? 'text-green-600' : 'text-blue-600'}">
                ₱${activity.amount.toLocaleString()}
            </td>
            <td class="px-6 py-4 text-sm text-gray-500">${activity.note}</td>
        </tr>
    `).join('');
}

// Load payment charts (placeholder - requires Chart.js)
function loadPaymentCharts(payments, credits) {
    // Get last 12 months data
    const months = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({
            label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
            month: date.getMonth(),
            year: date.getFullYear(),
            payments: 0,
            credits: 0
        });
    }
    
    // Aggregate payments by month
    payments.forEach(p => {
        const date = new Date(p.created_at || p.payment_date);
        const monthData = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthData) {
            monthData.payments += parseFloat(p.amount) || 0;
        }
    });
    
    // Aggregate credits by month
    credits.forEach(c => {
        const date = new Date(c.created_at || c.credit_date);
        const monthData = months.find(m => m.month === date.getMonth() && m.year === date.getFullYear());
        if (monthData) {
            monthData.credits += parseFloat(c.amount) || 0;
        }
    });
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded, skipping charts');
        return;
    }
    
    // Payments Chart
    const paymentsCtx = document.getElementById('psPaymentsChart');
    if (paymentsCtx) {
        new Chart(paymentsCtx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'Payments',
                    data: months.map(m => m.payments),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₱' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
    
    // Credits Chart
    const creditsCtx = document.getElementById('psCreditsChart');
    if (creditsCtx) {
        new Chart(creditsCtx, {
            type: 'line',
            data: {
                labels: months.map(m => m.label),
                datasets: [{
                    label: 'Credits',
                    data: months.map(m => m.credits),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: value => '₱' + value.toLocaleString()
                        }
                    }
                }
            }
        });
    }
}

// Setup payment filters
function setupPaymentFilters(payments, credits) {
    const leaseFilter = document.getElementById('psFilterLease');
    const typeFilter = document.getElementById('psFilterType');
    
    const applyFilters = () => {
        const selectedLease = leaseFilter?.value || '';
        const selectedType = typeFilter?.value || '';
        
        const rows = document.querySelectorAll('#psActivityTable tr');
        rows.forEach(row => {
            const leaseId = row.dataset.leaseId;
            const type = row.dataset.type;
            
            const leaseMatch = !selectedLease || leaseId === selectedLease;
            const typeMatch = !selectedType || type === selectedType;
            
            if (leaseMatch && typeMatch) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };
    
    if (leaseFilter) leaseFilter.addEventListener('change', applyFilters);
    if (typeFilter) typeFilter.addEventListener('change', applyFilters);
}

window.initDashboardPage = async function() {
    console.log('Dashboard page initialized');
    await loadDashboardData();
};

// Store dashboard data globally for chart updates
let dashboardData = {
    payments: [],
    credits: [],
    stockTransactions: [],
    inventory: []
};

// Load and display dashboard statistics
async function loadDashboardData() {
    try {
        const { supabase } = await import('./config.js');
        
        // Fetch all data in parallel including stock transactions
        const [inventoryResult, roomsResult, bookingsResult, paymentsResult, creditsResult, stockTransactionsResult] = await Promise.all([
            supabase.from('inventory').select('*'),
            supabase.from('rooms').select('*'),
            supabase.from('bookings').select('*'),
            supabase.from('payments').select('*'),
            supabase.from('credits').select('*'),
            supabase.from('stock_transactions').select('*').order('created_at', { ascending: false })
        ]);
        
        const inventory = inventoryResult.data || [];
        const rooms = roomsResult.data || [];
        const bookings = bookingsResult.data || [];
        const payments = paymentsResult.data || [];
        const credits = creditsResult.data || [];
        let stockTransactions = stockTransactionsResult.data || [];
        
        // Fallback to localStorage if stock_transactions table doesn't exist
        if (stockTransactionsResult.error) {
            stockTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
        }
        
        // Store data globally for chart updates
        dashboardData = { payments, credits, stockTransactions, inventory };
        
        // Calculate statistics
        
        // Total Products
        const totalProducts = inventory.length;
        document.getElementById('dashTotalProducts').textContent = totalProducts;
        
        // Inventory Status
        const inStock = inventory.filter(item => item.stock > 10).length;
        const lowStock = inventory.filter(item => item.stock > 0 && item.stock <= 10).length;
        const outOfStock = inventory.filter(item => item.stock === 0).length;
        
        document.getElementById('dashInStock').textContent = inStock;
        document.getElementById('dashLowStock').textContent = lowStock;
        document.getElementById('dashOutStock').textContent = outOfStock;
        
        // Active Leases
        const activeLeases = bookings.filter(b => b.status === 'Active').length;
        document.getElementById('dashActiveLeases').textContent = activeLeases;
        
        // Room Occupancy
        const occupiedRooms = rooms.filter(r => r.status === 'Occupied').length;
        const availableRooms = rooms.filter(r => r.status === 'Available').length;
        const totalRooms = rooms.length;
        const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;
        
        document.getElementById('dashOccupied').textContent = occupiedRooms;
        document.getElementById('dashAvailable').textContent = availableRooms;
        document.getElementById('dashOccupancyRate').textContent = `${occupancyRate}%`;
        
        // Revenue Calculations
        const totalPayments = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const totalCreditsAmount = credits.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        // Calculate inventory sales from stock out transactions
        const inventorySalesAmount = calculateInventorySales(stockTransactions, inventory);
        
        const totalRevenue = totalPayments + totalCreditsAmount + inventorySalesAmount;
        
        document.getElementById('dashTotalRevenue').textContent = `₱${totalRevenue.toLocaleString()}`;
        
        // Monthly Revenue (current month)
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        
        const monthlyPayments = payments.filter(p => {
            const paymentDate = new Date(p.created_at || p.payment_date);
            return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        const monthlyCredits = credits.filter(c => {
            const creditDate = new Date(c.created_at || c.credit_date);
            return creditDate.getMonth() === currentMonth && creditDate.getFullYear() === currentYear;
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        
        const monthlyInventorySales = calculateMonthlyInventorySales(stockTransactions, inventory, currentMonth, currentYear);
        
        const monthlyRevenue = monthlyPayments + monthlyCredits + monthlyInventorySales;
        document.getElementById('dashMonthlyRevenue').textContent = `₱${monthlyRevenue.toLocaleString()}`;
        
        // Revenue Breakdown
        const roomRentals = payments.filter(p => p.payment_type === 'Rent' || p.lease_id).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        const deposits = payments.filter(p => p.payment_type === 'Deposit' || p.payment_type === 'Security Deposit').reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        
        document.getElementById('dashInventorySales').textContent = `₱${inventorySalesAmount.toLocaleString()}`;
        document.getElementById('dashRoomRentals').textContent = `₱${roomRentals.toLocaleString()}`;
        document.getElementById('dashDeposits').textContent = `₱${deposits.toLocaleString()}`;
        
        // Recent Transactions
        loadRecentTransactions(payments, credits, stockTransactions, inventory);
        
        // Render Revenue Chart
        renderRevenueChart(payments, credits, stockTransactions, inventory, 12);
        
        // Setup chart period filter
        setupChartPeriodFilter();
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to load dashboard data',
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// Calculate inventory sales from stock out transactions
function calculateInventorySales(stockTransactions, inventory) {
    let total = 0;
    stockTransactions.forEach(t => {
        if (t.action === 'out') {
            const product = inventory.find(p => p.id === t.inventory_id || p.name === t.product_name);
            if (product) {
                total += t.quantity * (parseFloat(product.price) || 0);
            }
        }
    });
    return total;
}

// Calculate monthly inventory sales
function calculateMonthlyInventorySales(stockTransactions, inventory, month, year) {
    let total = 0;
    stockTransactions.forEach(t => {
        if (t.action === 'out') {
            const transactionDate = new Date(t.created_at);
            if (transactionDate.getMonth() === month && transactionDate.getFullYear() === year) {
                const product = inventory.find(p => p.id === t.inventory_id || p.name === t.product_name);
                if (product) {
                    total += t.quantity * (parseFloat(product.price) || 0);
                }
            }
        }
    });
    return total;
}

// Setup chart period filter
function setupChartPeriodFilter() {
    const periodFilter = document.getElementById('revenueChartPeriod');
    if (periodFilter) {
        periodFilter.addEventListener('change', function() {
            const months = this.value === 'all' ? 24 : parseInt(this.value);
            renderRevenueChart(
                dashboardData.payments,
                dashboardData.credits,
                dashboardData.stockTransactions,
                dashboardData.inventory,
                months
            );
        });
    }
}

// Render Revenue Chart
let revenueChartInstance = null;

function renderRevenueChart(payments, credits, stockTransactions, inventory, monthsToShow = 12) {
    const canvas = document.getElementById('revenueChart');
    if (!canvas) return;
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        // Load Chart.js dynamically
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        script.onload = () => renderRevenueChart(payments, credits, stockTransactions, inventory, monthsToShow);
        document.head.appendChild(script);
        return;
    }
    
    // Destroy existing chart if exists
    if (revenueChartInstance) {
        revenueChartInstance.destroy();
    }
    
    // Prepare monthly data
    const months = [];
    const roomRentalsData = [];
    const inventorySalesData = [];
    const creditsData = [];
    const now = new Date();
    
    for (let i = monthsToShow - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        months.push(monthLabel);
        
        // Calculate room rentals for this month
        const monthRentals = payments.filter(p => {
            const paymentDate = new Date(p.created_at || p.payment_date);
            return paymentDate.getMonth() === date.getMonth() && 
                   paymentDate.getFullYear() === date.getFullYear() &&
                   (p.payment_type === 'Rent' || p.lease_id);
        }).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        roomRentalsData.push(monthRentals);
        
        // Calculate inventory sales for this month
        const monthInventorySales = stockTransactions.filter(t => {
            if (t.action !== 'out') return false;
            const transactionDate = new Date(t.created_at);
            return transactionDate.getMonth() === date.getMonth() && 
                   transactionDate.getFullYear() === date.getFullYear();
        }).reduce((sum, t) => {
            const product = inventory.find(p => p.id === t.inventory_id || p.name === t.product_name);
            return sum + (t.quantity * (parseFloat(product?.price) || 0));
        }, 0);
        inventorySalesData.push(monthInventorySales);
        
        // Calculate credits for this month
        const monthCredits = credits.filter(c => {
            const creditDate = new Date(c.created_at || c.credit_date);
            return creditDate.getMonth() === date.getMonth() && 
                   creditDate.getFullYear() === date.getFullYear();
        }).reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
        creditsData.push(monthCredits);
    }
    
    // Update summary totals
    const totalRoomRentals = roomRentalsData.reduce((a, b) => a + b, 0);
    const totalInventorySales = inventorySalesData.reduce((a, b) => a + b, 0);
    const totalCredits = creditsData.reduce((a, b) => a + b, 0);
    
    const chartRoomRentals = document.getElementById('chartRoomRentals');
    const chartInventorySales = document.getElementById('chartInventorySales');
    const chartTotalCredits = document.getElementById('chartTotalCredits');
    
    if (chartRoomRentals) chartRoomRentals.textContent = `₱${totalRoomRentals.toLocaleString()}`;
    if (chartInventorySales) chartInventorySales.textContent = `₱${totalInventorySales.toLocaleString()}`;
    if (chartTotalCredits) chartTotalCredits.textContent = `₱${totalCredits.toLocaleString()}`;
    
    // Create the chart
    const ctx = canvas.getContext('2d');
    revenueChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Room Rentals',
                    data: roomRentalsData,
                    backgroundColor: 'rgba(147, 51, 234, 0.8)',
                    borderColor: 'rgba(147, 51, 234, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Inventory Sales',
                    data: inventorySalesData,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Credits',
                    data: creditsData,
                    backgroundColor: 'rgba(34, 197, 94, 0.8)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        boxWidth: 12,
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ₱${context.raw.toLocaleString()}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: false,
                    grid: { display: false },
                    ticks: { font: { size: 10 } }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: {
                        font: { size: 10 },
                        callback: function(value) {
                            return '₱' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

// Load recent transactions
function loadRecentTransactions(payments, credits, stockTransactions = [], inventory = []) {
    const transactionsList = document.getElementById('recentTransactionsList');
    if (!transactionsList) return;
    
    // Combine and sort transactions by date
    const allTransactions = [
        ...payments.map(p => ({
            type: 'Payment',
            amount: parseFloat(p.amount) || 0,
            date: new Date(p.created_at || p.payment_date),
            description: p.payment_method || 'Payment',
            lease: p.lease_id ? `Lease #${p.lease_id}` : ''
        })),
        ...credits.map(c => ({
            type: 'Credit',
            amount: parseFloat(c.amount) || 0,
            date: new Date(c.created_at || c.credit_date),
            description: c.reason || 'Credit',
            lease: c.lease_id ? `Lease #${c.lease_id}` : ''
        })),
        ...stockTransactions.filter(t => t.action === 'out').map(t => {
            const product = inventory.find(p => p.id === t.inventory_id || p.name === t.product_name);
            const amount = t.quantity * (parseFloat(product?.price) || 0);
            return {
                type: 'Sale',
                amount: amount,
                date: new Date(t.created_at),
                description: `${t.product_name} x${t.quantity}`,
                lease: 'Inventory Sale'
            };
        })
    ].sort((a, b) => b.date - a.date).slice(0, 8); // Get 8 most recent
    
    if (allTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
                    <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
                </svg>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    transactionsList.innerHTML = allTransactions.map(t => {
        let bgColor, iconColor, textColor;
        if (t.type === 'Payment') {
            bgColor = 'bg-green-100';
            iconColor = 'text-green-600';
            textColor = 'text-green-600';
        } else if (t.type === 'Sale') {
            bgColor = 'bg-orange-100';
            iconColor = 'text-orange-600';
            textColor = 'text-orange-600';
        } else {
            bgColor = 'bg-blue-100';
            iconColor = 'text-blue-600';
            textColor = 'text-blue-600';
        }
        
        return `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center space-x-3">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-full ${bgColor} flex items-center justify-center">
                        <svg class="w-5 h-5 ${iconColor}" fill="currentColor" viewBox="0 0 20 20">
                            ${t.type === 'Sale' ? 
                                '<path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd"></path>' :
                                '<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"></path><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"></path>'
                            }
                        </svg>
                    </div>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">${t.description}</p>
                    <p class="text-xs text-gray-500">${t.lease || t.type} • ${t.date.toLocaleDateString()}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-semibold ${textColor}">
                    ₱${t.amount.toLocaleString()}
                </p>
            </div>
        </div>
    `}).join('');
}

// Modal control functions
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Reset payment modal steps if closing payment modal
        if (modalId === 'addPaymentModal') {
            const paymentStep1 = document.getElementById('paymentStep1');
            const paymentStep2 = document.getElementById('paymentStep2');
            const paymentNextBtn = document.getElementById('paymentNextBtn');
            const paymentBackBtn = document.getElementById('paymentBackBtn');
            const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
            const paymentStep2Indicator = document.getElementById('paymentStep2Indicator');
            
            if (paymentStep1) paymentStep1.classList.remove('hidden');
            if (paymentStep2) paymentStep2.classList.add('hidden');
            if (paymentNextBtn) paymentNextBtn.classList.remove('hidden');
            if (paymentBackBtn) paymentBackBtn.classList.add('hidden');
            if (paymentSubmitBtn) paymentSubmitBtn.classList.add('hidden');
            
            if (paymentStep2Indicator) {
                paymentStep2Indicator.classList.add('text-gray-400');
                paymentStep2Indicator.classList.remove('text-green-600');
                const indicatorCircle = paymentStep2Indicator.querySelector('div');
                if (indicatorCircle) {
                    indicatorCircle.classList.add('border-gray-300');
                    indicatorCircle.classList.remove('border-green-600');
                }
            }
        }
    }
}

function openModal(modalId) {
    console.log('Opening modal:', modalId);
    const modal = document.getElementById(modalId);
    if (modal) {
        console.log('Modal found, displaying...');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    } else {
        console.error('Modal not found:', modalId);
    }
}

// Initialize modal close buttons
function initializeModalControls() {
    // Payment Modal Step Navigation
    const paymentNextBtn = document.getElementById('paymentNextBtn');
    const paymentBackBtn = document.getElementById('paymentBackBtn');
    const paymentStep1 = document.getElementById('paymentStep1');
    const paymentStep2 = document.getElementById('paymentStep2');
    const paymentSubmitBtn = document.getElementById('paymentSubmitBtn');
    const paymentStep2Indicator = document.getElementById('paymentStep2Indicator');
    
    if (paymentNextBtn && paymentBackBtn && paymentStep1 && paymentStep2) {
        paymentNextBtn.addEventListener('click', () => {
            // Validate step 1 fields
            const lease = document.getElementById('paymentLease').value;
            const amount = document.getElementById('paymentAmount').value;
            
            if (!lease || !amount) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Information',
                    text: 'Please select a lease and enter the payment amount',
                    confirmButtonColor: '#10b981'
                });
                return;
            }
            
            // Update review summary
            const leaseText = document.getElementById('paymentLease').selectedOptions[0].text;
            const method = document.querySelector('input[name="paymentMethod"]:checked').value;
            const methodText = method === 'cash' ? 'Cash Payment' : method.toUpperCase();
            
            document.getElementById('reviewLease').textContent = leaseText;
            document.getElementById('reviewMethod').textContent = methodText;
            document.getElementById('reviewAmount').textContent = '₱' + parseFloat(amount).toLocaleString();
            
            // Show step 2
            paymentStep1.classList.add('hidden');
            paymentStep2.classList.remove('hidden');
            paymentNextBtn.classList.add('hidden');
            paymentBackBtn.classList.remove('hidden');
            paymentSubmitBtn.classList.remove('hidden');
            
            // Update step indicator
            paymentStep2Indicator.classList.remove('text-gray-400');
            paymentStep2Indicator.classList.add('text-green-600');
            paymentStep2Indicator.querySelector('div').classList.remove('border-gray-300');
            paymentStep2Indicator.querySelector('div').classList.add('border-green-600');
        });
        
        paymentBackBtn.addEventListener('click', () => {
            // Show step 1
            paymentStep1.classList.remove('hidden');
            paymentStep2.classList.add('hidden');
            paymentNextBtn.classList.remove('hidden');
            paymentBackBtn.classList.add('hidden');
            paymentSubmitBtn.classList.add('hidden');
            
            // Update step indicator
            paymentStep2Indicator.classList.add('text-gray-400');
            paymentStep2Indicator.classList.remove('text-green-600');
            paymentStep2Indicator.querySelector('div').classList.add('border-gray-300');
            paymentStep2Indicator.querySelector('div').classList.remove('border-green-600');
        });
    }
    
    // Add Product Modal
    const cancelAddProduct = document.getElementById('cancelAddProduct');
    if (cancelAddProduct) {
        cancelAddProduct.addEventListener('click', () => closeModal('addProductModal'));
    }
    
    // Stock Update Modal
    const cancelStockUpdate = document.getElementById('cancelStockUpdate');
    if (cancelStockUpdate) {
        cancelStockUpdate.addEventListener('click', () => closeModal('stockUpdateModal'));
    }
    
    // Add Room Modal
    const cancelAddRoom = document.getElementById('cancelAddRoom');
    if (cancelAddRoom) {
        cancelAddRoom.addEventListener('click', () => closeModal('addRoomModal'));
    }
    
    // New Booking Modal
    const cancelBooking = document.getElementById('cancelBooking');
    if (cancelBooking) {
        cancelBooking.addEventListener('click', () => closeModal('newBookingModal'));
    }
    
    // Payment Modal
    const cancelPayment = document.getElementById('cancelPayment');
    if (cancelPayment) {
        cancelPayment.addEventListener('click', () => closeModal('addPaymentModal'));
    }
    
    // Credit Modal
    const cancelCredit = document.getElementById('cancelCredit');
    if (cancelCredit) {
        cancelCredit.addEventListener('click', () => closeModal('addCreditModal'));
    }
    
    // Close modals when clicking outside
    const modals = ['addProductModal', 'stockUpdateModal', 'addRoomModal', 'newBookingModal', 'addPaymentModal', 'addCreditModal'];
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modalId);
                }
            });
        }
    });
}

// Initialize form handlers
async function initializeFormHandlers() {
    const { supabase } = await import('./config.js');
    
    // Add Product Form
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm && !addProductForm.dataset.bound) {
        addProductForm.dataset.bound = 'true';
        addProductForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newProduct = {
                name: formData.get('productName'),
                category: formData.get('productCategory'),
                department: formData.get('productDepartment'),
                stock: parseInt(formData.get('productStock')),
                price: parseFloat(formData.get('productPrice')),
                status: 'In Stock'
            };
            
            const { error } = await supabase.from('inventory').insert([newProduct]);
            
            if (error) {
                console.error('❌ Failed to save product:', error.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error adding product',
                    text: error.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            await loadInventory();
            closeModal('addProductModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Product added successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // Stock Update Form
    const stockUpdateForm = document.getElementById('stockUpdateForm');
    if (stockUpdateForm && !stockUpdateForm.dataset.bound) {
        stockUpdateForm.dataset.bound = 'true';
        stockUpdateForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const quantity = parseInt(document.getElementById('stockQuantity').value);
            const reason = document.getElementById('stockReason').value || 'No reason provided';
            
            if (!selectedProductId || !currentStockAction) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Invalid stock operation',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get current inventory
            const { data: products, error: fetchError } = await supabase
                .from('inventory')
                .select('*')
                .eq('id', selectedProductId)
                .single();
            
            if (fetchError || !products) {
                console.error('Failed to fetch product:', fetchError);
                return;
            }
            
            const previousStock = products.stock;
            const newStock = currentStockAction === 'in' 
                ? products.stock + quantity 
                : products.stock - quantity;
            
            if (newStock < 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Operation',
                    text: 'Cannot remove more stock than available',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Determine new status
            let newStatus = 'In Stock';
            if (newStock === 0) newStatus = 'Out of Stock';
            else if (newStock <= 10) newStatus = 'Low Stock';
            
            // Update stock in database (updated_at will be handled by trigger)
            const { error: updateError } = await supabase
                .from('inventory')
                .update({ 
                    stock: newStock, 
                    status: newStatus
                })
                .eq('id', selectedProductId);
            
            if (updateError) {
                console.error('Failed to update stock:', updateError);
                
                // Check if it's a schema cache issue
                if (updateError.message.includes("updated_at") || updateError.message.includes("schema cache")) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Database Schema Update Needed',
                        html: `
                            <p class="mb-4">The database is missing the <code>updated_at</code> column.</p>
                            <p class="mb-4">Please run the migration script:</p>
                            <p class="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                                database/fix_missing_columns.sql
                            </p>
                            <p class="mt-4 text-sm text-gray-600">
                                Open your Supabase SQL Editor and run this script to fix the issue.
                            </p>
                        `,
                        confirmButtonColor: '#eab308'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Update Failed',
                        text: updateError.message,
                        confirmButtonColor: '#eab308'
                    });
                }
                return;
            }
            
            // Record the stock transaction for activity tracker
            await recordStockTransaction(
                selectedProductId,
                products.name,
                currentStockAction,
                quantity,
                previousStock,
                newStock,
                reason
            );
            
            await loadInventory();
            closeModal('stockUpdateModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: `Stock ${currentStockAction === 'in' ? 'added' : 'removed'} successfully!`,
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
            
            selectedProductId = null;
            currentStockAction = '';
        });
    }
    
    // Add Room Form
    const addRoomForm = document.getElementById('addRoomForm');
    if (addRoomForm && !addRoomForm.dataset.bound) {
        addRoomForm.dataset.bound = 'true';
        addRoomForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const newRoom = {
                name: formData.get('roomName'),
                type: formData.get('roomType'),
                capacity: parseInt(formData.get('roomCapacity')),
                rate: parseFloat(formData.get('roomRate')),
                status: 'Available'
            };
            
            const { error } = await supabase.from('rooms').insert([newRoom]);
            
            if (error) {
                console.error('❌ Failed to save room:', error.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error adding room',
                    text: error.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            await loadRooms();
            updateRoomDropdown(); // Update dropdown with new room
            closeModal('addRoomModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Room added successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // New Booking/Lease Form
    const newBookingForm = document.getElementById('newBookingForm');
    if (newBookingForm && !newBookingForm.dataset.bound) {
        newBookingForm.dataset.bound = 'true';
        
        // Update rent when room or duration changes
        const bookingRoomSelect = document.getElementById('bookingRoom');
        const bookingDurationInput = document.getElementById('bookingDuration');
        const totalAmountInput = document.getElementById('totalAmount');
        
        if (bookingRoomSelect && totalAmountInput) {
            bookingRoomSelect.addEventListener('change', async function() {
                const roomId = parseInt(this.value);
                if (!roomId) {
                    totalAmountInput.value = '';
                    return;
                }
                
                const { data: room } = await supabase
                    .from('rooms')
                    .select('rate')
                    .eq('id', roomId)
                    .single();
                
                if (room) {
                    totalAmountInput.value = room.rate;
                }
            });
        }
        
        newBookingForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const formData = new FormData(e.target);
            
            const roomId = parseInt(formData.get('bookingRoom'));
            const clientName = formData.get('clientName');
            const clientContact = formData.get('clientContact');
            const clientEmail = formData.get('clientEmail') || '';
            const leaseStart = formData.get('bookingDate');
            const leaseEnd = formData.get('leaseEndDate');
            const duration = parseInt(formData.get('bookingDuration'));
            const monthlyRent = parseFloat(formData.get('totalAmount'));
            const securityDeposit = parseFloat(formData.get('securityDeposit'));
            
            if (!roomId || !clientName || !leaseStart || !leaseEnd || !duration || !monthlyRent) {
                Swal.fire({
                    icon: 'error',
                    title: 'Missing Information',
                    text: 'Please fill in all required fields',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get room details
            const { data: roomData, error: roomFetchError } = await supabase
                .from('rooms')
                .select('name')
                .eq('id', roomId)
                .single();
            
            if (roomFetchError || !roomData) {
                console.error('❌ Failed to fetch room details:', roomFetchError);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not find room details',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Create new booking
            const newBooking = {
                room_id: roomId,
                room_name: roomData.name,
                tenant: clientName,
                client_name: clientName,
                contact: clientContact,
                client_contact: clientContact,
                email: clientEmail,
                start_date: leaseStart,
                lease_start: leaseStart,
                end_date: leaseEnd,
                lease_end: leaseEnd,
                rent: monthlyRent,
                duration: duration,
                duration_months: duration,
                monthly_rent: monthlyRent,
                security_deposit: securityDeposit,
                status: 'Active',
                total_paid: 0,
                balance: monthlyRent * duration
            };
            
            const { error: bookingError } = await supabase
                .from('bookings')
                .insert([newBooking]);
            
            if (bookingError) {
                console.error('❌ Failed to create booking:', bookingError.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Error creating lease',
                    text: bookingError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Update room status to Occupied
            const { error: roomError } = await supabase
                .from('rooms')
                .update({ 
                    status: 'Occupied'
                })
                .eq('id', roomId);
            
            if (roomError) {
                console.error('❌ Failed to update room status:', roomError.message);
            }
            
            await loadRooms();
            await loadBookings();
            closeModal('newBookingModal');
            
            Swal.fire({
                toast: true,
                position: 'bottom-end',
                icon: 'success',
                title: 'Lease created successfully!',
                showConfirmButton: false,
                timer: 1500,
                background: '#fff',
                color: '#000',
                width: '18rem',
                customClass: {
                    popup: 'rounded-lg shadow border border-gray-200 text-sm'
                }
            });
        });
    }
    
    // Add Payment Form
    const addPaymentForm = document.getElementById('addPaymentForm');
    if (addPaymentForm && !addPaymentForm.dataset.bound) {
        addPaymentForm.dataset.bound = 'true';
        addPaymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const leaseId = parseInt(document.getElementById('paymentLease').value);
            const amount = parseFloat(document.getElementById('paymentAmount').value);
            const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
            const receiptNumber = document.getElementById('paymentReceiptNumber').value;
            const notes = document.getElementById('paymentNote').value;
            
            if (!leaseId || !amount || amount <= 0) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Input',
                    text: 'Please select a lease and enter a valid amount',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get the booking details
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', leaseId)
                .single();
            
            if (fetchError || !booking) {
                console.error('Failed to fetch booking:', fetchError);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not find the selected lease',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Create payment record
            const paymentRecord = {
                lease_id: leaseId,
                booking_id: leaseId,
                amount: amount,
                payment_method: paymentMethod,
                receipt_number: receiptNumber || null,
                notes: notes || null,
                payment_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };
            
            // Insert payment record
            const { error: paymentError } = await supabase
                .from('payments')
                .insert([paymentRecord]);
            
            if (paymentError) {
                console.error('Failed to record payment:', paymentError);
                Swal.fire({
                    icon: 'error',
                    title: 'Payment Error',
                    text: `Could not save payment: ${paymentError.message}`,
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            
            // Update booking's total_paid and balance
            const newTotalPaid = (booking.total_paid || 0) + amount;
            const newBalance = (booking.balance || 0) - amount;
            
            // Determine if lease should be marked as paid
            const newStatus = newBalance <= 0 ? 'Paid' : booking.status;
            
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    total_paid: newTotalPaid,
                    balance: newBalance < 0 ? 0 : newBalance,
                    status: newStatus
                })
                .eq('id', leaseId);
            
            if (updateError) {
                console.error('Failed to update booking:', updateError);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: updateError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Reset form and close modal first
            document.getElementById('addPaymentForm').reset();
            closeModal('addPaymentModal');
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Payment Recorded Successfully!',
                html: `
                    <div class="text-left space-y-2">
                        <p><strong>Tenant:</strong> ${booking.tenant || booking.client_name}</p>
                        <p><strong>Room:</strong> ${booking.room_name}</p>
                        <p><strong>Amount Paid:</strong> ₱${amount.toLocaleString()}</p>
                        <p><strong>Method:</strong> ${paymentMethod === 'cash' ? 'Cash Payment' : paymentMethod.toUpperCase()}</p>
                        ${receiptNumber ? `<p><strong>Receipt #:</strong> ${receiptNumber}</p>` : ''}
                        <p><strong>New Balance:</strong> ₱${Math.max(0, newBalance).toLocaleString()}</p>
                        ${newStatus === 'Paid' ? '<p class="mt-3 text-green-600 font-bold">✓ Lease Fully Paid!</p>' : ''}
                        <p class="mt-4 text-sm text-gray-600 italic">Remember to issue an official receipt to the tenant.</p>
                    </div>
                `,
                confirmButtonColor: '#10b981',
                confirmButtonText: 'Done'
            });
            
            // Reload data across all modules in background
            await loadBookings();
            
            // Reload rooms to update dropdown
            if (typeof loadRooms === 'function') {
                await loadRooms();
            }
            
            // Reload payment summary if on that page
            if (typeof loadPaymentSummaryData === 'function') {
                await loadPaymentSummaryData();
            }
            
            // Reload dashboard if on that page
            if (typeof loadDashboardData === 'function') {
                await loadDashboardData();
            }
        });
    }
    
    // Add Credit Form
    const addCreditForm = document.getElementById('addCreditForm');
    if (addCreditForm && !addCreditForm.dataset.bound) {
        addCreditForm.dataset.bound = 'true';
        addCreditForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const { supabase } = await import('./config.js');
            
            const leaseId = parseInt(document.getElementById('creditLease').value);
            const amount = parseFloat(document.getElementById('creditAmount').value);
            const reason = document.getElementById('creditReason').value;
            const notes = document.getElementById('creditNote').value;
            const reference = document.getElementById('creditReference').value;
            
            if (!leaseId || !amount || amount <= 0 || !reason || !notes) {
                Swal.fire({
                    icon: 'error',
                    title: 'Invalid Input',
                    text: 'Please fill in all required fields',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Get the booking details
            const { data: booking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', leaseId)
                .single();
            
            if (fetchError || !booking) {
                console.error('Failed to fetch booking:', fetchError);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not find the selected lease',
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Create credit record
            const creditRecord = {
                lease_id: leaseId,
                booking_id: leaseId,
                amount: amount,
                reason: reason,
                notes: notes,
                reference: reference || null,
                credit_date: new Date().toISOString().split('T')[0],
                created_at: new Date().toISOString()
            };
            
            // Insert credit record
            const { error: creditError } = await supabase
                .from('credits')
                .insert([creditRecord]);
            
            if (creditError) {
                console.error('Failed to record credit:', creditError);
                Swal.fire({
                    icon: 'error',
                    title: 'Credit Error',
                    text: `Could not save credit: ${creditError.message}`,
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            
            // Update booking's balance (reduce it by credit amount)
            const newBalance = (booking.balance || 0) - amount;
            const newStatus = newBalance <= 0 ? 'Paid' : booking.status;
            
            const { error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    balance: newBalance < 0 ? 0 : newBalance,
                    status: newStatus
                })
                .eq('id', leaseId);
            
            if (updateError) {
                console.error('Failed to update booking:', updateError);
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: updateError.message,
                    confirmButtonColor: '#eab308'
                });
                return;
            }
            
            // Reset form and close modal
            document.getElementById('addCreditForm').reset();
            closeModal('addCreditModal');
            
            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Credit Added Successfully!',
                html: `
                    <div class="text-left space-y-2">
                        <p><strong>Tenant:</strong> ${booking.tenant || booking.client_name}</p>
                        <p><strong>Room:</strong> ${booking.room_name}</p>
                        <p><strong>Credit Amount:</strong> ₱${amount.toLocaleString()}</p>
                        <p><strong>Reason:</strong> ${reason.charAt(0).toUpperCase() + reason.slice(1)}</p>
                        ${reference ? `<p><strong>Reference:</strong> ${reference}</p>` : ''}
                        <p><strong>New Balance:</strong> ₱${Math.max(0, newBalance).toLocaleString()}</p>
                        ${newStatus === 'Paid' ? '<p class="mt-3 text-green-600 font-bold">✓ Lease Fully Paid!</p>' : ''}
                        <p class="mt-4 text-sm text-gray-600 italic">${notes}</p>
                    </div>
                `,
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'Done'
            });
            
            // Reload data across all modules in background
            await loadBookings();
            
            // Reload rooms
            if (typeof loadRooms === 'function') {
                await loadRooms();
            }
            
            // Reload payment summary if on that page
            if (typeof loadPaymentSummaryData === 'function') {
                await loadPaymentSummaryData();
            }
            
            // Reload dashboard if on that page
            if (typeof loadDashboardData === 'function') {
                await loadDashboardData();
            }
        });
    }
}

// Helper function to generate receipt number
function generateReceiptNumber() {
    const receiptInput = document.getElementById('paymentReceiptNumber');
    if (!receiptInput) return;
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // Format: OR-YYYYMMDD-HHMMSS-RRR
    const receiptNumber = `OR-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
    receiptInput.value = receiptNumber;
}

// Helper function to populate lease dropdown
async function populateLeaseDropdown(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    const { supabase } = await import('./config.js');
    const { bookings } = await import('./bookings.js');
    
    select.innerHTML = '<option value="">Select a lease</option>';
    
    // Filter only active bookings
    const activeBookings = bookings.filter(b => b.status === 'Active');
    
    if (activeBookings.length === 0) {
        select.innerHTML = '<option value="">No active leases available</option>';
        return;
    }
    
    activeBookings.forEach(booking => {
        const option = document.createElement('option');
        option.value = booking.id;
        option.textContent = `Lease #${booking.id} - ${booking.client_name || booking.tenant || 'Unknown Tenant'}`;
        option.dataset.bookingData = JSON.stringify(booking);
        select.appendChild(option);
    });
}

// Initialize Quick Actions in sidebar
function initializeQuickActions() {
    // Quick Add Product button
    const quickAddProduct = document.getElementById('quickAddProduct');
    if (quickAddProduct) {
        quickAddProduct.addEventListener('click', () => {
            const modal = document.getElementById('addProductModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Quick Add Room button
    const quickAddRoom = document.getElementById('quickAddRoom');
    if (quickAddRoom) {
        quickAddRoom.addEventListener('click', () => {
            const modal = document.getElementById('addRoomModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
    
    // Quick New Lease button
    const quickNewLease = document.getElementById('quickNewLease');
    if (quickNewLease) {
        quickNewLease.addEventListener('click', async () => {
            // Load rooms first to populate dropdown
            await loadRooms();
            updateRoomDropdown(); // Ensure dropdown is updated
            
            const modal = document.getElementById('newBookingModal');
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    }
}

// Logout function
async function initializeLogout() {
    const { supabase } = await import('./config.js');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            // Confirm logout
            const result = await Swal.fire({
                title: 'Logout',
                text: 'Are you sure you want to logout?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#eab308',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'Yes, logout',
                cancelButtonText: 'Cancel'
            });
            
            if (result.isConfirmed) {
                // Sign out from Supabase
                const { error } = await supabase.auth.signOut();
                
                if (error) {
                    console.error('Logout error:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Logout Failed',
                        text: error.message,
                        confirmButtonColor: '#eab308'
                    });
                    return;
                }
                
                // Clear all localStorage data
                localStorage.removeItem('userEmail');
                localStorage.removeItem('userId');
                localStorage.removeItem('userFullName');
                localStorage.removeItem('userOfficeUnit');
                localStorage.removeItem('isLoggedIn');
                
                // Show success message and redirect
                Swal.fire({
                    icon: 'success',
                    title: 'Logged Out',
                    text: 'You have been successfully logged out.',
                    timer: 1500,
                    showConfirmButton: false,
                    didClose: () => {
                        window.location.href = 'Log In.html';
                    }
                });
            }
        });
    }
}

// Initialize application
async function initApp() {
    try {
        // Load components
        await loadComponent('components/sidebar.html', 'sidebar');
        await loadComponent('components/header.html', 'header');
        await loadComponent('components/modals.html', 'modals');
        
        // Initialize modal controls after modals are loaded
        initializeModalControls();
        
        // Initialize form handlers
        await initializeFormHandlers();
        
        // Initialize Quick Actions in sidebar
        initializeQuickActions();
        
        // Initialize logout button
        await initializeLogout();
        
        // Load default page (dashboard)
        await loadPage('pages/dashboard.html', 'mainContent');
        
        // Initialize navigation
        initializeNavigation();
        
        // Initialize dashboard
        window.initDashboardPage();
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing application:', error);
    }
}

// Developer utility: Clear test rooms (Call from console: clearTestRooms())
window.clearTestRooms = async function() {
    try {
        const { supabase } = await import('./config.js');
        
        // Confirm action
        const result = await Swal.fire({
            title: 'Clear Test Rooms?',
            text: 'This will delete Room 1, Room 2, and Room 3 from Supabase',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, clear them',
            cancelButtonText: 'Cancel'
        });
        
        if (!result.isConfirmed) return;
        
        // Delete rooms with names "Room 1", "Room 2", "Room 3"
        const { data: deletedRooms, error } = await supabase
            .from('rooms')
            .delete()
            .in('name', ['Room 1', 'Room 2', 'Room 3'])
            .select();
        
        if (error) {
            console.error('Error deleting test rooms:', error);
            Swal.fire({
                icon: 'error',
                title: 'Delete Failed',
                text: error.message,
                confirmButtonColor: '#eab308'
            });
            return;
        }
        
        console.log('Deleted rooms:', deletedRooms);
        
        Swal.fire({
            icon: 'success',
            title: 'Test Rooms Cleared!',
            text: `Deleted ${deletedRooms?.length || 0} rooms`,
            confirmButtonColor: '#10b981'
        });
        
        // Reload rooms if on rooms page
        if (typeof loadRooms === 'function') {
            await loadRooms();
        }
        
    } catch (err) {
        console.error('Unexpected error:', err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to clear test rooms',
            confirmButtonColor: '#eab308'
        });
    }
};

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
