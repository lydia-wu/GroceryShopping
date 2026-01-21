/**
 * @file sync-manager.js
 * @description Manages offline sync between local IndexedDB/localStorage and Supabase.
 *              Implements queue-based sync with conflict resolution.
 *
 * @requires ./supabase-client.js
 * @requires ./state-manager.js
 * @requires ./event-bus.js
 * @exports SyncManager, syncManager
 *
 * DATA FLOW:
 * User Action → Local Save (Instant) → Add to Queue → Online Check → Supabase Sync
 */

import { getSupabaseClient, isSupabaseConfigured, executeWithRetry } from './supabase-client.js';
import { getState, setState, subscribe } from './state-manager.js';
import { emit, EVENTS } from './event-bus.js';

// IndexedDB database name and store names
const DB_NAME = 'best_meal_plan_db';
const DB_VERSION = 1;
const STORES = {
    meals: 'meals',
    cookingLog: 'cooking_log',
    shoppingTrips: 'shopping_trips',
    ingredientPrices: 'ingredient_prices',
    staplesLog: 'staples_log',
    syncQueue: 'sync_queue'
};

/**
 * Sync Manager Class
 * Handles offline-first data persistence and cloud sync
 */
class SyncManager {
    constructor() {
        this.db = null;
        this.syncQueue = [];
        this.isSyncing = false;
        this.syncInterval = null;
        this.retryTimeout = null;
        this.initialized = false;
    }

    /**
     * Initialize the sync manager
     * @returns {Promise<boolean>} Success status
     */
    async init() {
        if (this.initialized) return true;

        try {
            // Initialize IndexedDB
            await this.initIndexedDB();

            // Load sync queue from IndexedDB
            await this.loadSyncQueue();

            // Listen for online/offline events
            window.addEventListener('online', () => this.handleOnlineStatusChange(true));
            window.addEventListener('offline', () => this.handleOnlineStatusChange(false));

            // Start periodic sync check
            this.startSyncInterval();

            // Subscribe to state changes that need syncing
            this.subscribeToStateChanges();

            this.initialized = true;
            console.info('SyncManager initialized');

            // Attempt initial sync if online
            if (navigator.onLine && isSupabaseConfigured()) {
                this.sync();
            }

            return true;

        } catch (error) {
            console.error('SyncManager initialization failed:', error);
            return false;
        }
    }

