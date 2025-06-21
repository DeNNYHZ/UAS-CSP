-- Enhanced features: User Management, Authentication Security, Stock Movement History
-- Run this in your Supabase SQL Editor

-- Add new columns to users table for enhanced authentication
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create login_history table
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  success BOOLEAN NOT NULL,
  failure_reason VARCHAR(255)
);

-- Create user_activity_log table
CREATE TABLE IF NOT EXISTS user_activity_log (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(50) NOT NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id VARCHAR(50),
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create stock_movements table
CREATE TABLE IF NOT EXISTS stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  quantity_change INTEGER NOT NULL,
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  reason VARCHAR(255),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing demo users with additional info
UPDATE users SET 
  email = CASE 
    WHEN username = 'deniuser' THEN 'user@demo.com'
    WHEN username = 'deniadmin' THEN 'admin@demo.com'
    ELSE email
  END,
  full_name = CASE 
    WHEN username = 'deniuser' THEN 'Demo User'
    WHEN username = 'deniadmin' THEN 'Demo Admin'
    ELSE full_name
  END,
  phone = CASE 
    WHEN username = 'deniuser' THEN '+62812345678'
    WHEN username = 'deniadmin' THEN '+62812345679'
    ELSE phone
  END
WHERE username IN ('deniuser', 'deniadmin');

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  p_user_id UUID,
  p_username VARCHAR(50),
  p_action VARCHAR(100),
  p_resource_type VARCHAR(50) DEFAULT NULL,
  p_resource_id VARCHAR(50) DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_activity_log (
    user_id, username, action, resource_type, resource_id, 
    details, ip_address, user_agent
  ) VALUES (
    p_user_id, p_username, p_action, p_resource_type, p_resource_id,
    p_details, p_ip_address, p_user_agent
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to log stock movement
CREATE OR REPLACE FUNCTION log_stock_movement(
  p_product_id INTEGER,
  p_user_id UUID,
  p_movement_type VARCHAR(20),
  p_quantity_change INTEGER,
  p_quantity_before INTEGER,
  p_quantity_after INTEGER,
  p_reason VARCHAR(255) DEFAULT NULL,
  p_reference_number VARCHAR(100) DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  INSERT INTO stock_movements (
    product_id, user_id, movement_type, quantity_change,
    quantity_before, quantity_after, reason, reference_number, notes
  ) VALUES (
    p_product_id, p_user_id, p_movement_type, p_quantity_change,
    p_quantity_before, p_quantity_after, p_reason, p_reference_number, p_notes
  );
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log stock movements when products are updated
CREATE OR REPLACE FUNCTION trigger_log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if quantity changed
  IF OLD.quantity != NEW.quantity THEN
    PERFORM log_stock_movement(
      NEW.id,
      NULL, -- Will be set by application
      CASE 
        WHEN NEW.quantity > OLD.quantity THEN 'IN'
        WHEN NEW.quantity < OLD.quantity THEN 'OUT'
        ELSE 'ADJUSTMENT'
      END,
      NEW.quantity - OLD.quantity,
      OLD.quantity,
      NEW.quantity,
      'Product update',
      'UPD-' || NEW.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
      'Quantity changed from ' || OLD.quantity || ' to ' || NEW.quantity
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock movement logging
DROP TRIGGER IF EXISTS trigger_stock_movement_log ON products;
CREATE TRIGGER trigger_stock_movement_log
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION trigger_log_stock_movement();

-- Enable RLS for new tables
ALTER TABLE login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- Create policies for login_history
CREATE POLICY "Admins can view all login history" ON login_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Create policies for user_activity_log
CREATE POLICY "Admins can view all activity logs" ON user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert activity logs" ON user_activity_log
  FOR INSERT WITH CHECK (true);

-- Create policies for stock_movements
CREATE POLICY "Anyone can view stock movements" ON stock_movements
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert stock movements" ON stock_movements
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_login_time ON login_history(login_time);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_log_created_at ON user_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_users_last_activity ON users(last_activity);
CREATE INDEX IF NOT EXISTS idx_users_is_locked ON users(is_locked);
