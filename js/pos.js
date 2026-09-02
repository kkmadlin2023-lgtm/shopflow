/**
 * QuickMart POS - Counter Billing Engine & Cart Controller
 * High-speed POS operations, barcode scanning, item quantity controls, taxes, discounts, and checkout.
 */

class POSController {
  constructor() {
    this.cart = [];
    this.selectedCustomerId = null;
    this.selectedCustomer = null;
    this.activeCategory = 'ALL';
    this.searchQuery = '';
    this.billDiscount = 0; // Flat discount
    this.billDiscountType = 'FLAT'; // 'FLAT' or 'PERCENT'
    this.paymentMethod = 'CASH'; // 'CASH', 'UPI', 'CARD', 'SPLIT'
    this.cashTendered = 0;
    this.scannerInstance = null;
  }

  init() {
    this.resetCart();
    this.renderPosView();
    this.bindEvents();
    this.initBarcodeKeyboardListener();
  }

  resetCart() {
    this.cart = [];
    this.selectedCustomerId = null;
    this.selectedCustomer = null;
    this.billDiscount = 0;
    this.billDiscountType = 'FLAT';
    this.paymentMethod = 'CASH';
    this.cashTendered = 0;
    this.renderCart();
  }

  // --- CART MANAGEMENT ---
  addToCart(productId, qty = 1) {
    const product = window.db.getProductById(productId);
    if (!product) {
      window.app?.showToast('Product not found!', 'error');
      return;
    }

    if (product.currentStock <= 0) {
      window.app?.showToast(`'${product.name}' is out of stock!`, 'warning');
      return;
    }

    const existingIndex = this.cart.findIndex(item => item.productId === productId);

    if (existingIndex !== -1) {
      const currentQty = this.cart[existingIndex].quantity;
      if (currentQty + qty > product.currentStock) {
        window.app?.showToast(`Only ${product.currentStock} units in stock!`, 'warning');
        return;
      }
      this.cart[existingIndex].quantity += qty;
      this.cart[existingIndex].total = this.calculateItemTotal(this.cart[existingIndex]);
    } else {
      const newItem = {
        productId: product.id,
        name: product.shortName || product.name,
        fullName: product.name,
        barcode: product.barcode || '',
        unit: product.unit || 'Pcs',
        unitPrice: parseFloat(product.sellingPrice) || 0,
        purchasePrice: parseFloat(product.purchasePrice) || 0,
        mrp: parseFloat(product.mrp) || 0,
        taxPercent: parseFloat(product.taxPercent) || 0,
        quantity: qty,
        discountAmount: 0,
        total: 0
      };
      newItem.total = this.calculateItemTotal(newItem);
      this.cart.unshift(newItem);
    }

    this.renderCart();
    this.playBeepSound();
  }

  updateItemQty(productId, newQty) {
    const product = window.db.getProductById(productId);
    const itemIndex = this.cart.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return;

    newQty = parseFloat(newQty) || 0;

    if (newQty <= 0) {
      this.removeFromCart(productId);
      return;
    }

    if (product && newQty > product.currentStock) {
      window.app?.showToast(`Max available stock is ${product.currentStock}`, 'warning');
      newQty = product.currentStock;
    }

    this.cart[itemIndex].quantity = newQty;
    this.cart[itemIndex].total = this.calculateItemTotal(this.cart[itemIndex]);
    this.renderCart();
  }

  removeFromCart(productId) {
    this.cart = this.cart.filter(item => item.productId !== productId);
    this.renderCart();
  }

  updateItemDiscount(productId, discountAmount) {
    const itemIndex = this.cart.findIndex(i => i.productId === productId);
    if (itemIndex === -1) return;

    this.cart[itemIndex].discountAmount = Math.max(0, parseFloat(discountAmount) || 0);
    this.cart[itemIndex].total = this.calculateItemTotal(this.cart[itemIndex]);
    this.renderCart();
  }

  calculateItemTotal(item) {
    const base = item.quantity * item.unitPrice;
    const discounted = Math.max(0, base - (item.discountAmount || 0));
    return discounted;
  }

