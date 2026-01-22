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
     * Convert Excel serial date number to ISO date string
     * Excel dates are days since January 1, 1900 (with a leap year bug)
     * @param {number|string|Date} excelDate - Excel date serial or existing date
     * @returns {string} - ISO date string (YYYY-MM-DD)
     */
    excelDateToString(excelDate) {
        if (!excelDate) return null;

        // If already a string that looks like a date, return it
        if (typeof excelDate === 'string' && excelDate.includes('-')) {
            return excelDate;
        }

        // If it's a Date object, convert to string
        if (excelDate instanceof Date) {
            return excelDate.toISOString().split('T')[0];
        }

        // If it's a number (Excel serial), convert it
        if (typeof excelDate === 'number') {
            // Excel's epoch is January 1, 1900, but it incorrectly treats 1900 as a leap year
            // So we subtract 1 from dates after Feb 28, 1900
            // JavaScript's Date epoch is January 1, 1970
            // Days between 1900-01-01 and 1970-01-01 = 25569
            const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
            return jsDate.toISOString().split('T')[0];
        }

        return null;
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
     * Handles itemized purchase sheets (e.g., "2025_2026_Itemized_Pur")
     * @param {Object} data - Raw Excel data
     * @returns {Object} - Processed shopping data
     */
    processShoppingData(data) {
        const trips = [];
        const itemsByStore = {};
        const totalsByStore = {};
        let tripCounter = 1;

        for (const sheetName of data.sheetNames) {
            const sheetData = data.sheets[sheetName];

            // Check for itemized purchase sheets (year-based naming)
            const itemizedMatch = sheetName.match(/\d{4}.*Itemized/i);
            if (itemizedMatch) {
                console.log(`Processing itemized sheet: ${sheetName} with ${sheetData.length} rows`);
                const sheetTrips = this.processItemizedSheet(sheetData, tripCounter);

                for (const trip of sheetTrips) {
                    trips.push(trip);
                    tripCounter++;

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
            // Also check for old "Trip X" format for backwards compatibility
            else {
                const tripMatch = sheetName.match(/Trip\s*(\d+)/i);
                if (tripMatch) {
                    const tripNum = parseInt(tripMatch[1]);
                    const trip = this.processTripSheet(sheetData, tripNum, sheetName);
                    trips.push(trip);

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
        }

        // Sort trips by date (newest first)
        trips.sort((a, b) => {
            if (a.date && b.date) {
                return new Date(b.date) - new Date(a.date);
            }
            return b.tripNumber - a.tripNumber;
        });

        console.log(`Processed ${trips.length} shopping trips with ${Object.keys(itemsByStore).length} stores`);

        return {
            trips,
            itemsByStore,
            totalsByStore,
            rawData: data
        };
    }

    /**
     * Process an itemized purchase sheet (year-based format)
     * Groups items by OrderTransID_ReceiptID to create trips
     * @param {Array} sheetData - Sheet data as array of rows
     * @param {number} startTripNum - Starting trip number
     * @returns {Array} - Array of trip objects
     */
    processItemizedSheet(sheetData, startTripNum) {
        const tripsByReceipt = new Map();

        for (const row of sheetData) {
            // Get item name - skip tax/discount rows
            const itemName = row['Item'] || '';
            if (!itemName || itemName.includes('Tax') || itemName.includes('DISCOUNT')) {
                continue;
            }

            // Convert Excel serial date to JS Date string
            const rawDate = row['Date'];
            const dateStr = this.excelDateToString(rawDate);

            // Group by DATE - one shopping trip = one day of shopping (across all stores)
            const tripKey = dateStr;

            // Parse price - handle various formats
            let cost = 0;
            const priceRaw = row['PriceRaw'];
            if (typeof priceRaw === 'number') {
                cost = priceRaw;
            } else if (typeof priceRaw === 'string') {
                cost = parseFloat(priceRaw.replace(/[$,]/g, '')) || 0;
            }

            // Skip items with zero or negative cost
            if (cost <= 0) continue;

            // Get other fields
            const store = row['Location'] || '';
            const date = dateStr;
            const quantity = row['Qty'] || 1;
            const units = row['Qty_units'] || '';
            const category = row['Cat'] || '';
            const subCategory = row['SubCat'] || '';

            // Only process grocery items (exclude restaurants, prepared foods, etc.)
            if (category !== 'Food') continue;
            if (subCategory && subCategory !== 'Groceries') continue;

            // Skip items that look like restaurant/prepared food
            const lowerItem = itemName.toLowerCase();
            const restaurantKeywords = ['combo', 'entrée', 'entree', 'wings', 'scoop', 'braised',
                'sauce', 'curry', 'chow mein', 'fried rice', 'contains', 'with garlic', 'with pork'];
            const isRestaurant = restaurantKeywords.some(kw => lowerItem.includes(kw));
            if (isRestaurant) continue;

            // Create or update trip (grouped by date)
            if (!tripsByReceipt.has(tripKey)) {
                tripsByReceipt.set(tripKey, {
                    tripNumber: startTripNum + tripsByReceipt.size,
                    name: date,  // Just the date as the name
                    date: date,
                    items: [],
                    totalCost: 0,
                    storeBreakdown: {}
                });
            }

            const trip = tripsByReceipt.get(tripKey);
            trip.items.push({
                name: itemName.trim(),
                cost: cost,
                store: store,
                quantity: quantity,
                units: units,
                date: date
            });
            trip.totalCost += cost;

            // Update store breakdown
            if (store) {
                trip.storeBreakdown[store] = (trip.storeBreakdown[store] || 0) + cost;
            }
        }

        return Array.from(tripsByReceipt.values());
    }

    /**
     * Process a single trip sheet (old format for backwards compatibility)
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
