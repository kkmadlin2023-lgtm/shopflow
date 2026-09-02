/**
 * QuickMart POS - Master Application Router & State Orchestrator
 * Coordinates sidebar navigation, dashboard metrics, bill history, notifications, and keyboard helpers.
 */

class AppRouter {
  constructor() {
    this.currentView = 'dashboard';
    this.sidebarCollapsed = false;
    this.dashboardChartInstance = null;
    this.billsSearchQuery = '';
  }

  init() {
    this.bindNavigation();
    this.updateBranding();
    this.startLiveClock();
    this.navigate('dashboard');
    this.bindGlobalShortcuts();

    // Initialize sub-controllers
    if (window.pos) window.pos.init();
    if (window.products) window.products.init();
    if (window.stock) window.stock.init();
    if (window.customers) window.customers.init();
    if (window.expenses) window.expenses.init();
    if (window.reports) window.reports.init();
    if (window.settings) window.settings.init();
    if (window.supabaseSync) window.supabaseSync.init();

    if (window.lucide) window.lucide.createIcons();
  }

  // --- NAVIGATION & VIEW ROUTING ---
  navigate(viewName) {
    this.currentView = viewName;

    // Hide all view containers
    document.querySelectorAll('.app-view').forEach(view => {
      view.classList.add('hidden');
    });

    // Show target view
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) {
      targetView.classList.remove('hidden');
      targetView.classList.add('animate-fade-in');
    }

    // Update active nav items on Sidebar & Mobile bottom bar
    document.querySelectorAll('.nav-link-btn').forEach(btn => {
      const target = btn.getAttribute('data-view');
      if (target === viewName) {
        btn.classList.add('nav-item-active');
      } else {
        btn.classList.remove('nav-item-active');
      }
    });

    document.querySelectorAll('.mobile-bottom-nav-btn').forEach(btn => {
      const target = btn.getAttribute('data-view');
      if (target === viewName) {
        btn.classList.add('text-indigo-600', 'font-bold');
        btn.classList.remove('text-slate-500');
      } else {
        btn.classList.remove('text-indigo-600', 'font-bold');
        btn.classList.add('text-slate-500');
      }
    });

    // Trigger view-specific re-renders
    if (viewName === 'dashboard') this.renderDashboard();
    if (viewName === 'sale') window.pos?.renderPosView();
    if (viewName === 'products') window.products?.renderProductsTable();
    if (viewName === 'stock') window.stock?.renderStockView();
    if (viewName === 'bills') this.renderBillsTable();
    if (viewName === 'customers') window.customers?.renderCustomersTable();
    if (viewName === 'expenses') window.expenses?.renderExpensesView();
    if (viewName === 'reports') window.reports?.renderReports();
    if (viewName === 'settings') window.settings?.populateForm();

    // Close mobile drawer if open
    this.closeMobileDrawer();

