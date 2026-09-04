/**
 * QuickMart POS - Notification Center & Firebase / Web Push Notification System
 * Handles in-app notification center, audio chimes, low-stock alerts, sale notifications, and Web Push.
 */

const NOTIF_STORAGE_KEY = 'pos_notifications';

class NotificationManager {
  constructor() {
    this.notifications = this.loadNotifications();
    this.hasPushPermission = ('Notification' in window) && Notification.permission === 'granted';
    this.isMuted = localStorage.getItem('pos_sound_muted') === 'true';
    this.audioCtx = null;
  }

  init() {
    this.updateBadge();
    this.bindEvents();
    this.checkInitialStockAlerts();
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
      // Limit to 100 recent notifications
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
    if (this.hasPushPermission && document.visibilityState !== 'visible') {
      try {
        new Notification(title, {
          body: body,
          icon: '/assets/icons/icon-192.png',
          badge: '/assets/icons/badge-72.png',
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
          title: 'Push Notifications Enabled',
          body: 'You will receive instant alerts for low stock and counter sales.',
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
      // High pleasant two-tone cash register chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
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
          <div class="text-[10px] text-slate-400">FCM & In-App Alerts</div>
        </div>

      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', panelHtml);
    if (window.lucide) window.lucide.createIcons();

    this.renderNotificationList();

    const dropdown = document.getElementById('notification-dropdown-panel');
    document.getElementById('notif-close-panel-btn')?.addEventListener('click', () => dropdown.remove());

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
          <p class="text-[10px] text-slate-400 mt-0.5">Sale and stock alerts will appear here</p>
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
        sync: { icon: 'cloud-check', color: 'bg-indigo-100 text-indigo-700' },
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
          body: `${outList.length} items are currently out of stock. Please inward stock.`,
          type: 'warning',
          icon: 'alert-circle',
          sound: false
        });
      }

      if (lowList.length > 0) {
        this.notify({
          title: 'Low Stock Warning',
          body: `${lowList.length} items have fallen below their minimum threshold.`,
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
  }
}

window.notifications = new NotificationManager();
