/**
 * @file supabase-client.js
 * @description Supabase client initialization and configuration for cross-device sync.
 *              Provides database, real-time subscriptions, and storage access.
 *
 * @requires Supabase JS SDK (loaded from CDN)
 * @exports supabase, initSupabase, isSupabaseConfigured, getSupabaseStatus
 *
 * DATA FLOW:
 * Config → Initialize Client → Connect to Project → Real-time Subscriptions
 */

// Supabase configuration - set these up in Supabase dashboard
const SUPABASE_CONFIG = {
    // These will need to be set when user configures their Supabase project
    // For now, we use placeholders that indicate demo/offline mode
    url: localStorage.getItem('supabase_url') || '',
    anonKey: localStorage.getItem('supabase_anon_key') || '',
    // Storage bucket for meal photos
    storageBucket: 'meal-photos'
};

// Supabase client instance
let supabase = null;
let isConfigured = false;
let connectionStatus = 'disconnected';

/**
 * Initialize the Supabase client
 * @returns {Object|null} Supabase client instance or null if not configured
 */
export async function initSupabase() {
    // Check if Supabase SDK is loaded
    if (typeof window.supabase === 'undefined' && typeof createClient === 'undefined') {
        console.warn('Supabase SDK not loaded. Running in offline mode.');
        connectionStatus = 'offline';
        return null;
    }

    // Check if configuration is provided
    if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
        console.info('Supabase not configured. Running in local-only mode.');
        console.info('To enable cloud sync, set your Supabase URL and anon key in Settings.');
        connectionStatus = 'not_configured';
        isConfigured = false;
        return null;
    }

    try {
        // Create client using the SDK
        const createClientFn = window.supabase?.createClient || window.createClient;
        supabase = createClientFn(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            },
            realtime: {
                params: {
                    eventsPerSecond: 10
                }
            }
        });

        // Test connection
        const { data, error } = await supabase.from('meals').select('count', { count: 'exact', head: true });

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
            throw error;
        }

        connectionStatus = 'connected';
        isConfigured = true;
        console.info('Supabase connected successfully');

        // Dispatch event for other modules
        window.dispatchEvent(new CustomEvent('supabase:connected', {
            detail: { status: 'connected' }
        }));

        return supabase;

    } catch (error) {
        console.error('Supabase connection failed:', error);
        connectionStatus = 'error';
        isConfigured = false;

        window.dispatchEvent(new CustomEvent('supabase:error', {
            detail: { error: error.message }
        }));

        return null;
    }
}

/**
 * Configure Supabase with user-provided credentials
 * @param {string} url - Supabase project URL
 * @param {string} anonKey - Supabase anon/public key
 * @returns {Promise<boolean>} Success status
 */
export async function configureSupabase(url, anonKey) {
    // Validate URL format
    if (!url || !url.includes('supabase')) {
        throw new Error('Invalid Supabase URL');
    }

    // Validate key format (should be a JWT-like string)
    if (!anonKey || anonKey.length < 100) {
        throw new Error('Invalid Supabase anon key');
    }

    // Store credentials
    localStorage.setItem('supabase_url', url);
    localStorage.setItem('supabase_anon_key', anonKey);

    // Update config
    SUPABASE_CONFIG.url = url;
    SUPABASE_CONFIG.anonKey = anonKey;

    // Re-initialize
    return await initSupabase();
}

/**
 * Check if Supabase is configured and connected
 * @returns {boolean} Configuration status
 */
export function isSupabaseConfigured() {
    return isConfigured;
}

/**
 * Get current connection status
 * @returns {string} Status: 'connected', 'disconnected', 'offline', 'not_configured', 'error'
 */
export function getSupabaseStatus() {
    return connectionStatus;
}

/**
 * Get the Supabase client instance
 * @returns {Object|null} Supabase client or null
 */
export function getSupabaseClient() {
    return supabase;
}

/**
 * Clear Supabase configuration and disconnect
 */
export function clearSupabaseConfig() {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    SUPABASE_CONFIG.url = '';
    SUPABASE_CONFIG.anonKey = '';
    supabase = null;
    isConfigured = false;
    connectionStatus = 'not_configured';
}

// ==================
// REAL-TIME SUBSCRIPTIONS
// ==================

const subscriptions = new Map();

/**
 * Subscribe to real-time changes on a table
 * @param {string} table - Table name
 * @param {Function} callback - Callback for changes
 * @param {Object} options - Subscription options
 * @returns {Object|null} Subscription handle
 */
export function subscribeToTable(table, callback, options = {}) {
    if (!supabase) {
        console.warn(`Cannot subscribe to ${table}: Supabase not connected`);
        return null;
    }

    const channel = supabase.channel(`${table}-changes`)
        .on(
            'postgres_changes',
            {
                event: options.event || '*',
                schema: 'public',
                table: table,
                filter: options.filter || undefined
            },
            (payload) => {
                callback({
                    type: payload.eventType,
                    new: payload.new,
                    old: payload.old,
                    table: table
                });
            }
        )
        .subscribe();

    subscriptions.set(table, channel);
    return channel;
}

/**
 * Unsubscribe from a table
 * @param {string} table - Table name
 */
export function unsubscribeFromTable(table) {
    const channel = subscriptions.get(table);
    if (channel && supabase) {
        supabase.removeChannel(channel);
        subscriptions.delete(table);
    }
}

/**
 * Unsubscribe from all tables
 */
export function unsubscribeAll() {
    subscriptions.forEach((channel, table) => {
        unsubscribeFromTable(table);
    });
}

// ==================
// STORAGE HELPERS
// ==================

/**
 * Upload a file to Supabase storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'meals/meal-a.jpg')
 * @returns {Promise<string|null>} Public URL or null
 */
export async function uploadFile(file, path) {
    if (!supabase) {
        console.warn('Cannot upload file: Supabase not connected');
        return null;
    }

    try {
        const { data, error } = await supabase.storage
            .from(SUPABASE_CONFIG.storageBucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(SUPABASE_CONFIG.storageBucket)
            .getPublicUrl(path);

        return urlData?.publicUrl || null;

    } catch (error) {
        console.error('File upload failed:', error);
        return null;
    }
}

/**
 * Delete a file from Supabase storage
 * @param {string} path - Storage path
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFile(path) {
    if (!supabase) return false;

    try {
        const { error } = await supabase.storage
            .from(SUPABASE_CONFIG.storageBucket)
            .remove([path]);

        return !error;
    } catch (error) {
        console.error('File deletion failed:', error);
        return false;
    }
}

// ==================
// DATABASE HELPERS
// ==================

/**
 * Execute a query with automatic retry on network error
 * @param {Function} queryFn - Function that returns a Supabase query promise
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<Object>} Query result
 */
export async function executeWithRetry(queryFn, maxRetries = 3) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await queryFn();

            if (result.error) {
                // Check if it's a network error
                if (result.error.message?.includes('network') ||
                    result.error.message?.includes('fetch')) {
                    lastError = result.error;
                    await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
                    continue;
                }
                return result;
            }

            return result;
        } catch (error) {
            lastError = error;
            if (attempt < maxRetries) {
                await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
            }
        }
    }

    return { data: null, error: lastError };
}

// Export configured client (may be null if not configured)
export { supabase };

// Export default object for convenient imports
export default {
    initSupabase,
    configureSupabase,
    isSupabaseConfigured,
    getSupabaseStatus,
    getSupabaseClient,
    clearSupabaseConfig,
    subscribeToTable,
    unsubscribeFromTable,
    unsubscribeAll,
    uploadFile,
    deleteFile,
    executeWithRetry,
    supabase
};
