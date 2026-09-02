/**
 * QuickMart POS - Supabase Cloud & Google Authentication Integration
 * Handles Google OAuth, Supabase session state, and bidirectional mobile local storage synchronization.
 */

class SupabaseSyncManager {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.currentUser = null;
  }

  async init() {
    const settings = window.db.getSettings();
    const url = settings.supabaseUrl || 'https://pilfsqplgeljxhgcmujq.supabase.co';
    const key = settings.supabaseKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpbGZzcXBsZ2VsanhoZ2NtdWpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNzQ5MTMsImV4cCI6MjEwMzg1MDkxM30.CiFSFJS5vTb3jA_Payyf5m1CCJbbHig1ig8-6TtwxLg';

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

        // Check active session
        const { data: { session } } = await this.client.auth.getSession();
        if (session && session.user) {
          this.currentUser = session.user;
          this.onUserAuthenticated(session.user);
        }

        // Listen for Auth changes (e.g. after Google OAuth redirect)
        this.client.auth.onAuthStateChange(async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user) {
            this.currentUser = session.user;
            this.onUserAuthenticated(session.user);
            window.app?.showToast(`Signed in as ${session.user.user_metadata?.full_name || session.user.email}`, 'success');
            // Fetch cloud data if available
            await this.pullCloudData();
          } else if (event === 'SIGNED_OUT') {
            this.currentUser = null;
            this.onUserSignedOut();
          }
        });

      } catch (e) {
        console.warn('Supabase initialization notice:', e);
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
        window.app?.showToast('Note: Google OAuth requires running via local server (http://localhost:8080) rather than file://', 'warning');
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
    }
  }

  onUserAuthenticated(user) {
    // Update UI profile in sidebar & header
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

    // Toggle login/logout buttons
    document.querySelectorAll('.auth-logged-in-box').forEach(b => b.classList.remove('hidden'));
    document.querySelectorAll('.auth-logged-out-box').forEach(b => b.classList.add('hidden'));

    // Dismiss login modal if open
    document.getElementById('google-auth-modal')?.remove();
  }

  onUserSignedOut() {
    document.querySelectorAll('.auth-user-name').forEach(el => el.textContent = 'Guest Counter');
    document.querySelectorAll('.auth-user-email').forEach(el => el.textContent = 'Mobile Offline Mode');
    document.querySelectorAll('.auth-user-avatar').forEach(el => {
      el.innerHTML = `<span class="font-bold text-xs">GC</span>`;
    });

    document.querySelectorAll('.auth-logged-in-box').forEach(b => b.classList.add('hidden'));
    document.querySelectorAll('.auth-logged-out-box').forEach(b => b.classList.remove('hidden'));
  }

  /**
   * Push single entity update to Supabase cloud
   */
  async pushEntity(tableName, record) {
    if (!this.client || !this.isConnected) return;

    try {
      // Map JS camelCase to SQL snake_case where appropriate
      let payload = { ...record };
      if (tableName === 'products') {
        payload = {
          barcode: record.barcode || null,
          sku: record.sku || null,
          name: record.name,
          short_name: record.shortName || record.name,
          selling_price: record.sellingPrice,
          purchase_price: record.purchasePrice || 0,
          mrp: record.mrp || record.sellingPrice,
          current_stock: record.currentStock || 0,
          min_stock: record.minStock || 5,
          unit: record.unit || 'Pcs',
          brand: record.brand || null,
          photo_url: record.photoUrl || null
        };
      } else if (tableName === 'sales') {
        payload = {
          invoice_number: record.invoiceNumber,
          customer_name: record.customerName,
          customer_phone: record.customerPhone,
          subtotal: record.subtotal,
          discount_amount: record.discountAmount,
          tax_amount: record.taxAmount,
          grand_total: record.grandTotal,
          purchase_cost_total: record.purchaseCostTotal || 0,
          gross_profit: record.grossProfit || 0,
          payment_method: record.paymentMethod,
          payment_status: record.paymentStatus || 'PAID',
          cash_received: record.cashReceived || 0,
          change_returned: record.changeReturned || 0,
          upi_transaction_id: record.upiTransactionId || null
        };
      } else if (tableName === 'customers') {
        payload = {
          name: record.name,
          phone: record.phone || null,
          email: record.email || null,
          address: record.address || null,
          total_spent: record.totalSpent || 0,
          total_orders: record.totalOrders || 0
        };
      } else if (tableName === 'expenses') {
        payload = {
          category: record.category,
          amount: record.amount,
          date: record.date,
          description: record.description || null,
          payment_method: record.paymentMethod || 'CASH'
        };
      }

      await this.client.from(tableName).upsert(payload);
    } catch (e) {
      // Non-blocking background sync
      console.warn(`Supabase sync background note for ${tableName}:`, e.message);
    }
  }

  /**
   * Pulls products and categories from Supabase into mobile localStorage
   */
  async pullCloudData() {
    if (!this.client) return;

    try {
      const { data: cloudProducts, error } = await this.client.from('products').select('*');
      if (!error && cloudProducts && cloudProducts.length > 0) {
        // Merge cloud products to local storage
        const localProds = window.db.getProducts();
        cloudProducts.forEach(cp => {
          const mapped = {
            id: cp.id || 'prod-' + cp.barcode,
            barcode: cp.barcode,
            sku: cp.sku,
            name: cp.name,
            shortName: cp.short_name || cp.name,
            categoryId: cp.category_id || 'cat-1',
            brand: cp.brand || '',
            unit: cp.unit || 'Pcs',
            purchasePrice: parseFloat(cp.purchase_price) || 0,
            sellingPrice: parseFloat(cp.selling_price) || 0,
            mrp: parseFloat(cp.mrp) || 0,
            taxPercent: parseFloat(cp.tax_percent) || 0,
            currentStock: parseFloat(cp.current_stock) || 0,
            minStock: parseFloat(cp.min_stock) || 5,
            photoUrl: cp.photo_url || ''
          };

          const existIdx = localProds.findIndex(p => p.barcode === mapped.barcode || p.id === mapped.id);
          if (existIdx !== -1) {
            localProds[existIdx] = { ...localProds[existIdx], ...mapped };
          } else {
            localProds.push(mapped);
          }
        });

        localStorage.setItem(DB_KEYS.PRODUCTS, JSON.stringify(localProds));
        window.pos?.renderPosView();
        window.products?.renderProductsTable();
        window.app?.showToast(`Synced ${cloudProducts.length} items from Supabase Cloud!`, 'success');
      }
    } catch (e) {
      console.warn('Cloud pull note:', e);
    }
  }

  async testConnection() {
    const settings = window.db.getSettings();
    const url = settings.supabaseUrl;
    const key = settings.supabaseKey;

    if (!url || !key) {
      window.app?.showToast('Please enter Supabase URL and Key', 'warning');
      return false;
    }

    try {
      const client = window.supabase.createClient(url, key);
      const { error } = await client.from('categories').select('count', { count: 'exact', head: true });

      if (error && error.code !== 'PGRST116') {
        window.app?.showToast(`Connection note: ${error.message}`, 'warning');
      } else {
        window.app?.showToast('Connected to Supabase PostgreSQL cloud!', 'success');
      }
      this.client = client;
      this.isConnected = true;
      return true;
    } catch (err) {
      window.app?.showToast(`Connection failed: ${err.message}`, 'error');
      return false;
    }
  }

  bindEvents() {
    // Google Sign-in trigger buttons
    document.querySelectorAll('.google-signin-btn').forEach(btn => {
      btn.addEventListener('click', () => this.signInWithGoogle());
    });

    // Sign out trigger buttons
    document.querySelectorAll('.auth-signout-btn').forEach(btn => {
      btn.addEventListener('click', () => this.signOut());
    });

    // Test connection button in settings
    document.getElementById('settings-test-supabase-btn')?.addEventListener('click', () => {
      this.testConnection();
    });

    // Sync button in settings
    document.getElementById('settings-push-supabase-btn')?.addEventListener('click', () => {
      this.pullCloudData();
    });
  }
}

window.supabaseSync = new SupabaseSyncManager();
