-- Add booking_id column to payments table
-- This maintains compatibility with code that uses booking_id

DO $$ 
BEGIN
    -- Check if booking_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payments' 
        AND column_name = 'booking_id'
    ) THEN
        -- Add booking_id column
        ALTER TABLE payments 
        ADD COLUMN booking_id BIGINT REFERENCES bookings(id) ON DELETE CASCADE;
        
        -- Copy existing lease_id values to booking_id
        UPDATE payments SET booking_id = lease_id WHERE booking_id IS NULL;
        
        -- Create index for better performance
        CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
        
        RAISE NOTICE 'Added booking_id column to payments table';
    ELSE
        RAISE NOTICE 'booking_id column already exists in payments table';
    END IF;
END $$;
