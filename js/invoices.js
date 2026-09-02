/**
 * QuickMart POS - Invoice Generator, Thermal Printing & Invoices Manager
 * Formats 80mm, 58mm thermal receipts and A4 tax invoices with live exact-amount UPI QR codes.
 */

class InvoiceManager {
  constructor() {
    this.currentSale = null;
    this.currentFormat = '80mm'; // default format
  }

  /**
   * Format Indian Rupee currency
   */
  formatCurrency(num) {
    return '₹' + (parseFloat(num) || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  /**
   * Format ISO date string into readable Date & Time
   */
  formatDateTime(isoStr) {
    if (!isoStr) return { date: '', time: '' };
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  }

  /**
   * Generates 80mm Thermal Receipt HTML
   */
  render80mmReceipt(sale, settings, upiQrDataUrl) {
    const dt = this.formatDateTime(sale.timestamp);
    const hasDiscount = sale.discountAmount > 0;
    const hasTax = sale.taxAmount > 0;

    let itemsRows = '';
    (sale.items || []).forEach(item => {
      const itemTotal = (parseFloat(item.total) || 0).toFixed(2);
      const unitPrice = (parseFloat(item.unitPrice) || 0).toFixed(2);
      itemsRows += `
        <tr>
          <td colspan="3" style="font-weight: 600; padding-top: 4px;">${item.name || item.productName}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #e2e8f0;">
          <td style="color: #475569;">${item.quantity} ${item.unit || 'unit'} × ₹${unitPrice}</td>
          <td style="text-align: right; color: #64748b;">${item.discountAmount > 0 ? '-₹' + item.discountAmount.toFixed(2) : ''}</td>
          <td style="text-align: right; font-weight: 700;">₹${itemTotal}</td>
        </tr>
      `;
    });

    return `
      <div class="receipt-80mm" id="receipt-content-target">
        <!-- Shop Header -->
        <div style="text-align: center; margin-bottom: 8px;">
          <div style="font-size: 16px; font-weight: 900; letter-spacing: 0.5px; text-transform: uppercase;">${settings.shopName || 'QUICKMART POS'}</div>
          ${settings.tagline ? `<div style="font-size: 10px; color: #475569; margin-top: 1px;">${settings.tagline}</div>` : ''}
          ${settings.showAddressOnBill && settings.address ? `<div style="font-size: 10px; margin-top: 3px;">${settings.address}</div>` : ''}
          ${settings.showAddressOnBill && settings.city ? `<div style="font-size: 10px;">${settings.city} - ${settings.pincode || ''}</div>` : ''}
          ${settings.phone ? `<div style="font-size: 10px; font-weight: 600;">Tel: ${settings.phone}</div>` : ''}
          ${settings.showGstOnBill && settings.gstNumber ? `<div style="font-size: 10px; font-weight: bold; margin-top: 2px;">GSTIN: ${settings.gstNumber}</div>` : ''}
        </div>

        <div class="receipt-divider-dashed"></div>

        <!-- Bill Metadata -->
        <div style="font-size: 11px; margin: 4px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Bill No:</strong> ${sale.invoiceNumber}</span>
            <span><strong>Date:</strong> ${dt.date}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span><strong>Customer:</strong> ${sale.customerName || 'Walk-in'}</span>
            <span><strong>Time:</strong> ${dt.time}</span>
          </div>
          ${sale.customerPhone ? `<div><strong>Phone:</strong> ${sale.customerPhone}</div>` : ''}
        </div>

        <div class="receipt-divider-dashed"></div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
          <thead>
            <tr style="border-bottom: 1px solid #000; text-align: left; font-weight: bold;">
              <th>Item / Qty</th>
              <th style="text-align: right;">Disc</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="receipt-divider-dashed"></div>

        <!-- Totals & Calculations -->
        <div style="font-size: 11px; line-height: 1.5;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>${this.formatCurrency(sale.subtotal)}</span>
          </div>
          ${hasDiscount ? `
          <div style="display: flex; justify-content: space-between; color: #16a34a; font-weight: 600;">
            <span>Discount:</span>
            <span>-${this.formatCurrency(sale.discountAmount)}</span>
          </div>` : ''}
          ${hasTax ? `
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Tax (GST Breakdown):</span>
            <span>+${this.formatCurrency(sale.taxAmount)}</span>
          </div>` : ''}
        </div>

        <div class="receipt-divider-double"></div>

        <!-- Grand Total -->
        <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: 900; padding: 2px 0;">
          <span>GRAND TOTAL:</span>
          <span>${this.formatCurrency(sale.grandTotal)}</span>
        </div>

        <div class="receipt-divider-dashed"></div>

        <!-- Payment Info -->
        <div style="font-size: 11px; margin: 4px 0;">
          <div style="display: flex; justify-content: space-between;">
            <span>Payment Mode:</span>
            <span style="font-weight: bold;">${sale.paymentMethod}</span>
          </div>
          ${sale.paymentMethod === 'CASH' && sale.cashReceived > 0 ? `
          <div style="display: flex; justify-content: space-between; color: #475569;">
            <span>Cash Tendered:</span>
            <span>${this.formatCurrency(sale.cashReceived)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>Change Returned:</span>
            <span>${this.formatCurrency(sale.changeReturned)}</span>
          </div>` : ''}
        </div>

        <!-- Dynamic UPI QR Code for instant scan & pay -->
        ${settings.showQrOnBill && settings.upiId ? `
        <div style="text-align: center; margin: 12px 0 6px 0; padding-top: 6px; border-top: 1px dashed #94a3b8;">
          <div style="font-size: 10px; font-weight: bold; letter-spacing: 0.5px;">SCAN TO PAY VIA UPI</div>
          <div style="margin: 6px auto; display: inline-block;" id="receipt-qr-target">
            <!-- QR inserted here -->
          </div>
          <div style="font-size: 9px; font-family: monospace; font-weight: 600;">UPI: ${settings.upiId}</div>
          <div style="font-size: 9px; color: #64748b;">(Amount: ₹${(parseFloat(sale.grandTotal) || 0).toFixed(2)})</div>
        </div>` : ''}

        <div class="receipt-divider-dashed"></div>

        <!-- Footer -->
        <div style="text-align: center; font-size: 10px; color: #475569; margin-top: 6px;">
          <div>${settings.footerMessage || 'Thank you! Visit again.'}</div>
          <div style="font-size: 8px; color: #94a3b8; margin-top: 3px;">Powered by QuickMart POS Counter</div>
        </div>
      </div>
    `;
  }

  /**
   * Generates 58mm Thermal Compact Receipt HTML
   */
  render58mmReceipt(sale, settings) {
    const dt = this.formatDateTime(sale.timestamp);
    let itemsRows = '';
    (sale.items || []).forEach(item => {
      itemsRows += `
        <tr>
          <td colspan="2" style="font-weight: bold;">${item.name || item.productName}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
          <td>${item.quantity} ${item.unit || ''} × ₹${item.unitPrice}</td>
          <td style="text-align: right; font-weight: bold;">₹${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <div class="receipt-58mm" id="receipt-content-target">
        <div style="text-align: center;">
          <div style="font-size: 13px; font-weight: bold;">${settings.shopName || 'QUICKMART'}</div>
          ${settings.phone ? `<div style="font-size: 9px;">Tel: ${settings.phone}</div>` : ''}
          ${settings.gstNumber ? `<div style="font-size: 9px;">GST: ${settings.gstNumber}</div>` : ''}
        </div>
        <div class="receipt-divider-dashed"></div>
        <div style="font-size: 9px;">
          <div>Inv: ${sale.invoiceNumber} | ${dt.date}</div>
          <div>Cust: ${sale.customerName || 'Walk-in'}</div>
        </div>
        <div class="receipt-divider-dashed"></div>
        <table style="width: 100%; font-size: 9px;">
          <tbody>${itemsRows}</tbody>
        </table>
        <div class="receipt-divider-dashed"></div>
        <div style="font-size: 10px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span><span>₹${sale.subtotal.toFixed(2)}</span>
          </div>
          ${sale.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; color: green;">
            <span>Discount:</span><span>-₹${sale.discountAmount.toFixed(2)}</span>
          </div>` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 11px; margin-top: 3px;">
            <span>TOTAL:</span><span>₹${sale.grandTotal.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-top: 2px;">
            <span>Mode:</span><span>${sale.paymentMethod}</span>
          </div>
        </div>
        ${settings.showQrOnBill && settings.upiId ? `
        <div style="text-align: center; margin-top: 6px;" id="receipt-qr-target">
          <!-- QR target -->
        </div>` : ''}
        <div class="receipt-divider-dashed"></div>
        <div style="text-align: center; font-size: 8px;">${settings.footerMessage || 'Thank you! Visit again.'}</div>
      </div>
    `;
  }

  /**
   * Generates A4 Full Page Tax Invoice HTML
   */
  renderA4Invoice(sale, settings) {
    const dt = this.formatDateTime(sale.timestamp);
    let itemsRows = '';
    (sale.items || []).forEach((item, index) => {
      const unitPrice = parseFloat(item.unitPrice) || 0;
      const taxRate = parseFloat(item.taxPercent) || 0;
      const taxAmt = ((unitPrice * item.quantity) * (taxRate / 100)).toFixed(2);
      itemsRows += `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
          <td style="padding: 10px 8px; text-align: center; color: #64748b;">${index + 1}</td>
          <td style="padding: 10px 8px; font-weight: 600; color: #0f172a;">${item.name || item.productName}</td>
          <td style="padding: 10px 8px; text-align: center; font-family: monospace;">${item.barcode || 'N/A'}</td>
          <td style="padding: 10px 8px; text-align: center;">${item.quantity} ${item.unit || ''}</td>
          <td style="padding: 10px 8px; text-align: right;">₹${unitPrice.toFixed(2)}</td>
          <td style="padding: 10px 8px; text-align: right; color: #64748b;">${taxRate}%</td>
          <td style="padding: 10px 8px; text-align: right; font-weight: 700;">₹${item.total.toFixed(2)}</td>
        </tr>
      `;
    });

    return `
      <div class="receipt-a4" id="receipt-content-target">
        <!-- Top Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
          <div>
            <div style="font-size: 22px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: -0.5px;">${settings.shopName || 'QUICKMART SUPERMARKET'}</div>
            <div style="font-size: 12px; color: #475569; margin-top: 2px;">${settings.tagline || ''}</div>
            <div style="font-size: 12px; color: #334155; margin-top: 4px; max-width: 380px;">${settings.address || ''}, ${settings.city || ''} - ${settings.pincode || ''}</div>
            <div style="font-size: 12px; color: #334155;"><strong>Phone:</strong> ${settings.phone} ${settings.altPhone ? ' | ' + settings.altPhone : ''}</div>
            <div style="font-size: 12px; color: #334155;"><strong>Email:</strong> ${settings.email || 'counter@store.in'}</div>
            ${settings.gstNumber ? `<div style="font-size: 12px; font-weight: bold; color: #0f172a; margin-top: 2px;">GSTIN / UIN: ${settings.gstNumber}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="display: inline-block; padding: 4px 12px; background: #0f172a; color: #ffffff; font-weight: 800; font-size: 14px; border-radius: 4px; letter-spacing: 1px;">TAX INVOICE</div>
            <div style="margin-top: 8px; font-size: 13px;"><strong>Invoice No:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; color: #2563eb;">${sale.invoiceNumber}</span></div>
            <div style="font-size: 12px; color: #475569;"><strong>Date:</strong> ${dt.date}</div>
            <div style="font-size: 12px; color: #475569;"><strong>Time:</strong> ${dt.time}</div>
          </div>
        </div>

        <!-- Billed To & Payment Details -->
        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 14px 18px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
          <div>
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">BILLED TO CUSTOMER:</div>
            <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-top: 2px;">${sale.customerName || 'Walk-in Customer'}</div>
            ${sale.customerPhone ? `<div style="font-size: 12px; color: #475569;">Phone: ${sale.customerPhone}</div>` : ''}
          </div>
          <div style="text-align: right;">
            <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.5px;">PAYMENT STATUS:</div>
            <div style="display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; background: #dcfce7; color: #15803d; font-weight: 700; font-size: 12px; border-radius: 4px; margin-top: 2px;">
              PAID VIA ${sale.paymentMethod}
            </div>
            ${sale.upiTransactionId ? `<div style="font-size: 11px; color: #64748b; font-family: monospace;">Ref: ${sale.upiTransactionId}</div>` : ''}
          </div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background: #f1f5f9; border-top: 1px solid #cbd5e1; border-bottom: 2px solid #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: 700; color: #475569;">
              <th style="padding: 8px; text-align: center; width: 40px;">#</th>
              <th style="padding: 8px; text-align: left;">Item Description</th>
              <th style="padding: 8px; text-align: center; width: 120px;">Barcode / SKU</th>
              <th style="padding: 8px; text-align: center; width: 90px;">Quantity</th>
              <th style="padding: 8px; text-align: right; width: 100px;">Rate (₹)</th>
              <th style="padding: 8px; text-align: right; width: 80px;">GST %</th>
              <th style="padding: 8px; text-align: right; width: 110px;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <!-- Bottom Summary & QR -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-top: 10px;">
          <!-- Left: Terms & UPI QR -->
          <div style="max-width: 360px;">
            <div style="display: flex; align-items: center; gap: 16px; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
              <div id="receipt-qr-target" style="width: 80px; height: 80px; background: #fff; padding: 4px; border-radius: 6px; border: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: center;">
                <!-- QR target -->
              </div>
              <div style="font-size: 11px;">
                <div style="font-weight: bold; color: #0f172a;">Instant UPI Pay QR</div>
                <div style="color: #64748b; font-family: monospace; font-size: 10px;">${settings.upiId || ''}</div>
                <div style="color: #64748b; font-size: 10px; margin-top: 2px;">Scan with GPay/PhonePe to verify or pay balance</div>
              </div>
            </div>
            <div style="font-size: 10px; color: #64748b; margin-top: 10px; line-height: 1.4;">
              <strong>Terms & Conditions:</strong> Goods once sold are returnable within 3 days in original packaging with invoice. Subject to local jurisdiction.
            </div>
          </div>

          <!-- Right: Totals Box -->
          <div style="width: 280px; font-size: 13px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
              <span>Subtotal:</span>
              <span style="font-weight: 600; color: #0f172a;">${this.formatCurrency(sale.subtotal)}</span>
            </div>
            ${sale.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #16a34a; font-weight: 600;">
              <span>Total Discount:</span>
              <span>-${this.formatCurrency(sale.discountAmount)}</span>
            </div>` : ''}
            ${sale.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #475569;">
              <span>Total Tax (GST):</span>
              <span>+${this.formatCurrency(sale.taxAmount)}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 10px 0; margin-top: 6px; border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-size: 16px; font-weight: 900; color: #0f172a;">
              <span>Total Payable:</span>
              <span style="color: #2563eb;">${this.formatCurrency(sale.grandTotal)}</span>
            </div>
          </div>
        </div>

        <!-- Signature & Footer -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px;">
          <div style="color: #64748b;">${settings.footerMessage || 'Thank you for choosing us!'}</div>
          <div style="text-align: center;">
            <div style="margin-bottom: 35px; color: #94a3b8; font-size: 10px;">Authorized Signatory</div>
            <div style="font-weight: bold; border-top: 1px dashed #94a3b8; padding-top: 4px;">For ${settings.shopName}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Opens Receipt Print Preview Modal
   */
  openPrintModal(sale, initialFormat = null) {
    this.currentSale = sale;
    const settings = window.db.getSettings();
    this.currentFormat = initialFormat || settings.receiptFormat || '80mm';

    const modalHtml = `
      <div id="receipt-preview-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col overflow-hidden border border-slate-100">
          
          <!-- Modal Top Control Bar -->
          <div class="bg-slate-900 p-4 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-indigo-600 rounded-xl">
                <i data-lucide="printer" class="w-5 h-5"></i>
              </div>
              <div>
                <h3 class="font-bold text-base leading-tight">Invoice ${sale.invoiceNumber}</h3>
                <p class="text-xs text-slate-400">Total: ${this.formatCurrency(sale.grandTotal)} • ${sale.paymentMethod}</p>
              </div>
            </div>

            <!-- Format Selector Pills -->
            <div class="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs font-semibold">
              <button id="fmt-80mm-btn" class="px-3 py-1.5 rounded-lg transition-all ${this.currentFormat === '80mm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                80mm Thermal
              </button>
              <button id="fmt-58mm-btn" class="px-3 py-1.5 rounded-lg transition-all ${this.currentFormat === '58mm' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                58mm Mini
              </button>
              <button id="fmt-a4-btn" class="px-3 py-1.5 rounded-lg transition-all ${this.currentFormat === 'a4' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}">
                A4 Tax Invoice
              </button>
            </div>

            <!-- Action Buttons -->
            <div class="flex items-center space-x-2">
              <button id="trigger-browser-print-btn" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center gap-2">
                <i data-lucide="printer" class="w-4 h-4"></i> Print Bill (F5)
              </button>
              <button id="close-receipt-modal-btn" class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors">
                <i data-lucide="x" class="w-5 h-5"></i>
              </button>
            </div>
          </div>

          <!-- Modal Scrollable Preview Area -->
          <div class="receipt-preview-container flex-1 overflow-y-auto" id="printable-receipt-area">
            <div id="receipt-dynamic-render-target"></div>
          </div>

        </div>
      </div>
    `;

    const old = document.getElementById('receipt-preview-modal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    this.renderActiveFormat();

    // Bind event listeners
    const modal = document.getElementById('receipt-preview-modal');
    document.getElementById('close-receipt-modal-btn').addEventListener('click', () => modal.remove());

    document.getElementById('fmt-80mm-btn').addEventListener('click', () => {
      this.currentFormat = '80mm';
      this.updateFormatButtons();
      this.renderActiveFormat();
    });

    document.getElementById('fmt-58mm-btn').addEventListener('click', () => {
      this.currentFormat = '58mm';
      this.updateFormatButtons();
      this.renderActiveFormat();
    });

    document.getElementById('fmt-a4-btn').addEventListener('click', () => {
      this.currentFormat = 'a4';
      this.updateFormatButtons();
      this.renderActiveFormat();
    });

    document.getElementById('trigger-browser-print-btn').addEventListener('click', () => {
      window.print();
    });
  }

  updateFormatButtons() {
    const f80 = document.getElementById('fmt-80mm-btn');
    const f58 = document.getElementById('fmt-58mm-btn');
    const fa4 = document.getElementById('fmt-a4-btn');

    [f80, f58, fa4].forEach(btn => {
      btn.className = 'px-3 py-1.5 rounded-lg transition-all text-slate-400 hover:text-white';
    });

    if (this.currentFormat === '80mm') f80.className = 'px-3 py-1.5 rounded-lg transition-all bg-indigo-600 text-white shadow';
    if (this.currentFormat === '58mm') f58.className = 'px-3 py-1.5 rounded-lg transition-all bg-indigo-600 text-white shadow';
    if (this.currentFormat === 'a4') fa4.className = 'px-3 py-1.5 rounded-lg transition-all bg-indigo-600 text-white shadow';
  }

  renderActiveFormat() {
    const target = document.getElementById('receipt-dynamic-render-target');
    if (!target || !this.currentSale) return;

    const settings = window.db.getSettings();
    let html = '';

    if (this.currentFormat === '58mm') {
      html = this.render58mmReceipt(this.currentSale, settings);
    } else if (this.currentFormat === 'a4') {
      html = this.renderA4Invoice(this.currentSale, settings);
    } else {
      html = this.render80mmReceipt(this.currentSale, settings);
    }

    target.innerHTML = html;

    // Render exact UPI QR into the receipt target if enabled
    if (settings.showQrOnBill && settings.upiId) {
      const qrTarget = document.getElementById('receipt-qr-target');
      if (qrTarget) {
        const upiUrl = window.upi.generateUPIUrl(
          settings.upiId,
          settings.shopName,
          this.currentSale.grandTotal,
          this.currentSale.invoiceNumber
        );
        const qrSize = this.currentFormat === '58mm' ? 65 : (this.currentFormat === 'a4' ? 75 : 95);
        window.upi.renderQR(qrTarget, upiUrl, qrSize);
      }
    }
  }
}

window.invoices = new InvoiceManager();
