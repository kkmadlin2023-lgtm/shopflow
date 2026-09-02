/**
 * QuickMart POS & Inventory Management - Database & Local Storage Layer
 * Manages clean mobile localStorage persistence, stock tracking, and Supabase database synchronization.
 */

const DB_KEYS = {
  SETTINGS: 'pos_settings',
  CATEGORIES: 'pos_categories',
  PRODUCTS: 'pos_products',
  CUSTOMERS: 'pos_customers',
  SALES: 'pos_sales',
  SALE_ITEMS: 'pos_sale_items',
  STOCK_MOVEMENTS: 'pos_stock_movements',
  EXPENSES: 'pos_expenses',
  AUTH_USER: 'pos_auth_user',
  INITIALIZED: 'pos_db_initialized_v3'
};

// Default Initial Settings pre-configured with user's Supabase instance
const DEFAULT_SETTINGS = {
  shopName: 'My Shop Counter',
  tagline: 'Point of Sale & Inventory',
  logoUrl: '',
  address: 'Shop No. 1, Main Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001',
  phone: '+91 98765 43210',
  altPhone: '',
  email: 'counter@myshop.in',
  gstNumber: '',
  upiId: 'myshop@upi',
  gpayNumber: '',
  paymentName: 'My Shop Counter',
  currency: '₹',
  receiptFormat: '80mm', // '80mm', '58mm', 'a4'
  invoicePrefix: 'INV-',
  startingInvoiceNumber: 1001,
  showGstOnBill: true,
  showQrOnBill: true,
  showLogoOnBill: true,
  showAddressOnBill: true,
  footerMessage: 'Thank you for shopping with us! Visit again.',
  taxRateDefault: 5,
  supabaseUrl: 'https://pilfsqplgeljxhgcmujq.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbGZzcXBsZ2VsanhoZ2NtdWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzQ5MTMsImV4cCI6MjEwMzg1MDkxM30.CiFSFJS5vTb3jA_Payyf5m1CCJbbHig1ig8-6TtwxLg'
};

// Standard Retail Starter Categories
const STARTER_CATEGORIES = [
  { id: 'cat-1', name: 'Groceries & Staples', icon: 'shopping-basket', description: 'Rice, Atta, Dals, Spices & Edible Oils' },
  { id: 'cat-2', name: 'Dairy & Bakery', icon: 'cup-soda', description: 'Milk, Bread, Butter, Cheese & Paneer' },
  { id: 'cat-3', name: 'Snacks & Beverages', icon: 'cookie', description: 'Biscuits, Chips, Juices, Tea & Coffee' },
  { id: 'cat-4', name: 'Personal Care', icon: 'sparkles', description: 'Soaps, Shampoos, Oral care & Lotions' },
  { id: 'cat-5', name: 'Household & Cleaning', icon: 'spray-can', description: 'Detergents, Surface cleaners & Dishwash' }
];

