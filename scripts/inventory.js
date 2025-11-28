// Inventory Module
import { supabase, departmentNames } from './config.js';

export let inventory = [];
export let stockTransactions = [];

// Load inventory from Supabase
export async function loadInventory() {
    try {
        const { data, error } = await supabase
            .from("inventory")
            .select("*")
            .order("id", { ascending: true });

        if (error) {
            console.error("❌ Failed to load inventory:", error.message);
            
            // Check if it's a schema cache issue
            if (error.message.includes("updated_at") || error.message.includes("schema cache")) {
                Swal.fire({
                    icon: "warning",
                    title: "Database Schema Update Needed",
                    html: `
                        <p class="mb-4">The database is missing the <code>updated_at</code> column.</p>
                        <p class="mb-4">Please run the migration script located at:</p>
                        <p class="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                            database/fix_missing_columns.sql
                        </p>
                        <p class="mt-4 text-sm text-gray-600">
                            Open your Supabase SQL Editor and run this script to fix the issue.
                        </p>
                    `,
                    confirmButtonColor: "#eab308"
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error Loading Inventory",
                    text: error.message,
                    confirmButtonColor: "#eab308"
                });
            }
            return;
        }

        inventory = data || [];
        console.log(`✅ Loaded ${inventory.length} items from Supabase.`);
        renderInventory();
        
        // Also load stock transactions
        await loadStockTransactions();
    } catch (err) {
        console.error("⚠️ Unexpected error loading inventory:", err);
        Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Failed to load inventory. Please refresh the page.",
            confirmButtonColor: "#eab308"
        });
    }
}

// Load stock transactions from Supabase
export async function loadStockTransactions() {
    try {
        const { data, error } = await supabase
            .from("stock_transactions")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);

        if (error) {
            // Table might not exist yet, use localStorage as fallback
            console.warn("Stock transactions table not found, using localStorage fallback");
            stockTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
        } else {
            stockTransactions = data || [];
        }
        
        renderStockActivity();
    } catch (err) {
        console.error("⚠️ Error loading stock transactions:", err);
        // Fallback to localStorage
        stockTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
        renderStockActivity();
    }
}

// Record a stock transaction
export async function recordStockTransaction(inventoryId, productName, action, quantity, previousStock, newStock, reason) {
    const transaction = {
        inventory_id: inventoryId,
        product_name: productName,
        action: action,
        quantity: quantity,
        previous_stock: previousStock,
        new_stock: newStock,
        reason: reason || null,
        created_at: new Date().toISOString()
    };

    try {
        const { error } = await supabase
            .from("stock_transactions")
            .insert([transaction]);

        if (error) {
            console.warn("Failed to save to Supabase, using localStorage fallback:", error.message);
            // Fallback to localStorage
            const localTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
            localTransactions.unshift(transaction);
            // Keep only last 50 transactions
            if (localTransactions.length > 50) localTransactions.pop();
            localStorage.setItem('stockTransactions', JSON.stringify(localTransactions));
        }
        
        // Reload transactions to update the UI
        await loadStockTransactions();
    } catch (err) {
        console.error("⚠️ Error recording stock transaction:", err);
        // Fallback to localStorage
        const localTransactions = JSON.parse(localStorage.getItem('stockTransactions') || '[]');
        localTransactions.unshift(transaction);
        if (localTransactions.length > 50) localTransactions.pop();
        localStorage.setItem('stockTransactions', JSON.stringify(localTransactions));
        renderStockActivity();
    }
}

// Clear stock transaction history
export async function clearStockTransactions() {
    try {
        const { error } = await supabase
            .from("stock_transactions")
            .delete()
            .neq('id', 0); // Delete all records

        if (error) {
            console.warn("Failed to clear from Supabase:", error.message);
        }
        
        // Also clear localStorage
        localStorage.removeItem('stockTransactions');
        stockTransactions = [];
        renderStockActivity();
    } catch (err) {
        console.error("⚠️ Error clearing stock transactions:", err);
        localStorage.removeItem('stockTransactions');
        stockTransactions = [];
        renderStockActivity();
    }
}

