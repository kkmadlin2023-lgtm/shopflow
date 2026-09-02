/**
 * QuickMart POS - Expenses Management Controller
 * Tracks shop operating expenditures (Rent, Electricity, Bags, Maintenance) and integrates with Profit & Loss analytics.
 */

class ExpenseController {
  constructor() {
    this.searchQuery = '';
    this.categoryFilter = 'ALL';
  }

  init() {
    this.renderExpensesView();
    this.bindEvents();
  }

  renderExpensesView() {
    const tableBody = document.getElementById('expenses-table-body');
    if (!tableBody) return;

    const expenses = window.db.getExpenses();
    let list = expenses;

    if (this.categoryFilter !== 'ALL') {
      list = list.filter(e => e.category === this.categoryFilter);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        (e.description && e.description.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q))
      );
    }

    const totalExpense = list.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const totalEl = document.getElementById('expenses-total-amount');
    if (totalEl) totalEl.textContent = `₹${totalExpense.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="6" class="text-center py-10 text-slate-400 text-xs">No expense entries found</td></tr>
      `;
      return;
    }

    let rows = '';
    list.forEach(e => {
      rows += `
        <tr class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 text-xs">
          <td class="py-3 px-4 font-mono text-slate-500">${e.date}</td>
          <td class="py-3 px-4">
            <span class="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg font-bold text-[11px]">
              ${e.category}
            </span>
          </td>
          <td class="py-3 px-4 font-medium text-slate-800">${e.description || '—'}</td>
          <td class="py-3 px-4 font-black text-rose-600">₹${(parseFloat(e.amount) || 0).toFixed(2)}</td>
          <td class="py-3 px-4 font-mono text-slate-600">${e.paymentMethod}</td>
          <td class="py-3 px-4 text-right">
            <button class="delete-expense-btn p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" data-id="${e.id}" title="Delete Expense">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </td>
        </tr>
      `;
    });

    tableBody.innerHTML = rows;

    tableBody.querySelectorAll('.delete-expense-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Delete this expense record?')) {
          window.db.deleteExpense(id);
          window.app?.showToast('Expense removed', 'info');
          this.renderExpensesView();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  openExpenseModal() {
    const categories = ['Rent', 'Electricity', 'Packaging', 'Wages', 'Maintenance', 'Transport', 'Tea & Refreshments', 'Other'];
    const today = new Date().toISOString().split('T')[0];

    const modalHtml = `
      <div id="expense-form-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="receipt" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">Add Shop Expense</h3>
            </div>
            <button id="close-exp-form-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <form id="expense-form" class="p-6 space-y-4 text-xs">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Expense Category *</label>
                <select id="ef-category" required class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                  ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Date *</label>
                <input type="date" id="ef-date" required value="${today}" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
              </div>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Expense Amount (₹) *</label>
              <input type="number" step="0.01" id="ef-amount" required placeholder="e.g. 1500.00" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-sm text-slate-900 focus:ring-2 focus:ring-indigo-500">
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Payment Method</label>
              <select id="ef-paymentMethod" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                <option value="CASH">Cash</option>
                <option value="UPI">UPI / GPay</option>
                <option value="CARD">Bank / Card</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-slate-700 mb-1">Description / Notes</label>
              <input type="text" id="ef-description" placeholder="e.g. Bought 500 carry bags" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
            </div>

            <div class="pt-4 border-t border-slate-200 flex justify-end space-x-2">
              <button type="button" id="cancel-exp-form-modal-btn" class="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl">Cancel</button>
              <button type="submit" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md">Record Expense</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('expense-form-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('expense-form-modal');
    document.getElementById('close-exp-form-modal-btn').addEventListener('click', () => modal.remove());
    document.getElementById('cancel-exp-form-modal-btn').addEventListener('click', () => modal.remove());

    document.getElementById('expense-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const payload = {
        category: document.getElementById('ef-category').value,
        date: document.getElementById('ef-date').value,
        amount: parseFloat(document.getElementById('ef-amount').value) || 0,
        paymentMethod: document.getElementById('ef-paymentMethod').value,
        description: document.getElementById('ef-description').value.trim()
      };

      window.db.saveExpense(payload);
      window.app?.showToast('Expense recorded successfully!', 'success');
      modal.remove();
      this.renderExpensesView();
    });
  }

  bindEvents() {
    const search = document.getElementById('expenses-search-input');
    if (search) {
      search.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderExpensesView();
      });
    }

    const catFilter = document.getElementById('expenses-filter-category');
    if (catFilter) {
      catFilter.addEventListener('change', (e) => {
        this.categoryFilter = e.target.value;
        this.renderExpensesView();
      });
    }

    const addBtn = document.getElementById('expenses-add-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.openExpenseModal());
    }
  }
}

window.expenses = new ExpenseController();
