/**
 * Dietary Alerts Module
 * Handles checking ingredients against dietary restrictions
 */

import CONFIG from './config.js';

// Detailed dietary restrictions with reasons
const RESTRICTIONS = [
    {
        id: 'onion',
        name: 'Onions',
        reason: 'Dietary restriction: No onions',
        variants: ['onion', 'onions', 'shallot', 'shallots', 'scallion', 'scallions', 'green onion', 'green onions', 'red onion', 'white onion', 'yellow onion', 'pearl onion', 'cipollini', 'leek', 'leeks']
    },
    {
        id: 'mushroom',
        name: 'Mushrooms',
        reason: 'Dietary restriction: No mushrooms',
        variants: ['mushroom', 'mushrooms', 'shiitake', 'portobello', 'portabella', 'cremini', 'button mushroom', 'oyster mushroom', 'chanterelle', 'porcini', 'morel', 'enoki', 'maitake']
    },
    {
        id: 'broccoli',
        name: 'Broccoli',
        reason: 'Dietary restriction: No broccoli',
        variants: ['broccoli', 'broccolini', 'broccoli rabe', 'broccoli raab', 'rapini']
    },
    {
        id: 'cow_milk',
        name: 'Cow Milk',
        reason: 'Dietary restriction: No cow milk products',
        variants: [
            'milk', 'whole milk', '2% milk', '1% milk', 'skim milk', 'nonfat milk',
            'cream', 'heavy cream', 'light cream', 'whipping cream',
            'half-and-half', 'half and half',
            'buttermilk', 'evaporated milk', 'condensed milk', 'sweetened condensed milk',
            'cow milk', 'cows milk', "cow's milk"
        ],
        // Items that are OK despite containing "milk" in name
        exceptions: ['oat milk', 'almond milk', 'soy milk', 'coconut milk', 'rice milk', 'cashew milk', 'goat milk', 'sheep milk']
    }
];

/**
 * Check if a text contains any variant of a restriction
 * @param {string} text - Text to check
 * @param {Object} restriction - Restriction object
 * @returns {boolean}
 */
function containsVariant(text, restriction) {
    const normalizedText = text.toLowerCase().trim();

    // First check exceptions (items that are OK)
    if (restriction.exceptions) {
        for (const exception of restriction.exceptions) {
            if (normalizedText.includes(exception.toLowerCase())) {
                return false;
            }
        }
    }

    // Check variants
    for (const variant of restriction.variants) {
        // Use word boundary matching to avoid false positives
        const regex = new RegExp(`\\b${variant.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(normalizedText)) {
            return true;
        }
    }

    return false;
}

/**
 * Check an ingredient against all dietary restrictions
 * @param {string} ingredient - Ingredient name
 * @returns {Object|null} - Restriction object if found, null otherwise
 */
export function checkIngredient(ingredient) {
    for (const restriction of RESTRICTIONS) {
        if (containsVariant(ingredient, restriction)) {
            return {
                id: restriction.id,
                name: restriction.name,
                reason: restriction.reason,
                ingredient: ingredient
            };
        }
    }
    return null;
}

/**
 * Check multiple ingredients against dietary restrictions
 * @param {Array} ingredients - Array of ingredient names/objects
 * @returns {Array} - Array of alerts
 */
export function checkIngredients(ingredients) {
    const alerts = [];

    for (const ingredient of ingredients) {
        const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
        const alert = checkIngredient(name);
        if (alert) {
            alerts.push(alert);
        }
    }

    return alerts;
}

/**
 * Check if a meal has any dietary alerts
 * @param {Object} meal - Meal object with ingredients array
 * @returns {Object} - { hasAlerts: boolean, alerts: [], count: number }
 */
export function checkMeal(meal) {
    const ingredients = meal.ingredients || [];
    const alerts = checkIngredients(ingredients);

    return {
        hasAlerts: alerts.length > 0,
        alerts: alerts,
        count: alerts.length
    };
}

/**
 * Filter meals to only those without restricted ingredients
 * @param {Array} meals - Array of meal objects
 * @returns {Array} - Filtered array of meals
 */
export function filterSafeMeals(meals) {
    return meals.filter(meal => {
        const check = checkMeal(meal);
        return !check.hasAlerts;
    });
}

/**
 * Get all restriction definitions (for display purposes)
 * @returns {Array} - Array of restriction objects
 */
export function getRestrictions() {
    return RESTRICTIONS.map(r => ({
        id: r.id,
        name: r.name,
        reason: r.reason
    }));
}

/**
 * Generate HTML for a dietary alert badge
 * @param {Object} alert - Alert object
 * @returns {string} - HTML string
 */
export function generateAlertBadge(alert) {
    return `<span class="badge badge-warning ingredient-warning" title="${alert.reason}">&#9888;</span>`;
}

/**
 * Generate tooltip content for an ingredient with alert
 * @param {Object} alert - Alert object
 * @returns {string} - Tooltip text
 */
export function getAlertTooltip(alert) {
    return `${alert.reason}\nIngredient: ${alert.ingredient}`;
}

/**
 * Check if adding an ingredient would violate restrictions
 * @param {string} newIngredient - Ingredient to check
 * @returns {Object} - { safe: boolean, alert: Object|null }
 */
export function validateNewIngredient(newIngredient) {
    const alert = checkIngredient(newIngredient);
    return {
        safe: alert === null,
        alert: alert
    };
}

export default {
    checkIngredient,
    checkIngredients,
    checkMeal,
    filterSafeMeals,
    getRestrictions,
    generateAlertBadge,
    getAlertTooltip,
    validateNewIngredient
};
