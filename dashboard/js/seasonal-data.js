/**
 * Seasonal Data Module
 * Contains US seasonal produce data and Colorado-specific local produce
 */

// National "In Season" produce by month (available fresh anywhere in US)
export const SEASONAL_PRODUCE = {
    // January
    1: {
        fruits: [
            'Citrus (oranges, lemons, limes)',
            'Grapefruit',
            'Apples',
            'Pears',
            'Pomegranate',
            'Persimmon',
            'Kiwi',
            'Cranberries',
            'Dates',
            'Passion fruit'
        ],
        vegetables: [
            'Kale',
            'Cabbage',
            'Carrots',
            'Potatoes',
            'Beets',
            'Turnips',
            'Parsnips',
            'Winter squash',
            'Brussels sprouts',
            'Leeks'
        ]
    },
    // February
    2: {
        fruits: [
            'Citrus (oranges, lemons, limes)',
            'Grapefruit',
            'Apples',
            'Pears',
            'Kiwi',
            'Kumquats',
            'Blood oranges',
            'Tangerines',
            'Meyer lemons',
            'Passion fruit'
        ],
        vegetables: [
            'Kale',
            'Cabbage',
            'Carrots',
            'Potatoes',
            'Beets',
            'Turnips',
            'Parsnips',
            'Winter squash',
            'Brussels sprouts',
            'Leeks'
        ]
    },
    // March
    3: {
        fruits: [
            'Citrus (oranges, lemons, limes)',
            'Grapefruit',
            'Pineapple',
            'Mangoes',
            'Papaya',
            'Kiwi',
            'Blood oranges',
            'Tangerines',
            'Strawberries (early)',
            'Kumquats'
        ],
        vegetables: [
            'Artichokes',
            'Asparagus (early)',
            'Kale',
            'Spinach',
            'Lettuce',
            'Radishes',
            'Green onions',
            'Carrots',
            'Cabbage',
            'Turnips'
        ]
    },
    // April
    4: {
        fruits: [
            'Strawberries',
            'Citrus',
            'Pineapple',
            'Mangoes',
            'Papaya',
            'Rhubarb',
            'Apricots (late)',
            'Cherries (early)',
            'Kiwi',
            'Avocados'
        ],
        vegetables: [
            'Asparagus',
            'Artichokes',
            'Peas',
            'Spinach',
            'Lettuce',
            'Radishes',
            'Green onions',
            'Fava beans',
            'Spring onions',
            'Arugula'
        ]
    },
    // May
    5: {
        fruits: [
            'Strawberries',
            'Cherries',
            'Apricots',
            'Rhubarb',
            'Mangoes',
            'Pineapple',
            'Blueberries (early)',
            'Peaches (early)',
            'Lychee',
            'Avocados'
        ],
        vegetables: [
            'Asparagus',
            'Peas',
            'Spinach',
            'Lettuce',
            'Radishes',
            'Artichokes',
            'Fava beans',
            'Green beans',
            'Zucchini (early)',
            'Snap peas'
        ]
    },
    // June
    6: {
        fruits: [
            'Strawberries',
            'Cherries',
            'Blueberries',
            'Raspberries',
            'Peaches',
            'Apricots',
            'Plums',
            'Nectarines',
            'Watermelon',
            'Cantaloupe'
        ],
        vegetables: [
            'Tomatoes (early)',
            'Corn',
            'Zucchini',
            'Summer squash',
            'Green beans',
            'Cucumbers',
            'Bell peppers',
            'Eggplant',
            'Peas',
            'Beets'
        ]
    },
    // July
    7: {
        fruits: [
            'Peaches',
            'Blueberries',
            'Raspberries',
            'Blackberries',
            'Watermelon',
            'Cantaloupe',
            'Honeydew',
            'Nectarines',
            'Plums',
            'Cherries'
        ],
        vegetables: [
            'Tomatoes',
            'Corn',
            'Zucchini',
            'Summer squash',
            'Cucumbers',
            'Bell peppers',
            'Eggplant',
            'Green beans',
            'Okra',
            'Swiss chard'
        ]
    },
    // August
    8: {
        fruits: [
            'Peaches',
            'Nectarines',
            'Plums',
            'Blackberries',
            'Blueberries',
            'Watermelon',
            'Cantaloupe',
            'Grapes',
            'Figs',
            'Melons'
        ],
        vegetables: [
            'Tomatoes',
            'Corn',
            'Zucchini',
            'Bell peppers',
            'Eggplant',
            'Cucumbers',
            'Green beans',
            'Summer squash',
            'Okra',
            'Peppers (hot)'
        ]
    },
    // September
    9: {
        fruits: [
            'Apples',
            'Pears',
            'Grapes',
            'Figs',
            'Plums',
            'Pomegranate (early)',
            'Melons',
            'Peaches (late)',
            'Raspberries',
            'Blackberries'
        ],
        vegetables: [
            'Tomatoes',
            'Corn (late)',
            'Winter squash (early)',
            'Pumpkin',
            'Bell peppers',
            'Eggplant',
            'Broccoli',
            'Cauliflower',
            'Brussels sprouts',
            'Kale'
        ]
    },
    // October
    10: {
        fruits: [
            'Apples',
            'Pears',
            'Pomegranate',
            'Cranberries',
            'Grapes',
            'Persimmon',
            'Quince',
            'Figs (late)',
            'Passion fruit',
            'Kiwi (early)'
        ],
        vegetables: [
            'Pumpkin',
            'Winter squash',
            'Brussels sprouts',
            'Kale',
            'Cauliflower',
            'Broccoli',
            'Beets',
            'Carrots',
            'Parsnips',
            'Sweet potatoes'
        ]
    },
    // November
    11: {
        fruits: [
            'Apples',
            'Pears',
            'Pomegranate',
            'Cranberries',
            'Persimmon',
            'Citrus (early)',
            'Kiwi',
            'Quince',
            'Dates',
            'Tangerines'
        ],
        vegetables: [
            'Pumpkin',
            'Winter squash',
            'Brussels sprouts',
            'Kale',
            'Cabbage',
            'Carrots',
            'Parsnips',
            'Turnips',
            'Sweet potatoes',
            'Rutabaga'
        ]
    },
    // December
    12: {
        fruits: [
            'Citrus (oranges, lemons, limes)',
            'Grapefruit',
            'Pomegranate',
            'Cranberries',
            'Apples',
            'Pears',
            'Persimmon',
            'Kiwi',
            'Tangerines',
            'Dates'
        ],
        vegetables: [
            'Kale',
            'Cabbage',
            'Carrots',
            'Potatoes',
            'Beets',
            'Turnips',
            'Parsnips',
            'Winter squash',
            'Brussels sprouts',
            'Leeks'
        ]
    }
};

