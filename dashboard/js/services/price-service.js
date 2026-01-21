/**
 * @file price-service.js
 * @description Service for tracking and analyzing ingredient prices from shopping data.
 *              Matches purchase items to known ingredients and calculates price metrics.
 *
 * @requires ../core/state-manager.js
 * @requires ../core/event-bus.js
 * @exports PriceService, priceService
 *
 * DATA FLOW:
 * Shopping Trip → Item Matching → Price Extraction → State Update → Event Emission
 */

import { getState, setState, subscribe } from '../core/state-manager.js';
import { emit, EVENTS } from '../core/event-bus.js';

// Load ingredients data for matching
let ingredientsData = null;

/**
 * Price Service Class
 * Tracks ingredient prices from shopping data and provides price analytics
 */
class PriceService {
    constructor() {
        this.aliasMap = new Map(); // Maps aliases to ingredient keys
        this.initialized = false;
    }

    /**
     * Initialize the price service
     * Loads ingredients data and builds alias map
     */
    async init() {
        if (this.initialized) return;

        try {
            // Load ingredients.json
            const response = await fetch('../data/ingredients.json');
            ingredientsData = await response.json();

            // Build alias map for fast lookups
            this.buildAliasMap();

            // Subscribe to shopping trip changes
            subscribe('shoppingTrips', (trips) => this.onTripsChanged(trips));

            this.initialized = true;
            console.log('PriceService initialized with', Object.keys(ingredientsData.ingredients).length, 'ingredients');
        } catch (error) {
            console.error('Failed to initialize PriceService:', error);
        }
    }

    /**
     * Build a map of aliases to ingredient keys for fast matching
     */
    buildAliasMap() {
        if (!ingredientsData?.ingredients) return;

        for (const [key, ingredient] of Object.entries(ingredientsData.ingredients)) {
            // Map the key itself
            this.aliasMap.set(key.toLowerCase(), key);

            // Map the display name
            this.aliasMap.set(ingredient.name.toLowerCase(), key);

            // Map all aliases
            if (ingredient.aliases) {
                for (const alias of ingredient.aliases) {
                    this.aliasMap.set(alias.toLowerCase(), key);
                }
            }
        }
    }

    /**
     * Match an item name to a known ingredient
     * @param {string} itemName - Item name from shopping data
     * @returns {string|null} - Matched ingredient key or null
     */
    matchIngredient(itemName) {
        if (!itemName) return null;

        const normalized = itemName.toLowerCase().trim();

        // Direct match
        if (this.aliasMap.has(normalized)) {
            return this.aliasMap.get(normalized);
        }

        // Partial match - check if item contains any alias
        for (const [alias, key] of this.aliasMap) {
            if (normalized.includes(alias) || alias.includes(normalized)) {
                return key;
            }
        }

        return null;
    }

    /**
     * Process a shopping trip and extract prices
     * @param {Object} trip - Shopping trip data
     * @returns {Object} - Extracted price data { matched: [], unmatched: [] }
     */
    processTripPrices(trip) {
        const matched = [];
        const unmatched = [];

        if (!trip?.items) return { matched, unmatched };

        for (const item of trip.items) {
            const ingredientKey = this.matchIngredient(item.name);

            if (ingredientKey && item.cost > 0) {
                matched.push({
                    ingredientKey,
                    originalName: item.name,
                    cost: item.cost,
                    quantity: item.quantity,
                    store: item.store,
                    date: trip.date,
                    tripNumber: trip.tripNumber
                });
            } else if (item.cost > 0) {
                unmatched.push({
                    name: item.name,
                    cost: item.cost,
                    quantity: item.quantity,
                    store: item.store
                });
            }
        }

        return { matched, unmatched };
    }

    /**
     * Add a price record for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @param {Object} priceData - Price data { cost, quantity, store, date, tripNumber }
     */
    addPriceRecord(ingredientKey, priceData) {
        const prices = getState('ingredientPrices') || {};

        if (!prices[ingredientKey]) {
            prices[ingredientKey] = {
                records: [],
                averagePrice: 0,
                lowestPrice: null,
                highestPrice: null,
                preferredStore: null,
                lastUpdated: null
            };
        }

        // Add record
        prices[ingredientKey].records.push({
            ...priceData,
            timestamp: Date.now()
        });

        // Recalculate metrics
        this.recalculateMetrics(prices[ingredientKey]);

        // Update state
        setState({ ingredientPrices: prices });

        // Emit event
        emit(EVENTS.PRICE_UPDATED, { ingredientKey, prices: prices[ingredientKey] });
    }

