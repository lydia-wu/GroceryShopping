/**
 * Google Sheets Integration Module
 * Handles reading and writing to Google Sheets for cooking logs, recipes, and meal library
 */

import CONFIG from './config.js';

class GoogleSheetsAPI {
    constructor() {
        this.apiKey = CONFIG.googleSheetsApiKey;
        this.sheetId = CONFIG.googleSheetId;
        this.baseUrl = 'https://sheets.googleapis.com/v4/spreadsheets';

        // Sheet names
        this.sheets = {
            cookingLog: 'CookingLog',
            recipeUpdates: 'RecipeUpdates',
            mealLibrary: 'MealLibrary',
            rotationOrder: 'RotationOrder',
            staplesLog: 'StaplesLog',
            mealNotes: 'MealNotes'
        };

        // Demo mode flag - when API key is not configured
        this.demoMode = this.apiKey === 'YOUR_GOOGLE_SHEETS_API_KEY' || !this.apiKey;
    }

    /**
     * Check if Google Sheets is configured
     */
    isConfigured() {
        return !this.demoMode;
    }

    /**
     * Make API request to Google Sheets
     */
    async apiRequest(endpoint, method = 'GET', body = null) {
        if (this.demoMode) {
            console.log('Google Sheets API running in demo mode');
            return this.getDemoData(endpoint);
        }

        const url = `${this.baseUrl}/${this.sheetId}${endpoint}?key=${this.apiKey}`;

        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Google Sheets API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Google Sheets API error:', error);
            throw error;
        }
    }

    /**
     * Get demo data when API is not configured
     */
    getDemoData(endpoint) {
        // Return sample data for demonstration
        if (endpoint.includes('CookingLog')) {
            return {
                values: [
                    ['date', 'meal_code', 'meal_name', 'notes', 'servings_made'],
                    ['2026-01-08', 'B', 'Kale & Chicken Pasta', 'Turned out great!', '6'],
                    ['2026-01-11', 'C', 'Warm Chicken Grain Bowl', 'Added extra pomegranate', '6'],
                    ['2026-01-14', 'A', 'Mackerel Meatball', '', '5'],
                    ['2026-01-16', 'D', 'Turkey Barley Soup', 'Froze half', '8'],
                    ['2026-01-18', 'F', 'Turkey Spaghetti', '', '6']
                ]
            };
        }

        if (endpoint.includes('MealLibrary')) {
            return {
                values: [
                    ['meal_code', 'name', 'status', 'servings', 'ingredients_json', 'instructions', 'created_date', 'archived_date'],
                    ['A', 'Mackerel Meatball', 'active', '5', '[]', '', '2025-12-01', ''],
                    ['B', 'Kale & Chicken Pasta', 'active', '6', '[]', '', '2025-12-01', ''],
                    ['C', 'Warm Chicken Grain Bowl', 'active', '6', '[]', '', '2025-12-01', ''],
                    ['D', 'Turkey Barley Soup', 'active', '8', '[]', '', '2025-12-01', ''],
                    ['E', 'Mackerel Cauliflower Fried Rice', 'active', '6', '[]', '', '2025-12-01', ''],
                    ['F', 'Turkey Spaghetti', 'active', '6', '[]', '', '2025-12-01', '']
                ]
            };
        }

        if (endpoint.includes('RotationOrder')) {
            return {
                values: [
                    ['position', 'meal_code'],
                    ['1', 'B'],
                    ['2', 'C'],
                    ['3', 'A'],
                    ['4', 'D'],
                    ['5', 'F'],
                    ['6', 'E']
                ]
            };
        }

        if (endpoint.includes('StaplesLog')) {
            return {
                values: [
                    ['date', 'item', 'quantity', 'notes'],
                    ['2026-01-08', 'sourdough', '3 loaves', 'Good rise'],
                    ['2026-01-10', 'yogurt', '6.5 pints', 'Set nicely'],
                    ['2026-01-15', 'sourdough', '3 loaves', ''],
                    ['2026-01-17', 'breadcrumbs', '4 cups', 'From stale sourdough']
                ]
            };
        }

        return { values: [] };
    }

    /**
     * Read data from a sheet
     */
    async readSheet(sheetName, range = '') {
        const rangeStr = range ? `${sheetName}!${range}` : sheetName;
        const endpoint = `/values/${encodeURIComponent(rangeStr)}`;
        return await this.apiRequest(endpoint);
    }

    /**
     * Parse sheet data into array of objects
     */
    parseSheetData(data) {
        if (!data.values || data.values.length < 2) {
            return [];
        }

        const headers = data.values[0];
        const rows = data.values.slice(1);

        return rows.map(row => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index] || '';
            });
            return obj;
        });
    }

    // ==================== Cooking Log ====================

    /**
     * Get all cooking log entries
     */
    async getCookingLog() {
        const data = await this.readSheet(this.sheets.cookingLog);
        return this.parseSheetData(data);
    }

    /**
     * Get last cooked date for a meal
     */
    async getLastCookedDate(mealCode) {
        const logs = await this.getCookingLog();
        const mealLogs = logs
            .filter(log => log.meal_code === mealCode)
            .sort((a, b) => new Date(b.date) - new Date(a.date));

        return mealLogs.length > 0 ? mealLogs[0].date : null;
    }

    /**
     * Get cooking history for all meals
     */
    async getCookingHistory() {
        const logs = await this.getCookingLog();
        const history = {};

        for (const log of logs) {
            const code = log.meal_code;
            if (!history[code]) {
                history[code] = [];
            }
            history[code].push({
                date: log.date,
                notes: log.notes,
                servings: parseInt(log.servings_made) || 0
            });
        }

        // Sort each meal's history by date (newest first)
        for (const code in history) {
            history[code].sort((a, b) => new Date(b.date) - new Date(a.date));
        }

        return history;
    }

    /**
     * Add a cooking log entry
     * Note: This requires write access (API key alone won't work, need OAuth)
     */
    async addCookingEntry(entry) {
        if (this.demoMode) {
            console.log('Demo mode: Would add cooking entry:', entry);
            // Store in localStorage for demo
            const logs = JSON.parse(localStorage.getItem('cookingLog') || '[]');
            logs.push({
                date: entry.date,
                meal_code: entry.mealCode,
                meal_name: entry.mealName,
                notes: entry.notes || '',
                servings_made: entry.servings || ''
            });
            localStorage.setItem('cookingLog', JSON.stringify(logs));
            return { success: true, demo: true };
        }

        // Real API call would go here
        // This requires OAuth2 authentication for write access
        throw new Error('Write operations require OAuth2 authentication. See setup instructions.');
    }

    // ==================== Meal Library ====================

    /**
     * Get all meals from library
     */
    async getMealLibrary() {
        const data = await this.readSheet(this.sheets.mealLibrary);
        return this.parseSheetData(data).map(row => ({
            code: row.meal_code,
            name: row.name,
            status: row.status || 'active',
            servings: parseInt(row.servings) || 6,
            ingredients: this.safeParseJSON(row.ingredients_json, []),
            instructions: row.instructions || '',
            createdDate: row.created_date,
            archivedDate: row.archived_date
        }));
    }

    /**
     * Get only active meals
     */
    async getActiveMeals() {
        const meals = await this.getMealLibrary();
        return meals.filter(meal => meal.status === 'active');
    }

    /**
     * Get only archived meals
     */
    async getArchivedMeals() {
        const meals = await this.getMealLibrary();
        return meals.filter(meal => meal.status === 'archived');
    }

    // ==================== Rotation Order ====================

    /**
     * Get current rotation order
     */
    async getRotationOrder() {
        const data = await this.readSheet(this.sheets.rotationOrder);
        const parsed = this.parseSheetData(data);
        return parsed
            .sort((a, b) => parseInt(a.position) - parseInt(b.position))
            .map(row => row.meal_code);
    }

    // ==================== Staples Log ====================

    /**
     * Get staples production log
     */
    async getStaplesLog() {
        const data = await this.readSheet(this.sheets.staplesLog);
        return this.parseSheetData(data).map(row => ({
            date: row.date,
            item: row.item,
            quantity: row.quantity,
            notes: row.notes
        }));
    }

    /**
     * Get latest production for each staple
     */
    async getLatestStaples() {
        const logs = await this.getStaplesLog();
        const latest = {};

        for (const log of logs) {
            const existing = latest[log.item];
            if (!existing || new Date(log.date) > new Date(existing.date)) {
                latest[log.item] = log;
            }
        }

        return latest;
    }

    /**
     * Add staple production entry
     */
    async addStapleEntry(entry) {
        if (this.demoMode) {
            console.log('Demo mode: Would add staple entry:', entry);
            const logs = JSON.parse(localStorage.getItem('staplesLog') || '[]');
            logs.push({
                date: entry.date,
                item: entry.item,
                quantity: entry.quantity,
                notes: entry.notes || ''
            });
            localStorage.setItem('staplesLog', JSON.stringify(logs));
            return { success: true, demo: true };
        }

        throw new Error('Write operations require OAuth2 authentication.');
    }

    // ==================== Meal Notes ====================

    /**
     * Get notes for a meal
     */
    async getMealNotes(mealCode) {
        const data = await this.readSheet(this.sheets.mealNotes);
        const parsed = this.parseSheetData(data);
        return parsed
            .filter(row => row.meal_code === mealCode)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // ==================== Utilities ====================

    /**
     * Safely parse JSON string
     */
    safeParseJSON(str, defaultValue = null) {
        try {
            return JSON.parse(str) || defaultValue;
        } catch {
            return defaultValue;
        }
    }

    /**
     * Format date for sheets (YYYY-MM-DD)
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    /**
     * Get demo mode status
     */
    isDemoMode() {
        return this.demoMode;
    }
}

// Export singleton instance
const googleSheets = new GoogleSheetsAPI();
export default googleSheets;
