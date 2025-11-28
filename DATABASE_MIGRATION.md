# Database Migration Instructions

## Issue
The payment and credit system requires additional columns that are missing from the database:
- `payments.booking_id` - for linking payments to bookings
- `credits.booking_id` - for linking credits to bookings
- `bookings.email` - for storing tenant email addresses
- `bookings.notes` - for storing reminders and comments (displays in Current Leases)
- `bookings.status` constraint needs to include 'Paid'

## How to Fix

### Option 1: Run Migration Script (Recommended)
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the entire content of `database/migrate_payment_system.sql`
6. Click "Run" button
7. You should see success messages like:
   ```
   ✓ Added booking_id column to payments table
   ✓ Added email column to bookings table
   ✓ Added notes column to bookings table
   ✓ Added booking_id column to credits table
   ✓ Updated status constraint to include Paid status
   ```

### Option 2: Quick Fix (Manual SQL)
Run these commands in Supabase SQL Editor:

```sql
-- Add booking_id to payments
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE;

UPDATE payments SET booking_id = lease_id WHERE booking_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);

-- Add booking_id to credits
ALTER TABLE credits 
ADD COLUMN IF NOT EXISTS booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE;

UPDATE credits SET booking_id = lease_id WHERE booking_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_credits_booking_id ON credits(booking_id);

-- Add email to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Add notes to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update status constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
ALTER TABLE bookings 
ADD CONSTRAINT bookings_status_check 
CHECK (status IN ('Active', 'Ended', 'Cancelled', 'Paid'));
```

### Verification
After running the migration, verify by running:

```sql
-- Check columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('booking_id', 'lease_id');

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('email', 'notes');
```

## What This Fixes
✅ Payment recording will work without "booking_id not found" error
✅ Credit recording will work without "booking_id not found" error
✅ Email addresses can be stored for tenants
✅ Payment reminders can be saved as notes to bookings
✅ Reminder notes display in Current Leases table with bell icon
✅ Lease status can be set to "Paid" when fully paid (by payment or credit)
✅ Payment and credit history will display correctly
✅ Credits reduce balance and update status automatically

## Files Updated
- `database/schema.sql` - Updated with new columns
- `database/migrate_payment_system.sql` - Migration script
- `database/add_booking_id_to_payments.sql` - Individual migration for booking_id
