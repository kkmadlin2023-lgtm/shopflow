/**
 * QuickMart POS - Settings & Store Configuration Controller
 * Handles shop metadata, UPI credentials, thermal printer preferences, language, and data backups.
 * Note: Database connection keys are securely managed in the background and omitted from user-facing inputs.
 */

class SettingsController {
  constructor() {}

  init() {
    this.populateForm();
    this.bindEvents();
  }

  populateForm() {
    const s = window.db.getSettings();

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : '';
    };

    const setChecked = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.checked = !!val;
    };

    // Store Metadata
    setVal('set-shop-name', s.shopName);
    setVal('set-tagline', s.tagline);
    setVal('set-phone', s.phone);
    setVal('set-alt-phone', s.altPhone);
    setVal('set-email', s.email);
    setVal('set-address', s.address);
    setVal('set-city', s.city);
    setVal('set-state', s.state);
    setVal('set-pincode', s.pincode);
    setVal('set-gst-number', s.gstNumber);

    // Payment Info
    setVal('set-upi-id', s.upiId);
    setVal('set-gpay-number', s.gpayNumber);
    setVal('set-payment-name', s.paymentName);

    // Print & Invoice Info
    setVal('set-receipt-format', s.receiptFormat || '80mm');
    setVal('set-invoice-prefix', s.invoicePrefix || 'INV-');
    setVal('set-start-invoice-num', s.startingInvoiceNumber || 1001);
    setVal('set-footer-msg', s.footerMessage);

    setChecked('set-show-gst', s.showGstOnBill);
    setChecked('set-show-qr', s.showQrOnBill);
    setChecked('set-show-address', s.showAddressOnBill);
  }

  saveForm(e) {
    if (e) e.preventDefault();

    const getVal = (id) => document.getElementById(id)?.value?.trim() || '';
    const getChecked = (id) => !!document.getElementById(id)?.checked;

    const currentSettings = window.db.getSettings();

    const payload = {
      shopName: getVal('set-shop-name') || 'My Shop Counter',
      tagline: getVal('set-tagline'),
      phone: getVal('set-phone'),
      altPhone: getVal('set-alt-phone'),
      email: getVal('set-email'),
      address: getVal('set-address'),
      city: getVal('set-city'),
      state: getVal('set-state'),
      pincode: getVal('set-pincode'),
      gstNumber: getVal('set-gst-number'),
      upiId: getVal('set-upi-id'),
      gpayNumber: getVal('set-gpay-number'),
      paymentName: getVal('set-payment-name'),
      receiptFormat: getVal('set-receipt-format'),
      invoicePrefix: getVal('set-invoice-prefix') || 'INV-',
      startingInvoiceNumber: parseInt(getVal('set-start-invoice-num')) || 1001,
      footerMessage: getVal('set-footer-msg'),
      showGstOnBill: getChecked('set-show-gst'),
      showQrOnBill: getChecked('set-show-qr'),
      showAddressOnBill: getChecked('set-show-address'),
      // Keep existing Supabase credentials securely
      supabaseUrl: currentSettings.supabaseUrl,
      supabaseKey: currentSettings.supabaseKey
    };

    window.db.saveSettings(payload);
    window.app?.showToast('Settings saved successfully!', 'success');
    window.app?.updateBranding();
  }

  exportBackup() {
    const backup = window.db.exportAllData();
    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `myshop_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.app?.showToast('Backup downloaded successfully', 'success');
  }

  importBackup(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        window.db.importData(data);
        window.app?.showToast('Backup restored successfully!', 'success');
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        window.app?.showToast('Failed to import backup: Invalid JSON', 'error');
      }
    };
    reader.readAsText(file);
  }

  loadSampleDemoProducts() {
    if (confirm('Load sample retail demo products into the catalog?')) {
      window.db.loadSampleDemoProducts();
      window.app?.showToast('Sample demo products loaded!', 'success');
      setTimeout(() => location.reload(), 600);
    }
  }

  resetCleanEmpty() {
    if (confirm('Are you sure you want to reset and clear all data to an empty mobile store?')) {
      window.db.resetCleanDatabase();
      window.app?.showToast('Reset to empty store complete!', 'success');
      setTimeout(() => location.reload(), 600);
    }
  }

  bindEvents() {
    const form = document.getElementById('settings-form');
    if (form) {
      form.addEventListener('submit', (e) => this.saveForm(e));
    }

    const exportBtn = document.getElementById('settings-export-backup-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportBackup());
    }

    const importInput = document.getElementById('settings-import-backup-file');
    if (importInput) {
      importInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          this.importBackup(e.target.files[0]);
        }
      });
    }

    const loadDemoBtn = document.getElementById('settings-load-demo-btn');
    if (loadDemoBtn) {
      loadDemoBtn.addEventListener('click', () => this.loadSampleDemoProducts());
    }

    const resetCleanBtn = document.getElementById('settings-reset-clean-btn');
    if (resetCleanBtn) {
      resetCleanBtn.addEventListener('click', () => this.resetCleanEmpty());
    }
  }
}

window.settings = new SettingsController();
