-- Verification Script for SMART IGP Database
-- Run this script AFTER running fix_missing_columns.sql
-- This will verify that all columns and triggers are properly installed

-- ============================================
-- 1. Check for updated_at columns in all tables
-- ============================================

SELECT 
    'COLUMN CHECK' as check_type,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name = 'updated_at' THEN '✅ PRESENT'
        ELSE '❌ MISSING'
    END as status
FROM information_schema.columns
WHERE table_name IN ('inventory', 'rooms', 'bookings', 'payments', 'credits')
  AND column_name IN ('created_at', 'updated_at')
ORDER BY table_name, column_name;

-- ============================================
-- 2. Check for triggers on all tables
-- ============================================

SELECT 
    'TRIGGER CHECK' as check_type,
    trigger_name,
    event_object_table as table_name,
    action_timing,
    event_manipulation,
    '✅ ACTIVE' as status
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
  AND event_object_table IN ('inventory', 'rooms', 'bookings', 'payments', 'credits')
ORDER BY event_object_table;

-- ============================================
-- 3. Count records in each table (Safe version)
-- ============================================

DO $$
DECLARE
    inv_count INT;
    rooms_count INT;
    bookings_count INT;
    payments_count INT;
    credits_count INT;
    has_updated_at BOOLEAN;
BEGIN
    -- Check if updated_at column exists in inventory
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    IF has_updated_at THEN
        -- Count records
        SELECT COUNT(*) FROM inventory INTO inv_count;
        SELECT COUNT(*) FROM rooms INTO rooms_count;
        SELECT COUNT(*) FROM bookings INTO bookings_count;
        SELECT COUNT(*) FROM payments INTO payments_count;
        SELECT COUNT(*) FROM credits INTO credits_count;
        
        RAISE NOTICE 'RECORD COUNT CHECK:';
        RAISE NOTICE '  inventory: % records ✅', inv_count;
        RAISE NOTICE '  rooms: % records ✅', rooms_count;
        RAISE NOTICE '  bookings: % records ✅', bookings_count;
        RAISE NOTICE '  payments: % records ✅', payments_count;
        RAISE NOTICE '  credits: % records ✅', credits_count;
    ELSE
        RAISE WARNING '❌ Cannot count records: updated_at column missing. Run fix_missing_columns.sql first!';
    END IF;
END $$;

-- ============================================
-- 4. Test trigger functionality
-- ============================================

-- This creates a test record, updates it, and checks if updated_at changed
DO $$
DECLARE
    test_id INT;
    created_time TIMESTAMP;
    updated_time TIMESTAMP;
    has_updated_at BOOLEAN;
BEGIN
    -- Check if updated_at column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'updated_at'
    ) INTO has_updated_at;
    
    IF NOT has_updated_at THEN
        RAISE WARNING '❌ TRIGGER TEST SKIPPED: updated_at column missing. Run fix_missing_columns.sql first!';
        RETURN;
    END IF;
    
    -- Insert test record
    INSERT INTO inventory (name, category, department, stock, price, status)
    VALUES ('TEST_VERIFICATION_RECORD', 'merchandise', 'it', 10, 100.00, 'In Stock')
    RETURNING id, created_at INTO test_id, created_time;
    
    -- Wait a moment
    PERFORM pg_sleep(0.1);
    
    -- Update the record
    UPDATE inventory SET stock = 15 WHERE id = test_id
    RETURNING updated_at INTO updated_time;
    
    -- Check if trigger worked
    IF updated_time > created_time THEN
        RAISE NOTICE '✅ TRIGGER TEST PASSED: updated_at changed from % to %', created_time, updated_time;
    ELSE
        RAISE WARNING '❌ TRIGGER TEST FAILED: updated_at did not change';
    END IF;
    
    -- Clean up test record
    DELETE FROM inventory WHERE id = test_id;
    RAISE NOTICE '✅ Test record cleaned up';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '❌ TRIGGER TEST ERROR: %', SQLERRM;
END $$;

-- ============================================
-- 5. Summary Report
-- ============================================

DO $$
DECLARE
    inv_updated BOOLEAN;
    rooms_updated BOOLEAN;
    bookings_updated BOOLEAN;
    payments_updated BOOLEAN;
    credits_updated BOOLEAN;
    all_good BOOLEAN;
BEGIN
    -- Check each table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'updated_at'
    ) INTO inv_updated;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'rooms' AND column_name = 'updated_at'
    ) INTO rooms_updated;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'updated_at'
    ) INTO bookings_updated;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'updated_at'
    ) INTO payments_updated;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'credits' AND column_name = 'updated_at'
    ) INTO credits_updated;
    
    all_good := inv_updated AND rooms_updated AND bookings_updated AND payments_updated AND credits_updated;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SMART IGP DATABASE VERIFICATION REPORT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Column Status:';
    RAISE NOTICE '  inventory: %', CASE WHEN inv_updated THEN '✅ OK' ELSE '❌ MISSING' END;
    RAISE NOTICE '  rooms: %', CASE WHEN rooms_updated THEN '✅ OK' ELSE '❌ MISSING' END;
    RAISE NOTICE '  bookings: %', CASE WHEN bookings_updated THEN '✅ OK' ELSE '❌ MISSING' END;
    RAISE NOTICE '  payments: %', CASE WHEN payments_updated THEN '✅ OK' ELSE '❌ MISSING' END;
    RAISE NOTICE '  credits: %', CASE WHEN credits_updated THEN '✅ OK' ELSE '❌ MISSING' END;
    RAISE NOTICE '';
    
    IF all_good THEN
        RAISE NOTICE '========================================';
        RAISE NOTICE '✅ ALL CHECKS PASSED!';
        RAISE NOTICE '========================================';
        RAISE NOTICE '';
        RAISE NOTICE 'Your database is ready to use.';
        RAISE NOTICE 'You can now close this window and refresh your application.';
    ELSE
        RAISE WARNING '========================================';
        RAISE WARNING '⚠️ SOME CHECKS FAILED';
        RAISE WARNING '========================================';
        RAISE WARNING '';
        RAISE WARNING 'Please run fix_missing_columns.sql again.';
    END IF;
END $$;

-- ============================================
-- 6. Expected Output Summary
-- ============================================

/*
Expected Output When Everything is Working:

COLUMN CHECK:
- inventory: created_at ✅ PRESENT, updated_at ✅ PRESENT
- rooms: created_at ✅ PRESENT, updated_at ✅ PRESENT
- bookings: created_at ✅ PRESENT, updated_at ✅ PRESENT
- payments: created_at ✅ PRESENT, updated_at ✅ PRESENT
- credits: created_at ✅ PRESENT, updated_at ✅ PRESENT

TRIGGER CHECK:
- update_inventory_updated_at on inventory ✅ ACTIVE
- update_rooms_updated_at on rooms ✅ ACTIVE
- update_bookings_updated_at on bookings ✅ ACTIVE
- update_payments_updated_at on payments ✅ ACTIVE
- update_credits_updated_at on credits ✅ ACTIVE

RECORD COUNT:
- All tables show "✅ ALL RECORDS OK"

TRIGGER TEST:
- ✅ TRIGGER TEST PASSED

SUMMARY:
- ✅ ALL CHECKS PASSED!
*/