    /**
     * Recalculate price metrics for an ingredient
     * @param {Object} priceEntry - Price entry to update
     */
    recalculateMetrics(priceEntry) {
        const records = priceEntry.records;
        if (!records.length) return;

        // Calculate average
        const total = records.reduce((sum, r) => sum + r.cost, 0);
        priceEntry.averagePrice = Math.round((total / records.length) * 100) / 100;

        // Find lowest and highest
        let lowest = records[0];
        let highest = records[0];

        for (const record of records) {
            if (record.cost < lowest.cost) lowest = record;
            if (record.cost > highest.cost) highest = record;
        }

        priceEntry.lowestPrice = { cost: lowest.cost, store: lowest.store, date: lowest.date };
        priceEntry.highestPrice = { cost: highest.cost, store: highest.store, date: highest.date };

        // Find preferred store (most frequent with good prices)
        const storeStats = {};
        for (const record of records) {
            if (!record.store) continue;
            if (!storeStats[record.store]) {
                storeStats[record.store] = { count: 0, totalCost: 0 };
            }
            storeStats[record.store].count++;
            storeStats[record.store].totalCost += record.cost;
        }

        let preferredStore = null;
        let bestScore = -1;

        for (const [store, stats] of Object.entries(storeStats)) {
            const avgCost = stats.totalCost / stats.count;
            // Score = frequency * (1 / normalized cost) - prefer frequent + cheap
            const score = stats.count * (priceEntry.averagePrice / avgCost);
            if (score > bestScore) {
                bestScore = score;
                preferredStore = store;
            }
        }

        priceEntry.preferredStore = preferredStore;
        priceEntry.lastUpdated = new Date().toISOString();
    }

    /**
     * Handle shopping trips changes
     * @param {Array} trips - Updated trips array
     */
    onTripsChanged(trips) {
        if (!trips?.length) return;

        // Process each trip
        for (const trip of trips) {
            const { matched } = this.processTripPrices(trip);

            for (const priceData of matched) {
                // Check if this record already exists (avoid duplicates)
                const existing = this.getPriceRecords(priceData.ingredientKey);
                const isDuplicate = existing.some(r =>
                    r.tripNumber === priceData.tripNumber &&
                    r.cost === priceData.cost
                );

                if (!isDuplicate) {
                    this.addPriceRecord(priceData.ingredientKey, priceData);
                }
            }
        }
    }

    /**
     * Import prices from shopping data (bulk import)
     * @param {Array} trips - Array of shopping trips
     * @returns {Object} - Import results { imported: number, skipped: number, unmatched: [] }
     */
    importFromTrips(trips) {
        let imported = 0;
        let skipped = 0;
        const allUnmatched = [];

        for (const trip of trips) {
            const { matched, unmatched } = this.processTripPrices(trip);

            for (const priceData of matched) {
                const existing = this.getPriceRecords(priceData.ingredientKey);
                const isDuplicate = existing.some(r =>
                    r.tripNumber === priceData.tripNumber &&
                    r.cost === priceData.cost
                );

                if (!isDuplicate) {
                    this.addPriceRecord(priceData.ingredientKey, priceData);
                    imported++;
                } else {
                    skipped++;
                }
            }

            allUnmatched.push(...unmatched);
        }

        return { imported, skipped, unmatched: allUnmatched };
    }

    /**
     * Get price records for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Array} - Price records
     */
    getPriceRecords(ingredientKey) {
        const prices = getState('ingredientPrices') || {};
        return prices[ingredientKey]?.records || [];
    }

    /**
     * Get price summary for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Object|null} - Price summary or null
     */
    getPriceSummary(ingredientKey) {
        const prices = getState('ingredientPrices') || {};
        return prices[ingredientKey] || null;
    }

    /**
     * Get the current/average price for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {number} - Average price or 0
     */
    getPrice(ingredientKey) {
        const summary = this.getPriceSummary(ingredientKey);
        return summary?.averagePrice || 0;
    }

