-- Add categories table and update products table
-- Run this in your Supabase SQL Editor

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6B7280', -- Hex color for category
  icon VARCHAR(50) DEFAULT 'Package', -- Lucide icon name
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT category_name_length CHECK (LENGTH(TRIM(name)) >= 2),
  CONSTRAINT color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Add category_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
('Electronics', 'Electronic devices and gadgets', '#3B82F6', 'Smartphone'),
('Computers', 'Laptops, desktops, and accessories', '#8B5CF6', 'Monitor'),
('Audio', 'Headphones, speakers, and audio equipment', '#EF4444', 'Headphones'),
('Gaming', 'Gaming consoles and accessories', '#10B981', 'Gamepad2'),
('Mobile', 'Smartphones and mobile accessories', '#F59E0B', 'Smartphone'),
('Photography', 'Cameras and photography equipment', '#EC4899', 'Camera')
ON CONFLICT (name) DO NOTHING;

-- Update existing products with categories
UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Computers') 
WHERE nama_produk LIKE '%MacBook%' OR nama_produk LIKE '%Laptop%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Electronics') 
WHERE nama_produk LIKE '%Mouse%' OR nama_produk LIKE '%Keyboard%' OR nama_produk LIKE '%Monitor%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Audio') 
WHERE nama_produk LIKE '%Headphones%' OR nama_produk LIKE '%AirPods%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Mobile') 
WHERE nama_produk LIKE '%iPhone%' OR nama_produk LIKE '%Samsung%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Photography') 
WHERE nama_produk LIKE '%Canon%' OR nama_produk LIKE '%Camera%';

UPDATE products SET category_id = (SELECT id FROM categories WHERE name = 'Gaming') 
WHERE nama_produk LIKE '%Nintendo%' OR nama_produk LIKE '%Switch%';

-- Create trigger for categories updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create policies for categories table
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;
CREATE POLICY "Anyone can insert categories" ON categories
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update categories" ON categories;
CREATE POLICY "Anyone can update categories" ON categories
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete categories" ON categories;
CREATE POLICY "Anyone can delete categories" ON categories
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