// Render stock activity tracker
export function renderStockActivity() {
    const activityList = document.getElementById('stockActivityList');
    if (!activityList) return;

    if (!stockTransactions || stockTransactions.length === 0) {
        activityList.innerHTML = `
            <div class="px-6 py-8 text-center text-gray-500">
                <svg class="w-12 h-12 mx-auto text-gray-300 mb-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                </svg>
                <p class="text-sm">No stock activity yet</p>
                <p class="text-xs text-gray-400 mt-1">Stock in/out transactions will appear here</p>
            </div>
        `;
        return;
    }

    activityList.innerHTML = stockTransactions.map(t => {
        const date = new Date(t.created_at);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
        });
        const formattedTime = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit'
        });
        
        const isStockIn = t.action === 'in';
        const actionLabel = isStockIn ? 'Added' : 'Sold';
        const actionColor = isStockIn ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50';
        const iconBg = isStockIn ? 'bg-green-100' : 'bg-red-100';
        const iconColor = isStockIn ? 'text-green-600' : 'text-red-600';
        const quantitySign = isStockIn ? '+' : '-';

        return `
            <div class="px-6 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div class="flex items-center space-x-3">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full ${iconBg} flex items-center justify-center">
                        <svg class="w-4 h-4 ${iconColor}" fill="currentColor" viewBox="0 0 20 20">
                            ${isStockIn 
                                ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"></path>'
                                : '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>'
                            }
                        </svg>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-900">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionColor} mr-2">
                                ${actionLabel}
                            </span>
                            ${t.product_name}
                            <span class="font-bold ${isStockIn ? 'text-green-600' : 'text-red-600'}">${quantitySign}${t.quantity}</span>
                        </p>
                        ${t.reason ? `<p class="text-xs text-gray-500 mt-0.5">${t.reason}</p>` : ''}
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-xs text-gray-500">${formattedDate}</p>
                    <p class="text-xs text-gray-400">${formattedTime}</p>
                </div>
            </div>
        `;
    }).join('');
}

