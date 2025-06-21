-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nama_produk VARCHAR(255) NOT NULL,
  harga_satuan INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample users
INSERT INTO users (username, password, role) VALUES
('deniuser', 'passworduser', 'user'),
('deniadmin', 'passwordadmin', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products with more realistic data
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
('HP Pavilion Gaming Laptop', 12500000, 9)
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

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
