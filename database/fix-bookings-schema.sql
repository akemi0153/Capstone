-- Fix bookings table schema
-- This will ensure all required columns exist and remove NOT NULL constraints where appropriate

-- First, let's make sure the table exists with all necessary columns
DO $$ 
BEGIN
    -- Ensure all columns exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'duration') THEN
        ALTER TABLE bookings ADD COLUMN duration INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bookings' AND column_name = 'duration_months') THEN
        ALTER TABLE bookings ADD COLUMN duration_months INTEGER;
    END IF;
    
    -- Make columns nullable if they have NOT NULL constraints
    ALTER TABLE bookings ALTER COLUMN duration DROP NOT NULL;
    ALTER TABLE bookings ALTER COLUMN duration_months DROP NOT NULL;
    ALTER TABLE bookings ALTER COLUMN tenant DROP NOT NULL;
    ALTER TABLE bookings ALTER COLUMN room_name DROP NOT NULL;
    
END $$;

-- Now update duration from duration_months if duration is null
UPDATE bookings 
SET duration = duration_months 
WHERE duration IS NULL AND duration_months IS NOT NULL;

-- And vice versa
UPDATE bookings 
SET duration_months = duration 
WHERE duration_months IS NULL AND duration IS NOT NULL;

SELECT 'Bookings table schema fixed successfully!' AS result;
