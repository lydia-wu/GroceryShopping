/**
 * Excel Reader Module
 * Handles fetching and parsing Excel files using SheetJS
 */

import CONFIG from './config.js';

class ExcelReader {
    constructor() {
        this.cache = new Map();
    }

    /**
     * Fetch and parse an Excel file from URL
     * @param {string} url - URL to the Excel file
     * @param {boolean} useCache - Whether to use cached data
     * @returns {Promise<Object>} - Parsed workbook data
     */
    async fetchExcel(url, useCache = true) {
        const cacheKey = url;

        // Check cache
        if (useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < CONFIG.cache.excelTTL) {
                console.log('Using cached Excel data for:', url);
                return cached.data;
            }
        }

        try {
            console.log('Fetching Excel file:', url);
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Failed to fetch Excel file: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const data = this.parseWorkbook(workbook);

            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('Error fetching Excel file:', error);
            throw error;
        }
    }

    /**
     * Parse workbook into structured data
     * @param {Object} workbook - XLSX workbook object
     * @returns {Object} - Structured data from all sheets
     */
    parseWorkbook(workbook) {
        const result = {
            sheets: {},
            sheetNames: workbook.SheetNames
        };

        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            result.sheets[sheetName] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        }

        return result;
    }

    /**
     * Fetch and parse the MealCostCalculator.xlsx file
     * @returns {Promise<Object>} - Meal cost data
     */
    async getMealCostData() {
        const data = await this.fetchExcel(CONFIG.excelUrls.mealCostCalculator);
        return this.processMealCostData(data);
    }

    /**
     * Process meal cost calculator data into usable format
     * @param {Object} data - Raw Excel data
     * @returns {Object} - Processed meal cost data
     */
    processMealCostData(data) {
        const meals = {};
        const ingredients = {};
        const stores = {};

        // Process each sheet
        for (const sheetName of data.sheetNames) {
            const sheetData = data.sheets[sheetName];

            // Check if this is a meal sheet (usually named like "Meal A", "Meal B", etc.)
            const mealMatch = sheetName.match(/Meal\s*([A-F])/i);
            if (mealMatch) {
                const mealCode = mealMatch[1].toUpperCase();
                meals[mealCode] = this.processMealSheet(sheetData, mealCode);
            }

            // Process Summary or Overview sheet
            if (sheetName.toLowerCase().includes('summary') || sheetName.toLowerCase().includes('overview')) {
                // Extract summary data
            }

            // Process Ingredients sheet
            if (sheetName.toLowerCase().includes('ingredient')) {
                this.processIngredientsSheet(sheetData, ingredients);
            }
        }

        return { meals, ingredients, stores, rawData: data };
    }

    /**
     * Process a single meal sheet
     * @param {Array} sheetData - Sheet data as array of rows
     * @param {string} mealCode - Meal identifier
     * @returns {Object} - Processed meal data
     */
    processMealSheet(sheetData, mealCode) {
        const meal = {
            code: mealCode,
            ingredients: [],
            totalCost: 0,
            costPerServing: 0
        };

        for (const row of sheetData) {
            // Common column patterns in meal sheets
            const ingredient = row['Ingredient'] || row['Item'] || row['Name'] || '';
            const quantity = row['Quantity'] || row['Qty'] || row['Amount'] || '';
            const unit = row['Unit'] || '';
            const cost = parseFloat(row['Cost'] || row['Price'] || row['Total'] || 0);
            const store = row['Store'] || row['Source'] || '';

            if (ingredient && ingredient.trim()) {
                meal.ingredients.push({
                    name: ingredient.trim(),
                    quantity: quantity,
                    unit: unit,
                    cost: cost,
                    store: store
                });
                meal.totalCost += cost;
            }

            // Look for servings info
            if (row['Servings'] !== undefined) {
                meal.servings = parseInt(row['Servings']) || 6;
            }
        }

        // Calculate cost per serving
        if (meal.servings > 0) {
            meal.costPerServing = meal.totalCost / meal.servings;
        }

        return meal;
    }

    /**
     * Process ingredients sheet
     * @param {Array} sheetData - Sheet data as array of rows
     * @param {Object} ingredients - Ingredients object to populate
     */
    processIngredientsSheet(sheetData, ingredients) {
        for (const row of sheetData) {
            const name = row['Ingredient'] || row['Name'] || row['Item'] || '';
            if (name && name.trim()) {
                ingredients[name.trim().toLowerCase()] = {
                    name: name.trim(),
                    cost: parseFloat(row['Cost'] || row['Price'] || 0),
                    unit: row['Unit'] || '',
                    store: row['Store'] || '',
                    category: row['Category'] || ''
                };
            }
        }
    }

    /**
     * Fetch and parse the shopping data Excel file
     * @returns {Promise<Object>} - Shopping trip data
     */
    async getShoppingData() {
        const data = await this.fetchExcel(CONFIG.excelUrls.actualShoppingData);
        return this.processShoppingData(data);
    }

    /**
     * Process shopping data into usable format
     * @param {Object} data - Raw Excel data
     * @returns {Object} - Processed shopping data
     */
    processShoppingData(data) {
        const trips = [];
        const itemsByStore = {};
        const totalsByStore = {};

        for (const sheetName of data.sheetNames) {
            const sheetData = data.sheets[sheetName];

            // Check if this is a trip sheet
            const tripMatch = sheetName.match(/Trip\s*(\d+)/i);
            if (tripMatch) {
                const tripNum = parseInt(tripMatch[1]);
                const trip = this.processTripSheet(sheetData, tripNum, sheetName);
                trips.push(trip);

                // Aggregate by store
                for (const item of trip.items) {
                    const store = item.store || 'Unknown';
                    if (!itemsByStore[store]) {
                        itemsByStore[store] = [];
                        totalsByStore[store] = 0;
                    }
                    itemsByStore[store].push(item);
                    totalsByStore[store] += item.cost || 0;
                }
            }
        }

        // Sort trips by number
        trips.sort((a, b) => a.tripNumber - b.tripNumber);

        return {
            trips,
            itemsByStore,
            totalsByStore,
            rawData: data
        };
    }

    /**
     * Process a single trip sheet
     * @param {Array} sheetData - Sheet data as array of rows
     * @param {number} tripNum - Trip number
     * @param {string} sheetName - Original sheet name
     * @returns {Object} - Processed trip data
     */
    processTripSheet(sheetData, tripNum, sheetName) {
        const trip = {
            tripNumber: tripNum,
            name: sheetName,
            date: null,
            items: [],
            totalCost: 0,
            storeBreakdown: {}
        };

        for (const row of sheetData) {
            // Look for date
            if (row['Date']) {
                trip.date = row['Date'];
            }

            // Process items
            const item = row['Item'] || row['Ingredient'] || row['Name'] || row['Product'] || '';
            const cost = parseFloat(row['Cost'] || row['Price'] || row['Total'] || row['Amount'] || 0);
            const store = row['Store'] || row['Source'] || '';
            const quantity = row['Quantity'] || row['Qty'] || '';

            if (item && item.trim()) {
                trip.items.push({
                    name: item.trim(),
                    cost: cost,
                    store: store,
                    quantity: quantity
                });
                trip.totalCost += cost;

                // Update store breakdown
                if (store) {
                    trip.storeBreakdown[store] = (trip.storeBreakdown[store] || 0) + cost;
                }
            }
        }

        return trip;
    }

    /**
     * Get all data from both Excel files
     * @returns {Promise<Object>} - Combined data from all sources
     */
    async getAllData() {
        try {
            const [mealData, shoppingData] = await Promise.all([
                this.getMealCostData(),
                this.getShoppingData()
            ]);

            return {
                meals: mealData.meals,
                ingredients: mealData.ingredients,
                trips: shoppingData.trips,
                itemsByStore: shoppingData.itemsByStore,
                totalsByStore: shoppingData.totalsByStore
            };
        } catch (error) {
            console.error('Error loading Excel data:', error);
            throw error;
        }
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
    }
}

// Export singleton instance
const excelReader = new ExcelReader();
export default excelReader;
