// Dashboard Configuration
// Version: Update this when making changes for debugging
const CONFIG = {
    version: '1.0.0',

    // API Keys (replace with actual keys)
    // IMPORTANT: For production, consider using environment variables or a secure backend
    googleSheetsApiKey: 'YOUR_GOOGLE_SHEETS_API_KEY',
    googleSheetId: 'YOUR_GOOGLE_SHEET_ID',
    usdaApiKey: 'YOUR_USDA_API_KEY',

    // GitHub raw file URLs for Excel data
    // Update these URLs if your repo is different
    excelUrls: {
        mealCostCalculator: 'https://raw.githubusercontent.com/lydia-wu/GroceryShopping/main/MealCostCalculator.xlsx',
        actualShoppingData: 'https://raw.githubusercontent.com/lydia-wu/GroceryShopping/main/2026_actualShoppingData.xlsx'
    },

    // Meal rotation configuration
    mealRotation: {
        defaultOrder: ['B', 'C', 'A', 'D', 'F', 'E'],
        maxMeals: 10,
        servingsPerDay: 2
    },

    // Meal definitions (will be updated from Google Sheets)
    meals: {
        'A': {
            code: 'A',
            name: 'Mackerel Meatball',
            servings: 5,
            prepTime: 30,
            cookTime: 25,
            ingredients: [],
            instructions: '',
            sides: ['Kale salad', 'Sourdough bread']
        },
        'B': {
            code: 'B',
            name: 'Kale & Chicken Pasta',
            servings: 6,
            prepTime: 20,
            cookTime: 30,
            ingredients: [],
            instructions: '',
            sides: ['Grapefruit']
        },
        'C': {
            code: 'C',
            name: 'Warm Chicken Grain Bowl',
            servings: 6,
            prepTime: 25,
            cookTime: 35,
            ingredients: [],
            instructions: '',
            sides: ['Pomegranate', 'Grapes']
        },
        'D': {
            code: 'D',
            name: 'Turkey Barley Soup',
            servings: 8,
            prepTime: 20,
            cookTime: 60,
            ingredients: [],
            instructions: '',
            sides: ['Sourdough bread']
        },
        'E': {
            code: 'E',
            name: 'Mackerel Cauliflower Fried Rice',
            servings: 6,
            prepTime: 15,
            cookTime: 20,
            ingredients: [],
            instructions: '',
            sides: ['Grapes']
        },
        'F': {
            code: 'F',
            name: 'Turkey Spaghetti',
            servings: 6,
            prepTime: 15,
            cookTime: 30,
            ingredients: [],
            instructions: '',
            sides: ['Kale salad']
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
