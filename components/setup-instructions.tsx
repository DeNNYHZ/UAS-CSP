"use client"

import { useState } from "react"
import { getSupabaseStatus } from "@/lib/supabase"
import { Database, CheckCircle, AlertCircle, Copy, ExternalLink } from "lucide-react"

export function SetupInstructions() {
  const [copied, setCopied] = useState(false)
  const supabaseStatus = getSupabaseStatus()

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sqlScript = `CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  nama_produk VARCHAR(255) NOT NULL,
  harga_satuan INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO users (username, password, role) VALUES
('user1', 'password123', 'user'),
('admin1', 'adminpassword', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (nama_produk, harga_satuan, quantity) VALUES
('MacBook Pro M3 14-inch', 25000000, 8),
('Logitech MX Master 3S', 1200000, 25),
('Mechanical Keyboard RGB Corsair', 850000, 15),
('Dell UltraSharp 4K Monitor 27-inch', 4500000, 12),
('iPhone 15 Pro 128GB', 18000000, 6),
('Samsung Galaxy S24 Ultra', 16500000, 10)
ON CONFLICT DO NOTHING;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view user data" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can insert products" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update products" ON products FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete products" ON products FOR DELETE USING (true);`

  if (supabaseStatus.configured) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-green-800">Supabase Connected!</h3>
            <p className="text-sm text-green-700">Your application is now connected to Supabase database.</p>
          </div>
          <Database className="h-8 w-8 text-green-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Setup Your Supabase Database</h3>
          <p className="text-sm text-blue-700 mb-4">Follow these steps to complete your Supabase setup:</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              1
            </span>
            Open Supabase SQL Editor
          </h4>
          <p className="text-sm text-blue-700 mb-3">Go to your Supabase project dashboard and open the SQL Editor.</p>
          <a
            href="https://supabase.com/dashboard/project/pytirxgdrthhjfxrnifc/sql"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open SQL Editor
          </a>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              2
            </span>
            Run the Setup Script
          </h4>
          <p className="text-sm text-blue-700 mb-3">Copy and paste this SQL script into the editor and run it:</p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64 overflow-y-auto">
              <code>{sqlScript}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(sqlScript)}
              className="absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              title="Copy SQL script"
            >
              <Copy className="w-4 h-4" />
            </button>
            {copied && (
              <div className="absolute top-2 right-14 bg-green-600 text-white px-2 py-1 rounded text-xs">Copied!</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
              3
            </span>
            Restart Your Application
          </h4>
          <p className="text-sm text-blue-700">
            After running the SQL script, restart your development server to see the changes.
          </p>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm mt-2 inline-block">npm run dev</code>
        </div>
      </div>
    </div>
  )
}
