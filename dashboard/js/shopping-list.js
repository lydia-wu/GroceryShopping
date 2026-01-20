/**
 * Shopping List Module
 * Generates shopping lists from selected meals, grouped by store
 */

import CONFIG from './config.js';

class ShoppingListGenerator {
    constructor() {
        // Store information with typical items
        this.storeInfo = {
            'Costco': {
                name: 'Costco',
                priority: 1,
                typicalItems: ['chicken breast', 'mackerel', 'feta', 'avocado', 'grapes', 'pomegranate', 'pistachios', 'pasta', 'grapefruit', 'eggs']
            },
            'H-Mart': {
                name: 'H-Mart',
                priority: 2,
                typicalItems: ['kale', 'eggplant', 'chinese eggplant', 'sweet potato', 'cucumber', 'dill', 'parsley', 'lemon', 'lime', 'roma tomato', 'ginger', 'garlic']
            },
            'Safeway': {
                name: 'Safeway',
                priority: 3,
                typicalItems: ['pearl barley', 'cauliflower', 'riced cauliflower', 'zucchini', 'ground turkey']
            },
            'Sprouts': {
                name: 'Sprouts',
                priority: 4,
                typicalItems: ['organic produce', 'specialty items']
            },
            'Grains from the Plains': {
                name: 'Grains from the Plains',
                priority: 5,
                typicalItems: ['flour', 'wheat flour', 'bread flour', 'whole wheat flour']
            },
            'Walmart': {
                name: 'Walmart',
                priority: 6,
                typicalItems: []
            }
        };

        // Ingredient to store mapping (override automatic detection)
        this.ingredientStoreMap = {
            'chicken': 'Costco',
            'chicken breast': 'Costco',
            'mackerel': 'Costco',
            'canned mackerel': 'Costco',
            'feta': 'Costco',
            'feta cheese': 'Costco',
            'avocado': 'Costco',
            'grapes': 'Costco',
            'pomegranate': 'Costco',
            'pistachios': 'Costco',
            'grapefruit': 'Costco',
            'eggs': 'Costco',
            'brami pasta': 'Costco',
            'kale': 'H-Mart',
            'chinese eggplant': 'H-Mart',
            'eggplant': 'H-Mart',
            'sweet potato': 'H-Mart',
            'cucumber': 'H-Mart',
            'dill': 'H-Mart',
            'parsley': 'H-Mart',
            'lemon': 'H-Mart',
            'lime': 'H-Mart',
            'roma tomato': 'H-Mart',
            'tomato': 'H-Mart',
            'ginger': 'H-Mart',
            'garlic': 'H-Mart',
            'pearl barley': 'Safeway',
            'barley': 'Safeway',
            'cauliflower': 'Safeway',
            'riced cauliflower': 'Safeway',
            'zucchini': 'Safeway',
            'ground turkey': 'Safeway',
            'turkey': 'Safeway',
            'flour': 'Grains from the Plains',
            'wheat flour': 'Grains from the Plains',
            'bread flour': 'Grains from the Plains'
        };
    }

    /**
     * Determine which store an ingredient should be purchased from
     */
    determineStore(ingredientName) {
        const normalized = ingredientName.toLowerCase().trim();

        // Check explicit mapping first
        for (const [key, store] of Object.entries(this.ingredientStoreMap)) {
            if (normalized.includes(key)) {
                return store;
            }
        }

        // Check store typical items
        for (const [storeName, info] of Object.entries(this.storeInfo)) {
            for (const item of info.typicalItems) {
                if (normalized.includes(item) || item.includes(normalized)) {
                    return storeName;
                }
            }
        }

        // Default to Safeway for unknown items
        return 'Safeway';
    }

    /**
     * Generate shopping list from selected meals
     * @param {Array} selectedMeals - Array of meal objects
     * @returns {Object} - Shopping list grouped by store
     */
    generateList(selectedMeals) {
        const itemsByStore = {};
        const allItems = [];

        // Initialize stores
        for (const storeName of CONFIG.stores) {
            itemsByStore[storeName] = {
                name: storeName,
                items: [],
                estimatedTotal: 0
            };
        }

        // Collect all ingredients from selected meals
        for (const meal of selectedMeals) {
            const ingredients = meal.ingredients || [];

            for (const ingredient of ingredients) {
                const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
                const quantity = ingredient.quantity || '';
                const unit = ingredient.unit || '';
                const cost = ingredient.cost || 0;

                allItems.push({
                    name: name,
                    quantity: quantity,
                    unit: unit,
                    cost: cost,
                    mealCode: meal.code,
                    mealName: meal.name
                });
            }
        }

        // Consolidate duplicate items
        const consolidated = this.consolidateItems(allItems);

        // Group by store
        for (const item of consolidated) {
            const store = this.determineStore(item.name);
            if (itemsByStore[store]) {
                itemsByStore[store].items.push(item);
                itemsByStore[store].estimatedTotal += item.cost || 0;
            }
        }

        // Sort stores by priority
        const sortedStores = Object.entries(itemsByStore)
            .filter(([_, data]) => data.items.length > 0)
            .sort((a, b) => {
                const priorityA = this.storeInfo[a[0]]?.priority || 99;
                const priorityB = this.storeInfo[b[0]]?.priority || 99;
                return priorityA - priorityB;
            })
            .reduce((obj, [key, value]) => {
                obj[key] = value;
                return obj;
            }, {});

        return {
            stores: sortedStores,
            totalItems: consolidated.length,
            totalEstimatedCost: Object.values(sortedStores)
                .reduce((sum, store) => sum + store.estimatedTotal, 0),
            meals: selectedMeals.map(m => ({ code: m.code, name: m.name }))
        };
    }