  // --- TOTALS & CALCULATIONS ---
  getTotals() {
    let subtotal = 0;
    let totalTax = 0;
    let itemDiscounts = 0;

    this.cart.forEach(item => {
      const itemBase = item.quantity * item.unitPrice;
      const itemDisc = parseFloat(item.discountAmount) || 0;
      itemDiscounts += itemDisc;
      subtotal += itemBase;

      // Tax calculation per item
      const itemTaxable = Math.max(0, itemBase - itemDisc);
      const taxRate = parseFloat(item.taxPercent) || 0;
      totalTax += (itemTaxable * (taxRate / 100));
    });

    let overallDiscount = itemDiscounts;
    if (this.billDiscountType === 'PERCENT') {
      const billPercentDisc = (subtotal * (parseFloat(this.billDiscount) || 0)) / 100;
      overallDiscount += billPercentDisc;
    } else {
      overallDiscount += (parseFloat(this.billDiscount) || 0);
    }

    const netTaxable = Math.max(0, subtotal - overallDiscount);
    const grandTotal = Math.round(netTaxable + totalTax); // Round to nearest integer

    return {
      subtotal,
      itemDiscounts,
      billDiscount: parseFloat(this.billDiscount) || 0,
      totalDiscount: overallDiscount,
      totalTax,
      grandTotal,
      itemsCount: this.cart.reduce((sum, i) => sum + i.quantity, 0)
    };
  }

