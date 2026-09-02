/**
 * QuickMart POS - Customers Management Controller
 * Customer directory, purchase history, and quick customer creation.
 */

class CustomerController {
  constructor() {
    this.searchQuery = '';
  }

  init() {
    this.renderCustomersTable();
    this.bindEvents();
  }

  renderCustomersTable() {
    const tableBody = document.getElementById('customers-table-body');
    if (!tableBody) return;

    const customers = window.db.getCustomers();
    let list = customers;

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(c =>
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      );
    }

    const badge = document.getElementById('customers-total-count-badge');
    if (badge) badge.textContent = `${list.length} Customers`;

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-10 text-slate-400 text-xs">No customer records found</td></tr>
      `;
      return;
    }

    let rows = '';
    list.forEach(c => {
      rows += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="py-3 px-4">
            <div class="font-bold text-slate-900">${c.name}</div>
            <div class="text-[10px] text-slate-400">${c.address || 'No address saved'}</div>
          </td>
          <td class="py-3 px-4 font-mono text-slate-700">📱 ${c.phone || '—'}</td>
          <td class="py-3 px-4 text-slate-600">${c.email || '—'}</td>
          <td class="py-3 px-4 font-black text-emerald-600">₹${(c.totalSpent || 0).toFixed(2)}</td>
          <td class="py-3 px-4 text-slate-700 font-bold">${c.totalOrders || 0} Bills</td>
          <td class="py-3 px-4 text-right">
            <button class="edit-customer-btn p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" data-id="${c.id}" title="Edit Customer">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows;

    tableBody.querySelectorAll('.edit-customer-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCustomerModal(btn.getAttribute('data-id'));
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openCustomerModal(customerId = null) {
    const isEdit = !!customerId;
    const customer = isEdit ? window.db.getCustomerById(customerId) : null;

    const modalHtml = `
      <div id="cust-form-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="user-plus" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">${isEdit ? 'Edit Customer' : 'Add New Customer'}</h3>
            </div>
            <button id="close-cust-form-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="customer-form" class="p-6 space-y-4 text-xs">
            <input type="hidden" id="cf-id" value="${customer ? customer.id : ''}">

            <div>
              <label class="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
              <input type="text" id="cf-name" required value="${customer ? customer.name : ''}" placeholder="e.g. Ramesh Patel" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input type="tel" id="cf-phone" required value="${customer ? customer.phone : ''}" placeholder="9845012345" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500">
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Email Address</label>
                <input type="email" id="cf-email" value="${customer ? (customer.email || '') : ''}" placeholder="customer@mail.com" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Address / Landmark</label>
              <textarea id="cf-address" rows="2" placeholder="House no, Street, Area..." class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">${customer ? (customer.address || '') : ''}</textarea>
            </div>

            <div class="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button type="button" id="cancel-cust-form-modal-btn" class="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
              <button type="submit" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">
                ${isEdit ? 'Save Customer' : 'Add Customer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('cust-form-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('cust-form-modal');
    document.getElementById('close-cust-form-modal-btn').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-cust-form-modal-btn').addEventListener('click', () => modal.remove());

    document.getElementById('customer-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        id: document.getElementById('cf-id').value || undefined,
        name: document.getElementById('cf-name').value.trim(),
        phone: document.getElementById('cf-phone').value.trim(),
        email: document.getElementById('cf-email').value.trim(),
        address: document.getElementById('cf-address').value.trim()
      };

      window.db.saveCustomer(payload);
      window.app?.showToast(`Customer '${payload.name}' saved!`, 'success');
      modal.remove();
      this.renderCustomersTable();
    });
  }

  bindEvents() {
    const search = document.getElementById('customers-search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderCustomersTable();
      });
    }

    const addBtn = document.getElementById('customers-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openCustomerModal());
    }
  }
}

window.customers = new CustomerController();
