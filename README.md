<<<<<<< HEAD
# shopflow
POS FOR SHOP KEEPERS
=======
# 🛍️ QuickMart POS & Inventory Management System

A high-speed, lightweight, responsive **Shop Counter / POS & Inventory Management Web Application** designed for retail counters, grocery stores, supermarkets, and billing kiosks.

---

## ⚡ Key Highlights

- 🖥️ **Counter-Optimized Responsive POS**: Split-panel desktop layout, tablet support, and mobile bottom navigation with slide-in drawer.
- 📱 **Dynamic Exact-Amount UPI QR**: Real-time generation of `upi://pay?pa=...&am={EXACT_AMOUNT}&cu=INR` QR codes on counter screen and printed receipts.
- 🖨️ **Thermal & A4 Printing Engine**: Seamless support for 80mm thermal receipts, 58mm compact receipts, and A4 tax invoices with live print previews.
- 📦 **Complete Inventory Management**: Barcodes, SKU tracking, multi-unit measurements (Kg, Pcs, Litre, Pack, Box), MRP, Cost Price vs Selling Price margins, and Low-stock badge alerts.
- 📊 **Audited Stock Movement Log**: Real-time stock reduction on sale and movement categorization (`OPENING`, `PURCHASE`, `SALE`, `DAMAGED`, `ADJUSTMENT`).
- 💰 **Operating Expenses & Profit Analytics**: Real-time calculation of Gross Profit, Operating Expenses, Estimated Net Profit, and Chart.js trend graphs.
- ⌨️ **Keyboard Shortcut Engine**: Fast counter shortcuts (`F1`–`F5`, `ESC`, `?`) for rapid billing without mouse dependency.
- ☁️ **Dual-Mode Backend**: 100% operational standalone out-of-the-box via local storage + optional Supabase PostgreSQL sync with Row Level Security (`sql/schema.sql`).

---

## 🚀 Quick Start Guide

### 1. Direct Launch (No build step required)
Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari) or serve with any lightweight static server:

```powershell
# Using Python
cd C:\Users\kkmad\.gemini\antigravity\scratch\shop-pos
python -m http.server 8080

# Or using Node.js / npx serve
npx serve .
```

Then visit `http://localhost:8080` in your browser.

---

## ⌨️ Counter Keyboard Shortcuts

| Shortcut | Action | Description |
| :--- | :--- | :--- |
| **`F1`** | **New Sale** | Navigates immediately to the POS billing counter screen |
| **`F2`** | **Search / Scan** | Focuses the product search box for quick typing or barcode gun scanning |
| **`F3`** | **Select Customer** | Opens customer selection modal to choose registered customer or walk-in |
| **`F4`** | **Complete Sale** | Triggers payment checkout and completes the bill |
| **`F5`** | **Reprint / Print** | Prints active receipt or opens last completed invoice receipt |
| **`ESC`** | **Close Modal** | Closes any open modal dialog (camera scanner, UPI modal, receipt preview) |
| **`?`** | **Shortcuts Guide** | Opens the on-screen keyboard shortcut cheat sheet |

---

## 📂 Project Architecture

```text
shop-pos/
├── index.html                   # Master Single-Page POS Web Application
├── css/
│   ├── app.css                  # Custom styling, animations, typography
│   └── print.css                # 80mm, 58mm thermal and A4 print styles
├── js/
│   ├── app.js                   # Master router, live clock, toasts, shortcuts
│   ├── db.js                    # Storage layer, seed inventory, stock movements
│   ├── pos.js                   # Counter billing engine, cart state, scanner
│   ├── upi.js                   # NPCI UPI URI builder & QR generator
│   ├── invoices.js              # Thermal 80mm/58mm/A4 receipt formatter
│   ├── products.js              # Product catalog CRUD & filters
│   ├── stock.js                 # Stock audit & movement tracking
│   ├── customers.js             # Customer directory & order stats
│   ├── expenses.js              # Operating expenses tracker
│   ├── reports.js               # Sales, gross profit & Chart.js analytics
│   ├── settings.js              # Store configuration, UPI ID, backup/restore
│   └── supabase.js              # Supabase PostgreSQL connector & live sync
├── sql/
│   └── schema.sql               # Full PostgreSQL / Supabase schema with RLS
└── README.md                    # System documentation & reference
```

---

## 📱 UPI QR Code Integration

When completing a sale via UPI / GPay, the system creates a dynamic NPCI UPI string:

```text
upi://pay?pa=quickmart@okaxis&pn=QuickMart%20Supermarket&am=490.00&cu=INR&tn=Bill%20INV-1004
```

This ensures the customer scans the QR and is prompted for the **exact payable amount** in GPay, PhonePe, Paytm, BHIM, or any UPI app.

---

## 🗄️ Supabase PostgreSQL Cloud Setup (Optional)

To connect your Supabase database:
1. Create a new Supabase project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in Supabase and run the script located at `sql/schema.sql`.
3. In the POS application, navigate to **Settings & UPI → Supabase PostgreSQL Cloud Sync**.
4. Paste your **Supabase URL** and **Anon Public Key**, then click **Test Connection** and **Sync Local to Supabase**.
>>>>>>> 9fad53c (Initial commit: Shop Counter POS & Inventory Management System with Supabase and Google Auth)