// Render inventory table
export function renderInventory(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (data.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="8" class="px-6 py-12 text-center">
                <div class="text-gray-500">
                    <p class="text-lg font-medium mb-2">No products in inventory</p>
                    <p class="text-sm">Click "Add New Product" to get started</p>
                </div>
            </td>
        `;
        tableBody.appendChild(emptyRow);
        return;
    }

    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50';
        
        const statusColor = item.status === 'In Stock' ? 'text-green-600 bg-green-100' : 
                           item.status === 'Low Stock' ? 'text-yellow-600 bg-yellow-100' : 
                           'text-red-600 bg-red-100';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${item.category}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${departmentNames[item.department] || item.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱${item.price.toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex items-center gap-2">
                    <button onclick="window.openStockModal(${item.id}, 'in')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Stock In
                    </button>
                    <button onclick="window.openStockModal(${item.id}, 'out')" class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Stock Out
                    </button>
                    <button onclick="window.deleteInventoryItem(${item.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Delete
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Delete inventory item
export async function deleteInventoryItem(id) {
    const item = inventory.find(p => p.id === id);
    if (!item) return;

    const confirmDelete = confirm(`Are you sure you want to delete "${item.name}" from the inventory?`);
    if (!confirmDelete) return;

    try {
        const { error } = await supabase
            .from("inventory")
            .delete()
            .eq("id", id);

        if (error) {
            console.error("❌ Supabase delete failed:", error.message);
            Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text: "Could not remove this product from Supabase.",
                confirmButtonColor: "#eab308"
            });
            return;
        }

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: `"${item.name}" deleted successfully`,
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000",
            width: "18rem",
            customClass: {
                popup: "rounded-lg shadow border border-gray-200 text-sm"
            }
        });

        await loadInventory();
    } catch (err) {
        console.error("⚠️ Unexpected delete error:", err);
        Swal.fire({
            icon: "error",
            title: "Unexpected Error",
            text: "Something went wrong while deleting.",
            confirmButtonColor: "#eab308"
        });
    }
}

// Filter inventory
export function filterInventory() {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const departmentFilter = document.getElementById('departmentFilter');

    if (!searchInput || !categoryFilter || !departmentFilter) return;

    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const department = departmentFilter.value;

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !category || item.category === category;
        const matchesDepartment = !department || item.department === department;
        return matchesSearch && matchesCategory && matchesDepartment;
    });

    renderInventory(filtered);
}

// Populate month filter dropdown for export
export function populateMonthFilter() {
    const monthFilter = document.getElementById('exportMonthFilter');
    if (!monthFilter) return;

    // Get unique months from transactions
    const months = new Set();
    stockTransactions.forEach(t => {
        const date = new Date(t.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
    });

    // Add current month if no transactions
    if (months.size === 0) {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        months.add(currentMonth);
    }

    // Sort months in descending order
    const sortedMonths = Array.from(months).sort().reverse();

    monthFilter.innerHTML = '<option value="">Select Month</option>';
    sortedMonths.forEach(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(year, parseInt(monthNum) - 1);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        monthFilter.innerHTML += `<option value="${month}">${monthName}</option>`;
    });

    // Select current month by default
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    if (sortedMonths.includes(currentMonth)) {
        monthFilter.value = currentMonth;
    } else if (sortedMonths.length > 0) {
        monthFilter.value = sortedMonths[0];
    }
}

// Export stock history to CSV
export function exportStockHistoryCSV() {
    const monthFilter = document.getElementById('exportMonthFilter');
    const selectedMonth = monthFilter?.value;

    if (!selectedMonth) {
        Swal.fire({
            icon: 'warning',
            title: 'Select a Month',
            text: 'Please select a month to export.',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(year, parseInt(month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Filter transactions for selected month
    const filteredTransactions = stockTransactions.filter(t => {
        const date = new Date(t.created_at);
        return date.getFullYear() === parseInt(year) && (date.getMonth() + 1) === parseInt(month);
    });

    // Build CSV content
    let csvContent = '';
    
    // Header section
    csvContent += `STOCK ACTIVITY REPORT\n`;
    csvContent += `Month: ${monthName}\n`;
    csvContent += `Generated: ${new Date().toLocaleString()}\n`;
    csvContent += `\n`;

    // Transaction history section
    csvContent += `STOCK TRANSACTIONS\n`;
    csvContent += `Date,Time,Product,Action,Quantity,Previous Stock,New Stock,Reason\n`;

    if (filteredTransactions.length === 0) {
        csvContent += `No transactions for this month\n`;
    } else {
        filteredTransactions.forEach(t => {
            const date = new Date(t.created_at);
            const formattedDate = date.toLocaleDateString('en-US');
            const formattedTime = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const action = t.action === 'in' ? 'Stock In' : 'Stock Out';
            const reason = (t.reason || 'N/A').replace(/,/g, ';'); // Replace commas to avoid CSV issues
            
            csvContent += `${formattedDate},${formattedTime},"${t.product_name}",${action},${t.quantity},${t.previous_stock},${t.new_stock},"${reason}"\n`;
        });
    }

    // Summary by product
    csvContent += `\n`;
    csvContent += `MONTHLY SUMMARY BY PRODUCT\n`;
    csvContent += `Product,Total Stock In,Total Stock Out,Net Change\n`;

    const productSummary = {};
    filteredTransactions.forEach(t => {
        if (!productSummary[t.product_name]) {
            productSummary[t.product_name] = { stockIn: 0, stockOut: 0 };
        }
        if (t.action === 'in') {
            productSummary[t.product_name].stockIn += t.quantity;
        } else {
            productSummary[t.product_name].stockOut += t.quantity;
        }
    });

    Object.keys(productSummary).sort().forEach(product => {
        const summary = productSummary[product];
        const netChange = summary.stockIn - summary.stockOut;
        csvContent += `"${product}",${summary.stockIn},${summary.stockOut},${netChange >= 0 ? '+' : ''}${netChange}\n`;
    });

    // Current inventory status
    csvContent += `\n`;
    csvContent += `CURRENT INVENTORY STATUS (as of ${new Date().toLocaleString()})\n`;
    csvContent += `Product,Category,Department,Current Stock,Price,Status\n`;

    inventory.forEach(item => {
        const category = item.category || 'N/A';
        const department = departmentNames[item.department] || item.department || 'N/A';
        csvContent += `"${item.name}","${category}","${department}",${item.stock},₱${item.price.toLocaleString()},${item.status}\n`;
    });

    // Total summary
    csvContent += `\n`;
    csvContent += `TOTALS\n`;
    const totalStockIn = filteredTransactions.filter(t => t.action === 'in').reduce((sum, t) => sum + t.quantity, 0);
    const totalStockOut = filteredTransactions.filter(t => t.action === 'out').reduce((sum, t) => sum + t.quantity, 0);
    const totalCurrentStock = inventory.reduce((sum, item) => sum + item.stock, 0);
    const totalInventoryValue = inventory.reduce((sum, item) => sum + (item.stock * item.price), 0);

    csvContent += `Total Stock In (${monthName}),${totalStockIn}\n`;
    csvContent += `Total Stock Out (${monthName}),${totalStockOut}\n`;
    csvContent += `Net Change,${totalStockIn - totalStockOut >= 0 ? '+' : ''}${totalStockIn - totalStockOut}\n`;
    csvContent += `Total Current Stock,${totalCurrentStock}\n`;
    csvContent += `Total Inventory Value,₱${totalInventoryValue.toLocaleString()}\n`;

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Stock_Report_${selectedMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'success',
        title: `Report exported: Stock_Report_${selectedMonth}.csv`,
        showConfirmButton: false,
        timer: 2000
    });
}
