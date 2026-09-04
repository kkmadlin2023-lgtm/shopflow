/**
 * QuickMart POS - Bilingual Internationalization (English & தமிழ் / Tamil)
 * Provides comprehensive translations for counter billing, inventory, thermal receipts, and reports.
 */

const TRANSLATIONS = {
  en: {
    // App Branding & General
    shopNameDefault: 'My Shop Counter',
    taglineDefault: 'Point of Sale & Inventory',
    currency: '₹',
    online: 'Online / Active',
    offline: 'Offline Mode',
    shortcuts: 'Shortcuts',
    newSaleBtn: 'New Sale (F1)',
    home: 'Home',
    sale: 'Sale',
    stock: 'Stock',
    bills: 'Bills',
    more: 'More',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    search: 'Search',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    time: 'Time',
    all: 'All',

    // Nav Menu
    navDashboard: 'Dashboard',
    navSale: 'New Sale',
    navProducts: 'Products Catalog',
    navStock: 'Stock Management',
    navBills: 'Bills / Invoices',
    navCustomers: 'Customers',
    navExpenses: 'Expenses',
    navReports: 'Reports & Profit',
    navSettings: 'Settings & Store',

    // Dashboard
    dashOverview: 'Counter Overview',
    dashSubtitle: 'Live sales performance, low-stock warnings, and recent counter activity',
    startBilling: 'Start New Billing',
    todaySales: "Today's Sales",
    todayBills: "Today's Bills",
    stockAlerts: 'Stock Alerts',
    totalProducts: 'Total Products',
    salesTrend: '7-Day Sales Performance',
    dailyRevenueTrend: 'Daily revenue trends',
    fullAnalytics: 'Full Analytics',
    lowStockWarning: 'Low Stock Warning',
    manage: 'Manage',
    recentInvoices: 'Recent Counter Invoices',
    clickToReprint: 'Click any transaction to view or reprint thermal bill',
    viewAllBills: 'View All Bills',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    outOfStock: 'Out of Stock',
    allHealthy: 'All inventory levels are healthy! 🎉',
    noTransactions: 'No transactions recorded yet',

    // POS Screen
    searchProductPlaceholder: 'Search product name, barcode or SKU (F2)...',
    cameraScan: 'Camera Scan',
    customer: 'Customer',
    walkInCustomer: 'Walk-in Customer',
    cartEmpty: 'Bill Cart is Empty',
    cartEmptyHint: 'Click products on left or scan barcode to add to bill',
    subtotal: 'Subtotal',
    discount: 'Discount',
    tax: 'Tax (GST)',
    payableTotal: 'Payable Total',
    cash: 'Cash',
    upi: 'UPI / QR',
    card: 'Card',
    split: 'Split',
    tenderedCash: 'Tendered cash (₹)',
    change: 'Change',
    completeSale: 'Complete Sale',
    exact: 'Exact',

    // Products
    productsCatalog: 'Products Catalog',
    productsSubtitle: 'Manage item details, pricing, barcodes, GST taxes, and stock limits',
    addProduct: 'Add Product',
    editProduct: 'Edit Product',
    productName: 'Product Full Name',
    shortName: 'Short Name / Bill Name',
    barcode: 'Barcode / EAN',
    sku: 'SKU Code',
    category: 'Category',
    brand: 'Brand',
    sellingPrice: 'Selling Price (₹)',
    costPrice: 'Purchase Price (₹)',
    mrp: 'MRP (₹)',
    gstTaxRate: 'GST Tax Rate (%)',
    currentStock: 'Current Stock',
    unit: 'Unit of Measure',
    minStockAlert: 'Min Stock Alert',
    maxStockLimit: 'Max Stock Limit',
    productPhoto: 'Product Photo',
    chooseFromDevice: 'Choose Photo from Device / Camera',
    changePhoto: 'Change Photo',
    removePhoto: 'Remove Photo',
    supplier: 'Supplier / Distributor',

    // Stock Management
    stockMovements: 'Stock & Inventory Movements',
    stockSubtitle: 'Track stock audits, inward shipments, damage write-offs, and movement history',
    inwardAdjustStock: 'Inward / Adjust Stock',
    liveStockAudit: 'Live Stock Audit',
    movementAuditLog: 'Movement Audit Log',
    inventoryValue: 'Inventory Value',
    movementReason: 'Movement Reason / Type',
    quantityChange: 'Quantity Change',
    notes: 'Reason / Notes / PO Ref',

    // Bills
    billsHistory: 'Bills & Invoice History',
    billsSubtitle: 'Search past bills, view thermal receipt copies, and reprint bills',
    viewPrint: 'View / Print',

    // Customers
    customerManagement: 'Customer Management',
    customerSubtitle: 'Directory of registered counter customers and shopping history',
    addCustomer: 'Add Customer',
    customerName: 'Customer Name & Address',
    phone: 'Phone Number',
    email: 'Email Address',
    totalSpent: 'Total Spent',
    orders: 'Orders',

    // Expenses
    shopExpenses: 'Shop Operating Expenses',
    expensesSubtitle: 'Record shop expenditures like Rent, Electricity, Packaging, Wages & Tea',
    addExpense: 'Add Expense',
    expenseCategory: 'Expense Category',
    amount: 'Amount',
    description: 'Description / Notes',

    // Reports
    salesProfitReports: 'Sales & Profit Reports',
    reportsSubtitle: 'Gross profit estimation, sales trends, payment mode share, and product volume',
    exportCsv: 'Export CSV',
    today: 'Today',
    sevenDays: '7 Days',
    thirtyDays: '30 Days',
    salesRevenue: 'Sales Revenue',
    grossProfit: 'Gross Profit',
    totalExpenses: 'Total Expenses',
    netProfit: 'Est. Net Profit',
    totalBillsMetric: 'Total Bills',
    avgBillValue: 'Avg Bill Value',
    salesProfitTrend: 'Sales & Profit Trend',
    paymentMethodShare: 'Payment Methods Share',
    topSellingProducts: 'Top 5 Best-Selling Products',

    // Settings
    settingsStore: 'Shop Settings & Configurations',
    settingsSubtitle: 'Configure store metadata, UPI payment QR, thermal printing, and language',
    storeInfo: 'Store Information',
    shopFullName: 'Shop / Store Name',
    taglineSubtitle: 'Tagline / Subtitle',
    contactPhone: 'Contact Phone',
    altPhone: 'Alternative Phone',
    gstinNumber: 'GSTIN Number',
    shopAddress: 'Shop Address',
    city: 'City',
    state: 'State',
    pincode: 'Pincode',
    upiDetails: 'UPI & Digital Payment QR Details',
    storeUpiId: 'Store UPI ID (VPA)',
    gpayPhonePeNumber: 'GPay / PhonePe Mobile Number',
    payeeDisplayName: 'Payee Display Name',
    printerSettings: 'Receipt & Printer Settings',
    defaultReceiptFormat: 'Default Receipt Format',
    invoicePrefix: 'Invoice Prefix',
    startingInvoiceNumber: 'Starting Invoice Number',
    printUpiQr: 'Print UPI QR on Bill',
    printGstin: 'Print GSTIN on Bill',
    printAddress: 'Print Address on Bill',
    receiptFooterMessage: 'Receipt Footer Message',
    saveAllSettings: 'Save All Settings',
    dataBackupDemo: 'Data Backup & Demo Tools',
    downloadJsonBackup: 'Download JSON Backup',
    restoreFromJson: 'Restore from JSON',
    loadDemoProducts: 'Load Sample Demo Products',
    resetToEmptyStore: 'Reset to Empty Store',
    language: 'Language / மொழி'
  },

  ta: {
    // App Branding & General
    shopNameDefault: 'எனது கடை பில்லிங்',
    taglineDefault: 'விற்பனை மற்றும் இருப்பு மேலாண்மை',
    currency: '₹',
    online: 'இணைப்பில் உள்ளது',
    offline: 'ஆஃப்லைன் முறை',
    shortcuts: 'குறுக்குவழிகள்',
    newSaleBtn: 'புதிய விற்பனை (F1)',
    home: 'முகப்பு',
    sale: 'விற்பனை',
    stock: 'இருப்பு',
    bills: 'பில்கள்',
    more: 'மேலும்',
    cancel: 'ரத்து செய்',
    save: 'சேமி',
    delete: 'நீக்கு',
    edit: 'திருத்து',
    search: 'தேடுக',
    actions: 'செயல்கள்',
    status: 'நிலை',
    date: 'தேதி',
    time: 'நேரம்',
    all: 'அனைத்தும்',

    // Nav Menu
    navDashboard: 'முகப்பு பலகை',
    navSale: 'புதிய விற்பனை',
    navProducts: 'பொருட்கள் பட்டியல்',
    navStock: 'இருப்பு மேலாண்மை',
    navBills: 'பில்கள் & ரசீதுகள்',
    navCustomers: 'வாடிக்கையாளர்கள்',
    navExpenses: 'கடை செலவுகள்',
    navReports: 'விற்பனை அறிக்கைகள்',
    navSettings: 'கடை அமைப்புகள்',

    // Dashboard
    dashOverview: 'கவுண்டர் நிலவரம்',
    dashSubtitle: 'நேரலை விற்பனை, குறைந்த இருப்பு எச்சரிக்கை மற்றும் சமீபத்திய பில்கள்',
    startBilling: 'புதிய பில் தொடங்குக',
    todaySales: 'இன்றைய விற்பனை',
    todayBills: 'இன்றைய பில்கள்',
    stockAlerts: 'இருப்பு எச்சரிக்கை',
    totalProducts: 'மொத்த பொருட்கள்',
    salesTrend: '7 நாட்கள் விற்பனை விவரம்',
    dailyRevenueTrend: 'தினசரி வருவாய் போக்கு',
    fullAnalytics: 'முழு விவரம்',
    lowStockWarning: 'குறைந்த இருப்பு எச்சரிக்கை',
    manage: 'மேலாண்மை',
    recentInvoices: 'சமீபத்திய பில்கள்',
    clickToReprint: 'ரசீதை பார்க்க அல்லது அச்சிட பில் மீது கிளிக் செய்யவும்',
    viewAllBills: 'அனைத்து பில்களும்',
    inStock: 'கையிருப்பு உள்ளது',
    lowStock: 'குறைந்த இருப்பு',
    outOfStock: 'கையிருப்பு இல்லை',
    allHealthy: 'அனைத்துப் பொருட்களும் போதுமான அளவில் உள்ளன! 🎉',
    noTransactions: 'இன்னும் பரிவர்த்தனைகள் எதுவும் இல்லை',

    // POS Screen
    searchProductPlaceholder: 'பொருள் பெயர், பார்கோடு அல்லது SKU தேடுக (F2)...',
    cameraScan: 'கேமரா ஸ்கேன்',
    customer: 'வாடிக்கையாளர்',
    walkInCustomer: 'நேரடி வாடிக்கையாளர்',
    cartEmpty: 'பில் கூடை காலியாக உள்ளது',
    cartEmptyHint: 'பொருட்களை சேர்க்க இடதுபுறம் கிளிக் செய்யவும் அல்லது பார்கோடு ஸ்கேன் செய்யவும்',
    subtotal: 'கூட்டுத் தொகை',
    discount: 'தள்ளுபடி',
    tax: 'ஜி.எஸ்.டி வரி',
    payableTotal: 'செலுத்த வேண்டிய தொகை',
    cash: 'ரொக்கம்',
    upi: 'யுபிஐ / க்யூஆர்',
    card: 'கார்டு',
    split: 'பிரிவு முறை',
    tenderedCash: 'பெற்ற ரொக்கம் (₹)',
    change: 'மீதி தரவேண்டியது',
    completeSale: 'பில் முடிக்க',
    exact: 'சரியான தொகை',

    // Products
    productsCatalog: 'பொருட்கள் பட்டியல்',
    productsSubtitle: 'விலை, பார்கோடு, ஜிஎஸ்டி மற்றும் இருப்பு அளவுகளை நிர்வகிக்கவும்',
    addProduct: 'பொருள் சேர்க்க',
    editProduct: 'பொருள் திருத்த',
    productName: 'பொருளின் முழுப் பெயர்',
    shortName: 'குறுக்குப் பெயர் / பில் பெயர்',
    barcode: 'பார்கோடு / EAN',
    sku: 'SKU குறியீடு',
    category: 'பிரிவு',
    brand: 'பிராண்ட்',
    sellingPrice: 'விற்பனை விலை (₹)',
    costPrice: 'வாங்கிய விலை (₹)',
    mrp: 'அதிகபட்ச சில்லறை விலை MRP (₹)',
    gstTaxRate: 'ஜி.எஸ்.டி வரி சதவீதம் (%)',
    currentStock: 'தற்போதைய இருப்பு',
    unit: 'அளவு அலகு',
    minStockAlert: 'குறைந்த இருப்பு எச்சரிக்கை அளவு',
    maxStockLimit: 'அதிகபட்ச இருப்பு வரம்பு',
    productPhoto: 'பொருள் புகைப்படம்',
    chooseFromDevice: 'கேலரி அல்லது கேமராவிலிருந்து படம் தேர்ந்தெடுக்கவும்',
    changePhoto: 'படம் மாற்றுக',
    removePhoto: 'படத்தை நீக்குக',
    supplier: 'விநியோகஸ்தர் / சப்ளையர்',

    // Stock Management
    stockMovements: 'இருப்பு மற்றும் மாற்றங்கள்',
    stockSubtitle: 'சரக்கு வரவு, சேதங்கள் மற்றும் இருப்பு சரிபார்ப்பு வரலாறு',
    inwardAdjustStock: 'சரக்கு வரவு / திருத்தம்',
    liveStockAudit: 'நேரலை இருப்பு சரிபார்ப்பு',
    movementAuditLog: 'இருப்பு மாற்றங்களின் பதிவு',
    inventoryValue: 'சரக்கு மதிப்பு',
    movementReason: 'மாற்றத்தின் காரணம் / வகை',
    quantityChange: 'அளவு மாற்றம்',
    notes: 'காரணம் / பில் குறிப்பு',

    // Bills
    billsHistory: 'பில்கள் மற்றும் ரசீது வரலாறு',
    billsSubtitle: 'பழைய பில்களை தேடவும், ரசீதை மீண்டும் அச்சிடவும்',
    viewPrint: 'பார்க்க / அச்சிட',

    // Customers
    customerManagement: 'வாடிக்கையாளர் மேலாண்மை',
    customerSubtitle: 'பதிவுசெய்த வாடிக்கையாளர்கள் மற்றும் அவர்களின் ஷாப்பிங் வரலாறு',
    addCustomer: 'வாடிக்கையாளர் சேர்க்க',
    customerName: 'வாடிக்கையாளர் பெயர் & முகவரி',
    phone: 'தொலைபேசி எண்',
    email: 'மின்னஞ்சல்',
    totalSpent: 'மொத்த கொள்முதல்',
    orders: 'ஆர்டர்கள்',

    // Expenses
    shopExpenses: 'கடை இயக்கச் செலவுகள்',
    expensesSubtitle: 'வாடகை, மின்சாரம், பைகள், சம்பளம் போன்ற செலவுப் பதிவு',
    addExpense: 'செலவு சேர்க்க',
    expenseCategory: 'செலவு வகை',
    amount: 'தொகை',
    description: 'விவரம் / குறிப்பு',

    // Reports
    salesProfitReports: 'விற்பனை & லாப அறிக்கைகள்',
    reportsSubtitle: 'மொத்த லாபக் கணக்கீடு, விற்பனைப் போக்கு மற்றும் அதிகம் விற்ற பொருட்கள்',
    exportCsv: 'CSV பதிவிறக்கம்',
    today: 'இன்று',
    sevenDays: '7 நாட்கள்',
    thirtyDays: '30 நாட்கள்',
    salesRevenue: 'விற்பனை வருவாய்',
    grossProfit: 'மொத்த லாபம்',
    totalExpenses: 'மொத்த செலவுகள்',
    netProfit: 'நிகர லாபம்',
    totalBillsMetric: 'மொத்த பில்கள்',
    avgBillValue: 'சராசரி பில் மதிப்பு',
    salesProfitTrend: 'விற்பனை & லாபப் போக்கு',
    paymentMethodShare: 'பணம் செலுத்திய முறைகள்',
    topSellingProducts: 'அதிகம் விற்பனையான 5 பொருட்கள்',

    // Settings
    settingsStore: 'கடை அமைப்புகள் & க்யூஆர்',
    settingsSubtitle: 'கடை விபரம், யுபிஐ ஐடி, பிரிண்டர் அமைப்புகள் மற்றும் மொழி தேர்வு',
    storeInfo: 'கடை தகவல்',
    shopFullName: 'கடை பெயர்',
    taglineSubtitle: 'துணைத் தலைப்பு / முழக்கம்',
    contactPhone: 'தொடர்பு எண்',
    altPhone: 'மாற்று எண்',
    gstinNumber: 'ஜிஎஸ்டி எண் (GSTIN)',
    shopAddress: 'கடை முகவரி',
    city: 'ஊர் / நகரம்',
    state: 'மாநிலம்',
    pincode: 'அஞ்சல் குறியீடு',
    upiDetails: 'யுபிஐ மற்றும் டிஜிட்டல் க்யூஆர் விவரங்கள்',
    storeUpiId: 'கடையின் யுபிஐ ஐடி (VPA)',
    gpayPhonePeNumber: 'கூகுள் பே / ஃபோன்பே எண்',
    payeeDisplayName: 'பெயர் (Payee Name)',
    printerSettings: 'ரசீது மற்றும் பிரிண்டர் அமைப்புகள்',
    defaultReceiptFormat: 'இயல்புநிலை ரசீது வடிவம்',
    invoicePrefix: 'பில் முன்னொட்டு (Prefix)',
    startingInvoiceNumber: 'தொடக்க பில் எண்',
    printUpiQr: 'பில்லில் யுபிஐ QR அச்சிடவும்',
    printGstin: 'பில்லில் GSTIN அச்சிடவும்',
    printAddress: 'பில்லில் முகவரி அச்சிடவும்',
    receiptFooterMessage: 'ரசீது அடிக்குறிப்பு செய்தி',
    saveAllSettings: 'அமைப்புகளை சேமிக்க',
    dataBackupDemo: 'தரவு காப்புப்பிரதி & டெமோ',
    downloadJsonBackup: 'JSON காப்புப்பதிவு பதிவிறக்குக',
    restoreFromJson: 'JSON இலிருந்து மீட்டெடுக்குக',
    loadDemoProducts: 'மாதிரி பொருட்களை ஏற்றுக',
    resetToEmptyStore: 'காலி கடையாக மாற்றுக',
    language: 'மொழி / Language'
  }
};

