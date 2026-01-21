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
        console.log(`Looking up ingredient: "${ingredientName}" (${amount}g)`);

        const searchResults = await this.searchFood(ingredientName);
        console.log(`Search results for "${ingredientName}":`, searchResults?.length, searchResults?.[0]?.description);

        if (!searchResults || searchResults.length === 0) {
            console.warn(`No results found for: ${ingredientName}`);
            return null;
        }

        // Use first result (best match)
        const food = searchResults[0];
        const nutrients = this.extractNutrients(food);
        console.log(`Extracted nutrients for "${ingredientName}":`, nutrients.calories, 'cal,', nutrients.protein, 'g protein');

        // Scale by amount
        const scale = amount / 100;
        return this.scaleNutrients(nutrients, scale);
    }

    /**
     * Calculate total nutrition for a meal
     */
    async getMealNutrition(meal) {
        const ingredients = meal.ingredients || [];
        console.log(`Calculating nutrition for meal: ${meal.name}, ${ingredients.length} ingredients`);

        const totals = this.getEmptyNutrients();

        for (const ingredient of ingredients) {
            const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
            const amount = ingredient.grams || 100; // Default to 100g if not specified

            console.log(`Processing ingredient: ${name} (${amount}g)`);

            const nutrition = await this.getIngredientNutrition(name, amount);
            if (nutrition) {
                this.addNutrients(totals, nutrition);
            } else {
                console.warn(`No nutrition data for: ${name}`);
            }
        }

        console.log(`Meal totals:`, totals.calories, 'cal,', totals.protein, 'g protein');
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
            1103: 'selenium',
            1101: 'manganese',
            // Others
            1253: 'cholesterol',
            1258: 'saturatedFat',
            1292: 'omega3',
            1180: 'choline',
            9999: 'lycopene' // Custom ID for our demo data
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
            selenium: 0,
            manganese: 0,
            // Others
            cholesterol: 0,
            saturatedFat: 0,
            omega3: 0,
            choline: 0,
            lycopene: 0
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
        // Daily values based on FDA guidelines (2020 update)
        const dailyValues = {
            calories: 2000,
            protein: 50, // g
            carbs: 275, // g
            fat: 78, // g
            fiber: 28, // g
            sugar: 50, // g
            vitaminA: 900, // mcg RAE
            vitaminC: 90, // mg
            vitaminD: 20, // mcg
            vitaminE: 15, // mg
            vitaminK: 120, // mcg
            vitaminB1: 1.2, // mg (thiamin)
            vitaminB2: 1.3, // mg (riboflavin)
            vitaminB3: 16, // mg (niacin)
            vitaminB6: 1.7, // mg
            vitaminB12: 2.4, // mcg
            folate: 400, // mcg DFE
            calcium: 1300, // mg
            iron: 18, // mg
            magnesium: 420, // mg
            phosphorus: 1250, // mg
            potassium: 4700, // mg
            sodium: 2300, // mg
            zinc: 11, // mg
            selenium: 55, // mcg
            manganese: 2.3, // mg
            choline: 550, // mg
            cholesterol: 300, // mg
            saturatedFat: 20, // g
            omega3: 1600 // mg (ALA recommendation)
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
     * Get comprehensive health benefits based on "Eat to Beat Disease" concepts
     * Focuses on 5 defense systems: Angiogenesis, Regeneration, Microbiome, DNA Protection, Immunity
     */
    getFunFacts(nutrients, ingredients = []) {
        const facts = [];
        const ingredientNames = ingredients.map(i =>
            (typeof i === 'string' ? i : i.name).toLowerCase()
        );

        // Helper to check if ingredient is present
        const hasIngredient = (keywords) =>
            ingredientNames.some(name => keywords.some(k => name.includes(k)));

        // ===================
        // HEART HEALTH
        // ===================
        if (nutrients.omega3 > 400) {
            facts.push({
                icon: '❤️',
                text: 'Heart-protective omega-3s reduce inflammation and lower heart disease risk by up to 35%',
                category: 'heart'
            });
        }
        if (hasIngredient(['olive oil'])) {
            facts.push({
                icon: '❤️',
                text: 'Extra virgin olive oil contains oleocanthal, which has similar anti-inflammatory effects to ibuprofen',
                category: 'heart'
            });
        }
        if (hasIngredient(['garlic'])) {
            facts.push({
                icon: '❤️',
                text: 'Garlic\'s allicin compounds can lower blood pressure and reduce arterial plaque formation',
                category: 'heart'
            });
        }
        if (hasIngredient(['tomato', 'tomato sauce', 'tomato paste'])) {
            facts.push({
                icon: '❤️',
                text: 'Lycopene in cooked tomatoes reduces LDL cholesterol oxidation - cooking increases absorption 5x',
                category: 'heart'
            });
        }

        // ===================
        // BRAIN HEALTH
        // ===================
        if (nutrients.omega3 > 300) {
            facts.push({
                icon: '🧠',
                text: 'Omega-3 DHA is crucial for brain cell membranes - linked to 26% lower risk of dementia',
                category: 'brain'
            });
        }
        if (hasIngredient(['egg'])) {
            facts.push({
                icon: '🧠',
                text: 'Eggs provide choline, essential for acetylcholine production (memory neurotransmitter)',
                category: 'brain'
            });
        }
        if (hasIngredient(['kale'])) {
            facts.push({
                icon: '🧠',
                text: 'Kale\'s lutein crosses the blood-brain barrier, protecting neurons from oxidative damage',
                category: 'brain'
            });
        }
        if (hasIngredient(['pomegranate'])) {
            facts.push({
                icon: '🧠',
                text: 'Pomegranate urolithins improve memory by enhancing mitochondrial function in brain cells',
                category: 'brain'
            });
        }

        // ===================
        // CANCER PREVENTION (Angiogenesis)
        // ===================
        if (hasIngredient(['kale', 'cauliflower'])) {
            facts.push({
                icon: '🛡️',
                text: 'Cruciferous vegetables contain sulforaphane - shown to starve cancer cells by blocking blood vessel growth',
                category: 'cancer'
            });
        }
        if (hasIngredient(['tomato', 'tomato sauce', 'tomato paste'])) {
            facts.push({
                icon: '🛡️',
                text: 'Lycopene is anti-angiogenic - helps prevent tumors from developing their blood supply',
                category: 'cancer'
            });
        }
        if (hasIngredient(['garlic'])) {
            facts.push({
                icon: '🛡️',
                text: 'Garlic compounds inhibit cancer cell proliferation - studies show 30% lower colorectal cancer risk',
                category: 'cancer'
            });
        }
        if (hasIngredient(['parsley', 'dill', 'oregano', 'thyme', 'rosemary'])) {
            facts.push({
                icon: '🛡️',
                text: 'Mediterranean herbs contain apigenin and rosmarinic acid - powerful anti-angiogenic compounds',
                category: 'cancer'
            });
        }

        // ===================
        // GUT HEALTH (Microbiome)
        // ===================
        if (nutrients.fiber > 6) {
            facts.push({
                icon: '🦠',
                text: `${Math.round(nutrients.fiber)}g fiber feeds beneficial gut bacteria, producing anti-inflammatory short-chain fatty acids`,
                category: 'gut'
            });
        }
        if (hasIngredient(['barley'])) {
            facts.push({
                icon: '🦠',
                text: 'Barley\'s beta-glucan fiber is prebiotic gold - increases Bifidobacteria by up to 60%',
                category: 'gut'
            });
        }
        if (hasIngredient(['yogurt'])) {
            facts.push({
                icon: '🦠',
                text: 'Live yogurt cultures support microbiome diversity - linked to better immune function and mood',
                category: 'gut'
            });
        }
        if (hasIngredient(['garlic'])) {
            facts.push({
                icon: '🦠',
                text: 'Garlic\'s inulin selectively feeds beneficial Lactobacillus strains',
                category: 'gut'
            });
        }
        if (hasIngredient(['avocado'])) {
            facts.push({
                icon: '🦠',
                text: 'Avocado fiber and fats increase microbial diversity and beneficial bacteria abundance',
                category: 'gut'
            });
        }

        // ===================
        // MUSCLE & RECOVERY
        // ===================
        if (nutrients.protein > 25) {
            facts.push({
                icon: '💪',
                text: `${Math.round(nutrients.protein)}g complete protein supports muscle protein synthesis - optimal for recovery`,
                category: 'muscle'
            });
        }
        if (hasIngredient(['chicken', 'turkey']) && nutrients.protein > 20) {
            facts.push({
                icon: '💪',
                text: 'Lean poultry provides all essential amino acids with high leucine content for muscle building',
                category: 'muscle'
            });
        }
        if (hasIngredient(['egg'])) {
            facts.push({
                icon: '💪',
                text: 'Egg protein has the highest biological value (100) - the gold standard for protein quality',
                category: 'muscle'
            });
        }

        // ===================
        // DNA PROTECTION
        // ===================
        if (nutrients.vitaminC > 30) {
            facts.push({
                icon: '🧬',
                text: 'Vitamin C protects DNA from oxidative damage and supports collagen synthesis for tissue repair',
                category: 'dna'
            });
        }
        if (hasIngredient(['sweet potato', 'carrot'])) {
            facts.push({
                icon: '🧬',
                text: 'Beta-carotene acts as an antioxidant shield, protecting cell DNA from free radical damage',
                category: 'dna'
            });
        }
        if (nutrients.folate > 50) {
            facts.push({
                icon: '🧬',
                text: 'Folate is essential for DNA synthesis and repair - crucial for cell division and growth',
                category: 'dna'
            });
        }

        // ===================
        // IMMUNITY
        // ===================
        if (nutrients.vitaminC > 40) {
            facts.push({
                icon: '🛡️',
                text: `${Math.round(nutrients.vitaminC)}mg Vitamin C enhances white blood cell function and antibody production`,
                category: 'immune'
            });
        }
        if (hasIngredient(['ginger'])) {
            facts.push({
                icon: '🔥',
                text: 'Ginger\'s gingerols have potent anti-inflammatory and antimicrobial properties',
                category: 'immune'
            });
        }
        if (nutrients.zinc > 2) {
            facts.push({
                icon: '🛡️',
                text: 'Zinc is critical for immune cell development - deficiency impairs T-cell function',
                category: 'immune'
            });
        }

        // ===================
        // STEM CELL REGENERATION
        // ===================
        if (hasIngredient(['mackerel'])) {
            facts.push({
                icon: '🔄',
                text: 'Fatty fish omega-3s stimulate stem cell activity, supporting tissue regeneration',
                category: 'regeneration'
            });
        }
        if (hasIngredient(['pomegranate'])) {
            facts.push({
                icon: '🔄',
                text: 'Pomegranate activates stem cells and promotes cellular renewal through urolithin A',
                category: 'regeneration'
            });
        }
        if (hasIngredient(['kale', 'parsley'])) {
            facts.push({
                icon: '🔄',
                text: 'Dark leafy greens support bone marrow stem cell function through vitamin K and folate',
                category: 'regeneration'
            });
        }

        // ===================
        // BLOOD SUGAR & METABOLISM
        // ===================
        if (hasIngredient(['barley'])) {
            facts.push({
                icon: '📊',
                text: 'Barley has one of the lowest glycemic indexes of any grain - helps stabilize blood sugar for hours',
                category: 'metabolism'
            });
        }
        if (hasIngredient(['cauliflower'])) {
            facts.push({
                icon: '📊',
                text: 'Cauliflower rice has 80% fewer carbs than regular rice - great for blood sugar control',
                category: 'metabolism'
            });
        }
        if (hasIngredient(['cayenne', 'chili'])) {
            facts.push({
                icon: '🔥',
                text: 'Capsaicin boosts metabolism and increases fat burning through thermogenesis',
                category: 'metabolism'
            });
        }
        if (nutrients.fiber > 8 && nutrients.protein > 20) {
            facts.push({
                icon: '📊',
                text: 'High fiber + protein combo promotes satiety and prevents blood sugar spikes',
                category: 'metabolism'
            });
        }

        // ===================
        // BONE HEALTH
        // ===================
        if (nutrients.calcium > 150) {
            facts.push({
                icon: '🦴',
                text: `${Math.round(nutrients.calcium)}mg calcium supports bone density - combined with vitamin K for optimal absorption`,
                category: 'bone'
            });
        }
        if (nutrients.vitaminK > 50) {
            facts.push({
                icon: '🦴',
                text: 'Vitamin K activates osteocalcin, directing calcium into bones instead of arteries',
                category: 'bone'
            });
        }

        // ===================
        // EYE HEALTH
        // ===================
        if (hasIngredient(['kale', 'egg'])) {
            facts.push({
                icon: '👁️',
                text: 'Lutein and zeaxanthin protect the macula - reduces age-related macular degeneration risk by 43%',
                category: 'eye'
            });
        }
        if (nutrients.vitaminA > 300) {
            facts.push({
                icon: '👁️',
                text: 'Vitamin A is essential for rhodopsin production - supports night vision and eye health',
                category: 'eye'
            });
        }

        // ===================
        // SKIN HEALTH
        // ===================
        if (hasIngredient(['avocado'])) {
            facts.push({
                icon: '✨',
                text: 'Avocado\'s healthy fats and vitamin E nourish skin from within, improving elasticity',
                category: 'skin'
            });
        }
        if (nutrients.vitaminC > 30 && hasIngredient(['lemon', 'lime', 'tomato'])) {
            facts.push({
                icon: '✨',
                text: 'Vitamin C is essential for collagen synthesis - keeps skin firm and promotes wound healing',
                category: 'skin'
            });
        }

        // Shuffle and limit to 6 most diverse facts
        const diverseFacts = this.selectDiverseFacts(facts, 6);

        return diverseFacts;
    }

    /**
     * Select diverse facts across different categories
     */
    selectDiverseFacts(facts, limit) {
        if (facts.length <= limit) return facts;

        const categories = [...new Set(facts.map(f => f.category))];
        const selected = [];

        // First, pick one from each category
        for (const cat of categories) {
            if (selected.length >= limit) break;
            const catFacts = facts.filter(f => f.category === cat);
            if (catFacts.length > 0) {
                selected.push(catFacts[0]);
            }
        }

        // Fill remaining slots
        const remaining = facts.filter(f => !selected.includes(f));
        for (const fact of remaining) {
            if (selected.length >= limit) break;
            selected.push(fact);
        }

        return selected;
    }

    /**
     * Get demo search results
     */
    getDemoSearchResults(query) {
        const normalizedQuery = query.toLowerCase().trim();

        // Comprehensive demo data for all meal ingredients
        const demoFoods = {
            'chicken': [{ fdcId: 'demo_chicken', description: 'Chicken breast, raw', foodNutrients: this.getDemoNutrientList('chicken') }],
            'chicken breast': [{ fdcId: 'demo_chicken', description: 'Chicken breast, raw', foodNutrients: this.getDemoNutrientList('chicken') }],
            'kale': [{ fdcId: 'demo_kale', description: 'Kale, raw', foodNutrients: this.getDemoNutrientList('kale') }],
            'pasta': [{ fdcId: 'demo_pasta', description: 'Pasta, protein', foodNutrients: this.getDemoNutrientList('pasta') }],
            'turkey': [{ fdcId: 'demo_turkey', description: 'Turkey, ground, raw', foodNutrients: this.getDemoNutrientList('turkey') }],
            'ground turkey': [{ fdcId: 'demo_turkey', description: 'Turkey, ground, raw', foodNutrients: this.getDemoNutrientList('turkey') }],
            'mackerel': [{ fdcId: 'demo_mackerel', description: 'Mackerel, canned', foodNutrients: this.getDemoNutrientList('mackerel') }],
            'barley': [{ fdcId: 'demo_barley', description: 'Barley, pearl, cooked', foodNutrients: this.getDemoNutrientList('barley') }],
            'egg': [{ fdcId: 'demo_egg', description: 'Egg, whole, raw', foodNutrients: this.getDemoNutrientList('egg') }],
            'cauliflower': [{ fdcId: 'demo_cauliflower', description: 'Cauliflower, riced', foodNutrients: this.getDemoNutrientList('cauliflower') }],
            'sweet potato': [{ fdcId: 'demo_sweetpotato', description: 'Sweet potato, baked', foodNutrients: this.getDemoNutrientList('sweetpotato') }],
            'feta': [{ fdcId: 'demo_feta', description: 'Cheese, feta', foodNutrients: this.getDemoNutrientList('feta') }],
            'parmesan': [{ fdcId: 'demo_parmesan', description: 'Cheese, parmesan', foodNutrients: this.getDemoNutrientList('parmesan') }],
            'avocado': [{ fdcId: 'demo_avocado', description: 'Avocado, raw', foodNutrients: this.getDemoNutrientList('avocado') }],
            'tomato': [{ fdcId: 'demo_tomato', description: 'Tomato, raw', foodNutrients: this.getDemoNutrientList('tomato') }],
            'tomato sauce': [{ fdcId: 'demo_tomatosauce', description: 'Tomato sauce', foodNutrients: this.getDemoNutrientList('tomatosauce') }],
            'tomato paste': [{ fdcId: 'demo_tomatopaste', description: 'Tomato paste', foodNutrients: this.getDemoNutrientList('tomatopaste') }],
            'olive oil': [{ fdcId: 'demo_oliveoil', description: 'Olive oil, extra virgin', foodNutrients: this.getDemoNutrientList('oliveoil') }],
            'garlic': [{ fdcId: 'demo_garlic', description: 'Garlic, raw', foodNutrients: this.getDemoNutrientList('garlic') }],
            'lemon': [{ fdcId: 'demo_lemon', description: 'Lemon, raw', foodNutrients: this.getDemoNutrientList('lemon') }],
            'lemon juice': [{ fdcId: 'demo_lemonjuice', description: 'Lemon juice', foodNutrients: this.getDemoNutrientList('lemonjuice') }],
            'lime': [{ fdcId: 'demo_lime', description: 'Lime, raw', foodNutrients: this.getDemoNutrientList('lime') }],
            'honey': [{ fdcId: 'demo_honey', description: 'Honey', foodNutrients: this.getDemoNutrientList('honey') }],
            'maple syrup': [{ fdcId: 'demo_maple', description: 'Maple syrup, pure', foodNutrients: this.getDemoNutrientList('maple') }],
            'maple': [{ fdcId: 'demo_maple', description: 'Maple syrup, pure', foodNutrients: this.getDemoNutrientList('maple') }],
            'yogurt': [{ fdcId: 'demo_yogurt', description: 'Yogurt, plain, whole milk', foodNutrients: this.getDemoNutrientList('yogurt') }],
            'cucumber': [{ fdcId: 'demo_cucumber', description: 'Cucumber, raw', foodNutrients: this.getDemoNutrientList('cucumber') }],
            'dill': [{ fdcId: 'demo_dill', description: 'Dill, fresh', foodNutrients: this.getDemoNutrientList('dill') }],
            'parsley': [{ fdcId: 'demo_parsley', description: 'Parsley, fresh', foodNutrients: this.getDemoNutrientList('parsley') }],
            'pomegranate': [{ fdcId: 'demo_pomegranate', description: 'Pomegranate arils', foodNutrients: this.getDemoNutrientList('pomegranate') }],
            'pistachio': [{ fdcId: 'demo_pistachio', description: 'Pistachios, raw', foodNutrients: this.getDemoNutrientList('pistachio') }],
            'pistachios': [{ fdcId: 'demo_pistachio', description: 'Pistachios, raw', foodNutrients: this.getDemoNutrientList('pistachio') }],
            'carrot': [{ fdcId: 'demo_carrot', description: 'Carrots, raw', foodNutrients: this.getDemoNutrientList('carrot') }],
            'carrots': [{ fdcId: 'demo_carrot', description: 'Carrots, raw', foodNutrients: this.getDemoNutrientList('carrot') }],
            'celery': [{ fdcId: 'demo_celery', description: 'Celery, raw', foodNutrients: this.getDemoNutrientList('celery') }],
            'zucchini': [{ fdcId: 'demo_zucchini', description: 'Zucchini, raw', foodNutrients: this.getDemoNutrientList('zucchini') }],
            'eggplant': [{ fdcId: 'demo_eggplant', description: 'Eggplant, raw', foodNutrients: this.getDemoNutrientList('eggplant') }],
            'ginger': [{ fdcId: 'demo_ginger', description: 'Ginger root, raw', foodNutrients: this.getDemoNutrientList('ginger') }],
            'peas': [{ fdcId: 'demo_peas', description: 'Peas, green, frozen', foodNutrients: this.getDemoNutrientList('peas') }],
            'peas and carrots': [{ fdcId: 'demo_peascarrots', description: 'Peas and carrots, frozen', foodNutrients: this.getDemoNutrientList('peascarrots') }],
            'breadcrumbs': [{ fdcId: 'demo_breadcrumbs', description: 'Breadcrumbs, homemade', foodNutrients: this.getDemoNutrientList('breadcrumbs') }],
            'thyme': [{ fdcId: 'demo_thyme', description: 'Thyme, dried', foodNutrients: this.getDemoNutrientList('thyme') }],
            'oregano': [{ fdcId: 'demo_oregano', description: 'Oregano, dried', foodNutrients: this.getDemoNutrientList('oregano') }],
            'rosemary': [{ fdcId: 'demo_rosemary', description: 'Rosemary, dried', foodNutrients: this.getDemoNutrientList('rosemary') }],
            'italian seasoning': [{ fdcId: 'demo_italian', description: 'Italian seasoning blend', foodNutrients: this.getDemoNutrientList('italian') }],
            'cayenne': [{ fdcId: 'demo_cayenne', description: 'Cayenne pepper', foodNutrients: this.getDemoNutrientList('cayenne') }],
            'garlic powder': [{ fdcId: 'demo_garlicpowder', description: 'Garlic powder', foodNutrients: this.getDemoNutrientList('garlicpowder') }]
        };

        // First try exact match
        if (demoFoods[normalizedQuery]) {
            return demoFoods[normalizedQuery];
        }

        // Then try partial match, preferring longer matches
        const matches = Object.keys(demoFoods)
            .filter(key => normalizedQuery.includes(key) || key.includes(normalizedQuery))
            .sort((a, b) => b.length - a.length); // Longer matches first

        if (matches.length > 0) {
            return demoFoods[matches[0]];
        }

        // Default generic food
        return [{ fdcId: 'demo_generic', description: query, foodNutrients: this.getDemoNutrientList('generic') }];
    }

    /**
     * Get demo nutrient list - comprehensive per 100g values
     */
    getDemoNutrientList(foodType) {
        // Nutritional data per 100g (based on USDA values)
        const nutrientData = {
            // Proteins
            chicken: { calories: 165, protein: 31, carbs: 0, fat: 3.6, fiber: 0, vitaminB6: 0.6, vitaminB12: 0.3, zinc: 1.0, selenium: 27, iron: 1.0 },
            turkey: { calories: 149, protein: 20, carbs: 0, fat: 7.7, fiber: 0, vitaminB6: 0.5, vitaminB12: 1.1, zinc: 2.4, selenium: 24, iron: 1.1 },
            mackerel: { calories: 205, protein: 19, carbs: 0, fat: 14, fiber: 0, omega3: 2670, vitaminB12: 8.7, vitaminD: 16, selenium: 44 },
            egg: { calories: 147, protein: 12.6, carbs: 0.8, fat: 10, fiber: 0, vitaminB12: 1.1, vitaminD: 2.2, vitaminA: 160, choline: 294, selenium: 31 },

            // Vegetables
            kale: { calories: 49, protein: 4.3, carbs: 9, fat: 0.9, fiber: 3.6, vitaminA: 500, vitaminC: 120, vitaminK: 390, calcium: 150, iron: 1.5, potassium: 491 },
            sweetpotato: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1, fiber: 3, vitaminA: 709, vitaminC: 2.4, potassium: 337, manganese: 0.26 },
            cauliflower: { calories: 25, protein: 2, carbs: 5, fat: 0.3, fiber: 2, vitaminC: 48, vitaminK: 16, folate: 57, choline: 45 },
            carrot: { calories: 41, protein: 0.9, carbs: 10, fat: 0.2, fiber: 2.8, vitaminA: 835, vitaminK: 13, potassium: 320 },
            celery: { calories: 16, protein: 0.7, carbs: 3, fat: 0.2, fiber: 1.6, vitaminK: 29, potassium: 260, folate: 36 },
            zucchini: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3, fiber: 1, vitaminC: 18, potassium: 261, manganese: 0.18 },
            eggplant: { calories: 25, protein: 1, carbs: 6, fat: 0.2, fiber: 3, potassium: 229, folate: 22, vitaminK: 3.5 },
            cucumber: { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1, fiber: 0.5, vitaminK: 16, potassium: 147, vitaminC: 2.8 },
            tomato: { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, fiber: 1.2, vitaminC: 14, vitaminA: 42, potassium: 237, lycopene: 2573 },
            tomatosauce: { calories: 29, protein: 1.3, carbs: 6.3, fat: 0.2, fiber: 1.5, vitaminC: 7, vitaminA: 26, potassium: 331, lycopene: 15900 },
            tomatopaste: { calories: 82, protein: 4.3, carbs: 19, fat: 0.5, fiber: 4.1, vitaminC: 21, vitaminA: 75, potassium: 1014, lycopene: 28764, iron: 2.3 },
            avocado: { calories: 160, protein: 2, carbs: 8.5, fat: 15, fiber: 7, vitaminK: 21, vitaminE: 2.1, vitaminC: 10, potassium: 485, folate: 81 },
            pomegranate: { calories: 83, protein: 1.7, carbs: 19, fat: 1.2, fiber: 4, vitaminC: 10, vitaminK: 16, potassium: 236, folate: 38 },
            ginger: { calories: 80, protein: 1.8, carbs: 18, fat: 0.8, fiber: 2, potassium: 415, magnesium: 43, vitaminB6: 0.16 },
            garlic: { calories: 149, protein: 6.4, carbs: 33, fat: 0.5, fiber: 2.1, vitaminC: 31, vitaminB6: 1.2, manganese: 1.7, selenium: 14 },
            peas: { calories: 81, protein: 5.4, carbs: 14, fat: 0.4, fiber: 5.1, vitaminC: 40, vitaminK: 25, folate: 65, iron: 1.5 },
            peascarrots: { calories: 53, protein: 3, carbs: 10, fat: 0.3, fiber: 3.5, vitaminA: 400, vitaminC: 20, vitaminK: 15, fiber: 3.5 },

            // Grains
            barley: { calories: 123, protein: 2.3, carbs: 28, fat: 0.4, fiber: 3.8, selenium: 8.6, manganese: 0.26, magnesium: 22, iron: 1.3 },
            pasta: { calories: 131, protein: 25, carbs: 25, fat: 1.5, fiber: 7.9, iron: 1.3, selenium: 26 }, // Brami protein pasta
            breadcrumbs: { calories: 395, protein: 13, carbs: 72, fat: 5.3, fiber: 4.5, iron: 4.8, sodium: 732 },

            // Dairy
            feta: { calories: 264, protein: 14, carbs: 4, fat: 21, fiber: 0, calcium: 493, vitaminB12: 1.7, sodium: 917, phosphorus: 337 },
            parmesan: { calories: 431, protein: 38, carbs: 4, fat: 29, fiber: 0, calcium: 1184, vitaminB12: 1.2, phosphorus: 694, sodium: 1529 },
            yogurt: { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3, fiber: 0, calcium: 121, vitaminB12: 0.5, potassium: 155, phosphorus: 95 },

            // Fats/Oils
            oliveoil: { calories: 884, protein: 0, carbs: 0, fat: 100, fiber: 0, vitaminE: 14, vitaminK: 60 },

            // Fruits/Citrus
            lemon: { calories: 29, protein: 1.1, carbs: 9, fat: 0.3, fiber: 2.8, vitaminC: 53, potassium: 138, folate: 11 },
            lemonjuice: { calories: 22, protein: 0.4, carbs: 6.9, fat: 0.2, fiber: 0.3, vitaminC: 39, potassium: 103 },
            lime: { calories: 30, protein: 0.7, carbs: 11, fat: 0.2, fiber: 2.8, vitaminC: 29, potassium: 102 },

            // Sweeteners
            honey: { calories: 304, protein: 0.3, carbs: 82, fat: 0, fiber: 0.2, potassium: 52, vitaminC: 0.5 },
            maple: { calories: 260, protein: 0, carbs: 67, fat: 0.1, fiber: 0, manganese: 2.9, zinc: 1.5, calcium: 102, potassium: 212 },

            // Herbs & Spices
            dill: { calories: 43, protein: 3.5, carbs: 7, fat: 1.1, fiber: 2.1, vitaminA: 386, vitaminC: 85, calcium: 208, iron: 6.6, manganese: 1.3 },
            parsley: { calories: 36, protein: 3, carbs: 6.3, fat: 0.8, fiber: 3.3, vitaminA: 421, vitaminC: 133, vitaminK: 1640, iron: 6.2, folate: 152 },
            thyme: { calories: 276, protein: 9, carbs: 64, fat: 7.4, fiber: 37, vitaminC: 50, iron: 124, calcium: 1890, manganese: 7.9 },
            oregano: { calories: 265, protein: 9, carbs: 69, fat: 4.3, fiber: 43, vitaminK: 622, iron: 37, calcium: 1597, manganese: 5 },
            rosemary: { calories: 131, protein: 3.3, carbs: 21, fat: 5.9, fiber: 14, vitaminA: 146, vitaminC: 22, calcium: 317, iron: 6.7 },
            italian: { calories: 250, protein: 8, carbs: 55, fat: 5, fiber: 25, iron: 50, calcium: 1200, vitaminK: 400 },
            cayenne: { calories: 318, protein: 12, carbs: 57, fat: 17, fiber: 27, vitaminA: 2081, vitaminC: 76, vitaminE: 30, potassium: 2014 },
            garlicpowder: { calories: 331, protein: 17, carbs: 73, fat: 0.7, fiber: 9, vitaminB6: 1.7, iron: 5.7, calcium: 79, potassium: 1193 },

            // Nuts
            pistachio: { calories: 562, protein: 20, carbs: 28, fat: 45, fiber: 10, vitaminB6: 1.7, vitaminE: 2.9, potassium: 1025, magnesium: 121, iron: 3.9 },

            // Generic fallback
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
            { nutrientId: 1109, value: data.vitaminE || 0 },
            { nutrientId: 1183, value: data.vitaminK || 0 },
            { nutrientId: 1170, value: data.vitaminB6 || 0 },
            { nutrientId: 1178, value: data.vitaminB12 || 0 },
            { nutrientId: 1177, value: data.folate || 0 },
            { nutrientId: 1087, value: data.calcium || 0 },
            { nutrientId: 1089, value: data.iron || 0 },
            { nutrientId: 1090, value: data.magnesium || 0 },
            { nutrientId: 1092, value: data.potassium || 0 },
            { nutrientId: 1093, value: data.sodium || 0 },
            { nutrientId: 1095, value: data.zinc || 0 },
            { nutrientId: 1103, value: data.selenium || 0 },
            { nutrientId: 1101, value: data.manganese || 0 },
            { nutrientId: 1180, value: data.choline || 0 },
            { nutrientId: 1292, value: data.omega3 || 0 },
            { nutrientId: 9999, value: data.lycopene || 0 } // Custom for lycopene
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