    /**
     * Calculate the cost of a meal based on tracked prices
     * @param {Object} meal - Meal object with ingredients array
     * @returns {Object} - { totalCost, costPerServing, breakdown, missing }
     */
    calculateMealCost(meal) {
        const breakdown = [];
        const missing = [];
        let totalCost = 0;

        if (!meal?.ingredients) {
            return { totalCost: 0, costPerServing: 0, breakdown: [], missing: [] };
        }

        for (const ingredient of meal.ingredients) {
            // Try to match by name
            const key = this.matchIngredient(ingredient.name);
            const price = key ? this.getPrice(key) : 0;

            if (price > 0) {
                // Get ingredient data for unit conversion
                const ingredientData = ingredientsData?.ingredients?.[key];
                let estimatedCost = price;

                // If we have grams and typical quantity info, estimate proportional cost
                if (ingredient.grams && ingredientData?.gramsPerTypical) {
                    const ratio = ingredient.grams / ingredientData.gramsPerTypical;
                    estimatedCost = price * ratio;
                }

                breakdown.push({
                    name: ingredient.name,
                    ingredientKey: key,
                    quantity: ingredient.display || `${ingredient.grams}g`,
                    unitPrice: price,
                    estimatedCost: Math.round(estimatedCost * 100) / 100
                });

                totalCost += estimatedCost;
            } else {
                missing.push({
                    name: ingredient.name,
                    quantity: ingredient.display || `${ingredient.grams}g`
                });
            }
        }

        const servings = meal.servings || 6;

        return {
            totalCost: Math.round(totalCost * 100) / 100,
            costPerServing: Math.round((totalCost / servings) * 100) / 100,
            breakdown,
            missing
        };
    }

    /**
     * Get price trends for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Object} - { trend: 'up'|'down'|'stable', changePercent, records }
     */
    getPriceTrend(ingredientKey) {
        const records = this.getPriceRecords(ingredientKey);

        if (records.length < 2) {
            return { trend: 'stable', changePercent: 0, records };
        }

        // Sort by date/timestamp
        const sorted = [...records].sort((a, b) => {
            const dateA = a.timestamp || new Date(a.date).getTime();
            const dateB = b.timestamp || new Date(b.date).getTime();
            return dateA - dateB;
        });

        // Compare first and last thirds
        const third = Math.floor(sorted.length / 3);
        const early = sorted.slice(0, Math.max(third, 1));
        const recent = sorted.slice(-Math.max(third, 1));

        const earlyAvg = early.reduce((sum, r) => sum + r.cost, 0) / early.length;
        const recentAvg = recent.reduce((sum, r) => sum + r.cost, 0) / recent.length;

        const changePercent = Math.round(((recentAvg - earlyAvg) / earlyAvg) * 100);

        let trend = 'stable';
        if (changePercent > 5) trend = 'up';
        else if (changePercent < -5) trend = 'down';

        return { trend, changePercent, records: sorted };
    }

    /**
     * Get all price data
     * @returns {Object} - All ingredient prices
     */
    getAllPrices() {
        return getState('ingredientPrices') || {};
    }

    /**
     * Get store comparison for an ingredient
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Object} - Store comparison data
     */
    getStoreComparison(ingredientKey) {
        const records = this.getPriceRecords(ingredientKey);
        const byStore = {};

        for (const record of records) {
            const store = record.store || 'Unknown';
            if (!byStore[store]) {
                byStore[store] = { prices: [], count: 0 };
            }
            byStore[store].prices.push(record.cost);
            byStore[store].count++;
        }

        const comparison = {};
        for (const [store, data] of Object.entries(byStore)) {
            const avg = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
            comparison[store] = {
                averagePrice: Math.round(avg * 100) / 100,
                minPrice: Math.min(...data.prices),
                maxPrice: Math.max(...data.prices),
                purchaseCount: data.count
            };
        }

        return comparison;
    }

    /**
     * Clear all price data
     */
    clearPrices() {
        setState({ ingredientPrices: {} });
    }
}

// Create singleton instance
const priceService = new PriceService();

// Export
export { PriceService, priceService };
export default priceService;
