import { supabase } from './supabase-client.js';
import { DEPARTMENT_NAMES, STOCK_THRESHOLDS } from './config.js';

let inventory = [];
let selectedProductId = null;
let currentStockAction = '';

export async function loadInventory() {
    const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("❌ Failed to load inventory:", error.message);
        Swal.fire("Error", "Failed to load inventory", "error");
        return;
    }

    inventory = data || [];
    console.log(`✅ Loaded ${inventory.length} items from Supabase.`);
    renderInventory();
}

export function renderInventory(data = inventory) {
    const tableBody = document.getElementById('inventoryTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-12 text-center">
                    <div class="text-gray-500">
                        <p class="text-lg font-medium mb-2">No products in inventory</p>
                        <p class="text-sm">Click "Add New Product" to get started</p>
                    </div>
                </td>
            </tr>
        `;
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
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${DEPARTMENT_NAMES[item.department] || item.department}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${item.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱${item.price.toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                    ${item.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="inventoryModule.openStockModal(${item.id}, 'in')" class="text-green-600 hover:text-green-900 mr-3">Stock In</button>
                <button onclick="inventoryModule.openStockModal(${item.id}, 'out')" class="text-yellow-600 hover:text-yellow-900 mr-3">Stock Out</button>
                <button onclick="inventoryModule.deleteItem(${item.id})" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

export function filterInventory() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    const departmentFilter = document.getElementById('departmentFilter')?.value || '';

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || item.category === categoryFilter;
        const matchesDepartment = !departmentFilter || item.department === departmentFilter;
        return matchesSearch && matchesCategory && matchesDepartment;
    });

    renderInventory(filtered);
}

export async function deleteItem(id) {
    const item = inventory.find(p => p.id === id);
    if (!item) return;

    const result = await Swal.fire({
        title: "Delete item?",
        text: `"${item.name}" will be permanently removed.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#9ca3af",
        confirmButtonText: "Delete"
    });

    if (!result.isConfirmed) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);
    
    if (error) {
        console.error("❌ Delete failed:", error);
        Swal.fire("Error", "Failed to delete item", "error");
        return;
    }

    await loadInventory();
    
    Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: `"${item.name}" deleted`,
        showConfirmButton: false,
        timer: 1500
    });
}

export function openStockModal(productId, action) {
    const product = inventory.find(p => p.id === productId);
    if (!product) return;

    selectedProductId = productId;
    currentStockAction = action;

    document.getElementById('stockProductName').value = product.name;
    document.getElementById('currentStock').value = product.stock;
    document.getElementById('stockUpdateTitle').textContent = action === 'in' ? 'Stock In' : 'Stock Out';
    document.getElementById('confirmStockUpdate').textContent = action === 'in' ? 'Add Stock' : 'Remove Stock';
    
    document.getElementById('stockUpdateModal').classList.remove('hidden');
    document.getElementById('stockUpdateModal').classList.add('flex');
}

export function getInventoryData() {
    return inventory;
}

export function getSelectedProduct() {
    return { id: selectedProductId, action: currentStockAction };
}
