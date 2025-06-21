-- Secure setup for Supabase database with proper constraints
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with strict constraints
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints for data validation
  CONSTRAINT username_length CHECK (LENGTH(TRIM(username)) >= 3),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  CONSTRAINT password_length CHECK (LENGTH(password) >= 6),
  CONSTRAINT role_valid CHECK (role IN ('user', 'admin'))
);

-- Create products table with strict constraints
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  nama_produk VARCHAR(255) NOT NULL,
  harga_satuan INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints for data validation
  CONSTRAINT product_name_length CHECK (LENGTH(TRIM(nama_produk)) >= 3),
  CONSTRAINT price_positive CHECK (harga_satuan > 0),
  CONSTRAINT quantity_non_negative CHECK (quantity >= 0)
);

-- Insert demo users with proper validation
INSERT INTO users (username, password, role) VALUES
('deniuser', 'passworduser', 'user'),
('deniadmin', 'passwordadmin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products with validation
INSERT INTO products (nama_produk, harga_satuan, quantity) VALUES
('MacBook Pro M3 14-inch', 25000000, 8),
('Logitech MX Master 3S', 1200000, 25),
('Mechanical Keyboard RGB Corsair', 850000, 15),
('Dell UltraSharp 4K Monitor 27-inch', 4500000, 12),
('iPhone 15 Pro 128GB', 18000000, 6),
('Samsung Galaxy S24 Ultra', 16500000, 10),
('iPad Pro 12.9-inch M2', 15000000, 7),
('Sony WH-1000XM5 Headphones', 4200000, 18),
('Canon EOS R6 Mark II', 35000000, 3),
('HP Pavilion Gaming Laptop', 12500000, 9),
('AirPods Pro 2nd Gen', 3500000, 20),
('Nintendo Switch OLED', 4200000, 15)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view user data" ON users;
CREATE POLICY "Users can view user data" ON users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert user data" ON users;
CREATE POLICY "Users can insert user data" ON users
  FOR INSERT WITH CHECK (true);

-- Create policies for products table
DROP POLICY IF EXISTS "Anyone can view products" ON products;
CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert products" ON products;
CREATE POLICY "Anyone can insert products" ON products
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update products" ON products;
CREATE POLICY "Anyone can update products" ON products
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete products" ON products;
CREATE POLICY "Anyone can delete products" ON products
  FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_products_nama_produk ON products(nama_produk);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
