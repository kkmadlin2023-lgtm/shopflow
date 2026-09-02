/**
 * QuickMart POS - UPI QR & Payment Engine
 * Generates dynamic exact-amount UPI payment links and high-res QR codes for counter display and receipt printing.
 */

class UPIManager {
  constructor() {
    this.modalEl = null;
    this.currentQrCodeInstance = null;
  }

  /**
   * Constructs valid NPCI UPI payment intent URI
   * Format: upi://pay?pa={UPI_ID}&pn={NAME}&am={AMOUNT}&cu=INR&tn={NOTE}
   */
  generateUPIUrl(upiId, payeeName, amount, invoiceNo = '') {
    const cleanUpi = (upiId || '').trim();
    const cleanName = (payeeName || 'Shop Counter').trim();
    const formattedAmount = (parseFloat(amount) || 0).toFixed(2);
    const note = invoiceNo ? `Bill ${invoiceNo}` : 'Shop Payment';

    return `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
  }

  /**
   * Renders QR Code into a DOM target element
   */
  renderQR(container, text, size = 180) {
    if (typeof container === 'string') {
      container = document.getElementById(container);
    }
    if (!container) return;

    container.innerHTML = '';

    if (window.QRCode) {
      new QRCode(container, {
        text: text,
        width: size,
        height: size,
        colorDark: '#0f172a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } else {
      // Fallback if QRCode CDN is not yet ready: use reliable QR SVG API / image
      const img = document.createElement('img');
      img.src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
      img.alt = 'UPI Payment QR';
      img.className = 'w-full h-full object-contain mx-auto rounded-lg shadow-sm border border-slate-200';
      container.appendChild(img);
    }
  }

  /**
   * Opens dynamic counter payment modal for UPI / GPay
   */
  openUPIModal(amount, invoiceNo, onPaymentConfirmed) {
    const settings = window.db.getSettings();
    const upiId = settings.upiId || 'shop@upi';
    const shopName = settings.shopName || 'Shop Counter';
    const gpayNumber = settings.gpayNumber || '';
    const formattedAmount = (parseFloat(amount) || 0).toFixed(2);
    const upiUrl = this.generateUPIUrl(upiId, shopName, formattedAmount, invoiceNo);

    // Build modal markup
    const modalHtml = `
      <div id="upi-payment-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100 transform transition-all animate-scale-up">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-5 text-white flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <i data-lucide="qr-code" class="w-6 h-6"></i>
              </div>
              <div>
                <h3 class="font-bold text-lg leading-tight">Scan UPI to Pay</h3>
                <p class="text-xs text-emerald-100 font-medium">Any App: GPay, PhonePe, Paytm, BHIM</p>
              </div>
            </div>
            <button id="close-upi-modal-btn" class="text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <i data-lucide="x" class="w-5 h-5"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6 text-center">
            <!-- Amount Badge -->
            <div class="inline-flex items-baseline px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 mb-5">
              <span class="text-xs font-semibold uppercase tracking-wider text-emerald-600 mr-2">Exact Payable Amount:</span>
              <span class="text-2xl font-black font-mono">₹${formattedAmount}</span>
            </div>

            <!-- QR Code Wrapper -->
            <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner inline-block mx-auto mb-4 relative group">
              <div id="upi-modal-qrcode" class="w-48 h-48 flex items-center justify-center bg-white p-2 rounded-xl shadow-sm">
                <!-- QR rendered here -->
              </div>
              <div class="mt-2 text-xs font-semibold text-slate-500 tracking-wide flex items-center justify-center gap-1">
                <i data-lucide="smartphone" class="w-3.5 h-3.5 text-emerald-600"></i> Scan with any UPI Scanner
              </div>
            </div>

            <!-- Payment Details Grid -->
            <div class="bg-slate-50 rounded-xl p-3 text-left border border-slate-200 text-xs space-y-1.5 mb-5 font-mono">
              <div class="flex justify-between items-center text-slate-600">
                <span>UPI ID:</span>
                <span class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 select-all cursor-pointer flex items-center gap-1" id="copy-upi-btn" title="Click to copy">
                  ${upiId} <i data-lucide="copy" class="w-3 h-3 text-slate-400"></i>
                </span>
              </div>
              ${gpayNumber ? `
              <div class="flex justify-between items-center text-slate-600">
                <span>GPay Number:</span>
                <span class="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 select-all">${gpayNumber}</span>
              </div>` : ''}
              <div class="flex justify-between items-center text-slate-600">
                <span>Bill Ref:</span>
                <span class="text-slate-800 font-semibold">${invoiceNo || 'Counter Sale'}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-2 gap-3">
              <button id="cancel-upi-btn" class="px-4 py-3 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2">
                <i data-lucide="arrow-left" class="w-4 h-4"></i> Back / Cancel
              </button>
              <button id="confirm-upi-paid-btn" class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
                <i data-lucide="check-circle-2" class="w-4 h-4"></i> Payment Received
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove old modal if exists
    const old = document.getElementById('upi-payment-modal');
    if (old) old.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    // Render QR
    this.renderQR('upi-modal-qrcode', upiUrl, 180);

    // Bind events
    const modal = document.getElementById('upi-payment-modal');
    const closeBtn = document.getElementById('close-upi-modal-btn');
    const cancelBtn = document.getElementById('cancel-upi-btn');
    const confirmBtn = document.getElementById('confirm-upi-paid-btn');
    const copyBtn = document.getElementById('copy-upi-btn');

    const closeModal = () => {
      modal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(upiId).then(() => {
          window.app?.showToast('UPI ID copied to clipboard!', 'success');
        });
      });
    }

    confirmBtn.addEventListener('click', () => {
      closeModal();
      if (typeof onPaymentConfirmed === 'function') {
        onPaymentConfirmed();
      }
    });
  }
}

window.upi = new UPIManager();