class I18nManager {
  constructor() {
    this.currentLang = localStorage.getItem('pos_language') || 'en';
  }

  init() {
    this.setLanguage(this.currentLang);
    this.bindLanguageToggles();
  }

  t(key, fallback = '') {
    const langDict = TRANSLATIONS[this.currentLang] || TRANSLATIONS.en;
    return langDict[key] || TRANSLATIONS.en[key] || fallback || key;
  }

  setLanguage(lang) {
    if (!['en', 'ta'].includes(lang)) lang = 'en';
    this.currentLang = lang;
    localStorage.setItem('pos_language', lang);

    // Update active language UI toggles
    document.querySelectorAll('.lang-btn-en').forEach(btn => {
      if (lang === 'en') {
        btn.className = 'lang-btn-en px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs transition-all';
      } else {
        btn.className = 'lang-btn-en px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-all';
      }
    });

    document.querySelectorAll('.lang-btn-ta').forEach(btn => {
      if (lang === 'ta') {
        btn.className = 'lang-btn-ta px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-xs transition-all';
      } else {
        btn.className = 'lang-btn-ta px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-all';
      }
    });

    // Translate all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.t(key);
      if (text) {
        if (el.tagName === 'INPUT' && el.getAttribute('placeholder')) {
          el.setAttribute('placeholder', text);
        } else {
          el.textContent = text;
        }
      }
    });

    // Re-render active views if app is initialized
    if (window.app) {
      window.app.renderDashboard();
      window.pos?.renderPosView();
      window.products?.renderProductsTable();
      window.stock?.renderStockView();
      window.app.renderBillsTable();
      window.reports?.renderReports();
    }
  }

  bindLanguageToggles() {
    document.querySelectorAll('.lang-btn-en').forEach(btn => {
      btn.addEventListener('click', () => this.setLanguage('en'));
    });

    document.querySelectorAll('.lang-btn-ta').forEach(btn => {
      btn.addEventListener('click', () => this.setLanguage('ta'));
    });
  }
}

window.i18n = new I18nManager();
