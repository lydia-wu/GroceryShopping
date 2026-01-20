/**
 * Meal Library Module
 * Manages meal rotation, library, and meal CRUD operations
 */

import CONFIG from './config.js';
import googleSheets from './google-sheets.js';

class MealLibrary {
    constructor() {
        this.meals = new Map();
        this.rotationOrder = [];
        this.archivedMeals = [];
        this.maxMeals = CONFIG.mealRotation.maxMeals;

        // Local storage keys
        this.storageKeys = {
            meals: 'meal_library',
            rotation: 'rotation_order',
            archived: 'archived_meals'
        };

        // Initialize with config defaults
        this.initializeFromConfig();
    }

    /**
     * Initialize meals from config
     */
    initializeFromConfig() {
        for (const code in CONFIG.meals) {
            this.meals.set(code, {
                ...CONFIG.meals[code],
                status: 'active',
                createdDate: '2025-12-01',
                archivedDate: null
            });
        }
        this.rotationOrder = [...CONFIG.mealRotation.defaultOrder];
    }

    /**
     * Load data from Google Sheets or local storage
     */
    async loadData() {
        try {
            // Try to load from Google Sheets first
            if (googleSheets.isConfigured()) {
                const [library, rotation] = await Promise.all([
                    googleSheets.getMealLibrary(),
                    googleSheets.getRotationOrder()
                ]);

                // Populate meals from library
                this.meals.clear();
                this.archivedMeals = [];

                for (const meal of library) {
                    if (meal.status === 'active') {
                        this.meals.set(meal.code, meal);
                    } else {
                        this.archivedMeals.push(meal);
                    }
                }

                // Set rotation order
                if (rotation && rotation.length > 0) {
                    this.rotationOrder = rotation;
                }
            } else {
                // Load from local storage
                this.loadFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading meal data:', error);
            // Fall back to local storage
            this.loadFromLocalStorage();
        }
    }

    /**
     * Load from local storage
     */
    loadFromLocalStorage() {
        try {
            const storedMeals = localStorage.getItem(this.storageKeys.meals);
            const storedRotation = localStorage.getItem(this.storageKeys.rotation);
            const storedArchived = localStorage.getItem(this.storageKeys.archived);

            if (storedMeals) {
                const mealsData = JSON.parse(storedMeals);
                this.meals = new Map(mealsData);
            }

            if (storedRotation) {
                this.rotationOrder = JSON.parse(storedRotation);
            }

            if (storedArchived) {
                this.archivedMeals = JSON.parse(storedArchived);
            }
        } catch (error) {
            console.error('Error loading from local storage:', error);
        }
    }

    /**
     * Save to local storage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem(
                this.storageKeys.meals,
                JSON.stringify([...this.meals])
            );
            localStorage.setItem(
                this.storageKeys.rotation,
                JSON.stringify(this.rotationOrder)
            );
            localStorage.setItem(
                this.storageKeys.archived,
                JSON.stringify(this.archivedMeals)
            );
        } catch (error) {
            console.error('Error saving to local storage:', error);
        }
    }

    /**
     * Get all active meals
     */
    getActiveMeals() {
        return Array.from(this.meals.values());
    }

    /**
     * Get meal by code
     */
    getMeal(code) {
        return this.meals.get(code);
    }

    /**
     * Get meals in rotation order
     */
    getMealsInOrder() {
        return this.rotationOrder
            .map(code => this.meals.get(code))
            .filter(meal => meal !== undefined);
    }

    /**
     * Get rotation order
     */
    getRotationOrder() {
        return [...this.rotationOrder];
    }

    /**
     * Get archived meals
     */
    getArchivedMeals() {
        return [...this.archivedMeals];
    }

    /**
     * Get count of active meals
     */
    getActiveCount() {
        return this.meals.size;
    }

    /**
     * Check if can add more meals
     */
    canAddMeal() {
        return this.meals.size < this.maxMeals;
    }

    /**
     * Generate next available meal code
     */
    generateMealCode() {
        const usedCodes = new Set([
            ...this.meals.keys(),
            ...this.archivedMeals.map(m => m.code)
        ]);

        // Try letters A-Z first
        for (let i = 0; i < 26; i++) {
            const code = String.fromCharCode(65 + i);
            if (!usedCodes.has(code)) {
                return code;
            }
        }

        // Fall back to numbers
        let num = 1;
        while (usedCodes.has(num.toString())) {
            num++;
        }
        return num.toString();
    }

    /**
     * Add a new meal
     */
    addMeal(mealData) {
        if (!this.canAddMeal()) {
            throw new Error(`Cannot add more than ${this.maxMeals} meals`);
        }

        const code = mealData.code || this.generateMealCode();

        const newMeal = {
            code: code,
            name: mealData.name,
            servings: mealData.servings || 6,
            prepTime: mealData.prepTime || 0,
            cookTime: mealData.cookTime || 0,
            ingredients: mealData.ingredients || [],
            instructions: mealData.instructions || '',
            sides: mealData.sides || [],
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            archivedDate: null
        };

        this.meals.set(code, newMeal);
        this.rotationOrder.push(code);
        this.saveToLocalStorage();

        return newMeal;
    }

    /**
     * Update a meal
     */
    updateMeal(code, updates) {
        const meal = this.meals.get(code);
        if (!meal) {
            throw new Error(`Meal ${code} not found`);
        }

        const updatedMeal = { ...meal, ...updates };
        this.meals.set(code, updatedMeal);
        this.saveToLocalStorage();

        return updatedMeal;
    }

    /**
     * Archive a meal (remove from rotation)
     */
    archiveMeal(code) {
        const meal = this.meals.get(code);
        if (!meal) {
            throw new Error(`Meal ${code} not found`);
        }

        // Update status
        meal.status = 'archived';
        meal.archivedDate = new Date().toISOString().split('T')[0];

        // Remove from active meals
        this.meals.delete(code);

        // Remove from rotation
        this.rotationOrder = this.rotationOrder.filter(c => c !== code);

        // Add to archived
        this.archivedMeals.push(meal);

        this.saveToLocalStorage();

        return meal;
    }

    /**
     * Restore a meal from archive
     */
    restoreMeal(code, position = null) {
        const mealIndex = this.archivedMeals.findIndex(m => m.code === code);
        if (mealIndex === -1) {
            throw new Error(`Archived meal ${code} not found`);
        }

        if (!this.canAddMeal()) {
            throw new Error(`Cannot restore: maximum ${this.maxMeals} meals already active`);
        }

        // Remove from archived
        const meal = this.archivedMeals.splice(mealIndex, 1)[0];

        // Update status
        meal.status = 'active';
        meal.archivedDate = null;

        // Add back to active meals
        this.meals.set(code, meal);

        // Add to rotation at specified position or end
        if (position !== null && position >= 0 && position <= this.rotationOrder.length) {
            this.rotationOrder.splice(position, 0, code);
        } else {
            this.rotationOrder.push(code);
        }

        this.saveToLocalStorage();

        return meal;
    }

    /**
     * Delete a meal permanently
     */
    deleteMeal(code) {
        // Try to delete from active
        if (this.meals.has(code)) {
            this.meals.delete(code);
            this.rotationOrder = this.rotationOrder.filter(c => c !== code);
        }

        // Try to delete from archived
        this.archivedMeals = this.archivedMeals.filter(m => m.code !== code);

        this.saveToLocalStorage();
    }

    /**
     * Move meal up in rotation
     */
    moveMealUp(code) {
        const index = this.rotationOrder.indexOf(code);
        if (index > 0) {
            [this.rotationOrder[index - 1], this.rotationOrder[index]] =
            [this.rotationOrder[index], this.rotationOrder[index - 1]];
            this.saveToLocalStorage();
        }
        return this.rotationOrder;
    }

    /**
     * Move meal down in rotation
     */
    moveMealDown(code) {
        const index = this.rotationOrder.indexOf(code);
        if (index >= 0 && index < this.rotationOrder.length - 1) {
            [this.rotationOrder[index], this.rotationOrder[index + 1]] =
            [this.rotationOrder[index + 1], this.rotationOrder[index]];
            this.saveToLocalStorage();
        }
        return this.rotationOrder;
    }

    /**
     * Set custom rotation order
     */
    setRotationOrder(order) {
        // Validate all codes exist
        for (const code of order) {
            if (!this.meals.has(code)) {
                throw new Error(`Meal ${code} not found`);
            }
        }
        this.rotationOrder = order;
        this.saveToLocalStorage();
        return this.rotationOrder;
    }

    /**
     * Get position in rotation
     */
    getRotationPosition(code) {
        return this.rotationOrder.indexOf(code);
    }

    /**
     * Parse ingredients text into array
     */
    parseIngredients(text) {
        if (!text) return [];

        return text
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                // Try to parse "quantity unit ingredient" format
                const match = line.match(/^([\d./]+)?\s*(\w+)?\s+(.+)$/);
                if (match) {
                    return {
                        quantity: match[1] || '',
                        unit: match[2] || '',
                        name: match[3] || line
                    };
                }
                return { name: line, quantity: '', unit: '' };
            });
    }

    /**
     * Format ingredients for display
     */
    formatIngredientsText(ingredients) {
        if (!ingredients || !Array.isArray(ingredients)) return '';

        return ingredients
            .map(ing => {
                if (typeof ing === 'string') return ing;
                const parts = [];
                if (ing.quantity) parts.push(ing.quantity);
                if (ing.unit) parts.push(ing.unit);
                parts.push(ing.name);
                return parts.join(' ');
            })
            .join('\n');
    }
}

// Export singleton instance
const mealLibrary = new MealLibrary();
export default mealLibrary;