// Sample Supermarket Seed Pack (optional for demo testing)
const SAMPLE_DEMO_PRODUCTS = [
  {
    id: 'prod-101',
    barcode: '8901030383754',
    sku: 'RICE-BASMATI-5KG',
    name: 'India Gate Premium Basmati Rice',
    shortName: 'Basmati Rice 5kg',
    categoryId: 'cat-1',
    brand: 'India Gate',
    unit: 'Kg',
    purchasePrice: 380.00,
    sellingPrice: 460.00,
    mrp: 520.00,
    discountPercent: 0,
    taxPercent: 5,
    currentStock: 25,
    minStock: 5,
    maxStock: 100,
    photoUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&auto=format&fit=crop&q=80',
    description: 'Aged long-grain royal basmati rice',
    supplierName: 'KRBL Distributors',
    isActive: true
  },
  {
    id: 'prod-102',
    barcode: '8901491101837',
    sku: 'ATTA-AASH-10KG',
    name: 'Aashirvaad Superior MP Sharbati Atta 10kg',
    shortName: 'Aashirvaad Atta 10kg',
    categoryId: 'cat-1',
    brand: 'ITC Aashirvaad',
    unit: 'Pack',
    purchasePrice: 420.00,
    sellingPrice: 495.00,
    mrp: 545.00,
    discountPercent: 0,
    taxPercent: 0,
    currentStock: 15,
    minStock: 5,
    maxStock: 50,
    photoUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&auto=format&fit=crop&q=80',
    description: '100% pure whole wheat grain flour',
    supplierName: 'ITC Limited',
    isActive: true
  },
  {
    id: 'prod-103',
    barcode: '8901063012720',
    sku: 'SNK-BRIT-GOODDAY',
    name: 'Britannia Good Day Butter Cookies 200g',
    shortName: 'Good Day 200g',
    categoryId: 'cat-3',
    brand: 'Britannia',
    unit: 'Pack',
    purchasePrice: 31.00,
    sellingPrice: 38.00,
    mrp: 42.00,
    discountPercent: 0,
    taxPercent: 18,
    currentStock: 40,
    minStock: 10,
    maxStock: 200,
    photoUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300&auto=format&fit=crop&q=80',
    description: 'Rich buttery cashewnut smile cookies',
    supplierName: 'Britannia Depot',
    isActive: true
  }
];

class DatabaseManager {
  constructor() {
    this.init();
  }

