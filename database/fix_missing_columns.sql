-- Check and add updated_at to inventory table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE inventory ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to inventory table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in inventory table';
    END IF;
END $$;

-- Check and add updated_at to rooms table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE rooms ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to rooms table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in rooms table';
    END IF;
END $$;

-- Check and add updated_at to bookings table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE bookings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to bookings table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in bookings table';
    END IF;
END $$;

-- Check and add updated_at to payments table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE payments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to payments table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in payments table';
    END IF;
END $$;

-- Check and add updated_at to credits table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE credits ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to credits table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in credits table';
    END IF;
END $$;

-- ============================================
-- 2. Create trigger function if it doesn't exist
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. Create triggers for all tables
-- ============================================

-- Inventory table trigger
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at
    BEFORE UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Rooms table trigger
DROP TRIGGER IF EXISTS update_rooms_updated_at ON rooms;
CREATE TRIGGER update_rooms_updated_at
    BEFORE UPDATE ON rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Bookings table trigger
DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Payments table trigger
DROP TRIGGER IF EXISTS update_payments_updated_at ON payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Credits table trigger
DROP TRIGGER IF EXISTS update_credits_updated_at ON credits;
CREATE TRIGGER update_credits_updated_at
    BEFORE UPDATE ON credits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. Update existing rows to have current timestamp
-- ============================================

UPDATE inventory SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE rooms SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE bookings SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE payments SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE credits SET updated_at = NOW() WHERE updated_at IS NULL;

-- ============================================
-- 5. Verify the changes
-- ============================================

DO $$
DECLARE
    tbl_name TEXT;
    column_exists BOOLEAN;
BEGIN
    FOR tbl_name IN SELECT unnest(ARRAY['inventory', 'rooms', 'bookings', 'payments', 'credits'])
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = tbl_name AND column_name = 'updated_at'
        ) INTO column_exists;
        
        IF column_exists THEN
            RAISE NOTICE 'Table % has updated_at column ✓', tbl_name;
        ELSE
            RAISE WARNING 'Table % is missing updated_at column ✗', tbl_name;
        END IF;
    END LOOP;
END $$;

-- Success message
SELECT 'Migration completed successfully! All tables now have updated_at columns with triggers.' AS status;
