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
            const response = await fetch('./data/ingredients.json');
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
     * Prioritizes exact matches, then form-specific (dried/fresh), then partial
     * @param {string} itemName - Item name from shopping data
     * @returns {string|null} - Matched ingredient key or null
     */
    matchIngredient(itemName) {
        if (!itemName) return null;

        const normalized = itemName.toLowerCase().trim();

        // Direct exact match (highest priority)
        if (this.aliasMap.has(normalized)) {
            return this.aliasMap.get(normalized);
        }

        // Check for form modifiers (dried, fresh, ground, etc.)
        const hasDried = normalized.includes('dried') || normalized.includes('dry');
        const hasFresh = normalized.includes('fresh');
        const hasGround = normalized.includes('ground');
        const hasCanned = normalized.includes('canned') || normalized.includes('can ');

        // Collect all potential matches with scores
        const matches = [];

        for (const [alias, key] of this.aliasMap) {
            let score = 0;

            // Check for match
            if (normalized.includes(alias) || alias.includes(normalized)) {
                score = 1;

                // Bonus for longer alias matches (more specific)
                score += alias.length / 100;

                // Form matching bonuses/penalties
                const aliasHasDried = alias.includes('dried') || alias.includes('dry');
                const aliasHasFresh = alias.includes('fresh');
                const aliasHasGround = alias.includes('ground');
                const aliasHasCanned = alias.includes('canned') || alias.includes('can ');

                // Big bonus if forms match
                if (hasDried && aliasHasDried) score += 10;
                if (hasFresh && aliasHasFresh) score += 10;
                if (hasGround && aliasHasGround) score += 10;
                if (hasCanned && aliasHasCanned) score += 10;

                // Penalty if forms mismatch
                if (hasDried && aliasHasFresh) score -= 5;
                if (hasFresh && aliasHasDried) score -= 5;

                // Exact word boundary match bonus
                const wordPattern = new RegExp(`\\b${alias}\\b`);
                if (wordPattern.test(normalized)) score += 5;

                matches.push({ alias, key, score });
            }
        }

        if (matches.length === 0) return null;

        // Return best match
        matches.sort((a, b) => b.score - a.score);
        return matches[0].key;
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
     * Get the LATEST (most recent) price for an ingredient
     * Per user requirement: cost should auto-update to latest price, not average
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Object} - { price, date, store } or null if no data
     */
    getLatestPrice(ingredientKey) {
        const records = this.getPriceRecords(ingredientKey);
        if (!records || records.length === 0) return null;

        // Sort by date (most recent first)
        const sorted = [...records].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });

        const latest = sorted[0];
        return {
            price: latest.cost,
            date: latest.date,
            store: latest.store,
            quantity: latest.quantity
        };
    }

    /**
     * Get all ingredients with missing price data
     * Used for warning users about incomplete pricing
     * @returns {Array} - Array of ingredient keys without price data
     */
    getMissingPriceIngredients() {
        const prices = getState('ingredientPrices') || {};
        const allIngredients = ingredientsData?.ingredients || {};
        const missing = [];

        for (const key of Object.keys(allIngredients)) {
            if (!prices[key] || !prices[key].records || prices[key].records.length === 0) {
                missing.push({
                    key,
                    name: allIngredients[key].name,
                    category: allIngredients[key].category
                });
            }
        }

        return missing;
    }

    /**
     * Check if an ingredient has price data
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {boolean} - True if has price data
     */
    hasPriceData(ingredientKey) {
        const records = this.getPriceRecords(ingredientKey);
        return records && records.length > 0;
    }

    /**
     * Get homemade cost for staples (sourdough, yogurt, breadcrumbs)
     * These have pre-calculated costs based on ingredient costs
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {Object|null} - { cost, notes, isHomemade } or null
     */
    getHomemadeCost(ingredientKey) {
        const ingredient = ingredientsData?.ingredients?.[ingredientKey];
        if (!ingredient || !ingredient.isHomemade) return null;

        return {
            cost: ingredient.homemadeCostPerUnit || 0,
            notes: ingredient.homemadeCostNotes || '',
            isHomemade: true,
            typicalQuantity: ingredient.typicalQuantity,
            gramsPerTypical: ingredient.gramsPerTypical
        };
    }

    /**
     * Get effective price per gram, using shopping data OR homemade cost
     * Prioritizes actual shopping data, falls back to homemade cost
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {number} - Price per gram or 0 if no data
     */
    getEffectivePricePerGram(ingredientKey) {
        // First try shopping data
        const shoppingPrice = this.getPricePerGram(ingredientKey);
        if (shoppingPrice > 0) return shoppingPrice;

        // Fall back to homemade cost
        const homemade = this.getHomemadeCost(ingredientKey);
        if (homemade && homemade.cost > 0 && homemade.gramsPerTypical > 0) {
            return homemade.cost / homemade.gramsPerTypical;
        }

        return 0;
    }

    /**
     * Calculate the cost of a meal based on tracked prices
     * Uses price-per-unit calculation to estimate proportional costs
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

            if (key) {
                // Get price per gram - uses shopping data OR homemade costs
                const pricePerGram = this.getEffectivePricePerGram(key);
                const unitInfo = this.getUnitInfo(key);
                const homemadeInfo = this.getHomemadeCost(key);

                if (pricePerGram > 0 && ingredient.grams) {
                    // Calculate cost based on grams needed
                    const estimatedCost = pricePerGram * ingredient.grams;

                    breakdown.push({
                        name: ingredient.name,
                        ingredientKey: key,
                        quantity: ingredient.display || `${ingredient.grams}g`,
                        unit: unitInfo?.unit || 'unit',
                        pricePerUnit: unitInfo?.pricePerUnit ? Math.round(unitInfo.pricePerUnit * 100) / 100 : null,
                        gramsUsed: ingredient.grams,
                        estimatedCost: Math.round(estimatedCost * 100) / 100,
                        isHomemade: homemadeInfo?.isHomemade || false
                    });

                    totalCost += estimatedCost;
                } else {
                    missing.push({
                        name: ingredient.name,
                        quantity: ingredient.display || `${ingredient.grams}g`,
                        reason: pricePerGram === 0 ? 'no price data' : 'no grams specified'
                    });
                }
            } else {
                missing.push({
                    name: ingredient.name,
                    quantity: ingredient.display || `${ingredient.grams}g`,
                    reason: 'ingredient not matched'
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
     * Get price per gram for an ingredient (for accurate cost calculations)
     * Uses MOST RECENT purchase price
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {object} - { pricePerGram, unit, debug } or null if no data
     */
    getPricePerGram(ingredientKey) {
        const records = this.getPriceRecords(ingredientKey);
        if (!records || records.length === 0) return 0;

        // Get ingredient metadata
        const ingredientData = ingredientsData?.ingredients?.[ingredientKey];
        const gramsPerTypical = ingredientData?.gramsPerTypical || 100;
        const typicalQuantity = ingredientData?.typicalQuantity || '1 unit';

        // Sort by date (most recent first)
        const sorted = [...records].sort((a, b) => {
            const dateA = a.date ? new Date(a.date) : new Date(0);
            const dateB = b.date ? new Date(b.date) : new Date(0);
            return dateB - dateA;
        });

        // Use most recent purchase
        const mostRecent = sorted[0];
        const cost = mostRecent.cost || 0;
        let qty = parseFloat(mostRecent.quantity);
        let units = (mostRecent.units || '').toLowerCase().trim();

        if (cost <= 0) return 0;

        // Handle NaN or missing quantity
        if (isNaN(qty) || qty <= 0) {
            // Try to parse from item name (e.g., "@$2.49/lb" or "3 count")
            const itemName = (mostRecent.originalName || '').toLowerCase();
            const lbMatch = itemName.match(/(\d+(?:\.\d+)?)\s*lb/);
            const ozMatch = itemName.match(/(\d+(?:\.\d+)?)\s*oz/);
            const countMatch = itemName.match(/(\d+)\s*(?:count|cnt|pack|cans?)/);

            if (lbMatch) {
                qty = parseFloat(lbMatch[1]);
                units = 'lb';
            } else if (ozMatch) {
                qty = parseFloat(ozMatch[1]);
                units = 'oz';
            } else if (countMatch) {
                qty = parseFloat(countMatch[1]);
                units = 'cnt';
            } else {
                // Default: assume 1 typical unit
                qty = 1;
                units = 'cnt';
            }
        }

        // Convert quantity to grams based on units
        let totalGrams;
        let unitLabel = units || 'unit';

        switch (units) {
            case 'oz':
                totalGrams = qty * 28.35;
                unitLabel = 'oz';
                break;
            case 'lb':
                totalGrams = qty * 453.6;
                unitLabel = 'lb';
                break;
            case 'kg':
                totalGrams = qty * 1000;
                unitLabel = 'kg';
                break;
            case 'g':
                totalGrams = qty;
                unitLabel = 'g';
                break;
            case 'l':
            case 'liter':
                totalGrams = qty * 1000;
                unitLabel = 'L';
                break;
            case 'ml':
                totalGrams = qty;
                unitLabel = 'mL';
                break;
            case 'fl oz':
                totalGrams = qty * 29.57;
                unitLabel = 'fl oz';
                break;
            case 'gal':
                totalGrams = qty * 3785;
                unitLabel = 'gal';
                break;
            case 'cnt':
            case 'count':
            case 'each':
            case 'bunch':
            case '':
                // For count items, use gramsPerTypical
                totalGrams = qty * gramsPerTypical;
                unitLabel = typicalQuantity;
                break;
            default:
                // Try to be smart about unknown units
                if (units.includes('oz')) {
                    totalGrams = qty * 28.35;
                    unitLabel = 'oz';
                } else if (units.includes('lb')) {
                    totalGrams = qty * 453.6;
                    unitLabel = 'lb';
                } else {
                    // Default: assume count-based
                    totalGrams = qty * gramsPerTypical;
                    unitLabel = typicalQuantity;
                }
        }

        // Store unit info for display
        this._lastUnitInfo = this._lastUnitInfo || {};
        this._lastUnitInfo[ingredientKey] = {
            unit: unitLabel,
            pricePerUnit: cost / qty,
            totalGrams,
            qty,
            cost
        };

        return cost / totalGrams;
    }

    /**
     * Get unit info for last price lookup (for display purposes)
     */
    getUnitInfo(ingredientKey) {
        return this._lastUnitInfo?.[ingredientKey] || null;
    }

    /**
     * Get price per typical unit for an ingredient (for display)
     * Uses MOST RECENT purchase price
     * @param {string} ingredientKey - Ingredient identifier
     * @returns {number} - Price per typical unit or 0 if no data
     */
    getPricePerUnit(ingredientKey) {
        const pricePerGram = this.getPricePerGram(ingredientKey);
        if (pricePerGram === 0) return 0;

        // Get typical quantity in grams
        const ingredientData = ingredientsData?.ingredients?.[ingredientKey];
        const gramsPerTypical = ingredientData?.gramsPerTypical || 100;

        return pricePerGram * gramsPerTypical;
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
