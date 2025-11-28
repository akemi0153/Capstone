// Bookings Module
import { supabase } from './config.js';
import { rooms } from './rooms.js';

export let bookings = [];

// Load bookings from Supabase
export async function loadBookings() {
    const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .order("id", { ascending: true });

    if (error) {
        console.error("❌ Error loading bookings:", error.message);
        return;
    }

    bookings = data || [];
    console.log(`✅ Loaded ${bookings.length} bookings from Supabase.`);
    renderBookings(bookings);
}

// Render bookings table
export function renderBookings(data = bookings) {
    const tbody = document.getElementById("bookingsTable");
    if (!tbody) {
        console.error("❌ Could not find bookingsTable element.");
        return;
    }

    if (!data || data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    No active leases found.
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = data.map(b => {
        const isEnded = b.status === 'Ended' || b.status === 'Cancelled';
        const isPaid = b.status === 'Paid';
        const statusColor = b.status === 'Active' ? 'bg-green-100 text-green-800' : 
                           isPaid ? 'bg-blue-100 text-blue-800' : 
                           'bg-gray-100 text-gray-800';
        
        // Format notes to show reminders
        const hasNotes = b.notes && b.notes.trim() !== '';
        const notesPreview = hasNotes ? 
            (b.notes.length > 50 ? b.notes.substring(0, 50) + '...' : b.notes) : '';
        
        return `
        <tr data-booking-id="${b.id}" class="hover:bg-gray-50">
            <td class="px-6 py-4">#${b.id}</td>
            <td class="px-6 py-4">${b.room_name || "N/A"}</td>
            <td class="px-6 py-4">
                <div>
                    <div class="font-medium text-gray-900">${b.tenant || "—"}</div>
                    ${hasNotes ? `
                        <div class="mt-1 flex items-start text-xs text-gray-500">
                            <svg class="w-3 h-3 mr-1 mt-0.5 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"></path>
                            </svg>
                            <span class="italic" title="${b.notes}">${notesPreview}</span>
                        </div>
                    ` : ''}
                </div>
            </td>
            <td class="px-6 py-4">${b.contact || "—"}</td>
            <td class="px-6 py-4">${b.start_date || "—"}</td>
            <td class="px-6 py-4">${b.end_date || "—"}</td>
            <td class="px-6 py-4">₱${(b.rent || 0).toLocaleString()}</td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">
                    ${b.status}
                </span>
            </td>
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2">
                    <button 
                        onclick="window.cancelLease(${b.id})" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm hover:shadow-md ${isEnded ? 'opacity-50 cursor-not-allowed' : ''}"
                        ${isEnded ? 'disabled title="Lease already ended"' : ''}>
                        End
                    </button>
                    <button onclick="window.deleteLease(${b.id})" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-150 shadow-sm hover:shadow-md">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join("");
}

// Cancel/End lease
export async function cancelLease(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            Swal.fire("Error", "Booking not found.", "error");
            return;
        }

        // Check if lease is already ended
        if (booking.status === 'Ended' || booking.status === 'Cancelled') {
            Swal.fire({
                icon: "info",
                title: "Already Ended",
                text: "This lease has already been ended.",
                confirmButtonColor: "#eab308"
            });
            return;
        }

        const confirm = await Swal.fire({
            title: "End Lease?",
            text: `Are you sure you want to end the lease for ${booking.tenant_name || booking.tenant}?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#eab308",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, end it"
        });

        if (!confirm.isConfirmed) return;

        const { error: bookingError } = await supabase
            .from("bookings")
            .update({ status: "Ended" })
            .eq("id", bookingId);

        if (bookingError) {
            Swal.fire("Error", "Failed to update booking status.", "error");
            console.error(bookingError);
            return;
        }

        const { error: roomError } = await supabase
            .from("rooms")
            .update({ status: "Available" })
            .eq("id", booking.room_id);

        if (roomError) console.error("Room update failed:", roomError);

        booking.status = "Ended";
        const room = rooms.find(r => r.id === booking.room_id);
        if (room) room.status = "Available";

        renderBookings(bookings);

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: "Lease ended successfully!",
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000"
        });
    } catch (err) {
        console.error("Unexpected cancelLease error:", err);
        Swal.fire("Error", "Unexpected issue while ending lease.", "error");
    }
}

// Delete lease
export async function deleteLease(bookingId) {
    try {
        const booking = bookings.find(b => b.id === bookingId);
        if (!booking) {
            Swal.fire("Error", "Booking not found.", "error");
            return;
        }

        const confirm = await Swal.fire({
            title: "Delete Lease?",
            text: `This will permanently remove the lease for ${booking.tenant || "this tenant"}.`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it"
        });

        if (!confirm.isConfirmed) return;

        const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
        if (error) {
            console.error("Delete failed:", error);
            Swal.fire("Error", "Could not delete booking from database.", "error");
            return;
        }

        bookings = bookings.filter(b => b.id !== bookingId);
        renderBookings(bookings);

        Swal.fire({
            toast: true,
            position: "bottom-end",
            icon: "success",
            title: "Lease deleted successfully!",
            showConfirmButton: false,
            timer: 1500,
            background: "#fff",
            color: "#000"
        });
    } catch (err) {
        console.error("Unexpected deleteLease error:", err);
        Swal.fire("Error", "Unexpected issue while deleting lease.", "error");
    }
}
