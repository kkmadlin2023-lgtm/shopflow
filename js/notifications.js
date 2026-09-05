/**
 * QuickMart POS - Notification Center & Firebase / Web Push Notification System
 * Handles in-app notification center, audio chimes, low-stock alerts, sale notifications, and FCM Push Notification Pusher.
 */

const NOTIF_STORAGE_KEY = 'pos_notifications';
const FCM_TOKEN_KEY = 'pos_fcm_device_token';

class NotificationManager {
  constructor() {
    this.notifications = this.loadNotifications();
    this.hasPushPermission = ('Notification' in window) && Notification.permission === 'granted';
    this.isMuted = localStorage.getItem('pos_sound_muted') === 'true';
    this.audioCtx = null;
    this.fcmDeviceToken = localStorage.getItem(FCM_TOKEN_KEY) || this.generateDeviceToken();
  }

  init() {
    this.updateBadge();
    this.bindEvents();
    this.checkInitialStockAlerts();
  }

  generateDeviceToken() {
    const token = 'fcm-dev-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(FCM_TOKEN_KEY, token);
    return token;
  }

  loadNotifications() {
    try {
      const data = localStorage.getItem(NOTIF_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveNotifications() {
    try {
      if (this.notifications.length > 100) this.notifications.length = 100;
      localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(this.notifications));
      this.updateBadge();
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  }

  getUnreadCount() {
    return this.notifications.filter(n => !n.read).length;
  }

  updateBadge() {
    const unread = this.getUnreadCount();
    document.querySelectorAll('.notif-badge-count').forEach(badge => {
      if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : unread;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    });
  }

  /**
   * Dispatches a notification to In-App Center, Browser Push, Sound Chime, and Toast
   */
  notify({ title, body, type = 'info', icon = 'bell', sound = true }) {
    const notif = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: title,
      body: body,
      type: type, // 'sale', 'stock', 'sync', 'info', 'warning'
      icon: icon,
      timestamp: new Date().toISOString(),
      read: false
    };

    this.notifications.unshift(notif);
    this.saveNotifications();

    // Play Audio Chime
    if (sound && !this.isMuted) {
      if (type === 'sale') this.playSaleChime();
      else if (type === 'stock' || type === 'warning') this.playWarningChime();
      else this.playSoftChime();
    }

    // Trigger Native Browser Web Push if permitted
    if (this.hasPushPermission) {
      try {
        new Notification(title, {
          body: body,
          icon: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=128&auto=format&fit=crop&q=80',
          badge: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=72&auto=format&fit=crop&q=80',
          tag: notif.id
        });
      } catch (e) {
        console.warn('Push notification error:', e);
      }
    }

    // Render in Open Dropdown if currently visible
    this.renderNotificationList();
  }

  /**
   * Request native browser push notification permission
   */
  async requestPushPermission() {
    if (!('Notification' in window)) {
      window.app?.showToast('Push Notifications are not supported in this browser', 'warning');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.hasPushPermission = true;
        this.notify({
          title: 'Push Notifications Enabled 🔔',
          body: 'You will receive instant alerts for low stock, sales, and cloud sync.',
          type: 'info',
          icon: 'bell-ring'
        });
        window.app?.showToast('Push Notifications Enabled!', 'success');
        return true;
      } else {
        window.app?.showToast('Notification permission denied', 'warning');
        return false;
      }
    } catch (err) {
      console.error('Permission request error:', err);
      return false;
    }
  }

  // --- AUDIO CHIME SYNTHESIZER (Web Audio API) ---
  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  playSaleChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc1.frequency.setValueAtTime(1046.50, now + 0.3); // C6

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain);
      gain.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);
    } catch (e) {}
  }

  playWarningChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(330, now + 0.15);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  }

  playSoftChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  // --- FCM NOTIFICATION PUSHER MODAL ---
  openFcmPusherModal() {
    const modalHtml = `
      <div id="fcm-pusher-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 flex flex-col">
          
          <!-- Header -->
          <div class="bg-slate-900 p-4 text-white flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <i data-lucide="send" class="w-5 h-5 text-indigo-400"></i>
              <h3 class="font-bold text-sm">FCM / Web Push Notification Pusher</h3>
            </div>
            <button id="close-fcm-modal-btn" class="p-1.5 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-5 h-5"></i></button>
          </div>

          <!-- Body -->
          <form id="fcm-pusher-form" class="p-5 space-y-4 text-xs">
            
            <!-- Device Token Box -->
            <div class="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div class="flex items-center justify-between mb-1">
                <span class="font-bold text-slate-700">FCM / Web Push Device Token:</span>
                <button type="button" id="fcm-copy-token-btn" class="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] rounded-md transition-colors">
                  Copy Token
                </button>
              </div>
              <input type="text" readonly value="${this.fcmDeviceToken}" class="w-full bg-white px-2 py-1 border border-slate-300 rounded font-mono text-[10px] text-slate-600 focus:outline-none select-all">
            </div>

            <!-- Title -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Notification Title *</label>
              <input type="text" id="fcm-push-title" required value="🔔 Counter Notice: New Sale Completed" placeholder="e.g. Low Stock Alert" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
            </div>

            <!-- Body Message -->
            <div>
              <label class="block font-bold text-slate-700 mb-1">Notification Message / Body *</label>
              <textarea id="fcm-push-body" rows="2" required placeholder="Type the push notification text here..." class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">Bill #INV-1005 for ₹1,250 has been recorded successfully.</textarea>
            </div>

            <!-- Type & Sound Trigger -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block font-bold text-slate-700 mb-1">Notification Type & Sound</label>
                <select id="fcm-push-type" class="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium focus:ring-2 focus:ring-indigo-500">
                  <option value="sale">💰 Sale (Cash Chime)</option>
                  <option value="stock">⚠️ Low Stock Alert (Warning)</option>
                  <option value="sync">☁️ Cloud Sync (Bell)</option>
                  <option value="info">ℹ️ General Notice</option>
                </select>
              </div>
              <div>
                <label class="block font-bold text-slate-700 mb-1">Browser Push Status</label>
                <div class="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl font-semibold flex items-center justify-between text-[11px]">
                  <span>${this.hasPushPermission ? '✅ Push Enabled' : '⚠️ Push Not Allowed'}</span>
                  ${!this.hasPushPermission ? `<button type="button" id="fcm-modal-enable-push" class="text-indigo-600 font-bold hover:underline">Enable</button>` : ''}
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="pt-3 border-t border-slate-200 flex justify-end space-x-2">
              <button type="button" id="fcm-cancel-btn" class="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs">
                Cancel
              </button>
              <button type="submit" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5">
                <i data-lucide="send" class="w-3.5 h-3.5"></i>
                <span>Push Notification Now</span>
              </button>
            </div>

          </form>

        </div>
      </div>
    `;

    document.getElementById('fcm-pusher-modal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (window.lucide) window.lucide.createIcons();

    const modal = document.getElementById('fcm-pusher-modal');
    document.getElementById('close-fcm-modal-btn')?.addEventListener('click', () => modal.remove());
    document.getElementById('fcm-cancel-btn')?.addEventListener('click', () => modal.remove());

    document.getElementById('fcm-copy-token-btn')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.fcmDeviceToken);
      window.app?.showToast('FCM Token copied to clipboard!', 'success');
    });

    document.getElementById('fcm-modal-enable-push')?.addEventListener('click', async () => {
      await this.requestPushPermission();
      modal.remove();
      this.openFcmPusherModal();
    });

    const form = document.getElementById('fcm-pusher-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('fcm-push-title').value.trim();
      const body = document.getElementById('fcm-push-body').value.trim();
      const type = document.getElementById('fcm-push-type').value;

      this.notify({
        title: title,
        body: body,
        type: type,
        sound: true
      });

      window.app?.showToast('Push Notification dispatched!', 'success');
      modal.remove();
    });
  }

  // --- NOTIFICATION CENTER MODAL / DROPDOWN ---
  toggleNotificationDropdown() {
    let panel = document.getElementById('notification-dropdown-panel');
    if (panel) {
      panel.remove();
      return;
    }

    const panelHtml = `
      <div id="notification-dropdown-panel" class="fixed inset-0 z-50 md:inset-auto md:absolute md:top-14 md:right-4 w-full md:w-96 max-h-[85vh] bg-white md:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
        
        <!-- Top Bar -->
        <div class="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i data-lucide="bell" class="w-4 h-4 text-indigo-400"></i>
            <h3 class="font-bold text-sm">Notifications</h3>
            <span class="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full">${this.getUnreadCount()} new</span>
          </div>
          <div class="flex items-center space-x-2">
            <button id="notif-open-fcm-btn" class="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 font-bold text-[10px] rounded-lg border border-slate-700 flex items-center gap-1">
              <i data-lucide="send" class="w-3 h-3"></i> FCM Pusher
            </button>
            <button id="notif-mark-read-btn" class="text-[11px] text-slate-300 hover:text-white font-medium">Mark Read</button>
            <button id="notif-close-panel-btn" class="p-1 text-slate-400 hover:text-white rounded-lg"><i data-lucide="x" class="w-4 h-4"></i></button>
          </div>
        </div>

        <!-- Push Permission Banner if not enabled -->
        ${!this.hasPushPermission ? `
          <div class="p-3 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between text-xs">
            <div class="text-indigo-900 font-medium">Enable Browser Push Alerts</div>
            <button id="notif-enable-push-btn" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px]">Enable</button>
          </div>
        ` : ''}

        <!-- Notifications List -->
        <div class="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50" id="notification-items-container">
          <!-- Populated dynamically -->
        </div>

        <!-- Footer -->
        <div class="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <button id="notif-clear-all-btn" class="text-slate-500 hover:text-rose-600 font-semibold">Clear All</button>
          <button id="notif-open-fcm-footer-btn" class="text-indigo-600 font-bold hover:underline flex items-center gap-1 text-[11px]">
            <i data-lucide="send" class="w-3 h-3"></i> Test FCM Push
          </button>
        </div>

      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHtml);
    if (window.lucide) window.lucide.createIcons();

    this.renderNotificationList();

    const dropdown = document.getElementById('notification-dropdown-panel');
    document.getElementById('notif-close-panel-btn')?.addEventListener('click', () => dropdown.remove());

    document.getElementById('notif-open-fcm-btn')?.addEventListener('click', () => {
      dropdown.remove();
      this.openFcmPusherModal();
    });

    document.getElementById('notif-open-fcm-footer-btn')?.addEventListener('click', () => {
      dropdown.remove();
      this.openFcmPusherModal();
    });

    document.getElementById('notif-enable-push-btn')?.addEventListener('click', async () => {
      await this.requestPushPermission();
      this.toggleNotificationDropdown();
      this.toggleNotificationDropdown();
    });

    document.getElementById('notif-mark-read-btn')?.addEventListener('click', () => {
      this.notifications.forEach(n => n.read = true);
      this.saveNotifications();
      this.renderNotificationList();
    });

    document.getElementById('notif-clear-all-btn')?.addEventListener('click', () => {
      this.notifications = [];
      this.saveNotifications();
      this.renderNotificationList();
    });
  }

  renderNotificationList() {
    const container = document.getElementById('notification-items-container');
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div class="py-12 text-center text-slate-400">
          <i data-lucide="bell-off" class="w-8 h-8 mx-auto mb-2 opacity-30"></i>
          <p class="font-medium text-xs">No notifications yet</p>
          <p class="text-[10px] text-slate-400 mt-0.5">Sale, low stock, and cloud sync alerts will appear here</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    let itemsHtml = '';
    this.notifications.forEach(n => {
      const typeIcons = {
        sale: { icon: 'indian-rupee', color: 'bg-emerald-100 text-emerald-700' },
        stock: { icon: 'alert-triangle', color: 'bg-amber-100 text-amber-700' },
        sync: { icon: 'refresh-cw', color: 'bg-indigo-100 text-indigo-700' },
        warning: { icon: 'alert-circle', color: 'bg-rose-100 text-rose-700' },
        info: { icon: 'bell', color: 'bg-slate-100 text-slate-700' }
      }[n.type] || { icon: 'bell', color: 'bg-slate-100 text-slate-700' };

      const timeAgo = this.formatTimeAgo(n.timestamp);

      itemsHtml += `
        <div class="p-3 rounded-xl border transition-all ${n.read ? 'bg-white border-slate-200' : 'bg-indigo-50/70 border-indigo-200 shadow-xs'} flex items-start gap-3">
          <div class="p-2 rounded-lg flex-shrink-0 ${typeIcons.color}">
            <i data-lucide="${typeIcons.icon}" class="w-4 h-4"></i>
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-xs text-slate-900 leading-snug">${n.title}</h4>
              <span class="text-[9px] text-slate-400 whitespace-nowrap ml-1">${timeAgo}</span>
            </div>
            <p class="text-[11px] text-slate-600 mt-0.5 leading-snug">${n.body}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = itemsHtml;
    if (window.lucide) window.lucide.createIcons();
  }

  formatTimeAgo(isoStr) {
    if (!isoStr) return '';
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  checkInitialStockAlerts() {
    setTimeout(() => {
      const products = window.db.getProducts();
      const lowList = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
      const outList = products.filter(p => p.currentStock <= 0);

      if (outList.length > 0) {
        this.notify({
          title: 'Out of Stock Alert',
          body: `${outList.length} items are out of stock. Please inward stock.`,
          type: 'warning',
          icon: 'alert-circle',
          sound: false
        });
      }

      if (lowList.length > 0) {
        this.notify({
          title: 'Low Stock Warning',
          body: `${lowList.length} items have fallen below minimum threshold.`,
          type: 'stock',
          icon: 'alert-triangle',
          sound: false
        });
      }
    }, 1500);
  }

  bindEvents() {
    // Notification bell trigger in header
    document.querySelectorAll('.header-notif-bell-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNotificationDropdown();
      });
    });

    // FCM Pusher buttons in Settings
    document.querySelectorAll('.open-fcm-pusher-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openFcmPusherModal();
      });
    });
  }
}

window.notifications = new NotificationManager();
