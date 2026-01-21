/**
 * Meal Library Module
 * Manages meal rotation, library, meal CRUD operations, and tag system
 *
 * @requires ./config.js
 * @requires ./google-sheets.js
 * @requires ./core/state-manager.js
 * @requires ./core/event-bus.js
 */

import CONFIG from './config.js';
import googleSheets from './google-sheets.js';
import { getState, setState, subscribe } from './core/state-manager.js';
import { emit, EVENTS } from './core/event-bus.js';

// Predefined tag categories for meals
const TAG_CATEGORIES = {
    protein: { color: '#e74c3c', label: 'Protein Source' },
    cuisine: { color: '#3498db', label: 'Cuisine Type' },
    effort: { color: '#f39c12', label: 'Effort Level' },
    season: { color: '#27ae60', label: 'Season' },
    dietary: { color: '#9b59b6', label: 'Dietary' }
};

// Common tags
const DEFAULT_TAGS = [
    { id: 'chicken', name: 'Chicken', category: 'protein' },
    { id: 'turkey', name: 'Turkey', category: 'protein' },
    { id: 'fish', name: 'Fish', category: 'protein' },
    { id: 'vegetarian', name: 'Vegetarian', category: 'protein' },
    { id: 'quick', name: 'Quick (<30 min)', category: 'effort' },
    { id: 'medium', name: 'Medium (30-60 min)', category: 'effort' },
    { id: 'involved', name: 'Involved (60+ min)', category: 'effort' },
    { id: 'summer', name: 'Summer', category: 'season' },
    { id: 'winter', name: 'Winter', category: 'season' },
    { id: 'all-season', name: 'All Season', category: 'season' },
    { id: 'high-protein', name: 'High Protein', category: 'dietary' },
    { id: 'low-carb', name: 'Low Carb', category: 'dietary' },
    { id: 'heart-healthy', name: 'Heart Healthy', category: 'dietary' },
    { id: 'kid-friendly', name: 'Kid Friendly', category: 'dietary' }
];

class MealLibrary {
    constructor() {
        this.meals = new Map();
        this.rotationOrder = [];
        this.archivedMeals = [];
        this.tags = [...DEFAULT_TAGS];
        this.maxMeals = CONFIG.mealRotation.maxMeals;
        this.useStateManager = false; // Will be true once integrated

        // Local storage keys (legacy, for backwards compatibility)
        this.storageKeys = {
            meals: 'meal_library',
            rotation: 'rotation_order',
            archived: 'archived_meals',
            tags: 'meal_tags'
        };

        // Initialize with config defaults
        this.initializeFromConfig();
    }

    /**
     * Enable integration with new state manager
     */
    enableStateManager() {
        this.useStateManager = true;

        // Sync from state manager
        const stateMeals = getState('meals');
        const stateRotation = getState('rotationOrder');
        const stateArchived = getState('archivedMeals');
        const stateTags = getState('tags');

        if (stateMeals && Object.keys(stateMeals).length > 0) {
            this.meals = new Map(Object.entries(stateMeals));
        }
        if (stateRotation?.length > 0) {
            this.rotationOrder = stateRotation;
        }
        if (stateArchived?.length > 0) {
            this.archivedMeals = stateArchived;
        }
        if (stateTags?.length > 0) {
            this.tags = stateTags;
        }

        // Subscribe to state changes
        subscribe(['meals', 'rotationOrder', 'archivedMeals', 'tags'], () => {
            this.syncFromState();
        });
    }

    /**
     * Sync local data from state manager
     */
    syncFromState() {
        if (!this.useStateManager) return;

        const stateMeals = getState('meals');
        const stateRotation = getState('rotationOrder');
        const stateArchived = getState('archivedMeals');
        const stateTags = getState('tags');

        if (stateMeals) this.meals = new Map(Object.entries(stateMeals));
        if (stateRotation) this.rotationOrder = stateRotation;
        if (stateArchived) this.archivedMeals = stateArchived;
        if (stateTags) this.tags = stateTags;
    }

    /**
     * Persist changes (to state manager or localStorage)
     */
    persistChanges() {
        if (this.useStateManager) {
            setState({
                meals: Object.fromEntries(this.meals),
                rotationOrder: this.rotationOrder,
                archivedMeals: this.archivedMeals,
                tags: this.tags
            });
        } else {
            this.persistChanges();
        }
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
            tags: mealData.tags || [],
            status: 'active',
            createdDate: new Date().toISOString().split('T')[0],
            archivedDate: null
        };

