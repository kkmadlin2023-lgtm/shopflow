-- ==========================================================
-- SHOP POS & INVENTORY MANAGEMENT SYSTEM - SUPABASE SCHEMA
-- ==========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
    unit VARCHAR(50) DEFAULT 'Pcs', -- 'Pcs', 'Kg', 'Gram', 'Litre', 'Pack', 'Box', 'Bottle'
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
    type VARCHAR(50) NOT NULL, -- 'OPENING', 'PURCHASE', 'SALE', 'DAMAGED', 'ADJUSTMENT'
    quantity NUMERIC(12, 2) NOT NULL, -- Positive or negative
    previous_stock NUMERIC(12, 2) NOT NULL,
    new_stock NUMERIC(12, 2) NOT NULL,
    reference_id UUID, -- sale_id or purchase_id
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    notes TEXT,
    total_spent NUMERIC(12, 2) DEFAULT 0.00,
    total_orders INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SALES / INVOICES TABLE
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name VARCHAR(255) DEFAULT 'Walk-in Customer',
    customer_phone VARCHAR(50),
    subtotal NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    grand_total NUMERIC(12, 2) NOT NULL,
    purchase_cost_total NUMERIC(12, 2) DEFAULT 0.00,
    gross_profit NUMERIC(12, 2) DEFAULT 0.00,
    payment_method VARCHAR(50) NOT NULL, -- 'CASH', 'UPI', 'CARD', 'SPLIT', 'OTHER'
    payment_status VARCHAR(50) DEFAULT 'PAID', -- 'PAID', 'PENDING', 'PARTIAL'
    cash_received NUMERIC(12, 2) DEFAULT 0.00,
    change_returned NUMERIC(12, 2) DEFAULT 0.00,
    upi_transaction_id VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS sale_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id UUID REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    barcode VARCHAR(100),
    unit VARCHAR(50),
    quantity NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2) DEFAULT 0.00,
    unit_price NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    discount_amount NUMERIC(12, 2) DEFAULT 0.00,
    tax_percent NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(12, 2) DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- 'Rent', 'Electricity', 'Packaging', 'Wages', 'Maintenance', 'Transport', 'Other'
    amount NUMERIC(12, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'CASH',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_products_shop_id ON products(shop_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_sales_shop_id ON sales(shop_id);
CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_expenses_shop_date ON expenses(shop_id, date);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================================
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Helper function to get the current user's shop_id
CREATE OR REPLACE FUNCTION get_user_shop_id()
RETURNS UUID AS $$
  SELECT shop_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Shops RLS
CREATE POLICY "Users can view own shop" ON shops
    FOR ALL USING (id = get_user_shop_id() OR owner_id = auth.uid());

-- Profiles RLS
CREATE POLICY "Users can view shop profiles" ON profiles
    FOR ALL USING (shop_id = get_user_shop_id() OR id = auth.uid());

-- Categories RLS
CREATE POLICY "Users can manage categories in their shop" ON categories
    FOR ALL USING (shop_id = get_user_shop_id());

-- Products RLS
CREATE POLICY "Users can manage products in their shop" ON products
    FOR ALL USING (shop_id = get_user_shop_id());

-- Stock Movements RLS
CREATE POLICY "Users can view and add stock movements" ON stock_movements
    FOR ALL USING (shop_id = get_user_shop_id());

-- Customers RLS
CREATE POLICY "Users can manage customers in their shop" ON customers
    FOR ALL USING (shop_id = get_user_shop_id());

-- Sales RLS
CREATE POLICY "Users can manage sales in their shop" ON sales
    FOR ALL USING (shop_id = get_user_shop_id());

-- Sale Items RLS
CREATE POLICY "Users can manage sale items" ON sale_items
    FOR ALL USING (sale_id IN (SELECT id FROM sales WHERE shop_id = get_user_shop_id()));

-- Expenses RLS
CREATE POLICY "Users can manage expenses in their shop" ON expenses
    FOR ALL USING (shop_id = get_user_shop_id());
