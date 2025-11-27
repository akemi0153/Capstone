import { supabase } from './supabase-client.js';

let rooms = [];

export async function loadRooms() {
    const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("id", { ascending: true });
        
    if (error) {
        console.error("❌ Error loading rooms:", error.message);
        return;
    }

    rooms = data || [];
    console.log(`✅ Loaded ${rooms.length} rooms from Supabase.`);
    renderRooms();
    updateRoomDropdown();
}

export function renderRooms(data = rooms) {
    const tableBody = document.getElementById('roomsTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';

    if (!data || data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                    <p class="text-lg font-medium mb-2">No rooms available</p>
                    <p class="text-sm">Click "Add New Room" to add one.</p>
                </td>
            </tr>
        `;
        return;
    }

    data.forEach(room => {
        const statusColor = room.status === 'Available' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition';

        row.innerHTML = `
            <td class="px-6 py-4 text-sm text-gray-900">${room.name}</td>
            <td class="px-6 py-4 text-sm text-gray-500 capitalize">${room.type}</td>
            <td class="px-6 py-4 text-sm text-gray-500">${room.capacity}</td>
            <td class="px-6 py-4 text-sm text-gray-900">₱${room.rate.toLocaleString()}</td>
            <td class="px-6 py-4 text-sm">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}">
                    ${room.status}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="roomsModule.deleteRoom(${room.id})" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition">
                    Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

export async function deleteRoom(id) {
    const room = rooms.find(r => r.id === id);
    if (!room) return;

    const confirmDelete = await Swal.fire({
        title: `Delete "${room.name}"?`,
        text: "This will permanently remove the room from the database.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#eab308",
        confirmButtonText: "Yes, delete it"
    });

    if (!confirmDelete.isConfirmed) return;

    const { error } = await supabase.from("rooms").delete().eq("id", id);
    
    if (error) {
        Swal.fire("Error", "Failed to delete room", "error");
        return;
    }

    rooms = rooms.filter(r => r.id !== id);
    renderRooms();

    Swal.fire({
        toast: true,
        position: "bottom-end",
        icon: "success",
        title: `"${room.name}" deleted successfully`,
        showConfirmButton: false,
        timer: 1500
    });
}

export function updateRoomDropdown() {
    const select = document.getElementById('bookingRoom');
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a room</option>';
    
    rooms.filter(room => room.status === 'Available').forEach(room => {
        const option = document.createElement('option');
        option.value = room.id;
        option.textContent = `${room.name} - ₱${room.rate.toLocaleString()}/month`;
        option.dataset.rate = room.rate;
        select.appendChild(option);
    });
}

export function getRoomsData() {
    return rooms;
}
