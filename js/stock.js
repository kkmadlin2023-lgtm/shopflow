/**
 * QuickMart POS - Stock & Inventory Movement Controller
 * Handles stock audits, inward purchases, damage write-offs, manual adjustments, and audit trail logs.
 */

class StockController {
  constructor() {
    this.activeTab = 'AUDIT'; // 'AUDIT' or 'MOVEMENTS'
    this.searchQuery = '';
    this.movementTypeFilter = 'ALL';
  }

  init() {
    this.renderStockView();
    this.bindEvents();
  }

  renderStockView() {
    const products = window.db.getProducts();
    const movements = window.db.getStockMovements();

    // Summary Metrics
    const lowStockList = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    const outOfStockList = products.filter(p => p.currentStock <= 0);
    const totalInventoryValue = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);

    const countTotalEl = document.getElementById('stock-metric-total-items');
    const countLowEl = document.getElementById('stock-metric-low-stock');
    const countOutEl = document.getElementById('stock-metric-out-stock');
    const totalValEl = document.getElementById('stock-metric-total-value');

    if (countTotalEl) countTotalEl.textContent = products.length;
    if (countLowEl) countLowEl.textContent = lowStockList.length;
    if (countOutEl) countOutEl.textContent = outOfStockList.length;
    if (totalValEl) totalValEl.textContent = `₹${totalInventoryValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

    // Low stock warning banner
    const alertBanner = document.getElementById('stock-alert-banner');
    if (alertBanner) {
      if (lowStockList.length > 0 || outOfStockList.length > 0) {
        alertBanner.classList.remove('hidden');
        alertBanner.innerHTML = `
          <div class="flex items-center gap-3">
            <div class="p-2 bg-amber-500 text-white rounded-xl flex-shrink-0 animate-bounce">
              <i data-lucide="alert-triangle" class="w-5 h-5"></i>
            </div>
            <div>
              <div class="font-bold text-amber-950 text-xs">Attention Required: Inventory Alerts</div>
              <div class="text-[11px] text-amber-900 mt-0.5">
                <strong>${outOfStockList.length}</strong> items are out of stock and <strong>${lowStockList.length}</strong> items are below minimum reorder thresholds.
              </div>
            </div>
          </div>
          <button id="quick-inward-stock-banner-btn" class="px-3 py-1.5 bg-amber-900 hover:bg-amber-950 text-white font-bold rounded-lg text-xs whitespace-nowrap">
            + Inward Stock
          </button>
        `;
        document.getElementById('quick-inward-stock-banner-btn')?.addEventListener('click', () => {
          this.openAdjustmentModal();
        });
      } else {
        alertBanner.classList.add('hidden');
      }
    }

    // Render Table depending on Active Tab
    if (this.activeTab === 'AUDIT') {
      this.renderAuditTable(products);
    } else {
      this.renderMovementsTable(movements);
    }

    if (window.lucide) window.lucide.createIcons();
  }

  renderAuditTable(products) {
    const tableBody = document.getElementById('stock-table-body');
    if (!tableBody) return;

    let list = products;
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="text-center py-10 text-slate-400 text-xs">No matching inventory items found</td></tr>
      `;
      return;
    }

    let rows = '';
    list.forEach(p => {
      const isOutOfStock = p.currentStock <= 0;
      const isLowStock = p.currentStock <= p.minStock && !isOutOfStock;
      const valuation = (p.currentStock * p.purchasePrice).toFixed(2);

      rows += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="py-3 px-4 font-bold text-slate-900">
            <div>${p.name}</div>
            <div class="text-[10px] text-slate-400 font-mono">Barcode: ${p.barcode || 'N/A'} • SKU: ${p.sku || 'N/A'}</div>
          </td>
          <td class="py-3 px-4 font-black text-slate-800">
            ${p.currentStock} <span class="text-[10px] font-normal text-slate-500">${p.unit}</span>
          </td>
          <td class="py-3 px-4 text-slate-600">${p.minStock} ${p.unit}</td>
          <td class="py-3 px-4 text-slate-600">${p.maxStock || 100} ${p.unit}</td>
          <td class="py-3 px-4 font-mono text-slate-700">₹${valuation}</td>
          <td class="py-3 px-4">
            ${isOutOfStock ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of Stock</span>
            ` : isLowStock ? `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">Low Stock</span>
            ` : `
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">Good</span>
            `}
          </td>
          <td class="py-3 px-4 text-right">
            <button class="adjust-stock-row-btn px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold rounded-lg text-[11px] transition-colors" data-id="${p.id}">
              Adjust / Inward
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows;

    tableBody.querySelectorAll('.adjust-stock-row-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openAdjustmentModal(btn.getAttribute('data-id'));
      });
    });
  }

  renderMovementsTable(movements) {
    const tableBody = document.getElementById('stock-movements-table-body');
    if (!tableBody) return;

    let list = movements;
    if (this.movementTypeFilter !== 'ALL') {
      list = list.filter(m => m.type === this.movementTypeFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(m => m.productName && m.productName.toLowerCase().includes(q));
    }

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-10 text-slate-400 text-xs">No stock movement logs found</td></tr>
      `;
      return;
    }

    let rows = '';
    list.forEach(m => {
      const d = new Date(m.timestamp);
      const formattedDate = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      const isPositive = m.quantity > 0;
      const typeBadge = {
        'SALE': 'bg-rose-50 text-rose-700 border-rose-200',
        'PURCHASE': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'OPENING': 'bg-blue-50 text-blue-700 border-blue-200',
        'DAMAGED': 'bg-orange-50 text-orange-700 border-orange-200',
        'ADJUSTMENT': 'bg-purple-50 text-purple-700 border-purple-200'
      }[m.type] || 'bg-slate-100 text-slate-700 border-slate-200';

      rows += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="py-3 px-4 font-mono text-slate-500">${formattedDate}</td>
          <td class="py-3 px-4 font-bold text-slate-900">${m.productName}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold border ${typeBadge}">${m.type}</span>
          </td>
          <td class="py-3 px-4 font-black ${isPositive ? 'text-emerald-600' : 'text-rose-600'}">
            ${isPositive ? '+' : ''}${m.quantity}
          </td>
          <td class="py-3 px-4 text-slate-600 font-mono">
            ${m.previousStock} → <strong class="text-slate-900">${m.newStock}</strong>
          </td>
          <td class="py-3 px-4 text-slate-500">${m.notes || '—'}</td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows;
  }

  openAdjustmentModal(selectedProductId = null) {
    const products = window.db.getProducts();

    const modalHtml = `
      <div id="stock-adjust-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
          
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="layers" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">Record Stock Movement</h3>
            </div>
            <button id="close-adjust-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="stock-adjustment-form" class="p-6 space-y-4 text-xs">
            <!-- Product Select -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Select Product *</label>
              <select id="adj-product-id" required class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                ${products.map(p => `
                  <option value="${p.id}" ${selectedProductId === p.id ? 'selected' : ''}>
                    ${p.name} (Current Stock: ${p.currentStock} ${p.unit})
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Movement Type -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Movement Reason / Type *</label>
              <select id="adj-type" required class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                <option value="PURCHASE">🛒 Purchase / Stock Inward (+)</option>
                <option value="ADJUSTMENT">⚖ Manual Stock Audit Adjustment (+/-)</option>
                <option value="DAMAGED">💥 Damaged / Expired Goods (-)</option>
              </select>
            </div>

            <!-- Quantity -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Quantity Change *</label>
              <input type="number" step="0.01" id="adj-quantity" required placeholder="e.g. 50 or -5" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500">
              <p class="text-[10px] text-slate-400 mt-1">Enter positive number for inward/purchase, negative for write-offs</p>
            </div>

            <!-- Notes -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Reason / Notes / PO Ref</label>
              <input type="text" id="adj-notes" placeholder="e.g. Inward from Adani Wilmar Invoice #9821" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Buttons -->
            <div class="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button type="button" id="cancel-adj-modal-btn" class="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
              <button type="submit" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Apply Stock Update</button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.getElementById('stock-adjust-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('stock-adjust-modal');
    document.getElementById('close-adjust-modal-btn').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-adj-modal-btn').addEventListener('click', () => modal.remove());

    const form = document.getElementById('stock-adjustment-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pId = document.getElementById('adj-product-id').value;
      const type = document.getElementById('adj-type').value;
      let qty = parseFloat(document.getElementById('adj-quantity').value) || 0;
      const notes = document.getElementById('adj-notes').value.trim();

      // If damaged, ensure quantity is subtracted
      if (type === 'DAMAGED' && qty > 0) {
        qty = -qty;
      }

      window.db.updateProductStock(pId, qty, type, notes);
      window.app?.showToast('Stock movement recorded successfully!', 'success');
      modal.remove();
      this.renderStockView();
      window.products?.renderProductsTable();
      window.pos?.renderPosView();
    });
  }

  bindEvents() {
    // Tab switchers
    const auditTabBtn = document.getElementById('stock-tab-audit-btn');
    const movTabBtn = document.getElementById('stock-tab-mov-btn');
    const auditView = document.getElementById('stock-audit-view-container');
    const movView = document.getElementById('stock-movements-view-container');

    if (auditTabBtn && movTabBtn) {
      auditTabBtn.addEventListener('click', () => {
        this.activeTab = 'AUDIT';
        auditTabBtn.className = 'px-4 py-2 font-bold text-xs rounded-xl bg-indigo-600 text-white shadow-sm transition-all';
        movTabBtn.className = 'px-4 py-2 font-bold text-xs rounded-xl text-slate-600 hover:bg-slate-100 transition-all';
        auditView?.classList.remove('hidden');
        movView?.classList.add('hidden');
        this.renderStockView();
      });

      movTabBtn.addEventListener('click', () => {
        this.activeTab = 'MOVEMENTS';
        movTabBtn.className = 'px-4 py-2 font-bold text-xs rounded-xl bg-indigo-600 text-white shadow-sm transition-all';
        auditTabBtn.className = 'px-4 py-2 font-bold text-xs rounded-xl text-slate-600 hover:bg-slate-100 transition-all';
        movView?.classList.remove('hidden');
        auditView?.classList.add('hidden');
        this.renderStockView();
      });
    }

    // Inward stock trigger button
    const openInwardBtn = document.getElementById('stock-inward-btn');
    if (openInwardBtn) {
      openInwardBtn.addEventListener('click', () => this.openAdjustmentModal());
    }

    const searchInput = document.getElementById('stock-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderStockView();
      });
    }
  }
}

window.stock = new StockController();
