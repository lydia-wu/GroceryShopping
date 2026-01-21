/**
 * @file event-bus.js
 * @description Simple event bus for cross-component communication.
 *              Provides pub/sub pattern for decoupled module interaction.
 *
 * @requires None (standalone module)
 * @exports EventBus, eventBus, emit, on, off, once
 *
 * DATA FLOW:
 * Publisher → Event Bus → All Subscribers
 */

/**
 * Event Bus Class
 * Provides publish/subscribe pattern for loose coupling between components
 */
class EventBus {
    constructor() {
        this.events = new Map();
        this.onceListeners = new Map();
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    on(event, callback) {
        if (!this.events.has(event)) {
            this.events.set(event, new Set());
        }
        this.events.get(event).add(callback);

        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Subscribe to an event for one-time execution
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} Unsubscribe function
     */
    once(event, callback) {
        const onceWrapper = (...args) => {
            callback(...args);
            this.off(event, onceWrapper);
        };

        if (!this.onceListeners.has(callback)) {
            this.onceListeners.set(callback, onceWrapper);
        }

        return this.on(event, onceWrapper);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.delete(callback);

            // Also check for once wrapper
            const onceWrapper = this.onceListeners.get(callback);
            if (onceWrapper) {
                listeners.delete(onceWrapper);
                this.onceListeners.delete(callback);
            }

            // Clean up empty event sets
            if (listeners.size === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Emit an event with data
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data = null) {
        const listeners = this.events.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event handler for "${event}":`, error);
                }
            });
        }

        // Also emit to wildcard listeners
        const wildcardListeners = this.events.get('*');
        if (wildcardListeners) {
            wildcardListeners.forEach(callback => {
                try {
                    callback({ event, data });
                } catch (error) {
                    console.error(`Error in wildcard event handler:`, error);
                }
            });
        }
    }

    /**
     * Clear all listeners for an event or all events
     * @param {string} event - Event name (optional, clears all if not provided)
     */
    clear(event = null) {
        if (event) {
            this.events.delete(event);
        } else {
            this.events.clear();
            this.onceListeners.clear();
        }
    }

    /**
     * Get number of listeners for an event
     * @param {string} event - Event name
     * @returns {number} Number of listeners
     */
    listenerCount(event) {
        const listeners = this.events.get(event);
        return listeners ? listeners.size : 0;
    }

    /**
     * Check if event has listeners
     * @param {string} event - Event name
     * @returns {boolean} Has listeners
     */
    hasListeners(event) {
        return this.listenerCount(event) > 0;
    }
}

// Create singleton instance
const eventBus = new EventBus();

// ==================
// PREDEFINED EVENTS
// ==================
// These are the events used throughout the application

export const EVENTS = {
    // Navigation
    VIEW_CHANGED: 'view:changed',
    SECTION_SCROLL: 'section:scroll',

    // Meals
    MEAL_ADDED: 'meal:added',
    MEAL_UPDATED: 'meal:updated',
    MEAL_DELETED: 'meal:deleted',
    MEAL_ARCHIVED: 'meal:archived',
    MEAL_RESTORED: 'meal:restored',
    MEAL_COOKED: 'meal:cooked',
    ROTATION_CHANGED: 'rotation:changed',

    // Shopping
    SHOPPING_TRIP_ADDED: 'shopping:trip_added',
    SHOPPING_LIST_GENERATED: 'shopping:list_generated',
    PRICE_UPDATED: 'price:updated',

    // Staples
    STAPLE_LOGGED: 'staple:logged',

    // Sync
    SYNC_STARTED: 'sync:started',
    SYNC_COMPLETED: 'sync:completed',
    SYNC_FAILED: 'sync:failed',
    ONLINE_STATUS_CHANGED: 'sync:online_changed',

    // UI
    MODAL_OPENED: 'ui:modal_opened',
    MODAL_CLOSED: 'ui:modal_closed',
    EDIT_MODE_TOGGLED: 'ui:edit_mode_toggled',
    TOAST_SHOW: 'ui:toast_show',
    SIDEBAR_TOGGLED: 'ui:sidebar_toggled',

    // Data
    DATA_LOADED: 'data:loaded',
    DATA_EXPORTED: 'data:exported',
    DATA_IMPORTED: 'data:imported',

    // Settings
    SETTINGS_CHANGED: 'settings:changed',
    THEME_CHANGED: 'settings:theme_changed',

    // Charts
    CHART_UPDATED: 'chart:updated',
    RADAR_MEALS_CHANGED: 'radar:meals_changed',

    // Calendar
    DATE_SELECTED: 'calendar:date_selected',
    MEAL_SCHEDULED: 'calendar:meal_scheduled',

    // Export
    COOKBOOK_EXPORTED: 'export:cookbook'
};

// Export convenient methods
export const emit = (event, data) => eventBus.emit(event, data);
export const on = (event, callback) => eventBus.on(event, callback);
export const off = (event, callback) => eventBus.off(event, callback);
export const once = (event, callback) => eventBus.once(event, callback);

// Export singleton and class
export { EventBus, eventBus };
export default eventBus;
