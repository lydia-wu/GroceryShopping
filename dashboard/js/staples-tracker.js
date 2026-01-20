/**
 * Staples Tracker Module
 * Tracks homemade staples production (sourdough, yogurt, breadcrumbs)
 */

import CONFIG from './config.js';
import googleSheets from './google-sheets.js';

class StaplesTracker {
    constructor() {
        this.storageKey = 'staples_log';
        this.logs = [];

        // Staple definitions with cost calculations
        this.stapleInfo = {
            sourdough: {
                id: 'sourdough',
                name: 'Sourdough Bread',
                icon: '🍞',
                unit: 'loaves',
                defaultBatch: 3,
                // Cost per batch (approximate)
                ingredientCost: 2.50, // flour, water, salt
                avgUsagePerWeek: 2,
                storeBoughtCost: 7.00, // per loaf
                shelfLife: 5 // days
            },
            yogurt: {
                id: 'yogurt',
                name: 'Yogurt',
                icon: '🥛',
                unit: 'pints',
                defaultBatch: 6.5,
                ingredientCost: 4.00, // milk, starter
                avgUsagePerWeek: 3,
                storeBoughtCost: 2.50, // per pint
                shelfLife: 14 // days
            },
            breadcrumbs: {
                id: 'breadcrumbs',
                name: 'Breadcrumbs',
                icon: '🥖',
                unit: 'cups',
                defaultBatch: 4,
                ingredientCost: 0, // uses stale bread
                avgUsagePerWeek: 0.5,
                storeBoughtCost: 3.00, // per cup
                shelfLife: 30 // days
            }
        };

        // Load existing logs
        this.loadLogs();
    }

