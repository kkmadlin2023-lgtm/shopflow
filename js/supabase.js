/**
 * QuickMart POS - Supabase Cloud & Google Authentication Integration
 * Provides rock-solid, multi-device cloud synchronization bound to the user's Google Account.
 */

class SupabaseSyncManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.currentUser = null;
    this.isSyncing = false;
    this.realtimeChannel = null;
  }

  async init() {
    const settings = window.db.getSettings();
    const url = settings.supabaseUrl || 'https://eguloiwnffjpxvpfyfmg.supabase.co';
    const key = settings.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVndWxvaXduZmZqcHh2cGZ5Zm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg1MjkwNDIsImV4cCI6MjEwNDEwNTA0Mn0.WT1PpciNUBVaL0McygLRXZXg-MIZIamvRHtd8To0DVE';

    if (window.supabase) {
      try {
        this.client = window.supabase.createClient(url, key, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        });
        this.isConnected = true;

        // Check active session on startup
        const { data: { session } } = await this.client.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          this.onUserAuthenticated(session.user);
          // Initial cloud pull
          await this.pullCloudData();
        }

        // Listen for Auth changes (e.g. after Google OAuth redirect)
        this.client.auth.onAuthStateChange(async (event, session) => {
          if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
            this.currentUser = session.user;
            this.onUserAuthenticated(session.user);
            await this.pullCloudData();
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.onUserSignedOut();
          }
        });

      } catch (e) {
        console.warn('Supabase initialization note:', e);
      }
    }

    this.bindEvents();
  }

  /**
   * Triggers Google OAuth Sign In flow via Supabase
   */
  async signInWithGoogle() {
    if (!this.client) {
      window.app?.showToast('Supabase client not initialized', 'error');
      return;
    }

    try {
      let redirectUrl = window.location.href;
      
      // If opened directly from filesystem (file://), fallback to localhost:8080
      if (!window.location.origin || window.location.origin === 'null' || window.location.protocol === 'file:') {
        redirectUrl = 'http://localhost:8080';
        window.app?.showToast('Note: Google OAuth requires running via server (http://localhost:8080) rather than file://', 'warning');
      } else {
        redirectUrl = window.location.origin + window.location.pathname;
      }

      window.app?.showToast('Redirecting to Google Sign-In...', 'info');
      const { data, error } = await this.client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        window.app?.showToast(`Google Sign-In Error: ${error.message}`, 'error');
      }
    } catch (err) {
      window.app?.showToast(`Authentication failed: ${err.message}`, 'error');
    }
  }

  /**
   * Signs out user from Supabase session
   */
  async signOut() {
    if (this.client) {
      await this.client.auth.signOut();
      this.currentUser = null;
      this.onUserSignedOut();
      window.app?.showToast('Signed out successfully', 'info');
      window.notifications?.notify({
        title: 'Signed Out',
        body: 'Switched to local offline mode.',
        type: 'info'
      });
    }
  }

  onUserAuthenticated(user) {
    const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Store Owner';
    const email = user.email || '';
    const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

    // Update Desktop & Mobile Sidebar User info
    document.querySelectorAll('.auth-user-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.auth-user-email').forEach(el => el.textContent = email);
    document.querySelectorAll('.auth-user-avatar').forEach(el => {
      if (avatar) {
        el.innerHTML = `<img src="${avatar}" class="w-full h-full object-cover rounded-lg" alt="${name}">`;
      } else {
        el.innerHTML = `<span class="font-bold text-xs">${name.substring(0, 2).toUpperCase()}</span>`;
      }
    });

    // Toggle login/logout button display
    document.querySelectorAll('.auth-logged-in-box').forEach(b => b.classList.remove('hidden'));
    document.querySelectorAll('.auth-logged-out-box').forEach(b => b.classList.add('hidden'));

    // Enable realtime listener for multi-device sync
    this.setupRealtimeListener(user.id);
  }

  onUserSignedOut() {
    document.querySelectorAll('.auth-user-name').forEach(el => el.textContent = 'Guest Counter');
    document.querySelectorAll('.auth-user-email').forEach(el => el.textContent = 'Mobile Local Storage Mode');
    document.querySelectorAll('.auth-user-avatar').forEach(el => {
      el.innerHTML = `<span class="font-bold text-xs">GC</span>`;
    });

    document.querySelectorAll('.auth-logged-in-box').forEach(b => b.classList.add('hidden'));
    document.querySelectorAll('.auth-logged-out-box').forEach(b => b.classList.remove('hidden'));

    if (this.realtimeChannel) {
      this.client.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }

  /**
   * Pushes full store data (products, sales, customers, stock, settings) to Supabase cloud
   */
  async pushAllStoreData() {
    if (!this.client || !this.currentUser) return;

    try {
      const storeSnapshot = window.db.exportAllData();
      const userId = this.currentUser.id;
      const userEmail = this.currentUser.email || '';

      const { error } = await this.client.from('user_stores').upsert({
        user_id: userId,
        user_email: userEmail,
        store_data: storeSnapshot,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

      if (error) {
        console.warn('Store sync note:', error.message);
      }
    } catch (err) {
      console.warn('Sync push error:', err);
    }
  }

  /**
   * Hook called whenever a single entity (product, sale, expense) is modified locally
   */
  async pushEntity(tableName, record) {
    // Non-blocking full sync snapshot to user_stores
    this.pushAllStoreData();
  }

  /**
   * Pulls all user data from Supabase cloud into the device's local storage
   */
  async pullCloudData() {
    if (!this.client || !this.currentUser || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const userId = this.currentUser.id;
      const userEmail = this.currentUser.email;

      // 1. Fetch from user_stores snapshot table
      const { data, error } = await this.client
        .from('user_stores')
        .select('*')
        .or(`user_id.eq.${userId},user_email.eq.${userEmail}`)
        .maybeSingle();

      if (!error && data && data.store_data) {
        const cloudData = data.store_data;
        const localData = window.db.exportAllData();

        // If cloud data exists, merge products and sales intelligently
        if (cloudData.products && Array.isArray(cloudData.products)) {
          // Merge products
          const localProducts = localData.products || [];
          const mergedProducts = [...cloudData.products];
          
          localProducts.forEach(lp => {
            const idx = mergedProducts.findIndex(cp => cp.id === lp.id || (cp.barcode && cp.barcode === lp.barcode));
            if (idx === -1) {
              mergedProducts.push(lp);
            }
          });
          localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(mergedProducts));
        }

        if (cloudData.sales && Array.isArray(cloudData.sales)) {
          // Merge sales
          const localSales = localData.sales || [];
          const mergedSales = [...cloudData.sales];
          localSales.forEach(ls => {
            const idx = mergedSales.findIndex(cs => cs.invoiceNumber === ls.invoiceNumber);
            if (idx === -1) {
              mergedSales.push(ls);
            }
          });
          localStorage.setItem(DB_KEYS.SALES, JSON.stringify(mergedSales));
        }

        if (cloudData.customers && Array.isArray(cloudData.customers)) {
          localStorage.setItem(DB_KEYS.CUSTOMERS, JSON.stringify(cloudData.customers));
        }

        if (cloudData.expenses && Array.isArray(cloudData.expenses)) {
          localStorage.setItem(DB_KEYS.EXPENSES, JSON.stringify(cloudData.expenses));
        }

        if (cloudData.stockMovements && Array.isArray(cloudData.stockMovements)) {
          localStorage.setItem(DB_KEYS.STOCK_MOVEMENTS, JSON.stringify(cloudData.stockMovements));
        }

        // Re-render all views
        window.pos?.renderPosView();
        window.products?.renderProductsTable();
        window.stock?.renderStockView();
        window.app?.renderBillsTable();
        window.app?.renderDashboard();

        const prodCount = window.db.getProducts().length;
        const salesCount = window.db.getSales().length;

        window.notifications?.notify({
          title: 'Cloud Synced with Google Account',
          body: `Loaded ${prodCount} products & ${salesCount} bills from your account.`,
          type: 'sync',
          sound: false
        });

        window.app?.showToast(`Synced ${prodCount} items from your Google Account!`, 'success');
      } else {
        // If no cloud data yet, push local device data to cloud for the first time
        await this.pushAllStoreData();
      }
    } catch (e) {
      console.warn('Error pulling cloud data:', e);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Realtime channel listener for cross-device live updates
   */
  setupRealtimeListener(userId) {
    if (!this.client) return;

    try {
      if (this.realtimeChannel) {
        this.client.removeChannel(this.realtimeChannel);
      }

      this.realtimeChannel = this.client
        .channel(`user_stores_${userId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_stores',
          filter: `user_id=eq.${userId}`
        }, (payload) => {
          if (payload.new && payload.new.store_data) {
            // Background reload if updated by another device
            this.pullCloudData();
          }
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime listener note:', e);
    }
  }

  bindEvents() {
    // Google Sign-in buttons
    document.querySelectorAll('.google-signin-btn').forEach(btn => {
      btn.addEventListener('click', () => this.signInWithGoogle());
    });

    // Sign out buttons
    document.querySelectorAll('.auth-signout-btn').forEach(btn => {
      btn.addEventListener('click', () => this.signOut());
    });

    // Cloud Sync Now buttons
    document.querySelectorAll('.cloud-sync-now-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!this.currentUser) {
          window.app?.showToast('Please sign in with Google to sync across devices', 'warning');
          this.signInWithGoogle();
        } else {
          window.app?.showToast('Syncing with Google account...', 'info');
          await this.pullCloudData();
          await this.pushAllStoreData();
        }
      });
    });
  }
}

window.supabaseSync = new SupabaseSyncManager();