  // --- AUDIO FEEDBACK ---
  playBeepSound() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // 880Hz beep
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      // Audio not supported or blocked
    }
  }

  // --- BARCODE SCANNER LOGIC ---
  initBarcodeKeyboardListener() {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    window.addEventListener('keydown', (e) => {
      // Ignore if user is actively typing in input fields (unless it's the barcode scanner input)
      const target = e.target;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
      
      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      lastKeyTime = currentTime;

      // Barcode scanners type very rapidly (< 35ms between characters)
      if (e.key === 'Enter') {
        if (barcodeBuffer.length >= 4) {
          this.handleBarcodeScan(barcodeBuffer.trim());
          barcodeBuffer = '';
          if (isInput && target.id === 'pos-search-input') {
            target.value = '';
          }
        }
      } else if (e.key.length === 1) {
        if (timeDiff > 80 && !isInput) {
          barcodeBuffer = e.key; // Reset if gap is large and not focused
        } else {
          barcodeBuffer += e.key;
        }
      }
    });
  }

  handleBarcodeScan(barcode) {
    const product = window.db.getProductByBarcode(barcode);
    if (product) {
      this.addToCart(product.id, 1);
      window.app?.showToast(`Added: ${product.name}`, 'success');
    } else {
      window.app?.showToast(`No product found for barcode: ${barcode}`, 'warning');
    }
  }

  openCameraScannerModal() {
    const modalHtml = `
      <div id="camera-scanner-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="scan" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">Scan Product Barcode</h3>
            </div>
            <button id="close-camera-scanner-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>
          <div class="p-5 text-center">
            <div id="interactive-camera-view" class="w-full h-64 bg-slate-100 rounded-xl overflow-hidden border-2 border-dashed border-indigo-300 flex items-center justify-center relative">
              <div class="text-slate-400 text-xs">Initializing Camera...</div>
            </div>
            <p class="text-xs text-slate-500 mt-3">Hold product barcode steadily in front of the camera</p>
          </div>
        </div>
      </div>
    `;

    const old = document.getElementById('camera-scanner-modal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const closeBtn = document.getElementById('close-camera-scanner-btn');
    const stopScanner = () => {
      if (this.scannerInstance) {
        this.scannerInstance.stop().catch(() => {}).then(() => {
          this.scannerInstance = null;
        });
      }
      document.getElementById('camera-scanner-modal')?.remove();
    };

    closeBtn.addEventListener('click', stopScanner);

    // Initialize Html5QrcodeScanner if available
    if (window.Html5Qrcode) {
      this.scannerInstance = new Html5Qrcode("interactive-camera-view");
      const config = { fps: 10, qrbox: { width: 250, height: 150 } };
      this.scannerInstance.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          this.handleBarcodeScan(decodedText);
          stopScanner();
        },
        () => {} // ignore frame scan errors
      ).catch(err => {
        document.getElementById('interactive-camera-view').innerHTML = `
          <div class="p-4 text-xs text-rose-600 font-semibold">
            Unable to access camera: ${err.message || 'Permission denied'}
          </div>
        `;
      });
    } else {
      document.getElementById('interactive-camera-view').innerHTML = `
        <div class="p-4 text-xs text-slate-500">
          Camera scanning library not loaded. You can use a USB Barcode Scanner or type barcode in search box.
        </div>
      `;
    }
  }

  // --- RENDERING VIEWS ---
  renderPosView() {
    const container = document.getElementById('pos-products-container');
    if (!container) return;

    const products = window.db.getProducts();
    const categories = window.db.getCategories();

    // Filter products
    let filtered = products;
    if (this.activeCategory !== 'ALL') {
      filtered = filtered.filter(p => p.categoryId === this.activeCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.shortName && p.shortName.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Render Category Filter Pills
    const catContainer = document.getElementById('pos-categories-pills');
    if (catContainer) {
      let pillsHtml = `
        <button data-cat="ALL" class="pos-cat-pill whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${this.activeCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
          All Items (${products.length})
        </button>
      `;

      categories.forEach(cat => {
        const count = products.filter(p => p.categoryId === cat.id).length;
        const isActive = this.activeCategory === cat.id;
        pillsHtml += `
          <button data-cat="${cat.id}" class="pos-cat-pill whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${isActive ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}">
            ${cat.name} <span class="opacity-70 text-[10px]">(${count})</span>
          </button>
        `;
      });
      catContainer.innerHTML = pillsHtml;

      // Category Pill Click Handlers
      catContainer.querySelectorAll('.pos-cat-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          this.activeCategory = btn.getAttribute('data-cat');
          this.renderPosView();
        });
      });
    }

    // Render Product Cards Grid
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i data-lucide="package-search" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
          <p class="font-medium text-sm">No products found matching "${this.searchQuery}"</p>
          <p class="text-xs text-slate-400 mt-1">Try searching by barcode, name or change category</p>
        </div>
      `;
    } else {
      let cardsHtml = '';
      filtered.forEach(p => {
        const isOutOfStock = p.currentStock <= 0;
        const isLowStock = p.currentStock <= p.minStock && !isOutOfStock;
        const discountPct = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;

        cardsHtml += `
          <div class="pos-product-card group bg-white rounded-2xl p-3 border border-slate-200/80 hover:border-indigo-400 hover:shadow-lg transition-all flex flex-col justify-between relative cursor-pointer select-none ${isOutOfStock ? 'opacity-60 bg-slate-50 cursor-not-allowed' : 'active:scale-95'}" data-id="${p.id}">
            
            <!-- Stock Badge -->
            <div class="absolute top-2 right-2 z-10">
              ${isOutOfStock ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200">Out of Stock</span>
              ` : isLowStock ? `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">Low: ${p.currentStock} ${p.unit}</span>
              ` : `
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">${p.currentStock} ${p.unit}</span>
              `}
            </div>

            <!-- Image & Info -->
            <div>
              <div class="w-full h-24 rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                ${p.photoUrl ? `
                  <img src="${p.photoUrl}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                ` : `
                  <div class="w-full h-full flex items-center justify-center text-slate-300"><i data-lucide="package" class="w-8 h-8"></i></div>
                `}
                ${discountPct > 0 ? `
                  <span class="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">
                    ${discountPct}% OFF
                  </span>
                ` : ''}
              </div>

              <div class="text-[10px] font-semibold uppercase text-indigo-600 tracking-wider">${p.brand || 'Item'}</div>
              <h4 class="font-bold text-slate-800 text-xs line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors" title="${p.name}">
                ${p.name}
              </h4>
            </div>

            <!-- Price & Add -->
            <div class="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <div class="flex items-baseline gap-1">
                  <span class="text-sm font-black text-slate-900">₹${p.sellingPrice.toFixed(2)}</span>
                  ${p.mrp > p.sellingPrice ? `<span class="text-[10px] text-slate-400 line-through">₹${p.mrp.toFixed(2)}</span>` : ''}
                </div>
                <div class="text-[9px] text-slate-400 font-mono">${p.barcode ? p.barcode.slice(-6) : ''}</div>
              </div>

              <button class="add-to-cart-btn p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl transition-colors ${isOutOfStock ? 'pointer-events-none' : ''}">
                <i data-lucide="plus" class="w-4 h-4"></i>
              </button>
            </div>

          </div>
        `;
      });
      container.innerHTML = cardsHtml;

      // Card click events
      container.querySelectorAll('.pos-product-card').forEach(card => {
        card.addEventListener('click', (e) => {
          const prodId = card.getAttribute('data-id');
          this.addToCart(prodId, 1);
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderCart() {
    const itemsContainer = document.getElementById('pos-cart-items');
    const emptyState = document.getElementById('pos-cart-empty-state');
    const totals = this.getTotals();

    // Update Counter Header Badges
    const badgeEl = document.getElementById('pos-cart-count-badge');
    if (badgeEl) badgeEl.textContent = `${totals.itemsCount} items`;

    // Customer display
    const custNameEl = document.getElementById('pos-selected-customer-name');
    if (custNameEl) {
      custNameEl.textContent = this.selectedCustomer ? this.selectedCustomer.name : 'Walk-in Customer';
    }

    if (this.cart.length === 0) {
      if (itemsContainer) itemsContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (itemsContainer) {
        let itemsHtml = '';
        this.cart.forEach(item => {
          itemsHtml += `
            <div class="p-3 bg-white rounded-xl border border-slate-200/90 shadow-sm flex flex-col gap-2 transition-all hover:border-slate-300">
              
              <!-- Item Row 1: Name & Delete -->
              <div class="flex items-start justify-between gap-2">
                <div>
                  <div class="font-bold text-xs text-slate-900 leading-tight">${item.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono">Rate: ₹${item.unitPrice.toFixed(2)} / ${item.unit}</div>
                </div>
                <button class="cart-remove-item-btn text-slate-300 hover:text-rose-600 p-1 transition-colors" data-id="${item.productId}">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>

              <!-- Item Row 2: Qty Controls & Total -->
              <div class="flex items-center justify-between pt-1 border-t border-slate-50">
                
                <!-- Qty Buttons -->
                <div class="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button class="cart-qty-btn px-2 py-0.5 font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-white text-xs transition-colors" data-id="${item.productId}" data-action="dec">−</button>
                  <input type="number" min="1" value="${item.quantity}" class="cart-qty-input w-10 text-center bg-transparent text-xs font-bold text-slate-800 focus:outline-none" data-id="${item.productId}">
                  <button class="cart-qty-btn px-2 py-0.5 font-bold text-slate-600 hover:text-slate-900 rounded hover:bg-white text-xs transition-colors" data-id="${item.productId}" data-action="inc">+</button>
                </div>

                <!-- Price Total -->
                <div class="text-right">
                  <div class="text-xs font-black text-slate-900">₹${item.total.toFixed(2)}</div>
                  ${item.taxPercent > 0 ? `<div class="text-[9px] text-slate-400">incl. ${item.taxPercent}% GST</div>` : ''}
                </div>

              </div>

            </div>
          `;
        });
        itemsContainer.innerHTML = itemsHtml;

        // Bind cart item actions
        itemsContainer.querySelectorAll('.cart-remove-item-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            this.removeFromCart(btn.getAttribute('data-id'));
          });
        });

        itemsContainer.querySelectorAll('.cart-qty-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            const action = btn.getAttribute('data-action');
            const item = this.cart.find(i => i.productId === id);
            if (item) {
              const delta = action === 'inc' ? 1 : -1;
              this.updateItemQty(id, item.quantity + delta);
            }
          });
        });

        itemsContainer.querySelectorAll('.cart-qty-input').forEach(input => {
          input.addEventListener('change', () => {
            const id = input.getAttribute('data-id');
            this.updateItemQty(id, input.value);
          });
        });
      }
    }

    // Update Totals Summary Elements
    const subtotalEl = document.getElementById('pos-summary-subtotal');
    const discountEl = document.getElementById('pos-summary-discount');
    const taxEl = document.getElementById('pos-summary-tax');
    const grandTotalEl = document.getElementById('pos-summary-grandtotal');
    const payBtnAmountEl = document.getElementById('pos-pay-btn-amount');

    if (subtotalEl) subtotalEl.textContent = `₹${totals.subtotal.toFixed(2)}`;
    if (discountEl) discountEl.textContent = `-₹${totals.totalDiscount.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `+₹${totals.totalTax.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `₹${totals.grandTotal.toFixed(2)}`;
    if (payBtnAmountEl) payBtnAmountEl.textContent = `₹${totals.grandTotal.toFixed(2)}`;

    // Update Cash change calculation if cash input is open
    this.updateCashChange();

    if (window.lucide) window.lucide.createIcons();
  }

  updateCashChange() {
    const totals = this.getTotals();
    const input = document.getElementById('pos-cash-tendered-input');
    const changeDisplay = document.getElementById('pos-cash-change-display');

    if (input && changeDisplay) {
      const tendered = parseFloat(input.value) || 0;
      const change = Math.max(0, tendered - totals.grandTotal);
      changeDisplay.textContent = `₹${change.toFixed(2)}`;
      
      if (tendered < totals.grandTotal && tendered > 0) {
        changeDisplay.className = 'text-xs font-bold text-amber-600';
        changeDisplay.textContent = `Short by ₹${(totals.grandTotal - tendered).toFixed(2)}`;
      } else {
        changeDisplay.className = 'text-xs font-black text-emerald-600';
      }
    }
  }

  // --- CHECKOUT FLOW ---
  handleCheckout() {
    const totals = this.getTotals();
    if (this.cart.length === 0) {
      window.app?.showToast('Cart is empty! Add items first.', 'warning');
      return;
    }

    const invoiceNo = window.db.getNextInvoiceNumber();

    // If UPI selected, open UPI Modal first
    if (this.paymentMethod === 'UPI') {
      window.upi.openUPIModal(totals.grandTotal, invoiceNo, () => {
        this.completeSale('UPI');
      });
      return;
    }

    // If Split Payment, open split modal
    if (this.paymentMethod === 'SPLIT') {
      this.openSplitPaymentModal(totals.grandTotal, (splitData) => {
        this.completeSale('SPLIT', splitData);
      });
      return;
    }

    // Default Cash / Card direct checkout
    this.completeSale(this.paymentMethod);
  }

  completeSale(method = 'CASH', extraData = {}) {
    const totals = this.getTotals();
    const cashInput = document.getElementById('pos-cash-tendered-input');
    const tendered = cashInput ? (parseFloat(cashInput.value) || totals.grandTotal) : totals.grandTotal;
    const change = Math.max(0, tendered - totals.grandTotal);

    const salePayload = {
      customerId: this.selectedCustomerId,
      customerName: this.selectedCustomer ? this.selectedCustomer.name : 'Walk-in Customer',
      customerPhone: this.selectedCustomer ? this.selectedCustomer.phone : '',
      items: this.cart.map(i => ({ ...i })),
      subtotal: totals.subtotal,
      discountAmount: totals.totalDiscount,
      taxAmount: totals.totalTax,
      grandTotal: totals.grandTotal,
      paymentMethod: method,
      cashReceived: method === 'CASH' ? tendered : 0,
      changeReturned: method === 'CASH' ? change : 0,
      upiTransactionId: extraData.upiTxnId || (method === 'UPI' ? 'UPI-' + Math.floor(100000 + Math.random() * 900000) : ''),
      notes: extraData.notes || ''
    };

    // Save to DB and execute stock reduction
    const savedSale = window.db.createSale(salePayload);

    window.app?.showToast(`Bill #${savedSale.invoiceNumber} completed successfully!`, 'success');

    // Open Instant Receipt Print Preview
    window.invoices.openPrintModal(savedSale);

    // Reset Cart & Refresh POS product stock badges
    this.resetCart();
    this.renderPosView();
  }

  openSplitPaymentModal(total, onConfirm) {
    const modalHtml = `
      <div id="split-payment-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="bg-indigo-600 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="split" class="w-5 h-5"></i>
              <h3 class="font-bold text-base">Split Payment Checkout</h3>
            </div>
            <button id="close-split-modal-btn" class="p-1.5 text-white/80 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <div class="p-5 space-y-4">
            <div class="text-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="text-xs text-slate-500 font-medium uppercase">Total Payable</div>
              <div class="text-2xl font-black text-indigo-600 font-mono">₹${total.toFixed(2)}</div>
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">Cash Amount (₹)</label>
              <input type="number" id="split-cash-input" value="${(total / 2).toFixed(2)}" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-700 mb-1">UPI / Digital Amount (₹)</label>
              <input type="number" id="split-upi-input" value="${(total - (total / 2)).toFixed(2)}" class="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500">
            </div>

            <div id="split-balance-msg" class="text-xs font-semibold text-center text-emerald-600">
              Balanced: Exact total matched
            </div>

            <button id="confirm-split-btn" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md transition-all">
              Confirm Split Payment
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('split-payment-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('split-payment-modal');
    const cashInput = document.getElementById('split-cash-input');
    const upiInput = document.getElementById('split-upi-input');
    const msg = document.getElementById('split-balance-msg');
    const confirmBtn = document.getElementById('confirm-split-btn');

    document.getElementById('close-split-modal-btn').addEventListener('click', () => modal.remove());

    const recalculateSplit = () => {
      const c = parseFloat(cashInput.value) || 0;
      const u = parseFloat(upiInput.value) || 0;
      const sum = c + u;
      const diff = total - sum;

      if (Math.abs(diff) < 0.01) {
        msg.className = 'text-xs font-semibold text-center text-emerald-600';
        msg.textContent = 'Balanced: Exact total matched';
        confirmBtn.disabled = false;
      } else if (diff > 0) {
        msg.className = 'text-xs font-semibold text-center text-rose-600';
        msg.textContent = `Remaining: ₹${diff.toFixed(2)} to be allocated`;
        confirmBtn.disabled = true;
      } else {
        msg.className = 'text-xs font-semibold text-center text-amber-600';
        msg.textContent = `Exceeds total by: ₹${(-diff).toFixed(2)}`;
        confirmBtn.disabled = true;
      }
    };

    cashInput.addEventListener('input', recalculateSplit);
    upiInput.addEventListener('input', recalculateSplit);

    confirmBtn.addEventListener('click', () => {
      const c = parseFloat(cashInput.value) || 0;
      const u = parseFloat(upiInput.value) || 0;
      modal.remove();
      onConfirm({ cashAmount: c, upiAmount: u, notes: `Split: ₹${c} Cash + ₹${u} UPI` });
    });
  }

  // --- CUSTOMER SELECTOR MODAL ---
  openCustomerModal() {
    const customers = window.db.getCustomers();
    const modalHtml = `
      <div id="pos-customer-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
          
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="users" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">Select Customer</h3>
            </div>
            <button id="close-cust-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <!-- Search & Add New -->
          <div class="p-4 border-b border-slate-200 bg-slate-50 flex gap-2">
            <div class="relative flex-1">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-3"></i>
              <input type="text" id="cust-modal-search" placeholder="Search by name or phone..." class="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500">
            </div>
            <button id="cust-modal-walkin-btn" class="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl whitespace-nowrap">
              Walk-in
            </button>
          </div>

          <!-- Customer List -->
          <div class="p-4 overflow-y-auto flex-1 space-y-2" id="cust-modal-list">
            ${customers.map(c => `
              <div class="cust-select-card p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/50 cursor-pointer transition-all flex items-center justify-between" data-id="${c.id}">
                <div>
                  <div class="font-bold text-sm text-slate-900">${c.name}</div>
                  <div class="text-xs text-slate-500 font-mono">📱 ${c.phone || 'No phone'}</div>
                </div>
                <div class="text-right">
                  <div class="text-xs font-semibold text-emerald-600">₹${(c.totalSpent || 0).toFixed(2)}</div>
                  <div class="text-[10px] text-slate-400">${c.totalOrders || 0} orders</div>
                </div>
              </div>
            `).join('')}
          </div>

        </div>
      </div>
    `;

    document.getElementById('pos-customer-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('pos-customer-modal');
    document.getElementById('close-cust-modal-btn').addEventListener('click', () => modal.remove());

    document.getElementById('cust-modal-walkin-btn').addEventListener('click', () => {
      this.selectedCustomerId = null;
      this.selectedCustomer = null;
      this.renderCart();
      modal.remove();
      window.app?.showToast('Set to Walk-in Customer', 'info');
    });

    modal.querySelectorAll('.cust-select-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        this.selectedCustomerId = id;
        this.selectedCustomer = window.db.getCustomerById(id);
        this.renderCart();
        modal.remove();
        window.app?.showToast(`Customer: ${this.selectedCustomer.name}`, 'success');
      });
    });
  }

  // --- BINDING POS CONTROLS ---
  bindEvents() {
    // Search input
    const searchInput = document.getElementById('pos-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderPosView();
      });
    }

    // Camera Barcode Scanner trigger
    const scanBtn = document.getElementById('pos-camera-scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        this.openCameraScannerModal();
      });
    }

    // Payment method switchers
    const methodButtons = document.querySelectorAll('.pos-pay-method-btn');
    methodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.paymentMethod = btn.getAttribute('data-method');
        methodButtons.forEach(b => {
          b.className = 'pos-pay-method-btn flex-1 py-2 text-xs font-bold rounded-xl border transition-all text-slate-600 bg-white border-slate-200 hover:bg-slate-50';
        });
        btn.className = 'pos-pay-method-btn flex-1 py-2 text-xs font-bold rounded-xl border transition-all bg-indigo-600 text-white border-indigo-600 shadow-sm';

        // Toggle cash tender container if CASH selected
        const cashBox = document.getElementById('pos-cash-tender-container');
        if (cashBox) {
          if (this.paymentMethod === 'CASH') cashBox.classList.remove('hidden');
          else cashBox.classList.add('hidden');
        }
      });
    });

    // Cash tender quick buttons
    document.querySelectorAll('.pos-quick-cash-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const amt = btn.getAttribute('data-amt');
        const input = document.getElementById('pos-cash-tendered-input');
        if (input) {
          if (amt === 'exact') {
            input.value = this.getTotals().grandTotal;
          } else {
            input.value = amt;
          }
          this.updateCashChange();
        }
      });
    });

    const cashInput = document.getElementById('pos-cash-tendered-input');
    if (cashInput) {
      cashInput.addEventListener('input', () => this.updateCashChange());
    }

    // Pay / Complete Sale Button (F4)
    const payBtn = document.getElementById('pos-complete-sale-btn');
    if (payBtn) {
      payBtn.addEventListener('click', () => this.handleCheckout());
    }

    // Clear cart button
    const clearCartBtn = document.getElementById('pos-clear-cart-btn');
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', () => {
        if (this.cart.length > 0) {
          if (confirm('Are you sure you want to clear the current cart?')) {
            this.resetCart();
          }
        }
      });
    }

    // Customer trigger
    const custBtn = document.getElementById('pos-select-customer-btn');
    if (custBtn) {
      custBtn.addEventListener('click', () => this.openCustomerModal());
    }

    // Global shortcut listener for POS
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        window.app?.navigate('sale');
      } else if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('pos-search-input')?.focus();
      } else if (e.key === 'F3') {
        e.preventDefault();
        this.openCustomerModal();
      } else if (e.key === 'F4') {
        e.preventDefault();
        this.handleCheckout();
      } else if (e.key === 'F5') {
        // Prevent default browser refresh, trigger print if receipt modal open or reprint last
        e.preventDefault();
        const sales = window.db.getSales();
        if (sales.length > 0) {
          window.invoices.openPrintModal(sales[0]);
        }
      }
    });
  }
}

window.pos = new POSController();