    window.scrollTo(0, 0);
    if (window.lucide) window.lucide.createIcons();
  }

  // --- BRANDING & HEADER ---
  updateBranding() {
    const s = window.db.getSettings();
    document.querySelectorAll('.shop-brand-name').forEach(el => {
      el.textContent = s.shopName || 'QuickMart POS';
    });
    document.querySelectorAll('.shop-brand-tagline').forEach(el => {
      el.textContent = s.tagline || 'Counter Billing System';
    });
  }

  startLiveClock() {
    const clockEl = document.getElementById('live-counter-clock');
    const updateTime = () => {
      if (clockEl) {
        const now = new Date();
        clockEl.textContent = now.toLocaleDateString('en-IN', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' • ' + now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  }

  // --- DASHBOARD VIEW RENDERING ---
  renderDashboard() {
    const metrics = window.db.getDashboardMetrics();

    // Update Top 4 Metric Cards
    const salesEl = document.getElementById('dash-today-sales');
    const ordersEl = document.getElementById('dash-today-orders');
    const lowStockEl = document.getElementById('dash-low-stock-count');
    const totalProdEl = document.getElementById('dash-total-products');

    if (salesEl) salesEl.textContent = `₹${metrics.todaySalesAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    if (ordersEl) ordersEl.textContent = `${metrics.todayOrdersCount} Bills`;
    if (lowStockEl) {
      lowStockEl.textContent = `${metrics.lowStockCount + metrics.outOfStockCount}`;
      if (metrics.lowStockCount > 0 || metrics.outOfStockCount > 0) {
        lowStockEl.className = 'text-2xl font-black text-amber-600 animate-pulse';
      }
    }
    if (totalProdEl) totalProdEl.textContent = `${metrics.totalProductsCount}`;

    // Render Dashboard Sales Chart
    this.renderDashboardSalesChart();

    // Render Low Stock Table
    const lowStockTbody = document.getElementById('dash-low-stock-table-body');
    if (lowStockTbody) {
      const alertItems = [...metrics.outOfStockProducts, ...metrics.lowStockProducts];
      if (alertItems.length === 0) {
        lowStockTbody.innerHTML = `
          <tr><td colspan="4" class="py-6 text-center text-xs text-slate-400">All inventory levels are healthy! 🎉</td></tr>
        `;
      } else {
        lowStockTbody.innerHTML = alertItems.slice(0, 5).map(p => {
          const isOut = p.currentStock <= 0;
          return `
            <tr class="border-b border-slate-100 text-xs hover:bg-slate-50">
              <td class="py-2.5 px-3 font-bold text-slate-900">${p.name}</td>
              <td class="py-2.5 px-3 font-black ${isOut ? 'text-rose-600' : 'text-amber-600'}">${p.currentStock} ${p.unit}</td>
              <td class="py-2.5 px-3 text-slate-500">${p.minStock} ${p.unit}</td>
              <td class="py-2.5 px-3 text-right">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isOut ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}">
                  ${isOut ? 'OUT OF STOCK' : 'LOW STOCK'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Recent Transactions Table
    const recentTbody = document.getElementById('dash-recent-sales-table-body');
    if (recentTbody) {
      if (metrics.recentSales.length === 0) {
        recentTbody.innerHTML = `
          <tr><td colspan="5" class="py-6 text-center text-xs text-slate-400">No transactions recorded yet</td></tr>
        `;
      } else {
        recentTbody.innerHTML = metrics.recentSales.map(s => {
          const dt = window.invoices.formatDateTime(s.timestamp);
          return `
            <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 cursor-pointer dash-view-sale-row" data-id="${s.id}">
              <td class="py-2.5 px-3 font-mono font-bold text-indigo-600">${s.invoiceNumber}</td>
              <td class="py-2.5 px-3 font-medium text-slate-900">${s.customerName || 'Walk-in'}</td>
              <td class="py-2.5 px-3 font-bold text-slate-900">₹${s.grandTotal.toFixed(2)}</td>
              <td class="py-2.5 px-3">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">${s.paymentMethod}</span>
              </td>
              <td class="py-2.5 px-3 text-slate-500 text-right">${dt.time}</td>
            </tr>
          `;
        }).join('');

        recentTbody.querySelectorAll('.dash-view-sale-row').forEach(row => {
          row.addEventListener('click', () => {
            const sale = window.db.getSaleById(row.getAttribute('data-id'));
            if (sale) window.invoices.openPrintModal(sale);
          });
        });
      }
    }
  }

  renderDashboardSalesChart() {
    const canvas = document.getElementById('dash-sales-trend-canvas');
    if (!canvas || !window.Chart) return;

    const summary = window.db.getSalesSummary(7);

    if (this.dashboardChartInstance) {
      this.dashboardChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.dashboardChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: summary.labels,
        datasets: [{
          label: 'Daily Sales (₹)',
          data: summary.salesData,
          backgroundColor: '#4f46e5',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => '₹' + v, font: { size: 10 } },
            grid: { color: '#f1f5f9' }
          },
          x: {
            ticks: { font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  // --- BILLS / INVOICE HISTORY VIEW ---
  renderBillsTable() {
    const tableBody = document.getElementById('bills-table-body');
    if (!tableBody) return;

    const sales = window.db.getSales();
    let list = sales;

    if (this.billsSearchQuery.trim()) {
      const q = this.billsSearchQuery.toLowerCase().trim();
      list = list.filter(s =>
        (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.customerPhone && s.customerPhone.includes(q)) ||
        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(q))
      );
    }

    const countBadge = document.getElementById('bills-total-count-badge');
    if (countBadge) countBadge.textContent = `${list.length} Invoices`;

    if (list.length === 0) {
      tableBody.innerHTML = `
        <tr><td colspan="7" class="py-12 text-center text-xs text-slate-400">No invoices match your search query</td></tr>
      `;
      return;
    }

    tableBody.innerHTML = list.map(s => {
      const dt = window.invoices.formatDateTime(s.timestamp);
      const itemsCount = (s.items || []).reduce((sum, i) => sum + i.quantity, 0);

      return `
        <tr class="border-b border-slate-100 text-xs hover:bg-slate-50 transition-colors">
          <td class="py-3 px-4 font-mono font-bold text-indigo-600">${s.invoiceNumber}</td>
          <td class="py-3 px-4 text-slate-600">
            <div>${dt.date}</div>
            <div class="text-[10px] text-slate-400 font-mono">${dt.time}</div>
          </td>
          <td class="py-3 px-4 font-semibold text-slate-900">
            <div>${s.customerName || 'Walk-in'}</div>
            ${s.customerPhone ? `<div class="text-[10px] text-slate-400">📱 ${s.customerPhone}</div>` : ''}
          </td>
          <td class="py-3 px-4 text-slate-600">${itemsCount} items</td>
          <td class="py-3 px-4 font-black text-slate-900">₹${s.grandTotal.toFixed(2)}</td>
          <td class="py-3 px-4">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ${s.paymentMethod}
            </span>
          </td>
          <td class="py-3 px-4 text-right">
            <button class="view-invoice-action-btn px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold rounded-lg text-[11px] transition-colors inline-flex items-center gap-1.5" data-id="${s.id}">
              <i data-lucide="printer" class="w-3.5 h-3.5"></i> View / Print
            </button>
          </td>
        </tr>
      `;
    }).join('');

    tableBody.querySelectorAll('.view-invoice-action-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sale = window.db.getSaleById(btn.getAttribute('data-id'));
        if (sale) window.invoices.openPrintModal(sale);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }

    const typeConfig = {
      success: { bg: 'bg-emerald-800 text-white', icon: 'check-circle-2' },
      error: { bg: 'bg-rose-800 text-white', icon: 'alert-circle' },
      warning: { bg: 'bg-amber-800 text-white', icon: 'alert-triangle' },
      info: { bg: 'bg-slate-900 text-white', icon: 'info' }
    }[type] || { bg: 'bg-slate-900 text-white', icon: 'info' };

    const toast = document.createElement('div');
    toast.className = `toast-item ${typeConfig.bg}`;
    toast.innerHTML = `
      <i data-lucide="${typeConfig.icon}" class="w-4 h-4 flex-shrink-0"></i>
      <span class="flex-1 text-xs leading-snug">${message}</span>
    `;

    container.appendChild(toast);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- SHORTCUTS MODAL ---
  openShortcutsModal() {
    const modalHtml = `
      <div id="shortcuts-helper-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="keyboard" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-base">POS Keyboard Shortcuts</h3>
            </div>
            <button id="close-shortcuts-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>
          <div class="p-6 space-y-3 text-xs">
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600 font-medium">New Counter Sale Screen</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">F1</kbd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600 font-medium">Search Product / Scan Barcode</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">F2</kbd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600 font-medium">Select / Change Customer</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">F3</kbd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600 font-medium">Checkout & Pay Bill</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">F4</kbd>
            </div>
            <div class="flex justify-between items-center py-2 border-b border-slate-100">
              <span class="text-slate-600 font-medium">Reprint / Print Current Receipt</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">F5</kbd>
            </div>
            <div class="flex justify-between items-center py-2">
              <span class="text-slate-600 font-medium">Close Modal / Dismiss Screen</span>
              <kbd class="px-2.5 py-1 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-800">ESC</kbd>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('shortcuts-helper-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('shortcuts-helper-modal');
    document.getElementById('close-shortcuts-modal-btn').addEventListener('click', () => modal.remove());
  }

  // --- MOBILE DRAWER ---
  openMobileDrawer() {
    const drawer = document.getElementById('mobile-sidebar-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.remove('-translate-x-full');
      backdrop.classList.remove('hidden');
    }
  }

  closeMobileDrawer() {
    const drawer = document.getElementById('mobile-sidebar-drawer');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawer && backdrop) {
      drawer.classList.add('-translate-x-full');
      backdrop.classList.add('hidden');
    }
  }

  // --- EVENT BINDINGS ---
  bindNavigation() {
    // Sidebar & Navigation buttons
    document.querySelectorAll('.nav-link-btn, .mobile-bottom-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        if (view) this.navigate(view);
      });
    });

    // Mobile Hamburger
    const mobileMenuBtn = document.getElementById('mobile-menu-toggle-btn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', () => this.openMobileDrawer());
    }

    const drawerCloseBtn = document.getElementById('close-mobile-drawer-btn');
    const backdrop = document.getElementById('mobile-drawer-backdrop');
    if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', () => this.closeMobileDrawer());
    if (backdrop) backdrop.addEventListener('click', () => this.closeMobileDrawer());

    // Shortcuts Button in Header
    const shortcutsBtn = document.getElementById('header-shortcuts-btn');
    if (shortcutsBtn) {
      shortcutsBtn.addEventListener('click', () => this.openShortcutsModal());
    }

    // Bills Search
    const billsSearch = document.getElementById('bills-search-input');
    if (billsSearch) {
      billsSearch.addEventListener('input', (e) => {
        this.billsSearchQuery = e.target.value;
        this.renderBillsTable();
      });
    }

    // Quick New Sale button in Header
    const quickSaleBtn = document.getElementById('header-quick-sale-btn');
    if (quickSaleBtn) {
      quickSaleBtn.addEventListener('click', () => this.navigate('sale'));
    }
  }

  bindGlobalShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Close any active modal
        const modals = ['receipt-preview-modal', 'upi-payment-modal', 'split-payment-modal', 'product-form-modal', 'stock-adjust-modal', 'cust-form-modal', 'pos-customer-modal', 'expense-form-modal', 'camera-scanner-modal', 'shortcuts-helper-modal'];
        modals.forEach(mId => {
          document.getElementById(mId)?.remove();
        });
        this.closeMobileDrawer();
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        this.openShortcutsModal();
      }
    });
  }
}

// Global App Instance
window.app = new AppRouter();

// Auto boot on DOM load
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
