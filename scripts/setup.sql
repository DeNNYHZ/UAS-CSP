-- ===============================
-- RESET ALL DATA & STRUCTURE
-- ===============================
-- Optional: Drop tables if needed (uncomment if you want to reset)
-- DROP TABLE IF EXISTS stock_movements, login_history, user_activity_log, products, categories, users CASCADE;

-- ===============================
-- USERS
-- ===============================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR NOT NULL UNIQUE CHECK (length(TRIM(username)) >= 3),
  password VARCHAR NOT NULL CHECK (length(password) >= 6),
  role VARCHAR NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  email VARCHAR,
  full_name VARCHAR,
  phone VARCHAR,
  is_locked BOOLEAN DEFAULT false,
  failed_login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  last_activity TIMESTAMPTZ DEFAULT now()
);

-- ===============================
-- CATEGORIES
-- ===============================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR DEFAULT '#6B7280',
  icon VARCHAR DEFAULT 'Package',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================
-- PRODUCTS
-- ===============================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nama_produk VARCHAR NOT NULL CHECK (length(TRIM(nama_produk)) >= 3),
  harga_satuan INTEGER NOT NULL CHECK (harga_satuan > 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  category_id INTEGER REFERENCES categories(id)
);

-- ===============================
-- LOGIN HISTORY
-- ===============================
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  username VARCHAR NOT NULL,
  ip_address INET,
  user_agent TEXT,
  login_time TIMESTAMPTZ DEFAULT now(),
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR
);

-- ===============================
-- STOCK MOVEMENTS
-- ===============================
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id UUID REFERENCES users(id),
  movement_type VARCHAR NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason VARCHAR,
  reference_number VARCHAR,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================
-- USER ACTIVITY LOG
-- ===============================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  username VARCHAR NOT NULL,
  action VARCHAR NOT NULL,
  resource_type VARCHAR,
  resource_id VARCHAR,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===============================
-- SAMPLE DATA STARTS HERE
-- ===============================

-- Delete existing data (safe order)
DELETE FROM stock_movements;
DELETE FROM login_history;
DELETE FROM user_activity_log;
DELETE FROM products;
DELETE FROM categories;
DELETE FROM users;

-- Insert categories (10 categories, PC parts)
INSERT INTO categories (name, description, color, icon) VALUES
('CPU', 'Processor unit for computers', '#E11D48', 'Cpu'),
('GPU', 'Graphics card for rendering and games', '#8B5CF6', 'MonitorSmartphone'),
('RAM', 'Random access memory', '#F59E0B', 'Server'),
('Motherboard', 'Mainboard of a PC', '#10B981', 'Layers'),
('Monitor', 'PC display devices', '#3B82F6', 'Monitor'),
('Mouse', 'Pointing devices', '#6366F1', 'Mouse'),
('Headset', 'Audio & microphone devices', '#EC4899', 'Headphones'),
('SSD', 'Solid State Drive', '#F97316', 'HardDrive'),
('Power Supply', 'PSU for components', '#6B7280', 'Zap'),
('Casing', 'Chassis to house PC parts', '#14B8A6', 'Package');

-- Insert dummy users
INSERT INTO users (username, password, role, email, full_name, phone) VALUES
('admin_user', 'adminpass123', 'admin', 'admin@example.com', 'Admin One', '081234567890'),
('user_gamer', 'userpass123', 'user', 'gamer@example.com', 'Gamer Guy', '082345678901');

-- Sample products (only a few for example — expand as needed)
INSERT INTO products (nama_produk, harga_satuan, quantity, category_id) VALUES
('Intel Core i5-12400F', 3100000, 18, 1),
('NVIDIA RTX 3060 Ti', 6200000, 8, 2),
('Corsair Vengeance RGB 16GB', 1500000, 20, 3),
('ASUS ROG STRIX B650', 3700000, 7, 4),
('Acer Nitro 24" 165Hz', 3200000, 6, 5);

-- Login history
INSERT INTO login_history (user_id, username, ip_address, user_agent, success, failure_reason)
SELECT id, username, '192.168.1.10'::inet, 'Mozilla/5.0', true, NULL FROM users WHERE username = 'admin_user'
UNION
SELECT id, username, '192.168.1.20'::inet, 'Mozilla/5.0', false, 'Wrong password' FROM users WHERE username = 'user_gamer';

-- Stock movements
INSERT INTO stock_movements (product_id, user_id, movement_type, quantity_change, quantity_before, quantity_after, reason, reference_number, notes)
SELECT p.id, u.id, 'IN', 5, 5, 10, 'Restock', 'REF1234', 'Initial stock'
FROM products p, users u WHERE p.nama_produk = 'Intel Core i5-12400F' AND u.username = 'admin_user';

-- User activity log
INSERT INTO user_activity_log (user_id, username, action, resource_type, resource_id, details, ip_address, user_agent)
SELECT id, username, 'CREATE_PRODUCT', 'product', '1', '{"product": "Intel Core i5-12400F"}'::jsonb, '192.168.1.10'::inet, 'PostmanRuntime/7.29.0' FROM users WHERE username = 'admin_user'
UNION
SELECT id, username, 'LOGIN_ATTEMPT', NULL, NULL, '{"status": "failed"}'::jsonb, '192.168.1.20'::inet, 'Mozilla/5.0' FROM users WHERE username = 'user_gamer';