// Colorado-specific local produce (grown in Colorado)
export const COLORADO_LOCAL = {
    // Winter (Dec-Feb) - Storage crops, greenhouse greens
    winter: [
        'Potatoes',
        'Carrots',
        'Beets',
        'Turnips',
        'Parsnips',
        'Cabbage',
        'Winter squash',
        'Greenhouse lettuce',
        'Greenhouse spinach',
        'Greenhouse herbs'
    ],
    // Spring (Mar-May)
    spring: [
        'Asparagus',
        'Spinach',
        'Lettuce',
        'Radishes',
        'Peas',
        'Green onions',
        'Rhubarb',
        'Arugula',
        'Kale',
        'Swiss chard'
    ],
    // Summer (Jun-Aug)
    summer: [
        'Peaches (Palisade)',
        'Sweet corn',
        'Tomatoes',
        'Bell peppers',
        'Hot peppers',
        'Cucumbers',
        'Zucchini',
        'Summer squash',
        'Green beans',
        'Melons',
        'Berries',
        'Cherries',
        'Apricots',
        'Cantaloupe',
        'Watermelon'
    ],
    // Fall (Sep-Nov)
    fall: [
        'Apples',
        'Pears',
        'Pumpkin',
        'Winter squash',
        'Potatoes',
        'Carrots',
        'Beets',
        'Kale',
        'Brussels sprouts',
        'Late tomatoes',
        'Late peppers',
        'Cabbage'
    ],
    // Year-round local products (not seasonal but locally produced)
    yearRound: [
        'Colorado beef',
        'Local eggs',
        'Grains from the Plains flour',
        'Local honey',
        'Local goat cheese',
        'Greenhouse microgreens',
        'Local mushrooms',
        'Sprouts'
    ]
};

// Map month to season for Colorado
const MONTH_TO_SEASON = {
    1: 'winter',
    2: 'winter',
    3: 'spring',
    4: 'spring',
    5: 'spring',
    6: 'summer',
    7: 'summer',
    8: 'summer',
    9: 'fall',
    10: 'fall',
    11: 'fall',
    12: 'winter'
};