    /**
     * Initialize IndexedDB
     * @returns {Promise<IDBDatabase>}
     */
    initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('IndexedDB open failed:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, {
                            keyPath: 'id',
                            autoIncrement: storeName === 'syncQueue'
                        });

                        // Add indexes based on store
                        if (storeName === 'meals') {
                            store.createIndex('code', 'code', { unique: true });
                        } else if (storeName === 'cooking_log') {
                            store.createIndex('meal_id', 'meal_id', { unique: false });
                            store.createIndex('date_cooked', 'date_cooked', { unique: false });
                        } else if (storeName === 'sync_queue') {
                            store.createIndex('table', 'table', { unique: false });
                            store.createIndex('timestamp', 'timestamp', { unique: false });
                        }
                    }
                });
            };
        });
    }

    /**
     * Load sync queue from IndexedDB
     */
    async loadSyncQueue() {
        try {
            const queue = await this.getAllFromStore(STORES.syncQueue);
            this.syncQueue = queue.sort((a, b) => a.timestamp - b.timestamp);
            setState({ sync: { ...getState('sync'), pendingChanges: this.syncQueue.length } });
        } catch (error) {
            console.warn('Failed to load sync queue:', error);
            this.syncQueue = [];
        }
    }

    /**
     * Add item to sync queue
     * @param {string} table - Table name
     * @param {string} action - Action type: 'insert', 'update', 'delete'
     * @param {Object} data - Data to sync
     */
    async queueSync(table, action, data) {
        const queueItem = {
            table,
            action,
            data,
            timestamp: Date.now(),
            retries: 0
        };

        this.syncQueue.push(queueItem);
        await this.saveToStore(STORES.syncQueue, queueItem);

        setState({ sync: { ...getState('sync'), pendingChanges: this.syncQueue.length } });

        // Attempt immediate sync if online
        if (navigator.onLine && isSupabaseConfigured() && !this.isSyncing) {
            this.sync();
        }
    }

    /**
     * Process sync queue
     */
    async sync() {
        if (this.isSyncing || !navigator.onLine || !isSupabaseConfigured()) {
            return;
        }

        if (this.syncQueue.length === 0) {
            return;
        }

        this.isSyncing = true;
        emit(EVENTS.SYNC_STARTED, { pendingCount: this.syncQueue.length });

        const supabase = getSupabaseClient();
        if (!supabase) {
            this.isSyncing = false;
            return;
        }

        const processedIds = [];
        const failedItems = [];

        for (const item of this.syncQueue) {
            try {
                let result;

                switch (item.action) {
                    case 'insert':
                        result = await executeWithRetry(() =>
                            supabase.from(item.table).insert(item.data).select()
                        );
                        break;

                    case 'update':
                        result = await executeWithRetry(() =>
                            supabase.from(item.table).upsert(item.data).select()
                        );
                        break;

                    case 'delete':
                        result = await executeWithRetry(() =>
                            supabase.from(item.table).delete().eq('id', item.data.id)
                        );
                        break;
                }

                if (result.error) {
                    throw result.error;
                }

                processedIds.push(item.id);

            } catch (error) {
                console.error(`Sync failed for ${item.table}:`, error);
                item.retries++;

                if (item.retries < 3) {
                    failedItems.push(item);
                } else {
                    console.error(`Giving up on sync item after 3 retries:`, item);
                    processedIds.push(item.id); // Remove from queue anyway
                }
            }
        }

        // Remove processed items from queue
        this.syncQueue = this.syncQueue.filter(item =>
            !processedIds.includes(item.id)
        );

        // Clear processed items from IndexedDB
        for (const id of processedIds) {
            await this.deleteFromStore(STORES.syncQueue, id);
        }

        // Update failed items in IndexedDB
        for (const item of failedItems) {
            await this.saveToStore(STORES.syncQueue, item);
        }

        this.isSyncing = false;

        setState({
            sync: {
                ...getState('sync'),
                lastSyncTime: Date.now(),
                pendingChanges: this.syncQueue.length
            }
        });

        emit(EVENTS.SYNC_COMPLETED, {
            synced: processedIds.length,
            failed: failedItems.length,
            pending: this.syncQueue.length
        });
    }

    /**
     * Handle online status change
     * @param {boolean} isOnline - Online status
     */
    handleOnlineStatusChange(isOnline) {
        setState({ sync: { ...getState('sync'), isOnline } });
        emit(EVENTS.ONLINE_STATUS_CHANGED, { isOnline });

        if (isOnline) {
            // Attempt sync when coming online
            this.sync();
        }
    }

    /**
     * Start periodic sync interval
     */
    startSyncInterval() {
        // Check every 30 seconds
        this.syncInterval = setInterval(() => {
            if (navigator.onLine && isSupabaseConfigured() && this.syncQueue.length > 0) {
                this.sync();
            }
        }, 30000);

        // Also sync on window focus
        window.addEventListener('focus', () => {
            if (navigator.onLine && isSupabaseConfigured() && this.syncQueue.length > 0) {
                this.sync();
            }
        });
    }

    /**
     * Stop sync interval
     */
    stopSyncInterval() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    /**
     * Subscribe to state changes that need syncing
     */
    subscribeToStateChanges() {
        // We'll handle specific sync triggers in service modules
        // This is a placeholder for future expansion
    }

    // ==================
    // INDEXEDDB HELPERS
    // ==================

    /**
     * Save item to IndexedDB store
     * @param {string} storeName - Store name
     * @param {Object} data - Data to save
     */
    async saveToStore(storeName, data) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get item from IndexedDB store
     * @param {string} storeName - Store name
     * @param {*} key - Item key
     */
    async getFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Get all items from IndexedDB store
     * @param {string} storeName - Store name
     */
    async getAllFromStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Delete item from IndexedDB store
     * @param {string} storeName - Store name
     * @param {*} key - Item key
     */
    async deleteFromStore(storeName, key) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Clear all items from IndexedDB store
     * @param {string} storeName - Store name
     */
    async clearStore(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                reject(new Error('IndexedDB not initialized'));
                return;
            }

            const transaction = this.db.transaction(storeName, 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ==================
    // FETCH FROM CLOUD
    // ==================

    /**
     * Fetch all data from Supabase and merge with local
     */
    async fetchFromCloud() {
        if (!isSupabaseConfigured()) return;

        const supabase = getSupabaseClient();
        if (!supabase) return;

        try {
            emit(EVENTS.SYNC_STARTED, { type: 'fetch' });

            // Fetch meals
            const { data: meals, error: mealsError } = await supabase
                .from('meals')
                .select('*');

            if (!mealsError && meals) {
                // Merge with local data (cloud wins for conflicts)
                for (const meal of meals) {
                    await this.saveToStore(STORES.meals, meal);
                }
            }

            // Fetch cooking log
            const { data: cookingLog, error: logError } = await supabase
                .from('cooking_log')
                .select('*')
                .order('date_cooked', { ascending: false });

            if (!logError && cookingLog) {
                for (const log of cookingLog) {
                    await this.saveToStore(STORES.cookingLog, log);
                }
            }

            emit(EVENTS.SYNC_COMPLETED, { type: 'fetch' });
            emit(EVENTS.DATA_LOADED, { source: 'cloud' });

        } catch (error) {
            console.error('Fetch from cloud failed:', error);
            emit(EVENTS.SYNC_FAILED, { error: error.message, type: 'fetch' });
        }
    }

    /**
     * Force sync - push all local data to cloud
     */
    async forcePush() {
        if (!isSupabaseConfigured()) return;

        // Re-queue all local data
        const meals = await this.getAllFromStore(STORES.meals);
        for (const meal of meals) {
            await this.queueSync('meals', 'update', meal);
        }

        const cookingLog = await this.getAllFromStore(STORES.cookingLog);
        for (const log of cookingLog) {
            await this.queueSync('cooking_log', 'update', log);
        }

        // Trigger sync
        await this.sync();
    }
}

// Create singleton instance
const syncManager = new SyncManager();

// Export
export { SyncManager, syncManager, STORES };
export default syncManager;