        this.meals.set(code, newMeal);
        this.rotationOrder.push(code);
        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_ADDED, { code, meal: newMeal });
        }

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
        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_UPDATED, { code, meal: updatedMeal, changes: Object.keys(updates) });
        }

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

        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_ARCHIVED, { code, meal });
        }

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
        delete meal.archiveReason; // Clear archive reason

        // Add back to active meals
        this.meals.set(code, meal);

        // Add to rotation at specified position or end
        if (position !== null && position >= 0 && position <= this.rotationOrder.length) {
            this.rotationOrder.splice(position, 0, code);
        } else {
            this.rotationOrder.push(code);
        }

        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_RESTORED, { code, meal, position });
        }

        return meal;
    }

    /**
     * Delete a meal permanently
     */
    deleteMeal(code) {
        const wasActive = this.meals.has(code);

        // Try to delete from active
        if (wasActive) {
            this.meals.delete(code);
            this.rotationOrder = this.rotationOrder.filter(c => c !== code);
        }

        // Try to delete from archived
        this.archivedMeals = this.archivedMeals.filter(m => m.code !== code);

        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_DELETED, { code, wasActive });
        }
    }

    /**
     * Move meal up in rotation
     */
    moveMealUp(code) {
        const index = this.rotationOrder.indexOf(code);
        if (index > 0) {
            [this.rotationOrder[index - 1], this.rotationOrder[index]] =
            [this.rotationOrder[index], this.rotationOrder[index - 1]];
            this.persistChanges();

            if (this.useStateManager) {
                emit(EVENTS.ROTATION_CHANGED, { order: [...this.rotationOrder], action: 'move_up', code });
            }
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
            this.persistChanges();

            if (this.useStateManager) {
                emit(EVENTS.ROTATION_CHANGED, { order: [...this.rotationOrder], action: 'move_down', code });
            }
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
        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.ROTATION_CHANGED, { order: [...this.rotationOrder], action: 'set' });
        }

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

    // ==================
    // TAG SYSTEM METHODS
    // ==================

    /**
     * Get all available tags
     * @returns {Array} All tags
     */
    getAllTags() {
        return [...this.tags];
    }

    /**
     * Get tags by category
     * @param {string} category - Tag category
     * @returns {Array} Tags in category
     */
    getTagsByCategory(category) {
        return this.tags.filter(tag => tag.category === category);
    }

    /**
     * Get tag categories with metadata
     * @returns {Object} Tag categories
     */
    getTagCategories() {
        return { ...TAG_CATEGORIES };
    }

    /**
     * Add a new tag
     * @param {Object} tagData - { name, category }
     * @returns {Object} Created tag
     */
    addTag(tagData) {
        const id = tagData.id || tagData.name.toLowerCase().replace(/\s+/g, '-');

        // Check for duplicates
        if (this.tags.find(t => t.id === id)) {
            throw new Error(`Tag ${id} already exists`);
        }

        const newTag = {
            id,
            name: tagData.name,
            category: tagData.category || 'dietary',
            custom: true
        };

        this.tags.push(newTag);
        this.persistChanges();

        return newTag;
    }

    /**
     * Delete a tag
     * @param {string} tagId - Tag ID to delete
     */
    deleteTag(tagId) {
        const index = this.tags.findIndex(t => t.id === tagId);
        if (index === -1) {
            throw new Error(`Tag ${tagId} not found`);
        }

        // Remove tag from all meals that have it
        for (const [code, meal] of this.meals) {
            if (meal.tags?.includes(tagId)) {
                meal.tags = meal.tags.filter(t => t !== tagId);
            }
        }

        this.tags.splice(index, 1);
        this.persistChanges();
    }

    /**
     * Add a tag to a meal
     * @param {string} mealCode - Meal code
     * @param {string} tagId - Tag ID
     */
    addTagToMeal(mealCode, tagId) {
        const meal = this.meals.get(mealCode);
        if (!meal) {
            throw new Error(`Meal ${mealCode} not found`);
        }

        if (!this.tags.find(t => t.id === tagId)) {
            throw new Error(`Tag ${tagId} not found`);
        }

        if (!meal.tags) {
            meal.tags = [];
        }

        if (!meal.tags.includes(tagId)) {
            meal.tags.push(tagId);
            this.meals.set(mealCode, meal);
            this.persistChanges();

            if (this.useStateManager) {
                emit(EVENTS.MEAL_UPDATED, { code: mealCode, meal });
            }
        }
    }

    /**
     * Remove a tag from a meal
     * @param {string} mealCode - Meal code
     * @param {string} tagId - Tag ID
     */
    removeTagFromMeal(mealCode, tagId) {
        const meal = this.meals.get(mealCode);
        if (!meal) {
            throw new Error(`Meal ${mealCode} not found`);
        }

        if (meal.tags) {
            meal.tags = meal.tags.filter(t => t !== tagId);
            this.meals.set(mealCode, meal);
            this.persistChanges();

            if (this.useStateManager) {
                emit(EVENTS.MEAL_UPDATED, { code: mealCode, meal });
            }
        }
    }

    /**
     * Get tags for a meal
     * @param {string} mealCode - Meal code
     * @returns {Array} Meal's tags with full tag data
     */
    getMealTags(mealCode) {
        const meal = this.meals.get(mealCode);
        if (!meal || !meal.tags) return [];

        return meal.tags
            .map(tagId => this.tags.find(t => t.id === tagId))
            .filter(tag => tag !== undefined);
    }

    /**
     * Set all tags for a meal
     * @param {string} mealCode - Meal code
     * @param {Array} tagIds - Array of tag IDs
     */
    setMealTags(mealCode, tagIds) {
        const meal = this.meals.get(mealCode);
        if (!meal) {
            throw new Error(`Meal ${mealCode} not found`);
        }

        // Validate all tags exist
        for (const tagId of tagIds) {
            if (!this.tags.find(t => t.id === tagId)) {
                throw new Error(`Tag ${tagId} not found`);
            }
        }

        meal.tags = [...tagIds];
        this.meals.set(mealCode, meal);
        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_UPDATED, { code: mealCode, meal });
        }
    }

    /**
     * Filter meals by tags
     * @param {Array} tagIds - Tag IDs to filter by
     * @param {string} mode - 'any' (OR) or 'all' (AND)
     * @returns {Array} Filtered meals
     */
    filterMealsByTags(tagIds, mode = 'any') {
        if (!tagIds || tagIds.length === 0) {
            return this.getActiveMeals();
        }

        return this.getActiveMeals().filter(meal => {
            if (!meal.tags || meal.tags.length === 0) return false;

            if (mode === 'all') {
                return tagIds.every(tagId => meal.tags.includes(tagId));
            } else {
                return tagIds.some(tagId => meal.tags.includes(tagId));
            }
        });
    }

    /**
     * Get meals without any tags
     * @returns {Array} Untagged meals
     */
    getUntaggedMeals() {
        return this.getActiveMeals().filter(meal => !meal.tags || meal.tags.length === 0);
    }

    /**
     * Auto-suggest tags for a meal based on ingredients
     * @param {string} mealCode - Meal code
     * @returns {Array} Suggested tag IDs
     */
    suggestTagsForMeal(mealCode) {
        const meal = this.meals.get(mealCode);
        if (!meal) return [];

        const suggestions = new Set();
        const ingredientNames = (meal.ingredients || [])
            .map(i => (i.name || i).toLowerCase())
            .join(' ');

        // Protein detection
        if (ingredientNames.includes('chicken')) suggestions.add('chicken');
        if (ingredientNames.includes('turkey')) suggestions.add('turkey');
        if (ingredientNames.includes('mackerel') || ingredientNames.includes('fish') ||
            ingredientNames.includes('salmon') || ingredientNames.includes('tuna')) {
            suggestions.add('fish');
        }

        // Effort detection based on time
        const totalTime = (meal.prepTime || 0) + (meal.cookTime || 0);
        if (totalTime <= 30) suggestions.add('quick');
        else if (totalTime <= 60) suggestions.add('medium');
        else suggestions.add('involved');

        // Dietary detection
        if (meal.servings && meal.ingredients) {
            const proteinIngredients = meal.ingredients.filter(i =>
                ['chicken', 'turkey', 'fish', 'egg', 'mackerel'].some(p =>
                    (i.name || i).toLowerCase().includes(p)
                )
            );
            if (proteinIngredients.length >= 2) {
                suggestions.add('high-protein');
            }
        }

        return [...suggestions];
    }

    // ==================
    // ARCHIVE ENHANCEMENTS
    // ==================

    /**
     * Archive a meal with reason and tags preserved
     * @param {string} code - Meal code
     * @param {string} reason - Optional reason for archiving
     */
    archiveMealEnhanced(code, reason = null) {
        const meal = this.meals.get(code);
        if (!meal) {
            throw new Error(`Meal ${code} not found`);
        }

        // Update status
        meal.status = 'archived';
        meal.archivedDate = new Date().toISOString().split('T')[0];
        meal.archiveReason = reason;

        // Remove from active meals
        this.meals.delete(code);

        // Remove from rotation
        this.rotationOrder = this.rotationOrder.filter(c => c !== code);

        // Add to archived (tags are preserved)
        this.archivedMeals.push(meal);

        this.persistChanges();

        if (this.useStateManager) {
            emit(EVENTS.MEAL_ARCHIVED, { code, meal, reason });
        }

        return meal;
    }

    /**
     * Search archived meals by name or tags
     * @param {string} query - Search query
     * @returns {Array} Matching archived meals
     */
    searchArchivedMeals(query) {
        if (!query) return this.archivedMeals;

        const lowerQuery = query.toLowerCase();
        return this.archivedMeals.filter(meal => {
            const nameMatch = meal.name.toLowerCase().includes(lowerQuery);
            const tagMatch = meal.tags?.some(tagId => {
                const tag = this.tags.find(t => t.id === tagId);
                return tag?.name.toLowerCase().includes(lowerQuery);
            });
            return nameMatch || tagMatch;
        });
    }

    /**
     * Get archive statistics
     * @returns {Object} Archive stats
     */
    getArchiveStats() {
        const byReason = {};
        const byTag = {};

        for (const meal of this.archivedMeals) {
            const reason = meal.archiveReason || 'No reason';
            byReason[reason] = (byReason[reason] || 0) + 1;

            for (const tagId of (meal.tags || [])) {
                byTag[tagId] = (byTag[tagId] || 0) + 1;
            }
        }

        return {
            total: this.archivedMeals.length,
            byReason,
            byTag
        };
    }
}

// Export constants
export { TAG_CATEGORIES, DEFAULT_TAGS };

// Export singleton instance
const mealLibrary = new MealLibrary();
export default mealLibrary;