    /**
     * Load logs from storage
     */
    async loadLogs() {
        try {
            // Try Google Sheets first
            if (googleSheets.isConfigured()) {
                const sheetLogs = await googleSheets.getStaplesLog();
                this.logs = sheetLogs.map(log => ({
                    ...log,
                    date: new Date(log.date)
                }));
            } else {
                // Fall back to local storage
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.logs = JSON.parse(stored).map(log => ({
                        ...log,
                        date: new Date(log.date)
                    }));
                }
            }
        } catch (error) {
            console.error('Error loading staples logs:', error);
            // Try local storage as fallback
            try {
                const stored = localStorage.getItem(this.storageKey);
                if (stored) {
                    this.logs = JSON.parse(stored).map(log => ({
                        ...log,
                        date: new Date(log.date)
                    }));
                }
            } catch (e) {
                this.logs = [];
            }
        }
    }

    /**
     * Save logs to storage
     */
    saveLogs() {
        try {
            const toStore = this.logs.map(log => ({
                ...log,
                date: log.date.toISOString()
            }));
            localStorage.setItem(this.storageKey, JSON.stringify(toStore));
        } catch (error) {
            console.error('Error saving staples logs:', error);
        }
    }

    /**
     * Add a production entry
     */
    async addEntry(item, quantity, notes = '', date = new Date()) {
        if (!this.stapleInfo[item]) {
            throw new Error(`Unknown staple item: ${item}`);
        }

        const entry = {
            id: Date.now().toString(),
            item: item,
            quantity: quantity,
            notes: notes,
            date: new Date(date)
        };

        this.logs.push(entry);
        this.saveLogs();

        // Try to save to Google Sheets
        if (googleSheets.isConfigured()) {
            try {
                await googleSheets.addStapleEntry({
                    date: entry.date.toISOString().split('T')[0],
                    item: item,
                    quantity: quantity,
                    notes: notes
                });
            } catch (error) {
                console.warn('Failed to save to Google Sheets:', error);
            }
        }

        return entry;
    }

    /**
     * Get all logs for a specific item
     */
    getLogsForItem(item) {
        return this.logs
            .filter(log => log.item === item)
            .sort((a, b) => b.date - a.date);
    }

    /**
     * Get the most recent production for each item
     */
    getLatestProduction() {
        const latest = {};

        for (const itemId in this.stapleInfo) {
            const logs = this.getLogsForItem(itemId);
            latest[itemId] = logs.length > 0 ? logs[0] : null;
        }

        return latest;
    }

    /**
     * Get staple status (with estimated inventory)
     */
    getStapleStatus(item) {
        const info = this.stapleInfo[item];
        if (!info) return null;

        const logs = this.getLogsForItem(item);
        const latest = logs.length > 0 ? logs[0] : null;

        let status = {
            id: item,
            name: info.name,
            icon: info.icon,
            unit: info.unit,
            lastProduction: latest,
            estimatedRemaining: null,
            needsProduction: false,
            daysSinceProduction: null,
            savingsPerBatch: null
        };

        if (latest) {
            const daysSince = Math.floor((new Date() - latest.date) / (1000 * 60 * 60 * 24));
            status.daysSinceProduction = daysSince;

            // Parse quantity
            const qty = this.parseQuantity(latest.quantity);

            // Estimate remaining based on usage
            const dailyUsage = info.avgUsagePerWeek / 7;
            const estimatedUsed = dailyUsage * daysSince;
            status.estimatedRemaining = Math.max(0, qty - estimatedUsed);

            // Check if needs production
            status.needsProduction = status.estimatedRemaining < (qty * 0.2) || daysSince > info.shelfLife;

            // Calculate savings
            status.savingsPerBatch = (qty * info.storeBoughtCost) - info.ingredientCost;
        } else {
            status.needsProduction = true;
        }

        return status;
    }

    /**
     * Get all staple statuses
     */
    getAllStatuses() {
        const statuses = {};
        for (const itemId in this.stapleInfo) {
            statuses[itemId] = this.getStapleStatus(itemId);
        }
        return statuses;
    }

    /**
     * Parse quantity string to number
     */
    parseQuantity(quantityStr) {
        if (typeof quantityStr === 'number') return quantityStr;

        // Extract number from string like "3 loaves" or "6.5 pints"
        const match = quantityStr.toString().match(/[\d.]+/);
        return match ? parseFloat(match[0]) : 0;
    }

    /**
     * Format date for display
     */
    formatDate(date) {
        if (!date) return 'Never';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    }

    /**
     * Get staple info
     */
    getStapleInfo(item) {
        return this.stapleInfo[item];
    }

    /**
     * Get all staple definitions
     */
    getAllStapleInfo() {
        return { ...this.stapleInfo };
    }

    /**
     * Calculate total savings from homemade staples
     */
    calculateTotalSavings() {
        let totalSavings = 0;

        for (const log of this.logs) {
            const info = this.stapleInfo[log.item];
            if (info) {
                const qty = this.parseQuantity(log.quantity);
                const batchSavings = (qty * info.storeBoughtCost) - info.ingredientCost;
                totalSavings += Math.max(0, batchSavings);
            }
        }

        return totalSavings;
    }

    /**
     * Get production history for charts
     */
    getProductionHistory(item = null, limit = 10) {
        let filtered = item
            ? this.logs.filter(log => log.item === item)
            : this.logs;

        return filtered
            .sort((a, b) => b.date - a.date)
            .slice(0, limit)
            .reverse();
    }

    /**
     * Delete a log entry
     */
    deleteEntry(entryId) {
        this.logs = this.logs.filter(log => log.id !== entryId);
        this.saveLogs();
    }

    /**
     * Generate HTML for staples display
     */
    generateStaplesHTML() {
        const statuses = this.getAllStatuses();
        let html = '';

        for (const [itemId, status] of Object.entries(statuses)) {
            const needsClass = status.needsProduction ? 'needs-production' : '';
            const lastDate = status.lastProduction
                ? this.formatDate(status.lastProduction.date)
                : 'Never';
            const quantity = status.lastProduction
                ? status.lastProduction.quantity
                : '--';

            html += `
                <div class="staple-card ${needsClass}">
                    <div class="staple-icon">${status.icon}</div>
                    <div class="staple-name">${status.name}</div>
                    <div class="staple-info">
                        <div>Last: ${lastDate}</div>
                        <div>Made: ${quantity}</div>
                        ${status.estimatedRemaining !== null
                            ? `<div>Est. remaining: ~${status.estimatedRemaining.toFixed(1)} ${status.unit}</div>`
                            : ''}
                    </div>
                    ${status.needsProduction
                        ? '<div class="staple-alert">Time to make more!</div>'
                        : ''}
                </div>
            `;
        }

        return html;
    }
}

// Export singleton instance
const staplesTracker = new StaplesTracker();
export default staplesTracker;
