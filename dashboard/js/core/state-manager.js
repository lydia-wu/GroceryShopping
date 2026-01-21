/**
 * @file state-manager.js
 * @description Centralized state management for the dashboard application.
 *              Handles application state, persistence, and state change notifications.
 *
 * @requires None (standalone module)
 * @exports StateManager, appState
 *
 * DATA FLOW:
 * Action → State Update → Persist (optional) → Notify Subscribers → UI Update
 */

// Default state structure
const DEFAULT_STATE = {
    // Version tracking
    version: '2.0.0',

    // User/Household settings
    settings: {
        householdName: 'The Best Household',
        numAdults: 2,
        numChildren: 2,
        servingsPerDay: 2,
        dietaryRestrictions: ['onion', 'mushroom', 'broccoli', 'cow milk'],
        preferredStores: ['Costco', 'H-Mart', 'Safeway', 'Sprouts', 'Walmart', 'Grains from the Plains'],
        weeklyBudget: 200,
        perMealBudget: 25,
        perServingBudget: 5,
        scoreWeights: {
            protein: 10,
            anti_inflammatory: 9,
            vitamins: 8,
            blood_sugar: 7,
            heart_health: 6,
            fiber: 5,
            low_sugar: 4,
            minerals: 3,
            omega3: 2,
            low_sodium: 1
        }
    },

    // UI State
    ui: {
        currentView: 'dashboard',
        editMode: false,
        sidebarOpen: false,
        selectedMealsForRadar: [],
        expandedSections: {
            breakfast: false,
            lunch: false
        },
        lastSeenVersion: null,
        theme: 'warm-harvest'
    },

    // Meal data
    meals: {},
    rotationOrder: [],
    archivedMeals: {},

    // Cooking history
    cookingLog: [],

    // Shopping data
    shoppingTrips: [],
    ingredientPrices: {},

    // Staples data
    staplesLog: [],

    // Simple meals (breakfast/lunch)
    simpleMeals: {
        breakfast: [],
        lunch: []
    },

    // Tags
    tags: [],

    // Sync status
    sync: {
        lastSyncTime: null,
        pendingChanges: 0,
        isOnline: navigator.onLine
    }
};

// Storage key for localStorage
const STORAGE_KEY = 'best_meal_plan_state';

/**
 * State Manager Class
 * Provides centralized state management with subscription pattern
 */
class StateManager {
    constructor() {
        this.state = { ...DEFAULT_STATE };
        this.subscribers = new Map();
        this.persistKeys = ['settings', 'ui', 'meals', 'rotationOrder', 'archivedMeals',
            'cookingLog', 'shoppingTrips', 'ingredientPrices', 'staplesLog',
            'simpleMeals', 'tags'];

        // Load persisted state
        this.loadFromStorage();

        // Listen for online/offline events
        window.addEventListener('online', () => this.setState({ sync: { ...this.state.sync, isOnline: true } }));
        window.addEventListener('offline', () => this.setState({ sync: { ...this.state.sync, isOnline: false } }));
    }

    /**
     * Get current state or a specific path
     * @param {string} path - Dot-notation path (e.g., 'settings.householdName')
     * @returns {*} State value at path or entire state
     */
    getState(path = null) {
        if (!path) return this.state;

        return path.split('.').reduce((obj, key) => {
            return obj && obj[key] !== undefined ? obj[key] : undefined;
        }, this.state);
    }

    /**
     * Update state with partial changes
     * @param {Object} updates - Partial state updates
     * @param {Object} options - Options { persist: true, notify: true }
     */
    setState(updates, options = { persist: true, notify: true }) {
        const previousState = { ...this.state };

        // Deep merge updates
        this.state = this.deepMerge(this.state, updates);

        // Persist to localStorage
        if (options.persist) {
            this.saveToStorage();
        }

        // Notify subscribers
        if (options.notify) {
            this.notifySubscribers(previousState, updates);
        }
    }

