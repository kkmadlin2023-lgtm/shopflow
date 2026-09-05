-- ==========================================================
-- SHOPFLOW POS & INVENTORY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- COPY & PASTE THIS INTO YOUR SUPABASE SQL EDITOR AND CLICK RUN
-- ==========================================================

-- 1. PRIMARY UNIVERSAL EMAIL-BASED STORAGE TABLE (Cross-Device Cloud Sync)
CREATE TABLE IF NOT EXISTS user_stores (
    user_email TEXT PRIMARY KEY,
    user_id TEXT,
    store_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    fcm_token TEXT,
    last_synced_from TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    barcode TEXT,
    sku TEXT,
    name TEXT NOT NULL,
    short_name TEXT,
    category_id TEXT,
    brand TEXT,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    current_stock NUMERIC(12, 2) DEFAULT 0.00,
    min_stock NUMERIC(12, 2) DEFAULT 5.00,
    max_stock NUMERIC(12, 2) DEFAULT 1000.00,
    unit TEXT DEFAULT 'Pcs',
    photo_url TEXT,
    supplier_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SALES / INVOICES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    invoice_number TEXT NOT NULL,
    customer_name TEXT DEFAULT 'Walk-in Customer',
    customer_phone TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    purchase_cost_total NUMERIC(12, 2) DEFAULT 0.00,
    gross_profit NUMERIC(12, 2) DEFAULT 0.00,
    payment_method TEXT NOT NULL, -- 'CASH', 'UPI', 'CARD', 'SPLIT'
    payment_status TEXT DEFAULT 'PAID',
    cash_received NUMERIC(12, 2) DEFAULT 0.00,
    change_returned NUMERIC(12, 2) DEFAULT 0.00,
    upi_transaction_id TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    payment_method TEXT DEFAULT 'CASH',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STOCK MOVEMENTS LOG
CREATE TABLE IF NOT EXISTS stock_movements (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    product_id TEXT,
    product_name TEXT,
    movement_type TEXT NOT NULL,
    quantity_changed NUMERIC(12, 2) NOT NULL,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. FCM PUSH NOTIFICATION TOKENS TABLE
CREATE TABLE IF NOT EXISTS fcm_tokens (
    token TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    device_info TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. OPEN ROW LEVEL SECURITY (RLS) POLICIES FOR RELIABLE CROSS-DEVICE ACCESS
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on user_stores" ON user_stores;
CREATE POLICY "Allow all on user_stores" ON user_stores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on products" ON products;
CREATE POLICY "Allow all on products" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on sales" ON sales;
CREATE POLICY "Allow all on sales" ON sales FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on customers" ON customers;
CREATE POLICY "Allow all on customers" ON customers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on expenses" ON expenses;
CREATE POLICY "Allow all on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on stock_movements" ON stock_movements;
CREATE POLICY "Allow all on stock_movements" ON stock_movements FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on fcm_tokens" ON fcm_tokens;
CREATE POLICY "Allow all on fcm_tokens" ON fcm_tokens FOR ALL USING (true) WITH CHECK (true);