/**
 * Get current month (1-12)
 */
export function getCurrentMonth() {
    return new Date().getMonth() + 1;
}

/**
 * Get current season for Colorado
 */
export function getCurrentSeason() {
    return MONTH_TO_SEASON[getCurrentMonth()];
}

/**
 * Get month name
 */
export function getMonthName(month) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
}

/**
 * Get seasonal produce for current month
 * @returns {Object} - { fruits: [], vegetables: [] }
 */
export function getSeasonalProduce() {
    const month = getCurrentMonth();
    return SEASONAL_PRODUCE[month] || { fruits: [], vegetables: [] };
}

/**
 * Get Colorado local produce for current season
 * @returns {string[]} - Array of local produce items
 */
export function getColoradoLocal() {
    const season = getCurrentSeason();
    return [
        ...COLORADO_LOCAL[season],
        ...COLORADO_LOCAL.yearRound
    ];
}

/**
 * Check if an ingredient is in season
 * @param {string} ingredient - Ingredient name
 * @returns {boolean}
 */
export function isInSeason(ingredient) {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    const seasonal = getSeasonalProduce();

    const allSeasonal = [...seasonal.fruits, ...seasonal.vegetables]
        .map(item => item.toLowerCase());

    return allSeasonal.some(item =>
        normalizedIngredient.includes(item.split('(')[0].trim()) ||
        item.includes(normalizedIngredient)
    );
}

/**
 * Check if an ingredient is Colorado local
 * @param {string} ingredient - Ingredient name
 * @returns {boolean}
 */
export function isColoradoLocal(ingredient) {
    const normalizedIngredient = ingredient.toLowerCase().trim();
    const localItems = getColoradoLocal()
        .map(item => item.toLowerCase());

    return localItems.some(item =>
        normalizedIngredient.includes(item.split('(')[0].trim()) ||
        item.includes(normalizedIngredient)
    );
}

/**
 * Get tags for an ingredient
 * @param {string} ingredient - Ingredient name
 * @returns {Object} - { seasonal: boolean, local: boolean }
 */
export function getIngredientTags(ingredient) {
    return {
        seasonal: isInSeason(ingredient),
        local: isColoradoLocal(ingredient)
    };
}

/**
 * Get "What's Fresh Now" data for display
 * @returns {Object} - Formatted data for the fresh section
 */
export function getWhatsNow() {
    const month = getCurrentMonth();
    const monthName = getMonthName(month);
    const seasonal = getSeasonalProduce();
    const localItems = getColoradoLocal();

    // Tag fruits with local indicator
    const fruits = seasonal.fruits.map(fruit => ({
        name: fruit,
        isLocal: localItems.some(local =>
            local.toLowerCase().includes(fruit.toLowerCase().split('(')[0].trim()) ||
            fruit.toLowerCase().includes(local.toLowerCase().split('(')[0].trim())
        )
    }));

    // Tag vegetables with local indicator
    const vegetables = seasonal.vegetables.map(veg => ({
        name: veg,
        isLocal: localItems.some(local =>
            local.toLowerCase().includes(veg.toLowerCase().split('(')[0].trim()) ||
            veg.toLowerCase().includes(local.toLowerCase().split('(')[0].trim())
        )
    }));

    return {
        month: monthName,
        monthNumber: month,
        season: getCurrentSeason(),
        fruits,
        vegetables
    };
}

/**
 * Count seasonal/local ingredients in a meal
 * @param {Array} ingredients - Array of ingredient names
 * @returns {Object} - { seasonalCount, localCount, total }
 */
export function countSeasonalLocal(ingredients) {
    let seasonalCount = 0;
    let localCount = 0;

    for (const ingredient of ingredients) {
        const tags = getIngredientTags(ingredient);
        if (tags.seasonal) seasonalCount++;
        if (tags.local) localCount++;
    }

    return {
        seasonalCount,
        localCount,
        total: ingredients.length
    };
}

export default {
    SEASONAL_PRODUCE,
    COLORADO_LOCAL,
    getCurrentMonth,
    getCurrentSeason,
    getMonthName,
    getSeasonalProduce,
    getColoradoLocal,
    isInSeason,
    isColoradoLocal,
    getIngredientTags,
    getWhatsNow,
    countSeasonalLocal
};
