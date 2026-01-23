/**
 * @file staples-tracker.js
 * @description Tracks homemade staples production (sourdough, yogurt, breadcrumbs)
 *              with detailed tracking for flour types and yogurt production parameters.
 *
 * Feature 4: Import Historical Staples Data
 * - Tracks flour types for sourdough (King Arthur, Bob's Red Mill, wheat berries)
 * - Tracks yogurt production details (milk, starter, incubation, straining)
 * - Supports importing historical data from Excel
 *
 * @requires ./config.js
 * @requires ./google-sheets.js
 * @exports staplesTracker
 */

import CONFIG from './config.js';
import googleSheets from './google-sheets.js';

class StaplesTracker {
    constructor() {
        this.storageKey = 'staples_log';
        this.logs = [];

        // Flour type definitions (Feature 4)
        this.flourTypes = {
            ka_bread: { name: 'King Arthur Bread Flour', brand: 'King Arthur', type: 'bread' },
            ka_ap: { name: 'King Arthur All-Purpose', brand: 'King Arthur', type: 'all-purpose' },
            brm_whole_wheat: { name: "Bob's Red Mill Whole Wheat", brand: "Bob's Red Mill", type: 'whole wheat' },
            brm_rye: { name: "Bob's Red Mill Rye", brand: "Bob's Red Mill", type: 'rye' },
            wheat_scout66: { name: 'Wheat Berries - Scout 66', brand: 'Home Milled', type: 'wheat berry' },
            wheat_turkey_red: { name: 'Wheat Berries - Turkey Red', brand: 'Home Milled', type: 'wheat berry' },
            wheat_red_fife: { name: 'Wheat Berries - Red Fife', brand: 'Home Milled', type: 'wheat berry' },
            other: { name: 'Other', brand: 'Other', type: 'other' }
        };

        // Starter type definitions (Feature 4)
        this.starterTypes = {
            fage: { name: 'FAGE Greek Yogurt', brand: 'FAGE' },
            previous: { name: 'Previous Batch', brand: 'Homemade' },
            chobani: { name: 'Chobani', brand: 'Chobani' },
            other: { name: 'Other', brand: 'Other' }
        };

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
                shelfLife: 5, // days
                hasDetailedTracking: true,
                detailFields: ['flourType', 'flourGrams']
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
                shelfLife: 14, // days
                hasDetailedTracking: true,
                detailFields: ['milkQuantity', 'starterType', 'starterQuantity', 'incubationHours', 'strainingHours']
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
                shelfLife: 30, // days
                hasDetailedTracking: false,
                detailFields: []
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
     * Add a production entry with optional detailed tracking (Feature 4)
     * @param {string} item - Staple item type (sourdough, yogurt, breadcrumbs)
     * @param {string|number} quantity - Quantity produced
     * @param {string} notes - Optional notes
     * @param {Date} date - Production date
     * @param {Object} details - Optional detailed tracking data
     * @param {string} details.flourType - Flour type for sourdough
     * @param {number} details.flourGrams - Flour amount in grams for sourdough
     * @param {number} details.milkQuantity - Milk quantity in cups for yogurt
     * @param {string} details.starterType - Starter type for yogurt
     * @param {number} details.starterQuantity - Starter quantity in tbsp for yogurt
     * @param {number} details.incubationHours - Incubation time for yogurt
     * @param {number} details.strainingHours - Straining duration for yogurt
     * @returns {Object} The created entry
     */
    async addEntry(item, quantity, notes = '', date = new Date(), details = {}) {
        if (!this.stapleInfo[item]) {
            throw new Error(`Unknown staple item: ${item}`);
        }

        const entry = {
            id: Date.now().toString(),
            item: item,
            quantity: quantity,
            notes: notes,
            date: new Date(date),
            // Feature 4: Include detailed tracking data
            details: this.sanitizeDetails(item, details)
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
                    notes: notes,
                    ...entry.details
                });
            } catch (error) {
                console.warn('Failed to save to Google Sheets:', error);
            }
        }

        return entry;
    }

    /**
     * Sanitize and validate detail fields based on item type (Feature 4)
     * @param {string} item - Staple item type
     * @param {Object} details - Raw details object
     * @returns {Object} Sanitized details
     */
    sanitizeDetails(item, details) {
        if (!details || typeof details !== 'object') return {};

        const info = this.stapleInfo[item];
        if (!info || !info.hasDetailedTracking) return {};

        const sanitized = {};

        if (item === 'sourdough') {
            if (details.flourType && this.flourTypes[details.flourType]) {
                sanitized.flourType = details.flourType;
                sanitized.flourTypeName = this.flourTypes[details.flourType].name;
            }
            if (details.flourGrams && !isNaN(details.flourGrams)) {
                sanitized.flourGrams = parseFloat(details.flourGrams);
            }
        }

        if (item === 'yogurt') {
            if (details.milkQuantity && !isNaN(details.milkQuantity)) {
                sanitized.milkQuantity = parseFloat(details.milkQuantity);
            }
            if (details.starterType && this.starterTypes[details.starterType]) {
                sanitized.starterType = details.starterType;
                sanitized.starterTypeName = this.starterTypes[details.starterType].name;
            }
            if (details.starterQuantity && !isNaN(details.starterQuantity)) {
                sanitized.starterQuantity = parseFloat(details.starterQuantity);
            }
            if (details.incubationHours && !isNaN(details.incubationHours)) {
                sanitized.incubationHours = parseFloat(details.incubationHours);
            }
            if (details.strainingHours && !isNaN(details.strainingHours)) {
                sanitized.strainingHours = parseFloat(details.strainingHours);
            }
        }

        return sanitized;
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

    // ==================
    // FEATURE 4: Import Historical Staples Data
    // ==================

    /**
     * Import staples data from Excel workbook (Feature 4)
     * Expects a sheet named "Staples" with columns:
     * - date: Production date
     * - item: sourdough, yogurt, or breadcrumbs
     * - quantity: Amount produced
     * - notes: Optional notes
     * - flour_type: For sourdough (optional)
     * - flour_grams: For sourdough (optional)
     * - milk_cups: For yogurt (optional)
     * - starter_type: For yogurt (optional)
     * - starter_tbsp: For yogurt (optional)
     * - incubation_hours: For yogurt (optional)
     * - straining_hours: For yogurt (optional)
     *
     * @param {Object} workbookData - Parsed Excel workbook from excel-reader
     * @returns {Object} Import result { imported, skipped, errors }
     */
    importFromExcel(workbookData) {
        const result = { imported: 0, skipped: 0, errors: [], duplicates: 0 };

        // Look for Staples sheet (try various naming conventions)
        const sheetNames = ['Staples', 'staples', 'Staples_Log', 'StaplesLog', 'Homemade'];
        let staplesSheet = null;

        for (const name of sheetNames) {
            if (workbookData.sheets && workbookData.sheets[name]) {
                staplesSheet = workbookData.sheets[name];
                console.log(`[StaplesTracker] Found staples sheet: ${name}`);
                break;
            }
        }

        if (!staplesSheet || staplesSheet.length === 0) {
            result.errors.push('No staples data sheet found in Excel file');
            return result;
        }

        // Process each row
        for (const row of staplesSheet) {
            try {
                const entry = this.parseExcelRow(row);
                if (!entry) {
                    result.skipped++;
                    continue;
                }

                // Check for duplicates (same date and item)
                const isDuplicate = this.logs.some(log =>
                    log.item === entry.item &&
                    log.date.toDateString() === entry.date.toDateString()
                );

                if (isDuplicate) {
                    result.duplicates++;
                    continue;
                }

                // Add the entry (without async Google Sheets save)
                this.logs.push(entry);
                result.imported++;
            } catch (error) {
                result.errors.push(`Row error: ${error.message}`);
            }
        }

        // Save all imported logs
        if (result.imported > 0) {
            this.saveLogs();
        }

        console.log(`[StaplesTracker] Import complete:`, result);
        return result;
    }

    /**
     * Parse an Excel row into a staples entry (Feature 4)
     * @param {Object} row - Excel row object
     * @returns {Object|null} Staples entry or null if invalid
     */
    parseExcelRow(row) {
        // Get item type
        const itemRaw = row.item || row.Item || row.type || row.Type || '';
        const item = itemRaw.toLowerCase().trim();

        if (!this.stapleInfo[item]) {
            return null; // Unknown item type
        }

        // Get date
        let date = row.date || row.Date || row.production_date || row.ProductionDate;
        if (!date) return null;

        // Handle Excel serial dates
        if (typeof date === 'number') {
            const excelEpoch = new Date(1899, 11, 30);
            date = new Date(excelEpoch.getTime() + date * 86400000);
        } else {
            date = new Date(date);
        }

        if (isNaN(date.getTime())) return null;

        // Get quantity
        const quantity = row.quantity || row.Quantity || row.amount || row.Amount || '1';

        // Get notes
        const notes = row.notes || row.Notes || row.note || row.Note || '';

        // Build details object
        const details = {};

        // Sourdough details
        if (item === 'sourdough') {
            const flourType = row.flour_type || row.FlourType || row.flour || '';
            if (flourType) {
                // Try to match flour type
                const matched = this.matchFlourType(flourType);
                if (matched) details.flourType = matched;
            }
            const flourGrams = row.flour_grams || row.FlourGrams || row.grams || '';
            if (flourGrams && !isNaN(flourGrams)) {
                details.flourGrams = parseFloat(flourGrams);
            }
        }

        // Yogurt details
        if (item === 'yogurt') {
            const milkCups = row.milk_cups || row.MilkCups || row.milk || '';
            if (milkCups && !isNaN(milkCups)) {
                details.milkQuantity = parseFloat(milkCups);
            }
            const starterType = row.starter_type || row.StarterType || row.starter || '';
            if (starterType) {
                const matched = this.matchStarterType(starterType);
                if (matched) details.starterType = matched;
            }
            const starterTbsp = row.starter_tbsp || row.StarterTbsp || '';
            if (starterTbsp && !isNaN(starterTbsp)) {
                details.starterQuantity = parseFloat(starterTbsp);
            }
            const incubation = row.incubation_hours || row.IncubationHours || row.incubation || '';
            if (incubation && !isNaN(incubation)) {
                details.incubationHours = parseFloat(incubation);
            }
            const straining = row.straining_hours || row.StrainingHours || row.straining || '';
            if (straining && !isNaN(straining)) {
                details.strainingHours = parseFloat(straining);
            }
        }

        return {
            id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            item,
            quantity,
            notes,
            date,
            details: this.sanitizeDetails(item, details),
            importedFrom: 'excel'
        };
    }

    /**
     * Match flour type string to known types (Feature 4)
     * @param {string} flourStr - Flour type string from Excel
     * @returns {string|null} Matched flour type key or null
     */
    matchFlourType(flourStr) {
        const lower = flourStr.toLowerCase();

        // Direct matches
        if (this.flourTypes[flourStr]) return flourStr;

        // Pattern matching
        if (lower.includes('king arthur') && lower.includes('bread')) return 'ka_bread';
        if (lower.includes('king arthur') && lower.includes('all')) return 'ka_ap';
        if (lower.includes('bob') && lower.includes('whole')) return 'brm_whole_wheat';
        if (lower.includes('bob') && lower.includes('rye')) return 'brm_rye';
        if (lower.includes('scout')) return 'wheat_scout66';
        if (lower.includes('turkey')) return 'wheat_turkey_red';
        if (lower.includes('red fife')) return 'wheat_red_fife';

        return 'other';
    }

    /**
     * Match starter type string to known types (Feature 4)
     * @param {string} starterStr - Starter type string from Excel
     * @returns {string|null} Matched starter type key or null
     */
    matchStarterType(starterStr) {
        const lower = starterStr.toLowerCase();

        if (this.starterTypes[starterStr]) return starterStr;

        if (lower.includes('fage')) return 'fage';
        if (lower.includes('previous') || lower.includes('homemade')) return 'previous';
        if (lower.includes('chobani')) return 'chobani';

        return 'other';
    }

    /**
     * Get flour types (for UI dropdowns) (Feature 4)
     * @returns {Object} Flour type definitions
     */
    getFlourTypes() {
        return { ...this.flourTypes };
    }

    /**
     * Get starter types (for UI dropdowns) (Feature 4)
     * @returns {Object} Starter type definitions
     */
    getStarterTypes() {
        return { ...this.starterTypes };
    }

    /**
     * Get statistics by flour type (Feature 4)
     * @returns {Object} Statistics grouped by flour type
     */
    getFlourTypeStats() {
        const stats = {};

        for (const log of this.logs) {
            if (log.item === 'sourdough' && log.details?.flourType) {
                const type = log.details.flourType;
                if (!stats[type]) {
                    stats[type] = {
                        name: this.flourTypes[type]?.name || type,
                        count: 0,
                        totalGrams: 0
                    };
                }
                stats[type].count++;
                stats[type].totalGrams += log.details.flourGrams || 0;
            }
        }

        return stats;
    }

    /**
     * Get yogurt production averages (Feature 4)
     * @returns {Object} Average yogurt production parameters
     */
    getYogurtAverages() {
        const yogurtLogs = this.logs.filter(log =>
            log.item === 'yogurt' && log.details && Object.keys(log.details).length > 0
        );

        if (yogurtLogs.length === 0) return null;

        const totals = { incubation: 0, straining: 0, milk: 0, count: 0 };

        for (const log of yogurtLogs) {
            if (log.details.incubationHours) {
                totals.incubation += log.details.incubationHours;
                totals.count++;
            }
            if (log.details.strainingHours) {
                totals.straining += log.details.strainingHours;
            }
            if (log.details.milkQuantity) {
                totals.milk += log.details.milkQuantity;
            }
        }

        return {
            avgIncubationHours: totals.count > 0 ? (totals.incubation / totals.count).toFixed(1) : null,
            avgStrainingHours: totals.count > 0 ? (totals.straining / totals.count).toFixed(1) : null,
            avgMilkCups: totals.count > 0 ? (totals.milk / totals.count).toFixed(1) : null,
            totalBatches: yogurtLogs.length
        };
    }

    /**
     * Clear all imported data (for re-import) (Feature 4)
     */
    clearImportedData() {
        this.logs = this.logs.filter(log => log.importedFrom !== 'excel');
        this.saveLogs();
    }
}

// Export singleton instance
const staplesTracker = new StaplesTracker();
export default staplesTracker;
