/**
 * QuickMart POS - Reports, Gross Profit & Analytics Controller
 * Generates sales performance charts, profit margin analytics, payment breakdowns, and CSV export.
 */

class ReportController {
  constructor() {
    this.salesChartInstance = null;
    this.paymentChartInstance = null;
    this.topProductsChartInstance = null;
    this.selectedDays = 7;
  }

  init() {
    this.renderReports();
    this.bindEvents();
  }

  renderReports() {
    const sales = window.db.getSales();
    const expenses = window.db.getExpenses();

    // Date range calculation
    const now = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(now.getDate() - this.selectedDays);

    const filteredSales = sales.filter(s => new Date(s.timestamp) >= cutoffDate);
    const filteredExpenses = expenses.filter(e => new Date(e.date) >= cutoffDate);

    // Totals
    const totalRevenue = filteredSales.reduce((sum, s) => sum + (parseFloat(s.grandTotal) || 0), 0);
    const totalGrossProfit = filteredSales.reduce((sum, s) => sum + (parseFloat(s.grossProfit) || 0), 0);
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = totalGrossProfit - totalExpenses;
    const totalBills = filteredSales.length;
    const avgBill = totalBills > 0 ? (totalRevenue / totalBills) : 0;
    const grossMarginPct = totalRevenue > 0 ? ((totalGrossProfit / totalRevenue) * 100).toFixed(1) : 0;

    // Update Metric Cards in DOM
    const revEl = document.getElementById('report-metric-revenue');
    const grossProfitEl = document.getElementById('report-metric-gross-profit');
    const netProfitEl = document.getElementById('report-metric-net-profit');
    const expensesEl = document.getElementById('report-metric-expenses');
    const billsEl = document.getElementById('report-metric-bills');
    const avgBillEl = document.getElementById('report-metric-avg-bill');

    if (revEl) revEl.textContent = `₹${totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (grossProfitEl) grossProfitEl.textContent = `₹${totalGrossProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })} (${grossMarginPct}%)`;
    if (netProfitEl) {
      netProfitEl.textContent = `₹${netProfit.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
      netProfitEl.className = netProfit >= 0 ? 'text-2xl font-black text-emerald-600' : 'text-2xl font-black text-rose-600';
    }
    if (expensesEl) expensesEl.textContent = `₹${totalExpenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
    if (billsEl) billsEl.textContent = totalBills;
    if (avgBillEl) avgBillEl.textContent = `₹${avgBill.toFixed(0)}`;

    // Render Charts
    this.renderSalesTrendChart(this.selectedDays);
    this.renderPaymentChart();
    this.renderTopProductsChart();

    if (window.lucide) window.lucide.createIcons();
  }

  renderSalesTrendChart(days) {
    const canvas = document.getElementById('reports-sales-trend-canvas');
    if (!canvas || !window.Chart) return;

    const summary = window.db.getSalesSummary(days);

    if (this.salesChartInstance) {
      this.salesChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.salesChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: summary.labels,
        datasets: [
          {
            label: 'Sales Revenue (₹)',
            data: summary.salesData,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Gross Profit (₹)',
            data: summary.profitData,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.35,
            pointRadius: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { family: 'Inter', size: 11, weight: 'bold' } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '₹' + value,
              font: { size: 10 }
            },
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

  renderPaymentChart() {
    const canvas = document.getElementById('reports-payment-methods-canvas');
    if (!canvas || !window.Chart) return;

    const breakdown = window.db.getPaymentBreakdown();

    if (this.paymentChartInstance) {
      this.paymentChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.paymentChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['UPI / GPay', 'Cash', 'Bank / Card', 'Split'],
        datasets: [{
          data: [breakdown.UPI || 0, breakdown.CASH || 0, breakdown.CARD || 0, breakdown.SPLIT || 0],
          backgroundColor: ['#10b981', '#4f46e5', '#f59e0b', '#8b5cf6'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Inter', size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ₹${context.raw.toLocaleString('en-IN')}`
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  renderTopProductsChart() {
    const canvas = document.getElementById('reports-top-products-canvas');
    if (!canvas || !window.Chart) return;

    const topList = window.db.getTopSellingProducts(5);

    if (this.topProductsChartInstance) {
      this.topProductsChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    this.topProductsChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topList.map(p => p.name.length > 20 ? p.name.substring(0, 18) + '...' : p.name),
        datasets: [{
          label: 'Units Sold',
          data: topList.map(p => p.quantity),
          backgroundColor: '#6366f1',
          borderRadius: 8
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, font: { size: 10 } },
            grid: { color: '#f1f5f9' }
          },
          y: {
            ticks: { font: { size: 10, weight: 'bold' } },
            grid: { display: false }
          }
        }
      }
    });
  }

  exportSalesCSV() {
    const sales = window.db.getSales();
    if (sales.length === 0) {
      window.app?.showToast('No sales data to export', 'warning');
      return;
    }

    let csv = 'Invoice Number,Date,Time,Customer,Payment Method,Subtotal,Discount,Tax,Grand Total,Profit,UPI Ref\n';

    sales.forEach(s => {
      const dt = window.invoices.formatDateTime(s.timestamp);
      csv += `"${s.invoiceNumber}","${dt.date}","${dt.time}","${s.customerName || 'Walk-in'}","${s.paymentMethod}",${s.subtotal},${s.discountAmount},${s.taxAmount},${s.grandTotal},${s.grossProfit || 0},"${s.upiTransactionId || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `quickmart_sales_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.app?.showToast('Sales report downloaded as CSV!', 'success');
  }

  bindEvents() {
    // Days filter buttons
    document.querySelectorAll('.report-days-filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const days = parseInt(btn.getAttribute('data-days')) || 7;
        this.selectedDays = days;
        document.querySelectorAll('.report-days-filter-btn').forEach(b => {
          b.className = 'report-days-filter-btn px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition-all';
        });
        btn.className = 'report-days-filter-btn px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white shadow-sm transition-all';
        this.renderReports();
      });
    });

    // Export CSV trigger
    const exportBtn = document.getElementById('report-export-csv-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportSalesCSV());
    }
  }
}

window.reports = new ReportController();
