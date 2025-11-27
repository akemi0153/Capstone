-- Migration Script: Add missing balance column to bookings table
-- Run this if you already have a bookings table without the balance column

-- Add balance column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'balance'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0;
        
        RAISE NOTICE 'Column balance added to bookings table';
    ELSE
        RAISE NOTICE 'Column balance already exists in bookings table';
    END IF;
END $$;

-- Add total_paid column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'total_paid'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN total_paid DECIMAL(10, 2) DEFAULT 0;
        
        RAISE NOTICE 'Column total_paid added to bookings table';
    ELSE
        RAISE NOTICE 'Column total_paid already exists in bookings table';
    END IF;
END $$;

-- Add security_deposit column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'security_deposit'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN security_deposit DECIMAL(10, 2) DEFAULT 0;
        
        RAISE NOTICE 'Column security_deposit added to bookings table';
    ELSE
        RAISE NOTICE 'Column security_deposit already exists in bookings table';
    END IF;
END $$;

-- Add duration_months column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'duration_months'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN duration_months INTEGER;
        
        RAISE NOTICE 'Column duration_months added to bookings table';
    ELSE
        RAISE NOTICE 'Column duration_months already exists in bookings table';
    END IF;
END $$;

-- Add monthly_rent column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'monthly_rent'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN monthly_rent DECIMAL(10, 2) DEFAULT 0;
        
        RAISE NOTICE 'Column monthly_rent added to bookings table';
    ELSE
        RAISE NOTICE 'Column monthly_rent already exists in bookings table';
    END IF;
END $$;

-- Add other potentially missing columns
DO $$ 
BEGIN
    -- client_name
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'client_name'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN client_name VARCHAR(255);
        RAISE NOTICE 'Column client_name added to bookings table';
    END IF;
    
    -- client_contact
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'client_contact'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN client_contact VARCHAR(50);
        RAISE NOTICE 'Column client_contact added to bookings table';
    END IF;
    
    -- lease_start
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'lease_start'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN lease_start DATE;
        RAISE NOTICE 'Column lease_start added to bookings table';
    END IF;
    
    -- lease_end
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'lease_end'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN lease_end DATE;
        RAISE NOTICE 'Column lease_end added to bookings table';
    END IF;
    
    -- room_id
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'room_id'
    ) THEN
        ALTER TABLE bookings 
        ADD COLUMN room_id BIGINT;
        RAISE NOTICE 'Column room_id added to bookings table';
    END IF;
END $$;

-- Update existing records to calculate balance if needed
DO $$
BEGIN
    UPDATE bookings 
    SET balance = COALESCE(monthly_rent, 0) * COALESCE(duration_months, 1) - COALESCE(total_paid, 0)
    WHERE balance = 0 OR balance IS NULL;
    
    RAISE NOTICE 'Migration completed successfully';
END $$;
