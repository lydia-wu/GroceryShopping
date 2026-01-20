/**
 * Nutrition Module
 * USDA FoodData Central API integration for comprehensive nutrition data
 */

import CONFIG from './config.js';

class NutritionAPI {
    constructor() {
        this.apiKey = CONFIG.usdaApiKey;
        this.baseUrl = 'https://api.nal.usda.gov/fdc/v1';
        this.cache = new Map();
        this.cacheKey = 'nutrition_cache';

        // Demo mode when API key not configured
        this.demoMode = this.apiKey === 'YOUR_USDA_API_KEY' || !this.apiKey;

        // Load cache from localStorage
        this.loadCache();
    }

    /**
     * Load cache from localStorage
     */
    loadCache() {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const data = JSON.parse(cached);
                this.cache = new Map(Object.entries(data));
            }
        } catch (e) {
            console.warn('Failed to load nutrition cache:', e);
        }
    }

    /**
     * Save cache to localStorage
     */
    saveCache() {
        try {
            const data = Object.fromEntries(this.cache);
            localStorage.setItem(this.cacheKey, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save nutrition cache:', e);
        }
    }

    /**
     * Search for foods in USDA database
     */
    async searchFood(query) {
        if (this.demoMode) {
            return this.getDemoSearchResults(query);
        }

        const cacheKey = `search_${query.toLowerCase()}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/foods/search?api_key=${this.apiKey}&query=${encodeURIComponent(query)}&pageSize=5`
            );

            if (!response.ok) {
                throw new Error(`USDA API error: ${response.status}`);
            }

            const data = await response.json();
            const results = data.foods || [];

            this.cache.set(cacheKey, results);
            this.saveCache();

            return results;
        } catch (error) {
            console.error('USDA search error:', error);
            return this.getDemoSearchResults(query);
        }
    }

    /**
     * Get detailed nutrition for a food by FDC ID
     */
    async getFoodDetails(fdcId) {
        if (this.demoMode) {
            return this.getDemoNutrition(fdcId);
        }

        const cacheKey = `food_${fdcId}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/food/${fdcId}?api_key=${this.apiKey}`
            );

            if (!response.ok) {
                throw new Error(`USDA API error: ${response.status}`);
            }

            const data = await response.json();

            this.cache.set(cacheKey, data);
            this.saveCache();

            return data;
        } catch (error) {
            console.error('USDA food details error:', error);
            return this.getDemoNutrition(fdcId);
        }
    }

    /**
     * Get nutrition summary for an ingredient
     */
    async getIngredientNutrition(ingredientName, amount = 100, unit = 'g') {
        const searchResults = await this.searchFood(ingredientName);

        if (!searchResults || searchResults.length === 0) {
            return null;
        }

        // Use first result (best match)
        const food = searchResults[0];
        const nutrients = this.extractNutrients(food);

        // Scale by amount
        const scale = amount / 100;
        return this.scaleNutrients(nutrients, scale);
    }

    /**
     * Calculate total nutrition for a meal
     */
    async getMealNutrition(meal) {
        const ingredients = meal.ingredients || [];
        const totals = this.getEmptyNutrients();

        for (const ingredient of ingredients) {
            const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
            const amount = ingredient.grams || 100; // Default to 100g if not specified

            const nutrition = await this.getIngredientNutrition(name, amount);
            if (nutrition) {
                this.addNutrients(totals, nutrition);
            }
        }

        return totals;
    }

    /**
     * Get nutrition per serving for a meal
     */
    async getMealNutritionPerServing(meal) {
        const total = await this.getMealNutrition(meal);
        const servings = meal.servings || 1;
        return this.scaleNutrients(total, 1 / servings);
    }

    /**
     * Extract nutrients from USDA food data
     */
    extractNutrients(food) {
        const nutrients = this.getEmptyNutrients();
        const foodNutrients = food.foodNutrients || [];

        // Map USDA nutrient IDs to our structure
        const nutrientMap = {
            1008: 'calories',
            1003: 'protein',
            1005: 'carbs',
            1004: 'fat',
            1079: 'fiber',
            2000: 'sugar',
            // Vitamins
            1106: 'vitaminA',
            1162: 'vitaminC',
            1114: 'vitaminD',
            1109: 'vitaminE',
            1183: 'vitaminK',
            1165: 'vitaminB1',
            1166: 'vitaminB2',
            1167: 'vitaminB3',
            1170: 'vitaminB6',
            1178: 'vitaminB12',
            1177: 'folate',
            // Minerals
            1087: 'calcium',
            1089: 'iron',
            1090: 'magnesium',
            1091: 'phosphorus',
            1092: 'potassium',
            1093: 'sodium',
            1095: 'zinc',
            // Others
            1253: 'cholesterol',
            1258: 'saturatedFat',
            1292: 'omega3'
        };

        for (const n of foodNutrients) {
            const id = n.nutrientId || n.number;
            const value = n.value || n.amount || 0;

            if (nutrientMap[id]) {
                nutrients[nutrientMap[id]] = value;
            }
        }

        return nutrients;
    }

    /**
     * Get empty nutrients object
     */
    getEmptyNutrients() {
        return {
            // Macros
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            // Vitamins
            vitaminA: 0,
            vitaminC: 0,
            vitaminD: 0,
            vitaminE: 0,
            vitaminK: 0,
            vitaminB1: 0,
            vitaminB2: 0,
            vitaminB3: 0,
            vitaminB6: 0,
            vitaminB12: 0,
            folate: 0,
            // Minerals
            calcium: 0,
            iron: 0,
            magnesium: 0,
            phosphorus: 0,
            potassium: 0,
            sodium: 0,
            zinc: 0,
            // Others
            cholesterol: 0,
            saturatedFat: 0,
            omega3: 0
        };
    }

    /**
     * Scale nutrients by a factor
     */
    scaleNutrients(nutrients, scale) {
        const scaled = {};
        for (const key in nutrients) {
            scaled[key] = Math.round(nutrients[key] * scale * 10) / 10;
        }
        return scaled;
    }

    /**
     * Add nutrients from source to target
     */
    addNutrients(target, source) {
        for (const key in source) {
            target[key] = (target[key] || 0) + (source[key] || 0);
        }
    }

    /**
     * Get daily value percentages
     */
    getDailyValuePercent(nutrients) {
        // Daily values based on FDA guidelines
        const dailyValues = {
            calories: 2000,
            protein: 50,
            carbs: 275,
            fat: 78,
            fiber: 28,
            sugar: 50,
            vitaminA: 900, // mcg
            vitaminC: 90, // mg
            vitaminD: 20, // mcg
            vitaminE: 15, // mg
            vitaminK: 120, // mcg
            vitaminB1: 1.2, // mg
            vitaminB2: 1.3, // mg
            vitaminB3: 16, // mg
            vitaminB6: 1.7, // mg
            vitaminB12: 2.4, // mcg
            folate: 400, // mcg
            calcium: 1300, // mg
            iron: 18, // mg
            magnesium: 420, // mg
            phosphorus: 1250, // mg
            potassium: 4700, // mg
            sodium: 2300, // mg
            zinc: 11, // mg
            cholesterol: 300, // mg
            saturatedFat: 20 // g
        };

        const percentages = {};
        for (const key in nutrients) {
            if (dailyValues[key]) {
                percentages[key] = Math.round((nutrients[key] / dailyValues[key]) * 100);
            }
        }
        return percentages;
    }

    /**
     * Get fun facts for nutrition
     */
    getFunFacts(nutrients, ingredients = []) {
        const facts = [];

        // High protein
        if (nutrients.protein > 30) {
            facts.push({ icon: '💪', text: 'High protein meal' });
        }

        // Good fiber
        if (nutrients.fiber > 8) {
            facts.push({ icon: '🌾', text: 'Excellent fiber source' });
        }

        // Rich in Vitamin C
        if (nutrients.vitaminC > 45) {
            facts.push({ icon: '🍊', text: 'Rich in Vitamin C' });
        }

        // High in Vitamin A
        if (nutrients.vitaminA > 450) {
            facts.push({ icon: '🥕', text: 'High in Vitamin A' });
        }

        // Good omega-3
        if (nutrients.omega3 > 500) {
            facts.push({ icon: '🐟', text: 'Good omega-3 source' });
        }

        // Check for kale (antioxidants)
        const hasKale = ingredients.some(i =>
            (typeof i === 'string' ? i : i.name).toLowerCase().includes('kale')
        );
        if (hasKale) {
            facts.push({ icon: '🥬', text: 'High in antioxidants (kale)' });
        }

        // Check for complete protein (has chicken, turkey, or fish + grains)
        const hasProtein = ingredients.some(i => {
            const name = (typeof i === 'string' ? i : i.name).toLowerCase();
            return name.includes('chicken') || name.includes('turkey') ||
                   name.includes('mackerel') || name.includes('fish');
        });
        if (hasProtein && nutrients.protein > 25) {
            facts.push({ icon: '🍗', text: 'Complete protein meal' });
        }

        // Low sodium
        if (nutrients.sodium < 500) {
            facts.push({ icon: '🧂', text: 'Low sodium' });
        }

        return facts;
    }

    /**
     * Get demo search results
     */
    getDemoSearchResults(query) {
        const normalizedQuery = query.toLowerCase();

        // Demo data for common ingredients
        const demoFoods = {
            'chicken': [{ fdcId: 'demo_chicken', description: 'Chicken breast, raw', foodNutrients: this.getDemoNutrientList('chicken') }],
            'kale': [{ fdcId: 'demo_kale', description: 'Kale, raw', foodNutrients: this.getDemoNutrientList('kale') }],
            'pasta': [{ fdcId: 'demo_pasta', description: 'Pasta, dry', foodNutrients: this.getDemoNutrientList('pasta') }],
            'turkey': [{ fdcId: 'demo_turkey', description: 'Turkey, ground, raw', foodNutrients: this.getDemoNutrientList('turkey') }],
            'mackerel': [{ fdcId: 'demo_mackerel', description: 'Mackerel, canned', foodNutrients: this.getDemoNutrientList('mackerel') }],
            'barley': [{ fdcId: 'demo_barley', description: 'Barley, pearl, raw', foodNutrients: this.getDemoNutrientList('barley') }],
            'egg': [{ fdcId: 'demo_egg', description: 'Egg, whole, raw', foodNutrients: this.getDemoNutrientList('egg') }],
            'cauliflower': [{ fdcId: 'demo_cauliflower', description: 'Cauliflower, raw', foodNutrients: this.getDemoNutrientList('cauliflower') }],
            'sweet potato': [{ fdcId: 'demo_sweetpotato', description: 'Sweet potato, raw', foodNutrients: this.getDemoNutrientList('sweetpotato') }],
            'feta': [{ fdcId: 'demo_feta', description: 'Cheese, feta', foodNutrients: this.getDemoNutrientList('feta') }]
        };

        for (const key in demoFoods) {
            if (normalizedQuery.includes(key)) {
                return demoFoods[key];
            }
        }

        // Default generic food
        return [{ fdcId: 'demo_generic', description: query, foodNutrients: this.getDemoNutrientList('generic') }];
    }

    /**
     * Get demo nutrient list
     */
    getDemoNutrientList(foodType) {
        const nutrientData = {
            chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, vitaminB6: 0.5 },
            kale: { calories: 49, protein: 4.3, carbs: 9, fat: 0.9, fiber: 3.6, vitaminA: 500, vitaminC: 120, vitaminK: 390 },
            pasta: { calories: 371, protein: 13, carbs: 75, fat: 1.5, fiber: 3.2 },
            turkey: { calories: 149, protein: 20, carbs: 0, fat: 7.7, fiber: 0 },
            mackerel: { calories: 205, protein: 19, carbs: 0, fat: 14, fiber: 0, omega3: 2670 },
            barley: { calories: 354, protein: 12, carbs: 73, fat: 2.3, fiber: 17 },
            egg: { calories: 147, protein: 12, carbs: 0.8, fat: 10, fiber: 0, vitaminB12: 1.1, vitaminD: 2.2 },
            cauliflower: { calories: 25, protein: 2, carbs: 5, fat: 0.3, fiber: 2, vitaminC: 48 },
            sweetpotato: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, vitaminA: 709 },
            feta: { calories: 264, protein: 14, carbs: 4, fat: 21, fiber: 0, calcium: 493 },
            generic: { calories: 100, protein: 5, carbs: 15, fat: 3, fiber: 2 }
        };

        const data = nutrientData[foodType] || nutrientData.generic;

        return [
            { nutrientId: 1008, value: data.calories || 0 },
            { nutrientId: 1003, value: data.protein || 0 },
            { nutrientId: 1005, value: data.carbs || 0 },
            { nutrientId: 1004, value: data.fat || 0 },
            { nutrientId: 1079, value: data.fiber || 0 },
            { nutrientId: 2000, value: data.sugar || 0 },
            { nutrientId: 1106, value: data.vitaminA || 0 },
            { nutrientId: 1162, value: data.vitaminC || 0 },
            { nutrientId: 1114, value: data.vitaminD || 0 },
            { nutrientId: 1183, value: data.vitaminK || 0 },
            { nutrientId: 1170, value: data.vitaminB6 || 0 },
            { nutrientId: 1178, value: data.vitaminB12 || 0 },
            { nutrientId: 1087, value: data.calcium || 0 },
            { nutrientId: 1089, value: data.iron || 0 },
            { nutrientId: 1092, value: data.potassium || 0 },
            { nutrientId: 1093, value: data.sodium || 0 },
            { nutrientId: 1292, value: data.omega3 || 0 }
        ];
    }

    /**
     * Get demo nutrition data
     */
    getDemoNutrition(fdcId) {
        return {
            fdcId: fdcId,
            description: 'Demo food item',
            foodNutrients: this.getDemoNutrientList('generic')
        };
    }

    /**
     * Format nutrient value for display
     */
    formatNutrient(value, unit = 'g') {
        if (value >= 1000) {
            return `${(value / 1000).toFixed(1)}k${unit}`;
        }
        return `${Math.round(value * 10) / 10}${unit}`;
    }

    /**
     * Check if in demo mode
     */
    isDemoMode() {
        return this.demoMode;
    }

    /**
     * Clear nutrition cache
     */
    clearCache() {
        this.cache.clear();
        localStorage.removeItem(this.cacheKey);
    }
}

// Export singleton instance
const nutritionAPI = new NutritionAPI();
export default nutritionAPI;