    /**
     * Consolidate duplicate items (combine quantities)
     */
    consolidateItems(items) {
        const consolidated = new Map();

        for (const item of items) {
            const key = item.name.toLowerCase().trim();

            if (consolidated.has(key)) {
                const existing = consolidated.get(key);
                // Combine quantities (simple approach - just append)
                if (item.quantity && existing.quantity) {
                    if (item.unit === existing.unit) {
                        // Same unit - try to add
                        const num1 = parseFloat(existing.quantity) || 0;
                        const num2 = parseFloat(item.quantity) || 0;
                        existing.quantity = (num1 + num2).toString();
                    } else {
                        // Different units - append
                        existing.quantity = `${existing.quantity}, ${item.quantity} ${item.unit}`;
                    }
                }
                existing.cost = (existing.cost || 0) + (item.cost || 0);
                existing.meals.push({ code: item.mealCode, name: item.mealName });
            } else {
                consolidated.set(key, {
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    cost: item.cost,
                    meals: [{ code: item.mealCode, name: item.mealName }]
                });
            }
        }

        return Array.from(consolidated.values());
    }

    /**
     * Format shopping list as text for copying
     */
    formatAsText(shoppingList) {
        let text = `Shopping List\n`;
        text += `Generated: ${new Date().toLocaleDateString()}\n`;
        text += `Meals: ${shoppingList.meals.map(m => m.name).join(', ')}\n`;
        text += `${'='.repeat(50)}\n\n`;

        for (const [storeName, storeData] of Object.entries(shoppingList.stores)) {
            text += `${storeName.toUpperCase()}\n`;
            text += `${'-'.repeat(30)}\n`;

            for (const item of storeData.items) {
                const qty = item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '';
                text += `[ ] ${item.name}${qty ? ` - ${qty}` : ''}\n`;
            }

            if (storeData.estimatedTotal > 0) {
                text += `\nEstimated: $${storeData.estimatedTotal.toFixed(2)}\n`;
            }
            text += '\n';
        }

        text += `${'='.repeat(50)}\n`;
        text += `Total Items: ${shoppingList.totalItems}\n`;
        text += `Estimated Total: $${shoppingList.totalEstimatedCost.toFixed(2)}\n`;

        return text;
    }

    /**
     * Format shopping list as HTML
     */
    formatAsHTML(shoppingList) {
        let html = '';

        for (const [storeName, storeData] of Object.entries(shoppingList.stores)) {
            html += `
                <div class="store-section">
                    <div class="store-header">
                        <span class="store-name">${storeName}</span>
                        <span class="store-total">${storeData.items.length} items${storeData.estimatedTotal > 0 ? ` - Est. $${storeData.estimatedTotal.toFixed(2)}` : ''}</span>
                    </div>
                    <div class="store-items">
            `;

            for (const item of storeData.items) {
                const qty = item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : '';
                const mealsUsed = item.meals.map(m => m.code).join(', ');

                html += `
                    <div class="shopping-item">
                        <input type="checkbox" class="shopping-checkbox" data-item="${item.name}">
                        <span class="item-name">${item.name}</span>
                        ${qty ? `<span class="item-quantity">${qty}</span>` : ''}
                        <span class="item-meals text-muted text-small">(${mealsUsed})</span>
                    </div>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        html += `
            <div class="shopping-summary mt-4">
                <p><strong>Total Items:</strong> ${shoppingList.totalItems}</p>
                <p><strong>Estimated Total:</strong> $${shoppingList.totalEstimatedCost.toFixed(2)}</p>
            </div>
        `;

        return html;
    }

    /**
     * Copy shopping list to clipboard
     */
    async copyToClipboard(shoppingList) {
        const text = this.formatAsText(shoppingList);

        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }

    /**
     * Get stores in recommended shopping order
     */
    getShoppingRoute() {
        return Object.entries(this.storeInfo)
            .sort((a, b) => a[1].priority - b[1].priority)
            .map(([name]) => name);
    }
}

// Export singleton instance
const shoppingListGenerator = new ShoppingListGenerator();
export default shoppingListGenerator;
