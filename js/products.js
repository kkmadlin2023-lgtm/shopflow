/**
 * QuickMart POS - Product Management Controller
 * Handles product listing, filtering, search, add/edit modal, category assignment, and pricing calculations.
 */

class ProductController {
  constructor() {
    this.searchQuery = '';
    this.selectedCategory = 'ALL';
    this.stockFilter = 'ALL'; // 'ALL', 'LOW', 'OUT', 'GOOD'
  }

  init() {
    this.renderProductsTable();
    this.bindEvents();
  }

  renderProductsTable() {
    const tableBody = document.getElementById('products-table-body');
    if (!tableBody) return;

    const products = window.db.getProducts();
    const categories = window.db.getCategories();

    // Populate category filter dropdown
    const catSelect = document.getElementById('products-filter-category');
    if (catSelect && catSelect.children.length <= 1) {
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        catSelect.appendChild(opt);
      });
    }

    // Filter list
    let list = products;
    if (this.selectedCategory !== 'ALL') {
      list = list.filter(p => p.categoryId === this.selectedCategory);
    }
    if (this.stockFilter === 'LOW') {
      list = list.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    } else if (this.stockFilter === 'OUT') {
      list = list.filter(p => p.currentStock <= 0);
    } else if (this.stockFilter === 'GOOD') {
      list = list.filter(p => p.currentStock > p.minStock);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q))
      );
    }

    // Update count badge
    const countBadge = document.getElementById('products-total-count-badge');
    if (countBadge) countBadge.textContent = `${list.length} Products`;

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center py-12 text-slate-400">
            <i data-lucide="package-x" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
            <p class="font-medium text-sm">No products found</p>
          </td>
        </tr>
      `;
    } else {
      let rowsHtml = '';
      list.forEach(p => {
        const cat = categories.find(c => c.id === p.categoryId);
        const catName = cat ? cat.name : 'General';
        const isOutOfStock = p.currentStock <= 0;
        const isLowStock = p.currentStock <= p.minStock && !isOutOfStock;
        const margin = p.sellingPrice > 0 ? (((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100).toFixed(0) : 0;

        rowsHtml += `
          <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
            <!-- Photo & Name -->
            <td class="py-3 px-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                  ${p.photoUrl ? `<img src="${p.photoUrl}" alt="${p.name}" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-slate-300"><i data-lucide="image" class="w-5 h-5"></i></div>`}
                </div>
                <div>
                  <div class="font-bold text-slate-900 leading-tight">${p.name}</div>
                  <div class="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                    <span>SKU: ${p.sku || 'N/A'}</span>
                    ${p.barcode ? `<span>• Barcode: ${p.barcode}</span>` : ''}
                  </div>
                </div>
              </div>
            </td>

            <!-- Category -->
            <td class="py-3 px-4">
              <span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium text-[11px] whitespace-nowrap">
                ${catName}
              </span>
            </td>

            <!-- Pricing -->
            <td class="py-3 px-4">
              <div class="font-bold text-slate-900">₹${p.sellingPrice.toFixed(2)}</div>
              <div class="text-[10px] text-slate-400">MRP: ₹${p.mrp.toFixed(2)}</div>
            </td>

            <!-- Cost & Margin -->
            <td class="py-3 px-4">
              <div class="font-medium text-slate-600">₹${p.purchasePrice.toFixed(2)}</div>
              <div class="text-[10px] text-emerald-600 font-semibold">+${margin}% Margin</div>
            </td>

            <!-- Tax -->
            <td class="py-3 px-4 font-mono text-slate-600">
              ${p.taxPercent || 0}% GST
            </td>

            <!-- Stock & Unit -->
            <td class="py-3 px-4">
              <div class="font-black text-slate-900">${p.currentStock} <span class="text-[10px] font-normal text-slate-500">${p.unit}</span></div>
              <div class="text-[10px] text-slate-400">Min: ${p.minStock}</div>
            </td>

            <!-- Status Badge -->
            <td class="py-3 px-4">
              ${isOutOfStock ? `
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">Out of Stock</span>
              ` : isLowStock ? `
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 animate-pulse">Low Stock</span>
              ` : `
                <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">In Stock</span>
              `}
            </td>

            <!-- Actions -->
            <td class="py-3 px-4 text-right">
              <div class="flex items-center justify-end space-x-1">
                <button class="edit-product-btn p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" data-id="${p.id}" title="Edit Product">
                  <i data-lucide="edit-3" class="w-4 h-4"></i>
                </button>
                <button class="delete-product-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" data-id="${p.id}" title="Delete Product">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
      tableBody.innerHTML = rowsHtml;

      // Event listeners for Edit and Delete
      tableBody.querySelectorAll('.edit-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          this.openProductModal(id);
        });
      });

      tableBody.querySelectorAll('.delete-product-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const p = window.db.getProductById(id);
          if (confirm(`Are you sure you want to delete '${p?.name}'?`)) {
            window.db.deleteProduct(id);
            window.app?.showToast('Product deleted successfully', 'success');
            this.renderProductsTable();
          }
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  openProductModal(productId = null) {
    const isEdit = !!productId;
    const product = isEdit ? window.db.getProductById(productId) : null;
    const categories = window.db.getCategories();

    const units = ['Pcs', 'Kg', 'Gram', 'Litre', 'Pack', 'Box', 'Dozen', 'Bottle'];

    const modalHtml = `
      <div id="product-form-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col">
          
          <!-- Header -->
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="${isEdit ? 'edit-3' : 'plus-circle'}" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">${isEdit ? 'Edit Product' : 'Add New Product'}</h3>
            </div>
            <button id="close-prod-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <!-- Form Body -->
          <form id="product-edit-form" class="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
            <input type="hidden" id="pf-id" value="${product ? product.id : ''}">

            <!-- Row 1: Name & Short Name -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div class="md:col-span-2">
                <label class="block font-bold text-slate-700 mb-1">Product Full Name *</label>
                <input type="text" id="pf-name" required value="${product ? product.name : ''}" placeholder="e.g. India Gate Premium Basmati Rice" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Short Name / Bill Name</label>
                <input type="text" id="pf-shortName" value="${product ? (product.shortName || '') : ''}" placeholder="e.g. Basmati Rice 5kg" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <!-- Row 2: Barcode, SKU, Category, Brand -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Barcode / EAN</label>
                <input type="text" id="pf-barcode" value="${product ? (product.barcode || '') : ''}" placeholder="8901030383754" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">SKU Code</label>
                <input type="text" id="pf-sku" value="${product ? (product.sku || '') : ''}" placeholder="RICE-5KG" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Category *</label>
                <select id="pf-categoryId" required class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                  ${categories.map(c => `<option value="${c.id}" ${product && product.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Brand</label>
                <input type="text" id="pf-brand" value="${product ? (product.brand || '') : ''}" placeholder="e.g. India Gate" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <!-- Row 3: Pricing & Tax -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div class="font-bold text-slate-800 mb-2 flex items-center gap-1.5"><i data-lucide="tag" class="w-4 h-4 text-indigo-600"></i> Pricing & Taxation</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Purchase Price (₹)</label>
                  <input type="number" step="0.01" id="pf-purchasePrice" value="${product ? product.purchasePrice : '0.00'}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Selling Price (₹) *</label>
                  <input type="number" step="0.01" id="pf-sellingPrice" required value="${product ? product.sellingPrice : ''}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">MRP (₹) *</label>
                  <input type="number" step="0.01" id="pf-mrp" required value="${product ? product.mrp : ''}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">GST Tax Rate (%)</label>
                  <select id="pf-taxPercent" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                    <option value="0" ${product && product.taxPercent == 0 ? 'selected' : ''}>0% (Exempt)</option>
                    <option value="5" ${product && product.taxPercent == 5 ? 'selected' : ''}>5% GST</option>
                    <option value="12" ${product && product.taxPercent == 12 ? 'selected' : ''}>12% GST</option>
                    <option value="18" ${product && product.taxPercent == 18 ? 'selected' : ''}>18% GST</option>
                    <option value="28" ${product && product.taxPercent == 28 ? 'selected' : ''}>28% GST</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Row 4: Stock & Units -->
            <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div class="font-bold text-slate-800 mb-2 flex items-center gap-1.5"><i data-lucide="boxes" class="w-4 h-4 text-emerald-600"></i> Stock & Inventory Units</div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Current Stock</label>
                  <input type="number" step="0.01" id="pf-currentStock" value="${product ? product.currentStock : '10'}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Unit of Measure</label>
                  <select id="pf-unit" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500">
                    ${units.map(u => `<option value="${u}" ${product && product.unit === u ? 'selected' : ''}>${u}</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Min Stock Alert</label>
                  <input type="number" step="0.01" id="pf-minStock" value="${product ? product.minStock : '5'}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                </div>
                <div>
                  <label class="block font-semibold text-slate-600 mb-1">Max Stock Limit</label>
                  <input type="number" step="0.01" id="pf-maxStock" value="${product ? (product.maxStock || '100') : '100'}" class="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                </div>
              </div>
            </div>

            <!-- Row 5: Photo URL & Supplier Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Product Photo URL</label>
                <input type="url" id="pf-photoUrl" value="${product ? (product.photoUrl || '') : ''}" placeholder="https://..." class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Supplier / Distributor</label>
                <input type="text" id="pf-supplierName" value="${product ? (product.supplierName || '') : ''}" placeholder="e.g. City Wholesale Agency" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-4 border-t border-slate-200 flex justify-end space-x-3">
              <button type="button" id="cancel-prod-modal-btn" class="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button type="submit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md">
                ${isEdit ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>

        </div>
      </div>
    `;

    document.getElementById('product-form-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('product-form-modal');
    document.getElementById('close-prod-modal-btn').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-prod-modal-btn').addEventListener('click', () => modal.remove());

    const form = document.getElementById('product-edit-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('pf-id').value || undefined,
        name: document.getElementById('pf-name').value.trim(),
        shortName: document.getElementById('pf-shortName').value.trim(),
        barcode: document.getElementById('pf-barcode').value.trim(),
        sku: document.getElementById('pf-sku').value.trim(),
        categoryId: document.getElementById('pf-categoryId').value,
        brand: document.getElementById('pf-brand').value.trim(),
        purchasePrice: parseFloat(document.getElementById('pf-purchasePrice').value) || 0,
        sellingPrice: parseFloat(document.getElementById('pf-sellingPrice').value) || 0,
        mrp: parseFloat(document.getElementById('pf-mrp').value) || 0,
        taxPercent: parseFloat(document.getElementById('pf-taxPercent').value) || 0,
        currentStock: parseFloat(document.getElementById('pf-currentStock').value) || 0,
        unit: document.getElementById('pf-unit').value,
        minStock: parseFloat(document.getElementById('pf-minStock').value) || 5,
        maxStock: parseFloat(document.getElementById('pf-maxStock').value) || 100,
        photoUrl: document.getElementById('pf-photoUrl').value.trim(),
        supplierName: document.getElementById('pf-supplierName').value.trim()
      };

      window.db.saveProduct(payload);
      window.app?.showToast(`Product '${payload.name}' saved!`, 'success');
      modal.remove();
      this.renderProductsTable();
      window.pos?.renderPosView(); // Refresh POS grid too
    });
  }

  bindEvents() {
    const searchInput = document.getElementById('products-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderProductsTable();
      });
    }

    const catFilter = document.getElementById('products-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.selectedCategory = e.target.value;
        this.renderProductsTable();
      });
    }

    const stockFilter = document.getElementById('products-filter-stock');
    if (stockFilter) {
      stockFilter.addEventListener('change', (e) => {
        this.stockFilter = e.target.value;
        this.renderProductsTable();
      });
    }

    const addBtn = document.getElementById('products-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.openProductModal();
      });
    }
  }
}

window.products = new ProductController();
