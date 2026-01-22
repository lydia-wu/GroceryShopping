// Dashboard Configuration
// Version: Update this when making changes for debugging
const CONFIG = {
    version: '1.0.0',

    // API Keys (replace with actual keys)
    // IMPORTANT: For production, consider using environment variables or a secure backend
    googleSheetsApiKey: 'YOUR_GOOGLE_SHEETS_API_KEY',
    googleSheetId: 'YOUR_GOOGLE_SHEET_ID',
    usdaApiKey: 'YOUR_USDA_API_KEY',

    // Excel file paths (relative to dashboard/index.html)
    excelUrls: {
        mealCostCalculator: '../MealCostCalculator.xlsx',
        actualShoppingData: '../Best_actualShoppingData.xlsx'
    },

    // Meal rotation configuration
    mealRotation: {
        defaultOrder: ['B', 'C', 'A', 'D', 'F', 'E'],
        maxMeals: 10,
        servingsPerDay: 2,

        // =====================================================================
        // SPENDING DATA DATE RANGE - Controls what appears in charts/analytics
        // =====================================================================
        // Search terms: "rotation start date", "spending date range", "chart date filter"
        //
        // rotationStartDate:
        //   - Set to a date string (e.g., '2025-12-01') to manually specify start date
        //   - Set to null for DYNAMIC calculation based on cooking history
        //   - Dynamic mode uses earliest cook date minus buffer for shelf-stable items
        //
        // shelfStableBufferDays:
        //   - Days BEFORE first cook date to include (for flour, frozen items, etc.)
        //   - Only used when rotationStartDate is null (dynamic mode)
        //   - Default: 14 days
        // =====================================================================
        rotationStartDate: null,  // null = dynamic based on cooking history
        shelfStableBufferDays: 14
    },

    // Meal definitions with actual ingredients
    meals: {
        'A': {
            code: 'A',
            name: 'Mackerel Meatball',
            servings: 5,
            prepTime: 30,
            cookTime: 25,
            ingredients: [
                { name: 'mackerel', grams: 340, display: '2 cans canned mackerel' },
                { name: 'egg', grams: 100, display: '2 eggs' },
                { name: 'breadcrumbs', grams: 60, display: '1 cup homemade breadcrumbs' },
                { name: 'yogurt', grams: 480, display: '2 cups homemade yogurt' },
                { name: 'kale', grams: 150, display: '1 bunch kale' },
                { name: 'cucumber', grams: 200, display: '⅔ cucumber' },
                { name: 'avocado', grams: 300, display: '2 avocados' },
                { name: 'feta', grams: 75, display: '½ cup feta cheese' },
                { name: 'tomato', grams: 379, display: '379g vine tomatoes' },
                { name: 'tomato paste', grams: 227, display: '8 oz tomato paste' },
                { name: 'dill', grams: 130, display: '0.29 lb fresh dill' },
                { name: 'parsley', grams: 30, display: '½ bunch parsley' },
                { name: 'lemon', grams: 60, display: '1 lemon' },
                { name: 'lime', grams: 50, display: '1 lime' },
                { name: 'olive oil', grams: 54, display: '4 tbsp olive oil' }
            ],
            instructions: 'Mix mackerel with eggs and breadcrumbs, form into balls. Bake at 400°F for 20-25 min. Serve with yogurt sauce and kale cucumber salad.',
            sides: ['Sourdough bread', 'Grapes', 'Yogurt parfait']
        },
        'B': {
            code: 'B',
            name: 'Kale & Chicken Pasta',
            servings: 6,
            prepTime: 20,
            cookTime: 30,
            ingredients: [
                { name: 'chicken breast', grams: 680, display: '2 packages chicken breast' },
                { name: 'pasta', grams: 340, display: '1 box Brami protein pasta' },
                { name: 'kale', grams: 150, display: '1 bunch kale' },
                { name: 'eggplant', grams: 270, display: '0.6 lb Chinese eggplant' },
                { name: 'feta', grams: 75, display: '½ cup feta cheese' },
                { name: 'parmesan', grams: 30, display: '⅛ block parmesan' },
                { name: 'lemon juice', grams: 240, display: '1 cup lemon juice' },
                { name: 'honey', grams: 170, display: '½ cup honey' },
                { name: 'olive oil', grams: 54, display: '4 tbsp olive oil' },
                { name: 'garlic', grams: 30, display: '2 tbsp minced garlic' },
                { name: 'thyme', grams: 8, display: '4 tsp dried thyme' },
                { name: 'oregano', grams: 8, display: '4 tsp dried oregano' }
            ],
            instructions: 'Cook pasta. Sauté chicken with garlic, thyme, oregano. Roast eggplant. Massage kale with lemon-honey dressing. Toss all together with feta and parmesan.',
            sides: ['Sourdough bread', 'Grapefruit', 'Yogurt parfait']
        },
        'C': {
            code: 'C',
            name: 'Warm Chicken Grain Bowl',
            servings: 8,
            prepTime: 25,
            cookTime: 45,
            ingredients: [
                { name: 'chicken breast', grams: 680, display: '2 packages chicken breast' },
                { name: 'kale', grams: 300, display: '2 bunches kale' },
                { name: 'sweet potato', grams: 600, display: '3 sweet potatoes' },
                { name: 'barley', grams: 315, display: '1¾ cups pearl barley' },
                { name: 'pomegranate', grams: 150, display: '1 cup pomegranate arils' },
                { name: 'pistachios', grams: 92, display: '3.25 oz shelled pistachios' },
                { name: 'feta', grams: 75, display: '½ cup feta cheese' },
                { name: 'parsley', grams: 30, display: '½ bunch parsley' },
                { name: 'parmesan', grams: 85, display: '3 oz parmesan' },
                { name: 'lemon juice', grams: 360, display: '1½ cups lemon juice' },
                { name: 'maple syrup', grams: 60, display: '3-4 tbsp maple syrup' },
                { name: 'olive oil', grams: 27, display: '2 tbsp olive oil' },
                { name: 'honey', grams: 42, display: '2 tbsp honey' },
                { name: 'garlic powder', grams: 6, display: '2 tsp garlic powder' },
                { name: 'rosemary', grams: 2, display: '1 tsp dried rosemary' },
                { name: 'thyme', grams: 2, display: '1 tsp dried thyme' }
            ],
            instructions: 'Pressure cook barley. Roast sweet potatoes at 350°F ~45 min. Bake chicken with lemon-maple marinade ~25 min. Make kale pesto. Assemble bowls.',
            sides: ['Sourdough bread']
        },
        'D': {
            code: 'D',
            name: 'Turkey Barley Soup',
            servings: 8,
            prepTime: 20,
            cookTime: 60,
            ingredients: [
                { name: 'ground turkey', grams: 1560, display: '2 packages (~3.44 lb) ground turkey' },
                { name: 'barley', grams: 180, display: '1 cup pearl barley' },
                { name: 'carrots', grams: 180, display: '3 carrots' },
                { name: 'celery', grams: 160, display: '4 stalks celery' },
                { name: 'tomato sauce', grams: 850, display: '2 cans tomato sauce' },
                { name: 'zucchini', grams: 450, display: '3 zucchinis' },
                { name: 'garlic', grams: 60, display: '1 large garlic knob + 4 tbsp minced' },
                { name: 'italian seasoning', grams: 15, display: '3 tbsp Italian seasoning' }
            ],
            instructions: 'Brown turkey with garlic. Add vegetables and cook 5 min. Add tomato sauce, barley, and water. Simmer 45-60 min until barley is tender.',
            sides: ['Roasted purple potatoes', 'Sliced apples', 'Grilled cheese', 'Yogurt']
        },
        'E': {
            code: 'E',
            name: 'Mackerel Cauliflower Fried Rice',
            servings: 6,
            prepTime: 15,
            cookTime: 20,
            ingredients: [
                { name: 'mackerel', grams: 170, display: '1 can canned mackerel' },
                { name: 'egg', grams: 300, display: '6 eggs' },
                { name: 'cauliflower', grams: 680, display: '2 packages riced cauliflower' },
                { name: 'peas and carrots', grams: 340, display: '1 bag frozen peas & carrots' },
                { name: 'ginger', grams: 30, display: '2 roots fresh ginger' },
                { name: 'garlic', grams: 60, display: '4 tbsp minced garlic' }
            ],
            instructions: 'Scramble eggs, set aside. Sauté ginger and garlic. Add cauliflower rice and peas/carrots. Flake in mackerel. Add eggs back. Season with soy sauce.',
            sides: ['Oranges', 'Grapes']
        },
        'F': {
            code: 'F',
            name: 'Turkey Spaghetti',
            servings: 6,
            prepTime: 15,
            cookTime: 30,
            ingredients: [
                { name: 'ground turkey', grams: 454, display: '1 package ground turkey' },
                { name: 'tomato sauce', grams: 1275, display: '3 cans tomato sauce' },
                { name: 'pasta', grams: 340, display: '1 box Brami protein pasta' },
                { name: 'kale', grams: 150, display: '1 bunch kale' },
                { name: 'garlic', grams: 60, display: '4 tbsp minced garlic' },
                { name: 'olive oil', grams: 54, display: '4 tbsp olive oil' },
                { name: 'italian seasoning', grams: 36, display: '12 tbsp Italian seasoning' },
                { name: 'cayenne', grams: 12, display: 'Cayenne pepper + misc spices' }
            ],
            instructions: 'Brown turkey with garlic and Italian seasonings. Add tomato sauce and simmer 20 min. Cook pasta. Massage raw kale. Serve pasta with sauce and kale side.',
            sides: ['Sliced apples with peanut butter', 'Sourdough bread', 'Raw kale salad']
        }
    },

    // Dietary restrictions
    dietaryRestrictions: [
        { item: 'onion', variants: ['onions', 'onion', 'shallot', 'shallots', 'scallion', 'scallions', 'green onion', 'green onions'] },
        { item: 'mushroom', variants: ['mushrooms', 'mushroom', 'shiitake', 'portobello', 'cremini'] },
        { item: 'broccoli', variants: ['broccoli', 'broccolini'] },
        { item: 'cow milk', variants: ['milk', 'whole milk', '2% milk', 'skim milk', 'cream', 'half-and-half', 'heavy cream', 'half and half'] }
    ],

    // Stores for shopping list
    stores: ['Costco', 'H-Mart', 'Safeway', 'Sprouts', 'Walmart', 'Grains from the Plains'],

    // Homemade staples to track
    staples: [
        { id: 'sourdough', name: 'Sourdough Bread', unit: 'loaves', defaultBatch: 3 },
        { id: 'yogurt', name: 'Yogurt', unit: 'pints', defaultBatch: 6.5 },
        { id: 'breadcrumbs', name: 'Breadcrumbs', unit: 'cups', defaultBatch: 4 }
    ],

    // Cache settings
    cache: {
        nutritionTTL: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        excelTTL: 60 * 60 * 1000 // 1 hour in milliseconds
    }
};

// Freeze config to prevent accidental modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.meals);
Object.freeze(CONFIG.mealRotation);
Object.freeze(CONFIG.dietaryRestrictions);
Object.freeze(CONFIG.staples);
Object.freeze(CONFIG.cache);

export default CONFIG;
