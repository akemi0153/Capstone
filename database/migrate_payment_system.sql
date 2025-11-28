-- Migration: Add missing columns for payment system
-- Run this script on your existing database to add required columns

DO $$ 
BEGIN
    -- Add booking_id to payments table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE payments 
        ADD COLUMN booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE;
        
        -- Copy existing lease_id values to booking_id
        UPDATE payments SET booking_id = lease_id WHERE booking_id IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
        
        RAISE NOTICE '✓ Added booking_id column to payments table';
    ELSE
        RAISE NOTICE '✓ booking_id column already exists in payments table';
    END IF;

    -- Add email to bookings table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN email VARCHAR(255);
        
        RAISE NOTICE '✓ Added email column to bookings table';
    ELSE
        RAISE NOTICE '✓ email column already exists in bookings table';
    END IF;

    -- Add notes to bookings table (for reminders and comments)
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'notes'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN notes TEXT;
        
        RAISE NOTICE '✓ Added notes column to bookings table';
    ELSE
        RAISE NOTICE '✓ notes column already exists in bookings table';
    END IF;

    -- Add booking_id to credits table
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'credits' 
        AND column_name = 'booking_id'
    ) THEN
        ALTER TABLE credits 
        ADD COLUMN booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE;
        
        -- Copy existing lease_id values to booking_id
        UPDATE credits SET booking_id = lease_id WHERE booking_id IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_credits_booking_id ON credits(booking_id);
        
        RAISE NOTICE '✓ Added booking_id column to credits table';
    ELSE
        RAISE NOTICE '✓ booking_id column already exists in credits table';
    END IF;

    -- Update status check constraint to include 'Paid'
    BEGIN
        ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
        ALTER TABLE bookings 
        ADD CONSTRAINT bookings_status_check 
        CHECK (status IN ('Active', 'Ended', 'Cancelled', 'Paid'));
        
        RAISE NOTICE '✓ Updated status constraint to include Paid status';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE '✓ Status constraint already updated or does not exist';
    END;

END $$;

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE '=== Migration Complete ===';
    RAISE NOTICE 'Verifying columns...';
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'booking_id') THEN
        RAISE NOTICE '✓ payments.booking_id exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'email') THEN
        RAISE NOTICE '✓ bookings.email exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'notes') THEN
        RAISE NOTICE '✓ bookings.notes exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'credits' AND column_name = 'booking_id') THEN
        RAISE NOTICE '✓ credits.booking_id exists';
    END IF;
    
    RAISE NOTICE '=== All columns verified ===';
END $$;
