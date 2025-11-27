-- Add status column to inventory table
-- This field tracks stock status (In Stock, Low Stock, Out of Stock)

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'inventory' AND column_name = 'status'
    ) THEN
        ALTER TABLE inventory 
        ADD COLUMN status VARCHAR(20) DEFAULT 'In Stock' 
        CHECK (status IN ('In Stock', 'Low Stock', 'Out of Stock'));
        
        RAISE NOTICE 'Added status column to inventory table';
    ELSE
        RAISE NOTICE 'Status column already exists in inventory table';
    END IF;
END $$;

-- Update existing records to set proper status based on stock levels
UPDATE inventory 
SET status = CASE 
    WHEN stock = 0 THEN 'Out of Stock'
    WHEN stock <= 10 THEN 'Low Stock'
    ELSE 'In Stock'
END
WHERE status IS NULL OR status = '';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);

-- Add comment
COMMENT ON COLUMN inventory.status IS 'Stock status: In Stock (>10), Low Stock (1-10), Out of Stock (0)';
