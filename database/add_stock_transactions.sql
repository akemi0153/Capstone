-- Migration: Add stock_transactions table for tracking stock in/out history
-- Run this script in your Supabase SQL Editor

-- ============================================
-- STOCK TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS stock_transactions (
    id BIGSERIAL PRIMARY KEY,
    inventory_id BIGINT REFERENCES inventory(id) ON DELETE CASCADE,
    product_name VARCHAR(255) NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('in', 'out')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_stock_transactions_inventory_id ON stock_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at DESC);

-- Add comment
COMMENT ON TABLE stock_transactions IS 'Tracks all stock in and stock out transactions for inventory items';

-- Verify the table was created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_transactions') THEN
        RAISE NOTICE '✓ stock_transactions table created successfully';
    END IF;
END $$;