    /**
     * Subscribe to state changes
     * @param {string|Array} paths - Path(s) to watch (e.g., 'settings' or ['meals', 'rotationOrder'])
     * @param {Function} callback - Callback function(newValue, previousValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(paths, callback) {
        const pathsArray = Array.isArray(paths) ? paths : [paths];

        pathsArray.forEach(path => {
            if (!this.subscribers.has(path)) {
                this.subscribers.set(path, new Set());
            }
            this.subscribers.get(path).add(callback);
        });

        // Return unsubscribe function
        return () => {
            pathsArray.forEach(path => {
                const subs = this.subscribers.get(path);
                if (subs) {
                    subs.delete(callback);
                }
            });
        };
    }

    /**
     * Notify subscribers of state changes
     * @param {Object} previousState - State before update
     * @param {Object} updates - The updates that were applied
     */
    notifySubscribers(previousState, updates) {
        // Get all changed paths
        const changedPaths = this.getChangedPaths(updates);

        changedPaths.forEach(path => {
            const subscribers = this.subscribers.get(path);
            if (subscribers) {
                const newValue = this.getState(path);
                const prevValue = path.split('.').reduce((obj, key) => {
                    return obj && obj[key] !== undefined ? obj[key] : undefined;
                }, previousState);

                subscribers.forEach(callback => {
                    try {
                        callback(newValue, prevValue, path);
                    } catch (error) {
                        console.error('State subscriber error:', error);
                    }
                });
            }
        });

        // Also notify global subscribers
        const globalSubs = this.subscribers.get('*');
        if (globalSubs) {
            globalSubs.forEach(callback => {
                try {
                    callback(this.state, previousState, changedPaths);
                } catch (error) {
                    console.error('Global state subscriber error:', error);
                }
            });
        }
    }

    /**
     * Get all paths that were changed in an update
     * @param {Object} updates - Update object
     * @param {string} prefix - Path prefix
     * @returns {Array} Array of changed paths
     */
    getChangedPaths(updates, prefix = '') {
        const paths = [];

        Object.keys(updates).forEach(key => {
            const path = prefix ? `${prefix}.${key}` : key;
            paths.push(path);

            if (updates[key] && typeof updates[key] === 'object' && !Array.isArray(updates[key])) {
                paths.push(...this.getChangedPaths(updates[key], path));
            }
        });

        return paths;
    }

    /**
     * Deep merge two objects
     * @param {Object} target - Target object
     * @param {Object} source - Source object
     * @returns {Object} Merged object
     */
    deepMerge(target, source) {
        const output = { ...target };

        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) {
                    output[key] = this.deepMerge(target[key], source[key]);
                } else {
                    output[key] = { ...source[key] };
                }
            } else {
                output[key] = source[key];
            }
        });

        return output;
    }

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            const toSave = {};
            this.persistKeys.forEach(key => {
                toSave[key] = this.state[key];
            });
            localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.state = this.deepMerge(DEFAULT_STATE, parsed);
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
        }
    }

    /**
     * Reset state to defaults
     * @param {Array} keys - Optional array of state keys to reset. If not provided, resets all.
     */
    resetState(keys = null) {
        if (keys) {
            keys.forEach(key => {
                if (DEFAULT_STATE[key] !== undefined) {
                    this.state[key] = JSON.parse(JSON.stringify(DEFAULT_STATE[key]));
                }
            });
        } else {
            this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        }

        this.saveToStorage();
        this.notifySubscribers({}, this.state);
    }

    /**
     * Export current state as JSON
     * @returns {string} JSON string of state
     */
    exportState() {
        return JSON.stringify(this.state, null, 2);
    }

    /**
     * Import state from JSON
     * @param {string} json - JSON string of state
     * @returns {boolean} Success status
     */
    importState(json) {
        try {
            const imported = JSON.parse(json);
            this.state = this.deepMerge(DEFAULT_STATE, imported);
            this.saveToStorage();
            this.notifySubscribers({}, this.state);
            return true;
        } catch (error) {
            console.error('Failed to import state:', error);
            return false;
        }
    }
}

// Create singleton instance
const stateManager = new StateManager();

// Export convenient accessors
export const appState = stateManager;
export const getState = (path) => stateManager.getState(path);
export const setState = (updates, options) => stateManager.setState(updates, options);
export const subscribe = (paths, callback) => stateManager.subscribe(paths, callback);
export const resetState = (keys) => stateManager.resetState(keys);
export const exportState = () => stateManager.exportState();
export const importState = (json) => stateManager.importState(json);

// Export default
export default stateManager;
