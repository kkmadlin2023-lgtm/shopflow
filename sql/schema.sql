-- ==========================================================
-- SHOPFLOW POS & INVENTORY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. UNIVERSAL CROSS-DEVICE SYNC TABLE (Primary Sync Engine)
CREATE TABLE IF NOT EXISTS user_stores (
    user_id TEXT PRIMARY KEY,
    user_email TEXT,
    store_data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on user_stores
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users and anon clients
CREATE POLICY IF NOT EXISTS "Allow read/write on user_stores" 
ON user_stores 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- 1. SHOPS TABLE (Multi-tenant support)
CREATE TABLE IF NOT EXISTS shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(50),
    alt_phone VARCHAR(50),
    email VARCHAR(255),
    gst_number VARCHAR(50),
    upi_id VARCHAR(100),
    gpay_number VARCHAR(50),
    payment_name VARCHAR(255),
    currency VARCHAR(10) DEFAULT '₹',
    receipt_format VARCHAR(20) DEFAULT '80mm', -- '80mm', '58mm', 'a4'
    invoice_prefix VARCHAR(20) DEFAULT 'INV-',
    starting_invoice_number INT DEFAULT 1,
    footer_message TEXT DEFAULT 'Thank you for shopping with us! Visit again.',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. USER PROFILES & ROLES
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(50) DEFAULT 'CASHIER', -- 'OWNER', 'ADMIN', 'CASHIER', 'STOCK_MANAGER'
    phone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) DEFAULT 'package',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    barcode VARCHAR(100),
    sku VARCHAR(100),
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    brand VARCHAR(100),
    description TEXT,
    photo_url TEXT,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    selling_price NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    discount_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    current_stock NUMERIC(12, 2) DEFAULT 0.00,
    min_stock NUMERIC(12, 2) DEFAULT 5.00,
    max_stock NUMERIC(12, 2) DEFAULT 1000.00,
    unit VARCHAR(50) DEFAULT 'Pcs',
    supplier_name VARCHAR(255),
    batch_number VARCHAR(100),
    expiry_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STOCK MOVEMENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- 'OPENING', 'PURCHASE', 'SALE', 'DAMAGED', 'ADJUSTMENT'
    quantity_changed NUMERIC(12, 2) NOT NULL,
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_invoice VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    address TEXT,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SALES / INVOICES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(50),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    purchase_cost_total NUMERIC(12, 2) DEFAULT 0.00,
    gross_profit NUMERIC(12, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL, -- 'CASH', 'UPI', 'CARD', 'SPLIT'
    payment_status VARCHAR(50) DEFAULT 'PAID',
    cash_received NUMERIC(12, 2) DEFAULT 0.00,
    change_returned NUMERIC(12, 2) DEFAULT 0.00,
    upi_transaction_id VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    unit VARCHAR(50) DEFAULT 'Pcs',
    quantity NUMERIC(12, 2) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