  /**
   * Initializes local storage with clean, empty data structure on mobile/desktop
   */
  init(forceClean = false) {
    if (!localStorage.getItem(DB_KEYS.INITIALIZED) || forceClean) {
      // 1. Settings with Supabase pre-configured
      localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      
      // 2. Starter Categories
      localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(STARTER_CATEGORIES));

      // 3. Clean Empty Collections (Empty as requested!)
      localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.SALES, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.STOCK_MOVEMENTS, JSON.stringify([]));
      localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify([]));

      localStorage.setItem(DB_KEYS.INITIALIZED, 'true');
    }
  }

  // --- SETTINGS ---
  getSettings() {
    try {
      const data = localStorage.getItem(DB_KEYS.SETTINGS);
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  saveSettings(newSettings) {
    const merged = { ...this.getSettings(), ...newSettings };
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(merged));
    return merged;
  }

  // --- CATEGORIES ---
  getCategories() {
    try {
      const data = localStorage.getItem(DB_KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveCategory(category) {
    const cats = this.getCategories();
    if (category.id) {
      const idx = cats.findIndex(c => c.id === category.id);
      if (idx !== -1) cats[idx] = { ...cats[idx], ...category };
    } else {
      category.id = 'cat-' + Date.now();
      cats.push(category);
    }
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(cats));
    window.supabaseSync?.pushEntity('categories', category);
    return category;
  }

  deleteCategory(id) {
    const cats = this.getCategories().filter(c => c.id !== id);
    localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(cats));
    return true;
  }

  // --- PRODUCTS ---
  getProducts() {
    try {
      const data = localStorage.getItem(DB_KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getProductById(id) {
    return this.getProducts().find(p => p.id === id) || null;
  }

  getProductByBarcode(barcode) {
    if (!barcode) return null;
    const clean = barcode.trim().toLowerCase();
    return this.getProducts().find(p => p.barcode && p.barcode.trim().toLowerCase() === clean) || null;
  }

  saveProduct(product) {
    const prods = this.getProducts();
    const isNew = !product.id;
    let oldProduct = null;

    if (!isNew) {
      const idx = prods.findIndex(p => p.id === product.id);
      if (idx !== -1) {
        oldProduct = prods[idx];
        prods[idx] = { ...oldProduct, ...product, updatedAt: new Date().toISOString() };
      }
    } else {
      product.id = 'prod-' + Date.now();
      product.createdAt = new Date().toISOString();
      product.currentStock = parseFloat(product.currentStock) || 0;
      prods.push(product);

      // Record opening stock movement
      if (product.currentStock > 0) {
        this.recordStockMovement({
          productId: product.id,
          productName: product.name,
          type: 'OPENING',
          quantity: product.currentStock,
          previousStock: 0,
          newStock: product.currentStock,
          notes: 'New product creation stock entry'
        });
      }
    }

    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(prods));

    // Realtime Supabase Sync
    const saved = isNew ? product : prods.find(p => p.id === product.id);
    window.supabaseSync?.pushEntity('products', saved);

    return saved;
  }

  deleteProduct(id) {
    const prods = this.getProducts().filter(p => p.id !== id);
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(prods));
    return true;
  }

  // --- STOCK MANAGEMENT ---
  updateProductStock(productId, delta, type = 'ADJUSTMENT', notes = '', refId = null) {
    const prods = this.getProducts();
    const idx = prods.findIndex(p => p.id === productId);
    if (idx === -1) return null;

    const prod = prods[idx];
    const prevStock = parseFloat(prod.currentStock) || 0;
    const change = parseFloat(delta) || 0;
    const newStock = Math.max(0, prevStock + change);

    prod.currentStock = newStock;
    prods[idx] = prod;
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(prods));

    // Record stock movement log
    const movement = this.recordStockMovement({
      productId: prod.id,
      productName: prod.name,
      type: type, // 'SALE', 'PURCHASE', 'DAMAGED', 'ADJUSTMENT', 'OPENING'
      quantity: change,
      previousStock: prevStock,
      newStock: newStock,
      notes: notes,
      referenceId: refId
    });

    // Realtime Supabase Sync
    window.supabaseSync?.pushEntity('products', prod);
    if (movement) window.supabaseSync?.pushEntity('stock_movements', movement);

    return prod;
  }

  recordStockMovement(movement) {
    try {
      const movements = this.getStockMovements();
      movement.id = 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
      movement.timestamp = movement.timestamp || new Date().toISOString();
      movements.unshift(movement);
      if (movements.length > 500) movements.length = 500;
      localStorage.setItem(DB_KEYS.STOCK_MOVEMENTS, JSON.stringify(movements));
      return movement;
    } catch (e) {
      console.error('Error recording stock movement:', e);
      return null;
    }
  }

  getStockMovements(filter = {}) {
    try {
      const data = localStorage.getItem(DB_KEYS.STOCK_MOVEMENTS);
      let list = data ? JSON.parse(data) : [];
      if (filter.productId) list = list.filter(m => m.productId === filter.productId);
      if (filter.type) list = list.filter(m => m.type === filter.type);
      return list;
    } catch (e) {
      return [];
    }
  }

  // --- CUSTOMERS ---
  getCustomers() {
    try {
      const data = localStorage.getItem(DB_KEYS.CUSTOMERS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getCustomerById(id) {
    return this.getCustomers().find(c => c.id === id) || null;
  }

  saveCustomer(customer) {
    const custs = this.getCustomers();
    if (customer.id) {
      const idx = custs.findIndex(c => c.id === customer.id);
      if (idx !== -1) custs[idx] = { ...custs[idx], ...customer };
    } else {
      customer.id = 'cust-' + Date.now();
      customer.totalSpent = 0;
      customer.totalOrders = 0;
      customer.createdAt = new Date().toISOString();
      custs.push(customer);
    }
    localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(custs));
    window.supabaseSync?.pushEntity('customers', customer);
    return customer;
  }

  // --- SALES & BILLING ---
  getSales() {
    try {
      const data = localStorage.getItem(DB_KEYS.SALES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  getSaleById(id) {
    return this.getSales().find(s => s.id === id || s.invoiceNumber === id) || null;
  }

  getNextInvoiceNumber() {
    const settings = this.getSettings();
    const prefix = settings.invoicePrefix || 'INV-';
    const sales = this.getSales();
    const startNum = parseInt(settings.startingInvoiceNumber) || 1001;

    if (sales.length === 0) {
      return `${prefix}${startNum}`;
    }

    let maxNum = startNum - 1;
    sales.forEach(s => {
      if (s.invoiceNumber && s.invoiceNumber.startsWith(prefix)) {
        const numPart = parseInt(s.invoiceNumber.replace(prefix, ''));
        if (!isNaN(numPart) && numPart > maxNum) {
          maxNum = numPart;
        }
      }
    });

    return `${prefix}${maxNum + 1}`;
  }

  createSale(saleData) {
    const sales = this.getSales();
    const invoiceNo = this.getNextInvoiceNumber();
    const saleId = 'sale-' + Date.now();

    let totalPurchaseCost = 0;
    const saleItems = (saleData.items || []).map(item => {
      const prod = this.getProductById(item.productId);
      const purchasePrice = prod ? parseFloat(prod.purchasePrice) || 0 : (parseFloat(item.purchasePrice) || 0);
      totalPurchaseCost += purchasePrice * item.quantity;
      return {
        ...item,
        purchasePrice: purchasePrice
      };
    });

    const grandTotal = parseFloat(saleData.grandTotal) || 0;
    const grossProfit = Math.max(0, grandTotal - totalPurchaseCost);

    const saleRecord = {
      id: saleId,
      invoiceNumber: invoiceNo,
      customerId: saleData.customerId || null,
      customerName: saleData.customerName || 'Walk-in Customer',
      customerPhone: saleData.customerPhone || '',
      items: saleItems,
      subtotal: parseFloat(saleData.subtotal) || 0,
      discountAmount: parseFloat(saleData.discountAmount) || 0,
      taxAmount: parseFloat(saleData.taxAmount) || 0,
      grandTotal: grandTotal,
      purchaseCostTotal: totalPurchaseCost,
      grossProfit: grossProfit,
      paymentMethod: saleData.paymentMethod || 'CASH',
      paymentStatus: 'PAID',
      cashReceived: parseFloat(saleData.cashReceived) || 0,
      changeReturned: parseFloat(saleData.changeReturned) || 0,
      upiTransactionId: saleData.upiTransactionId || '',
      notes: saleData.notes || '',
      timestamp: new Date().toISOString()
    };

    // 1. Save sale locally
    sales.unshift(saleRecord);
    localStorage.setItem(DB_KEYS.SALES, JSON.stringify(sales));

    // 2. Reduce stock for each item & record movement
    saleItems.forEach(item => {
      if (item.productId) {
        this.updateProductStock(
          item.productId,
          -item.quantity,
          'SALE',
          `Sale bill #${invoiceNo} (${saleRecord.customerName})`,
          saleId
        );
      }
    });

    // 3. Update customer stats if registered
    if (saleData.customerId) {
      const custs = this.getCustomers();
      const cIdx = custs.findIndex(c => c.id === saleData.customerId);
      if (cIdx !== -1) {
        custs[cIdx].totalSpent = (parseFloat(custs[cIdx].totalSpent) || 0) + grandTotal;
        custs[cIdx].totalOrders = (parseInt(custs[cIdx].totalOrders) || 0) + 1;
        custs[cIdx].lastPurchasedAt = new Date().toISOString();
        localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(custs));
        window.supabaseSync?.pushEntity('customers', custs[cIdx]);
      }
    }

    // 4. Realtime Supabase Sync
    window.supabaseSync?.pushEntity('sales', saleRecord);

    return saleRecord;
  }

  // --- EXPENSES ---
  getExpenses() {
    try {
      const data = localStorage.getItem(DB_KEYS.EXPENSES);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveExpense(expense) {
    const expenses = this.getExpenses();
    if (expense.id) {
      const idx = expenses.findIndex(e => e.id === expense.id);
      if (idx !== -1) expenses[idx] = { ...expenses[idx], ...expense };
    } else {
      expense.id = 'exp-' + Date.now();
      expense.createdAt = new Date().toISOString();
      expenses.unshift(expense);
    }
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
    window.supabaseSync?.pushEntity('expenses', expense);
    return expense;
  }

  deleteExpense(id) {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(expenses));
    return true;
  }

  // --- DASHBOARD & ANALYTICS ---
  getDashboardMetrics() {
    const sales = this.getSales();
    const products = this.getProducts();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(s => s.timestamp.startsWith(todayStr));

    const todaySalesAmount = todaySales.reduce((sum, s) => sum + (parseFloat(s.grandTotal) || 0), 0);
    const todayOrdersCount = todaySales.length;

    const lowStockProducts = products.filter(p => (parseFloat(p.currentStock) || 0) <= (parseFloat(p.minStock) || 5) && (parseFloat(p.currentStock) || 0) > 0);
    const outOfStockProducts = products.filter(p => (parseFloat(p.currentStock) || 0) <= 0);

    const totalStockValue = products.reduce((sum, p) => sum + ((parseFloat(p.currentStock) || 0) * (parseFloat(p.purchasePrice) || 0)), 0);

    return {
      todaySalesAmount,
      todayOrdersCount,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      outOfStockProducts,
      totalProductsCount: products.length,
      totalStockValue,
      recentSales: sales.slice(0, 7)
    };
  }

  getSalesSummary(days = 7) {
    const sales = this.getSales();
    const labels = [];
    const salesData = [];
    const profitData = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });

      const daySales = sales.filter(s => s.timestamp.startsWith(dateStr));
      const dayRevenue = daySales.reduce((acc, s) => acc + (parseFloat(s.grandTotal) || 0), 0);
      const dayProfit = daySales.reduce((acc, s) => acc + (parseFloat(s.grossProfit) || 0), 0);

      labels.push(dayLabel);
      salesData.push(dayRevenue);
      profitData.push(dayProfit);
    }

    return { labels, salesData, profitData };
  }

  getPaymentBreakdown() {
    const sales = this.getSales();
    const breakdown = { UPI: 0, CASH: 0, CARD: 0, SPLIT: 0 };
    sales.forEach(s => {
      const method = (s.paymentMethod || 'CASH').toUpperCase();
      breakdown[method] = (breakdown[method] || 0) + (parseFloat(s.grandTotal) || 0);
    });
    return breakdown;
  }

  getTopSellingProducts(limit = 5) {
    const sales = this.getSales();
    const productStats = {};

    sales.forEach(s => {
      (s.items || []).forEach(item => {
        if (!productStats[item.productId]) {
          productStats[item.productId] = {
            id: item.productId,
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productStats[item.productId].quantity += parseFloat(item.quantity) || 0;
        productStats[item.productId].revenue += parseFloat(item.total) || 0;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, limit);
  }

  // --- DEMO LOADER & RESET ---
  loadSampleDemoProducts() {
    localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(SAMPLE_DEMO_PRODUCTS));
    return true;
  }

  resetCleanDatabase() {
    this.init(true);
    return true;
  }

  exportAllData() {
    return {
      version: '3.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      categories: this.getCategories(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      sales: this.getSales(),
      stockMovements: this.getStockMovements(),
      expenses: this.getExpenses()
    };
  }

  importData(dataObj) {
    if (!dataObj || typeof dataObj !== 'object') throw new Error('Invalid backup file');
    if (dataObj.settings) localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(dataObj.settings));
    if (dataObj.categories) localStorage.setItem(DB_KEYS.CATEGORIES, JSON.stringify(dataObj.categories));
    if (dataObj.products) localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(dataObj.products));
    if (dataObj.customers) localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(dataObj.customers));
    if (dataObj.sales) localStorage.setItem(DB_KEYS.SALES, JSON.stringify(dataObj.sales));
    if (dataObj.stockMovements) localStorage.setItem(DB_KEYS.STOCK_MOVEMENTS, JSON.stringify(dataObj.stockMovements));
    if (dataObj.expenses) localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(dataObj.expenses));
    return true;
  }
}

// Global DB Instance
window.db = new DatabaseManager();
