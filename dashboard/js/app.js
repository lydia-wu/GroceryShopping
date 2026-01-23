/**
 * Main Application Module
 * Ties together all components and manages UI state
 *
 * v2.0.0 - Integrated with new core infrastructure
 */

console.log('[app.js] Module loading started...');

import CONFIG from './config.js';
console.log('[app.js] CONFIG loaded');
import excelReader from './excel-reader.js';
import googleSheets from './google-sheets.js';
import nutritionAPI from './nutrition.js';
import chartManager from './charts.js';
import mealLibrary, { TAG_CATEGORIES } from './meal-library.js';
import shoppingListGenerator from './shopping-list.js';
import staplesTracker from './staples-tracker.js';
import seasonalData from './seasonal-data.js';
import dietaryAlerts from './dietary-alerts.js';
console.log('[app.js] Legacy modules loaded');

// v2.0.0 Core Infrastructure
import { getState, setState, subscribe } from './core/state-manager.js';
console.log('[app.js] state-manager loaded');
import { emit, on, EVENTS } from './core/event-bus.js';
console.log('[app.js] event-bus loaded');
import priceService from './services/price-service.js';
console.log('[app.js] price-service loaded');
import { getDiverseFactsForMeal, getFactsForCategory, healthCategories, healthBenefits } from './data/health-benefits.js';
console.log('[app.js] All imports complete!');

class MealDashboardApp {
    constructor() {
        this.state = {
            meals: {},
            cookingHistory: {},
            trips: [],
            mealsNutrition: {},
            storeData: {},
            currentView: 'dashboard',
            isLoading: true,
            error: null,
            // Tag filter state
            activeTagFilters: [],
            tagFilterMode: 'any' // 'any' or 'all'
        };

        this.modals = {};
        this.v2Enabled = true; // Flag for v2.0.0 features
        this.currentEditingMealCode = null; // For tag editor
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        console.log(`Meal Dashboard v${CONFIG.version} initializing...`);

        // Display version
        this.displayVersion();

        // Set up event listeners
        this.setupEventListeners();

        // v2.0.0: Initialize core infrastructure
        if (this.v2Enabled) {
            await this.initCoreInfrastructure();
        }

        // Initialize modules
        await mealLibrary.loadData();
        await staplesTracker.loadLogs();

        // v2.0.0: Enable state manager integration in meal library
        if (this.v2Enabled) {
            mealLibrary.enableStateManager();
        }

        // Load data
        await this.loadAllData();

        // v2.0.0: Import prices from shopping trips
        if (this.v2Enabled && this.state.trips.length > 0) {
            const result = priceService.importFromTrips(this.state.trips);
            console.log(`Price service: imported ${result.imported} prices, skipped ${result.skipped}`);
        }

        // Render UI
        this.renderDashboard();

        console.log('Dashboard initialized successfully');
    }

    /**
     * v2.0.0: Initialize core infrastructure modules
     */
    async initCoreInfrastructure() {
        console.log('Initializing v2.0.0 core infrastructure...');

        // Initialize price service
        await priceService.init();

        // Subscribe to key events
        this.setupEventSubscriptions();

        console.log('Core infrastructure initialized');
    }

    /**
     * v2.0.0: Set up event bus subscriptions
     */
    setupEventSubscriptions() {
        // Meal events
        on(EVENTS.MEAL_ADDED, (data) => {
            console.log('Event: Meal added', data.code);
            this.state.meals[data.code] = data.meal;
            this.renderDashboard();
        });

        on(EVENTS.MEAL_UPDATED, (data) => {
            console.log('Event: Meal updated', data.code);
            if (this.state.meals[data.code]) {
                this.state.meals[data.code] = { ...this.state.meals[data.code], ...data.meal };
            }
        });

        on(EVENTS.MEAL_ARCHIVED, (data) => {
            console.log('Event: Meal archived', data.code);
            delete this.state.meals[data.code];
            this.showToast(`Archived ${data.meal.name}`, 'info');
            this.renderDashboard();
        });

        on(EVENTS.MEAL_RESTORED, (data) => {
            console.log('Event: Meal restored', data.code);
            this.state.meals[data.code] = data.meal;
            this.showToast(`Restored ${data.meal.name}`, 'success');
            this.renderDashboard();
        });

        on(EVENTS.ROTATION_CHANGED, (data) => {
            console.log('Event: Rotation changed', data.action);
            this.renderRotationTimeline();
        });

        on(EVENTS.PRICE_UPDATED, (data) => {
            console.log('Event: Price updated', data.ingredientKey);
        });

        // UI events
        on(EVENTS.TOAST_SHOW, (data) => {
            this.showToast(data.message, data.type);
        });
    }

    /**
     * Display version number
     */
    displayVersion() {
        const versionDisplay = document.getElementById('version-display');
        const footerVersion = document.getElementById('footer-version');

        if (versionDisplay) versionDisplay.textContent = `v${CONFIG.version}`;
        if (footerVersion) footerVersion.textContent = `v${CONFIG.version}`;
    }

    /**
     * Load all data from sources
     */
    async loadAllData() {
        this.state.isLoading = true;
        this.showLoading();

        try {
            // Load Excel data
            const excelData = await this.loadExcelData();

            // Load cooking history
            const cookingHistory = await googleSheets.getCookingHistory();
            this.state.cookingHistory = cookingHistory;

            // Merge Excel data with config meals
            this.state.meals = this.mergeMealData(excelData.meals || {});

            // Store trips and store data
            this.state.trips = excelData.trips || [];
            this.state.storeData = excelData.totalsByStore || {};

            // Calculate nutrition for meals
            await this.calculateMealNutrition();

            this.state.isLoading = false;
            this.state.error = null;

        } catch (error) {
            console.error('Error loading data:', error);
            this.state.error = error.message;
            this.state.isLoading = false;

            // Use fallback demo data
            await this.loadDemoData();
        }

        this.hideLoading();
    }

    /**
     * Load Excel data with error handling
     */
    async loadExcelData() {
        try {
            return await excelReader.getAllData();
        } catch (error) {
            console.warn('Failed to load Excel data, using defaults:', error);
            return { meals: {}, trips: [], totalsByStore: {} };
        }
    }

    /**
     * Merge Excel meal data with config defaults
     */
    mergeMealData(excelMeals) {
        const merged = {};

        // Start with config meals
        for (const code in CONFIG.meals) {
            merged[code] = { ...CONFIG.meals[code] };
        }

        // Overlay Excel data (but preserve CONFIG ingredients if Excel doesn't have them)
        for (const code in excelMeals) {
            if (merged[code]) {
                const excelData = excelMeals[code];
                merged[code] = {
                    ...merged[code],
                    ...excelData,
                    // Preserve config ingredients if Excel doesn't have them or they're empty
                    ingredients: (excelData.ingredients && excelData.ingredients.length > 0)
                        ? excelData.ingredients
                        : merged[code].ingredients,
                    // Keep config values for certain fields if not in Excel
                    prepTime: excelData.prepTime || merged[code].prepTime,
                    cookTime: excelData.cookTime || merged[code].cookTime
                };
            } else {
                merged[code] = excelMeals[code];
            }
        }

        return merged;
    }

    /**
     * Load demo data when APIs fail
     */
    async loadDemoData() {
        console.log('Loading demo data...');

        this.state.meals = { ...CONFIG.meals };
        this.state.trips = [
            { tripNumber: 1, name: 'Trip 1', totalCost: 149.05, date: '2026-01-08' },
            { tripNumber: 2, name: 'Trip 2', totalCost: 142.50, date: '2026-01-15' },
            { tripNumber: 3, name: 'Trip 3', totalCost: 155.20, date: '2026-01-22' }
        ];
        this.state.storeData = {
            'Costco': 250.00,
            'H-Mart': 85.00,
            'Safeway': 95.00,
            'Grains from the Plains': 16.75
        };

        // Calculate nutrition for demo meals
        await this.calculateMealNutrition();
    }

    /**
     * Calculate nutrition for all meals
     */
    async calculateMealNutrition() {
        console.log('Calculating nutrition for meals:', Object.keys(this.state.meals));

        for (const code in this.state.meals) {
            const meal = this.state.meals[code];
            console.log(`Processing meal ${code}:`, meal?.name, 'ingredients:', meal?.ingredients?.length);

            try {
                const nutrition = await nutritionAPI.getMealNutritionPerServing(meal);
                console.log(`Meal ${code} nutrition:`, nutrition);

                const dailyValues = nutritionAPI.getDailyValuePercent(nutrition);
                const funFacts = nutritionAPI.getFunFacts(nutrition, meal.ingredients);

                this.state.mealsNutrition[code] = {
                    name: meal.name,
                    nutrition,
                    dailyValues,
                    funFacts
                };
                console.log(`Meal ${code} nutrition stored successfully`);
            } catch (error) {
                console.error(`Failed to calculate nutrition for meal ${code}:`, error);
            }
        }

        console.log('Final mealsNutrition:', Object.keys(this.state.mealsNutrition));
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Log cooking button
        document.getElementById('log-cooking-btn')?.addEventListener('click', () => {
            this.openModal('log-cooking');
        });

        // Manage rotation button
        document.getElementById('manage-rotation-btn')?.addEventListener('click', () => {
            this.openModal('rotation');
        });

        // Log staple button
        document.getElementById('log-staple-btn')?.addEventListener('click', () => {
            this.openModal('staple');
        });

        // Modal close buttons
        this.setupModalListeners();

        // Form submissions
        document.getElementById('log-cooking-form')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogCooking();
        });

        document.getElementById('save-log-cooking')?.addEventListener('click', () => {
            this.handleLogCooking();
        });

        document.getElementById('cancel-log-cooking')?.addEventListener('click', () => {
            this.closeModal('log-cooking');
        });

        document.getElementById('save-staple')?.addEventListener('click', () => {
            this.handleLogStaple();
        });

        document.getElementById('cancel-staple')?.addEventListener('click', () => {
            this.closeModal('staple');
            this.toggleStapleDetailFields(''); // Hide detail fields on cancel
        });

        // Feature 4: Toggle item-specific fields based on staple selection
        document.getElementById('staple-select')?.addEventListener('change', (e) => {
            this.toggleStapleDetailFields(e.target.value);
        });

        // Shopping list
        document.getElementById('generate-shopping-list')?.addEventListener('click', () => {
            this.generateShoppingList();
        });

        document.getElementById('copy-shopping-list')?.addEventListener('click', () => {
            this.copyShoppingList();
        });

        // Meal library buttons
        document.getElementById('add-meal-btn')?.addEventListener('click', () => {
            this.openAddMealModal();
        });

        document.getElementById('view-library-btn')?.addEventListener('click', () => {
            this.openModal('library');
            this.renderMealLibrary();
        });

        // Archive search (Feature 16)
        document.getElementById('archive-search-input')?.addEventListener('input', (e) => {
            this.renderMealLibrary(e.target.value);
        });

        // Archive reason modal handlers (Feature 16)
        document.getElementById('archive-reason-select')?.addEventListener('change', (e) => {
            const customGroup = document.getElementById('archive-reason-custom-group');
            if (customGroup) {
                customGroup.style.display = e.target.value === 'other' ? 'block' : 'none';
            }
        });

        document.getElementById('confirm-archive')?.addEventListener('click', () => {
            this.confirmArchiveMeal();
        });

        document.getElementById('cancel-archive-reason')?.addEventListener('click', () => {
            this.closeModal('archive-reason');
        });

        document.getElementById('save-meal-edit')?.addEventListener('click', () => {
            this.handleSaveMeal();
        });

        document.getElementById('cancel-meal-edit')?.addEventListener('click', () => {
            this.closeModal('meal-edit');
        });

        // Tag editor modal
        document.getElementById('close-tag-editor')?.addEventListener('click', () => {
            this.closeModal('tag-editor');
        });

        document.getElementById('cancel-tag-editor')?.addEventListener('click', () => {
            this.closeModal('tag-editor');
        });

        document.getElementById('save-tags')?.addEventListener('click', () => {
            this.saveTagsFromEditor();
        });

        document.getElementById('create-new-tag')?.addEventListener('click', () => {
            this.createNewTag();
        });

        // Close all modals on backdrop click
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) {
                    this.closeAllModals();
                }
            });
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }

    /**
     * Set up modal-specific listeners
     */
    setupModalListeners() {
        const modalConfigs = [
            { backdrop: 'log-cooking-modal-backdrop', close: 'close-log-cooking', name: 'log-cooking' },
            { backdrop: 'nutrition-modal-backdrop', close: 'close-nutrition', name: 'nutrition' },
            { backdrop: 'rotation-modal-backdrop', close: 'close-rotation', name: 'rotation' },
            { backdrop: 'shopping-modal-backdrop', close: 'close-shopping', name: 'shopping' },
            { backdrop: 'meal-edit-modal-backdrop', close: 'close-meal-edit', name: 'meal-edit' },
            { backdrop: 'staple-modal-backdrop', close: 'close-staple', name: 'staple' },
            { backdrop: 'library-modal-backdrop', close: 'close-library', name: 'library' },
            { backdrop: 'tag-editor-modal-backdrop', close: 'close-tag-editor', name: 'tag-editor' },
            { backdrop: 'archive-reason-modal-backdrop', close: 'close-archive-reason', name: 'archive-reason' }
        ];

        modalConfigs.forEach(config => {
            const closeBtn = document.getElementById(config.close);
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.closeModal(config.name));
            }

            // Also handle buttons with -btn suffix
            const closeBtn2 = document.getElementById(`${config.close}-btn`);
            if (closeBtn2) {
                closeBtn2.addEventListener('click', () => this.closeModal(config.name));
            }
        });
    }

    /**
     * Handle navigation
     */
    handleNavigation(e) {
        const view = e.target.dataset.view;
        if (!view) return;

        // Update active state
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        this.state.currentView = view;

        // Show/hide sections based on view
        this.updateViewVisibility(view);
    }

    /**
     * Update section visibility based on view
     */
    updateViewVisibility(view) {
        const sections = {
            dashboard: ['hero-section', 'rotation-timeline', 'meals-section', 'charts-section', 'staples-section', 'fresh-section'],
            meals: ['meals-section'],
            shopping: ['shopping-section'],
            analytics: ['charts-section']
        };

        // For now, show all sections (can be customized later)
        // This is a simplified implementation
    }

    /**
     * Render the dashboard
     */
    renderDashboard() {
        this.renderHeroSection();
        this.renderRotationTimeline();
        this.renderTagFilterBar();
        this.renderMealCards();
        this.renderStaples();
        this.renderWhatsNow();
        this.renderCharts();
        this.populateMealSelects();
    }

    /**
     * Render hero section with next meal
     */
    renderHeroSection() {
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        document.getElementById('today-date').textContent = `TODAY: ${todayStr}`;

        // Determine next meal based on rotation and cooking history
        const nextMeal = this.calculateNextMeal();

        if (nextMeal) {
            document.getElementById('next-meal-name').textContent = `Meal ${nextMeal.code} - ${nextMeal.name}`;
            document.getElementById('next-meal-details').textContent = nextMeal.description || '';
            document.getElementById('next-meal-servings').textContent = `${nextMeal.servings} servings`;
            document.getElementById('next-meal-cost').textContent = nextMeal.totalCost
                ? `~$${nextMeal.totalCost.toFixed(2)}`
                : '--';
            document.getElementById('next-meal-time').textContent = nextMeal.prepTime && nextMeal.cookTime
                ? `${nextMeal.prepTime} + ${nextMeal.cookTime} min`
                : '--';

            // Calculate next cooking date
            const nextDate = this.calculateNextCookingDate(nextMeal.code);
            document.getElementById('next-meal-date').textContent = nextDate
                ? nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Soon';
        }
    }

    /**
     * Calculate next meal to cook
     */
    calculateNextMeal() {
        const rotationOrder = mealLibrary.getRotationOrder();
        const history = this.state.cookingHistory;

        // Find the meal that was cooked least recently
        let nextMealCode = rotationOrder[0];
        let oldestDate = new Date();

        for (const code of rotationOrder) {
            const mealHistory = history[code];
            if (!mealHistory || mealHistory.length === 0) {
                // Never cooked - this is next
                nextMealCode = code;
                break;
            }

            const lastCooked = new Date(mealHistory[0].date);
            if (lastCooked < oldestDate) {
                oldestDate = lastCooked;
                nextMealCode = code;
            }
        }

        return this.state.meals[nextMealCode] || CONFIG.meals[nextMealCode];
    }

    /**
     * Calculate next cooking date based on servings consumption
     */
    calculateNextCookingDate(mealCode) {
        const history = this.state.cookingHistory[mealCode];
        if (!history || history.length === 0) {
            return new Date(); // Cook today if never cooked
        }

        const lastCooked = new Date(history[0].date);
        const meal = this.state.meals[mealCode];
        const servings = history[0].servings || meal?.servings || 6;
        const daysOfFood = Math.ceil(servings / CONFIG.mealRotation.servingsPerDay);

        const nextDate = new Date(lastCooked);
        nextDate.setDate(nextDate.getDate() + daysOfFood);

        return nextDate;
    }

    /**
     * Render rotation timeline
     */
    renderRotationTimeline() {
        const container = document.getElementById('rotation-timeline');
        if (!container) return;

        const rotationOrder = mealLibrary.getRotationOrder();
        const history = this.state.cookingHistory;
        const nextMeal = this.calculateNextMeal();

        let html = '';

        for (const code of rotationOrder) {
            const meal = this.state.meals[code] || CONFIG.meals[code];
            const mealHistory = history[code];
            const lastCooked = mealHistory?.[0]?.date;

            const isCompleted = lastCooked && this.isRecentlyCoooked(lastCooked);
            const isNext = code === nextMeal?.code;

            const statusClass = isNext ? 'next' : (isCompleted ? 'completed' : '');
            const statusText = isNext ? 'NEXT' : (isCompleted ? `✓ ${this.formatShortDate(lastCooked)}` : 'Pending');

            html += `
                <div class="rotation-item ${statusClass}" data-meal="${code}">
                    <div class="rotation-code">Meal ${code}</div>
                    <div class="rotation-date">${meal?.name?.split(' ').slice(0, 2).join(' ') || 'Unknown'}</div>
                    <div class="rotation-status">${statusText}</div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Add click handlers
        container.querySelectorAll('.rotation-item').forEach(item => {
            item.addEventListener('click', () => {
                const code = item.dataset.meal;
                this.showMealDetails(code);
            });
        });
    }

    /**
     * Check if date is within recent cooking cycle
     */
    isRecentlyCoooked(dateStr) {
        const date = new Date(dateStr);
        const daysSince = Math.floor((new Date() - date) / (1000 * 60 * 60 * 24));
        return daysSince < 14; // Within current cycle
    }

    /**
     * Format short date
     */
    formatShortDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    }

    /**
     * Render meal cards
     */
    renderMealCards() {
        const container = document.getElementById('meals-grid');
        if (!container) return;

        const rotationOrder = mealLibrary.getRotationOrder();
        let html = '';

        // Apply tag filters if any
        let mealsToRender = rotationOrder;
        if (this.state.activeTagFilters.length > 0) {
            const filteredMeals = mealLibrary.filterMealsByTags(
                this.state.activeTagFilters,
                this.state.tagFilterMode
            );
            const filteredCodes = filteredMeals.map(m => m.code);
            mealsToRender = rotationOrder.filter(code => filteredCodes.includes(code));
        }

        for (const code of mealsToRender) {
            const meal = this.state.meals[code] || CONFIG.meals[code];
            if (!meal) continue;

            const history = this.state.cookingHistory[code];
            const lastCooked = history?.[0]?.date;
            const nextDue = this.calculateNextCookingDate(code);

            // Get dietary alerts
            const alerts = dietaryAlerts.checkMeal(meal);

            // Get seasonal/local counts
            const ingredientNames = (meal.ingredients || []).map(i =>
                typeof i === 'string' ? i : i.name
            );
            const seasonalLocal = seasonalData.countSeasonalLocal(ingredientNames);

            // Calculate cost per serving (v2.0.0: use price service if available)
            let costPerServing = meal.costPerServing || 0;

            if (this.v2Enabled) {
                try {
                    const costData = priceService.calculateMealCost(meal);
                    if (costData.costPerServing > 0) {
                        costPerServing = costData.costPerServing;
                    }
                } catch (e) {
                    // Price service not ready, use default
                }
            }

            // Render tags
            const mealTags = mealLibrary.getMealTags(code);
            let tagsHtml = '';
            if (seasonalLocal.seasonalCount > 0) {
                tagsHtml += `<span class="badge badge-seasonal">🌱 ${seasonalLocal.seasonalCount} seasonal</span>`;
            }
            if (seasonalLocal.localCount > 0) {
                tagsHtml += `<span class="badge badge-local">🏔️ ${seasonalLocal.localCount} local</span>`;
            }
            if (alerts.hasAlerts) {
                tagsHtml += `<span class="badge badge-warning" title="${alerts.alerts.map(a => a.reason).join(', ')}">⚠️ ${alerts.count} alert${alerts.count > 1 ? 's' : ''}</span>`;
            }
            // Show all meal tags
            for (const tag of mealTags) {
                tagsHtml += `<span class="badge badge-tag" data-category="${tag.category}">${tag.name}</span>`;
            }
            // Add edit tags button
            tagsHtml += `<button class="edit-tags-btn" data-meal="${code}" title="Edit tags">✏️</button>`;

            html += `
                <div class="meal-card" data-meal="${code}">
                    <div class="meal-card-header">
                        <div class="meal-code">${code}</div>
                        <div class="meal-name">${meal.name}</div>
                    </div>
                    <div class="meal-card-body">
                        <div class="meal-meta">
                            <div class="meal-meta-item">
                                <span>Servings:</span> ${meal.servings}
                            </div>
                            <div class="meal-meta-item">
                                <span>Cost/Serving:</span> ${costPerServing > 0 ? `$${costPerServing.toFixed(2)}` : '--'}
                            </div>
                            ${meal.prepTime || meal.cookTime ? `
                            <div class="meal-meta-item">
                                <span>Time:</span> ${meal.prepTime || 0}+${meal.cookTime || 0} min
                            </div>
                            ` : ''}
                        </div>

                        <div class="meal-tags">
                            ${tagsHtml}
                        </div>

                        <div class="meal-dates">
                            <div>
                                <span class="meal-date-label">Last cooked:</span>
                                <span class="meal-date-value">${lastCooked ? this.formatShortDate(lastCooked) : 'Never'}</span>
                            </div>
                            <div>
                                <span class="meal-date-label">Next due:</span>
                                <span class="meal-date-value">${nextDue ? this.formatShortDate(nextDue) : '--'}</span>
                            </div>
                        </div>
                    </div>
                    <div class="meal-card-actions">
                        <button class="btn btn-sm btn-outline view-nutrition-btn" data-meal="${code}">Nutrition</button>
                        <button class="btn btn-sm btn-primary log-meal-btn" data-meal="${code}">Log Cooking</button>
                        <button class="btn btn-sm btn-outline archive-meal-btn" data-meal="${code}" title="Archive meal">📦</button>
                    </div>
                </div>
            `;
        }

        // Show message if no meals match filters
        if (mealsToRender.length === 0 && this.state.activeTagFilters.length > 0) {
            html = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <div class="empty-state-icon">🔍</div>
                    <h4 class="empty-state-title">No meals match filters</h4>
                    <p class="empty-state-text">Try adjusting your tag filters or clear them to see all meals.</p>
                </div>
            `;
        }

        container.innerHTML = html;

        // Add event listeners
        container.querySelectorAll('.view-nutrition-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showNutritionModal(btn.dataset.meal);
            });
        });

        container.querySelectorAll('.log-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openLogCookingModal(btn.dataset.meal);
            });
        });

        // Add edit tags button listeners
        container.querySelectorAll('.edit-tags-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTagEditorModal(btn.dataset.meal);
            });
        });

        // Add archive button listeners (Feature 16)
        container.querySelectorAll('.archive-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openArchiveModal(btn.dataset.meal);
            });
        });
    }

    /**
     * Render tag filter bar
     */
    renderTagFilterBar() {
        const container = document.getElementById('tag-filter-chips');
        if (!container) return;

        const allTags = mealLibrary.getAllTags();
        const categories = mealLibrary.getTagCategories();

        let html = '';

        // Group tags by category for better organization
        for (const categoryId of Object.keys(categories)) {
            const categoryTags = allTags.filter(t => t.category === categoryId);
            for (const tag of categoryTags) {
                const isActive = this.state.activeTagFilters.includes(tag.id);
                html += `
                    <span class="tag-filter-chip ${isActive ? 'active' : ''}"
                          data-tag-id="${tag.id}"
                          data-category="${tag.category}">
                        ${tag.name}
                    </span>
                `;
            }
        }

        container.innerHTML = html;

        // Update filter mode checkbox
        const filterModeCheckbox = document.getElementById('filter-mode-all');
        if (filterModeCheckbox) {
            filterModeCheckbox.checked = this.state.tagFilterMode === 'all';
        }

        // Add click handlers
        container.querySelectorAll('.tag-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const tagId = chip.dataset.tagId;
                this.toggleTagFilter(tagId);
            });
        });

        // Filter mode toggle handler
        const modeCheckbox = document.getElementById('filter-mode-all');
        if (modeCheckbox) {
            modeCheckbox.removeEventListener('change', this.handleFilterModeChange);
            this.handleFilterModeChange = () => {
                this.state.tagFilterMode = modeCheckbox.checked ? 'all' : 'any';
                this.renderMealCards();
            };
            modeCheckbox.addEventListener('change', this.handleFilterModeChange);
        }

        // Clear filters handler
        const clearBtn = document.getElementById('clear-tag-filters');
        if (clearBtn) {
            clearBtn.removeEventListener('click', this.handleClearFilters);
            this.handleClearFilters = () => {
                this.state.activeTagFilters = [];
                this.renderTagFilterBar();
                this.renderMealCards();
            };
            clearBtn.addEventListener('click', this.handleClearFilters);
        }
    }

    /**
     * Toggle a tag filter on/off
     */
    toggleTagFilter(tagId) {
        const index = this.state.activeTagFilters.indexOf(tagId);
        if (index > -1) {
            this.state.activeTagFilters.splice(index, 1);
        } else {
            this.state.activeTagFilters.push(tagId);
        }

        this.renderTagFilterBar();
        this.renderMealCards();
    }

    /**
     * Open tag editor modal for a meal
     */
    openTagEditorModal(mealCode) {
        this.currentEditingMealCode = mealCode;
        const meal = this.state.meals[mealCode] || CONFIG.meals[mealCode];

        if (!meal) return;

        // Set title
        document.getElementById('tag-editor-meal-name').textContent = meal.name;

        // Render tag editor content
        this.renderTagEditorContent(mealCode);

        // Open modal
        this.openModal('tag-editor');
    }

    /**
     * Render tag editor modal content
     */
    renderTagEditorContent(mealCode) {
        const container = document.getElementById('tag-editor-content');
        if (!container) return;

        const allTags = mealLibrary.getAllTags();
        const categories = mealLibrary.getTagCategories();
        const currentTags = mealLibrary.getMealTags(mealCode).map(t => t.id);

        let html = '';

        // Render each category
        for (const [categoryId, categoryInfo] of Object.entries(categories)) {
            const categoryTags = allTags.filter(t => t.category === categoryId);
            if (categoryTags.length === 0) continue;

            html += `
                <div class="tag-category-section">
                    <div class="tag-category-label" style="color: ${categoryInfo.color}">${categoryInfo.label}</div>
                    <div class="tag-checkbox-group">
            `;

            for (const tag of categoryTags) {
                const isChecked = currentTags.includes(tag.id);
                html += `
                    <label class="tag-checkbox-item ${isChecked ? 'checked' : ''}" data-category="${tag.category}">
                        <input type="checkbox" name="meal-tags" value="${tag.id}" ${isChecked ? 'checked' : ''}>
                        <span>${tag.name}</span>
                    </label>
                `;
            }

            html += `
                    </div>
                </div>
            `;
        }

        // Add suggested tags section
        const suggestedTags = mealLibrary.suggestTagsForMeal(mealCode);
        const newSuggestions = suggestedTags.filter(tagId => !currentTags.includes(tagId));

        if (newSuggestions.length > 0) {
            html += `
                <div class="tag-category-section" style="margin-top: var(--space-4); padding-top: var(--space-4); border-top: 1px dashed var(--color-gray-300);">
                    <div class="tag-category-label" style="color: var(--color-info);">💡 Suggested Tags</div>
                    <div class="tag-checkbox-group">
            `;

            for (const tagId of newSuggestions) {
                const tag = allTags.find(t => t.id === tagId);
                if (tag) {
                    html += `
                        <label class="tag-checkbox-item" data-category="${tag.category}">
                            <input type="checkbox" name="meal-tags" value="${tag.id}">
                            <span>${tag.name}</span>
                        </label>
                    `;
                }
            }

            html += `
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;

        // Add change handlers to update visual state
        container.querySelectorAll('.tag-checkbox-item input').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const label = e.target.closest('.tag-checkbox-item');
                if (e.target.checked) {
                    label.classList.add('checked');
                } else {
                    label.classList.remove('checked');
                }
            });
        });
    }

    /**
     * Save tags from the tag editor modal
     */
    saveTagsFromEditor() {
        const mealCode = this.currentEditingMealCode;
        if (!mealCode) return;

        // Get all checked tags
        const checkedTags = [];
        document.querySelectorAll('#tag-editor-content input[name="meal-tags"]:checked').forEach(cb => {
            checkedTags.push(cb.value);
        });

        try {
            mealLibrary.setMealTags(mealCode, checkedTags);

            // Update local state
            if (this.state.meals[mealCode]) {
                this.state.meals[mealCode].tags = checkedTags;
            }

            this.showToast('Tags updated successfully', 'success');
            this.closeModal('tag-editor');
            this.renderMealCards();
            this.renderTagFilterBar();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Create a new tag from the tag editor modal
     */
    createNewTag() {
        const nameInput = document.getElementById('new-tag-name');
        const categorySelect = document.getElementById('new-tag-category');

        const name = nameInput.value.trim();
        const category = categorySelect.value;

        if (!name) {
            this.showToast('Please enter a tag name', 'error');
            return;
        }

        try {
            const newTag = mealLibrary.addTag({ name, category });
            this.showToast(`Created tag: ${newTag.name}`, 'success');

            // Clear input
            nameInput.value = '';

            // Re-render tag editor content
            if (this.currentEditingMealCode) {
                this.renderTagEditorContent(this.currentEditingMealCode);
            }

            // Re-render filter bar
            this.renderTagFilterBar();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Render staples section
     */
    renderStaples() {
        const container = document.getElementById('staples-grid');
        if (!container) return;

        container.innerHTML = staplesTracker.generateStaplesHTML();
    }

    /**
     * Render What's Fresh Now section
     */
    renderWhatsNow() {
        const data = seasonalData.getWhatsNow();

        document.getElementById('fresh-month').textContent = `- ${data.month}`;

        const fruitsContainer = document.getElementById('fresh-fruits');
        const vegetablesContainer = document.getElementById('fresh-vegetables');

        if (fruitsContainer) {
            fruitsContainer.innerHTML = data.fruits.map(item => `
                <li class="fresh-item">
                    <span>${item.name}</span>
                    ${item.isLocal ? '<span class="badge badge-local">🏔️ CO</span>' : ''}
                </li>
            `).join('');
        }

        if (vegetablesContainer) {
            vegetablesContainer.innerHTML = data.vegetables.map(item => `
                <li class="fresh-item">
                    <span>${item.name}</span>
                    ${item.isLocal ? '<span class="badge badge-local">🏔️ CO</span>' : ''}
                </li>
            `).join('');
        }
    }

    /**
     * Render charts
     */
    renderCharts() {
        // Filter trips to only show current rotation period
        const filteredTrips = this.filterTripsForDisplay(this.state.trips);

        // Also filter store data based on filtered trips
        const filteredStoreData = this.calculateStoreDataFromTrips(filteredTrips);

        // Calculate meal costs using price service and add to meals data for charts
        const mealsWithCosts = this.calculateMealCostsForCharts();

        chartManager.updateAllCharts({
            meals: mealsWithCosts,
            trips: filteredTrips,
            storeData: filteredStoreData,
            mealsNutrition: this.state.mealsNutrition,
            healthBenefitsData: { healthCategories, healthBenefits }
        });
    }

    /**
     * Calculate costs for all meals using price service
     * Returns meals object with totalCost and costPerServing populated
     */
    calculateMealCostsForCharts() {
        const mealsWithCosts = {};

        for (const code of Object.keys(this.state.meals)) {
            const meal = this.state.meals[code];
            const costData = priceService.calculateMealCost(meal);

            mealsWithCosts[code] = {
                ...meal,
                totalCost: costData.totalCost,
                costPerServing: costData.costPerServing
            };
        }

        return mealsWithCosts;
    }

    /**
     * Filter trips to only show those relevant to current meal rotation
     *
     * DYNAMIC DATE LOGIC:
     * - Finds the earliest "last cooked" date among all meals in current rotation
     * - Subtracts a buffer (default 14 days) for shelf-stable item purchases
     * - Only shows trips from that date onwards
     *
     * MANUAL OVERRIDE:
     * - Set CONFIG.mealRotation.rotationStartDate to a specific date (e.g., '2025-12-01')
     * - Set to null to use dynamic calculation based on cooking history
     *
     * TO CHANGE START DATE: Search for "rotationStartDate" in dashboard/js/config.js
     */
    filterTripsForDisplay(trips) {
        if (!trips || trips.length === 0) return [];

        // For 2026 data: start from Jan 1, 2026
        const startDate = new Date('2026-01-01');
        console.log(`[Charts] Filtering trips from ${startDate.toISOString().split('T')[0]} onwards`);

        const filtered = trips.filter(trip => {
            if (!trip.date) return false;
            const tripDate = new Date(trip.date);
            return tripDate >= startDate;
        });

        // Sort by date ascending (oldest first for timeline view)
        filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(`[Charts] Showing ${filtered.length} of ${trips.length} trips`);
        return filtered;
    }

    /**
     * Calculate the start date for relevant spending data
     * Based on cooking history of current rotation meals
     *
     * TO CUSTOMIZE: Edit CONFIG.mealRotation in dashboard/js/config.js
     * - rotationStartDate: Set to specific date string (e.g., '2025-12-01') or null for dynamic
     * - shelfStableBufferDays: Days before first cook to include (default: 14)
     */
    calculateRotationStartDate() {
        // Manual override if set in config
        if (CONFIG.mealRotation.rotationStartDate) {
            return new Date(CONFIG.mealRotation.rotationStartDate);
        }

        // Dynamic: find earliest cook date in current rotation
        const rotationOrder = mealLibrary.getRotationOrder();
        const history = this.state.cookingHistory;
        let earliestCookDate = null;

        for (const code of rotationOrder) {
            const mealHistory = history[code];
            if (mealHistory && mealHistory.length > 0) {
                // Get the FIRST time this meal was cooked in current rotation
                // (last entry in array if sorted newest-first)
                const firstCook = mealHistory[mealHistory.length - 1];
                const cookDate = new Date(firstCook.date);

                if (!earliestCookDate || cookDate < earliestCookDate) {
                    earliestCookDate = cookDate;
                }
            }
        }

        // If no cooking history, default to last 30 days
        if (!earliestCookDate) {
            earliestCookDate = new Date();
            earliestCookDate.setDate(earliestCookDate.getDate() - 30);
        }

        // Subtract buffer for shelf-stable purchases (flour, frozen items, etc.)
        const bufferDays = CONFIG.mealRotation.shelfStableBufferDays || 14;
        earliestCookDate.setDate(earliestCookDate.getDate() - bufferDays);

        return earliestCookDate;
    }

    /**
     * Calculate store totals from filtered trips
     */
    calculateStoreDataFromTrips(trips) {
        const storeData = {};
        for (const trip of trips) {
            if (trip.storeBreakdown) {
                for (const [store, amount] of Object.entries(trip.storeBreakdown)) {
                    storeData[store] = (storeData[store] || 0) + amount;
                }
            } else if (trip.store && trip.totalCost) {
                storeData[trip.store] = (storeData[trip.store] || 0) + trip.totalCost;
            }
        }
        return storeData;
    }

    /**
     * Populate meal select dropdowns
     */
    populateMealSelects() {
        const select = document.getElementById('log-meal-select');
        if (!select) return;

        const rotationOrder = mealLibrary.getRotationOrder();

        select.innerHTML = '<option value="">Select a meal...</option>';

        for (const code of rotationOrder) {
            const meal = this.state.meals[code] || CONFIG.meals[code];
            select.innerHTML += `<option value="${code}">${code} - ${meal?.name || 'Unknown'}</option>`;
        }

        // Set default date to today
        const dateInput = document.getElementById('log-date');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    }

    /**
     * Open modal
     */
    openModal(modalName) {
        const backdrop = document.getElementById(`${modalName}-modal-backdrop`);
        const modal = document.getElementById(`${modalName}-modal`);

        if (backdrop && modal) {
            backdrop.classList.add('active');
            modal.classList.add('active');
        }
    }

    /**
     * Close modal
     */
    closeModal(modalName) {
        const backdrop = document.getElementById(`${modalName}-modal-backdrop`);
        const modal = document.getElementById(`${modalName}-modal`);

        if (backdrop && modal) {
            backdrop.classList.remove('active');
            modal.classList.remove('active');
        }
    }

    /**
     * Close all modals
     */
    closeAllModals() {
        document.querySelectorAll('.modal-backdrop.active').forEach(backdrop => {
            backdrop.classList.remove('active');
        });
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    /**
     * Open log cooking modal with pre-selected meal
     */
    openLogCookingModal(mealCode) {
        this.openModal('log-cooking');

        const select = document.getElementById('log-meal-select');
        if (select && mealCode) {
            select.value = mealCode;
        }

        const meal = this.state.meals[mealCode];
        if (meal) {
            const servingsInput = document.getElementById('log-servings');
            if (servingsInput) {
                servingsInput.value = meal.servings || 6;
            }
        }
    }

    /**
     * Handle log cooking form submission
     */
    async handleLogCooking() {
        const mealCode = document.getElementById('log-meal-select').value;
        const date = document.getElementById('log-date').value;
        const servings = document.getElementById('log-servings').value;
        const notes = document.getElementById('log-notes').value;

        if (!mealCode || !date) {
            this.showToast('Please select a meal and date', 'error');
            return;
        }

        const meal = this.state.meals[mealCode] || CONFIG.meals[mealCode];

        try {
            await googleSheets.addCookingEntry({
                date: date,
                mealCode: mealCode,
                mealName: meal?.name || `Meal ${mealCode}`,
                notes: notes,
                servings: servings || meal?.servings
            });

            // Update local state
            if (!this.state.cookingHistory[mealCode]) {
                this.state.cookingHistory[mealCode] = [];
            }
            this.state.cookingHistory[mealCode].unshift({
                date: date,
                notes: notes,
                servings: parseInt(servings) || meal?.servings
            });

            this.showToast(`Logged cooking for ${meal?.name || mealCode}`, 'success');
            this.closeModal('log-cooking');

            // Clear form
            document.getElementById('log-cooking-form').reset();
            document.getElementById('log-date').value = new Date().toISOString().split('T')[0];

            // Re-render
            this.renderDashboard();

        } catch (error) {
            console.error('Error logging cooking:', error);
            this.showToast('Saved locally (demo mode)', 'success');
            this.closeModal('log-cooking');
            this.renderDashboard();
        }
    }

    /**
     * Handle log staple form submission (Feature 4: Enhanced with detailed tracking)
     */
    async handleLogStaple() {
        const item = document.getElementById('staple-select').value;
        const date = document.getElementById('staple-date').value;
        const quantity = document.getElementById('staple-quantity').value;
        const notes = document.getElementById('staple-notes').value;

        if (!item || !date || !quantity) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Feature 4: Collect detailed tracking data
        const details = {};

        if (item === 'sourdough') {
            const flourType = document.getElementById('flour-type')?.value;
            const flourGrams = document.getElementById('flour-grams')?.value;
            if (flourType) details.flourType = flourType;
            if (flourGrams) details.flourGrams = parseFloat(flourGrams);
        }

        if (item === 'yogurt') {
            const milkQuantity = document.getElementById('milk-quantity')?.value;
            const starterType = document.getElementById('starter-type')?.value;
            const starterQuantity = document.getElementById('starter-quantity')?.value;
            const incubationHours = document.getElementById('incubation-hours')?.value;
            const strainingHours = document.getElementById('straining-hours')?.value;

            if (milkQuantity) details.milkQuantity = parseFloat(milkQuantity);
            if (starterType) details.starterType = starterType;
            if (starterQuantity) details.starterQuantity = parseFloat(starterQuantity);
            if (incubationHours) details.incubationHours = parseFloat(incubationHours);
            if (strainingHours) details.strainingHours = parseFloat(strainingHours);
        }

        try {
            await staplesTracker.addEntry(item, quantity, notes, date, details);

            this.showToast(`Logged ${item} production`, 'success');
            this.closeModal('staple');

            // Clear form and hide item-specific fields
            document.getElementById('staple-form').reset();
            document.getElementById('staple-date').value = new Date().toISOString().split('T')[0];
            this.toggleStapleDetailFields('');

            // Re-render
            this.renderStaples();

        } catch (error) {
            console.error('Error logging staple:', error);
            this.showToast('Failed to log production', 'error');
        }
    }

    /**
     * Toggle visibility of item-specific staple fields (Feature 4)
     * @param {string} itemType - The selected staple type
     */
    toggleStapleDetailFields(itemType) {
        const sourdoughFields = document.getElementById('sourdough-fields');
        const yogurtFields = document.getElementById('yogurt-fields');

        if (sourdoughFields) {
            sourdoughFields.style.display = itemType === 'sourdough' ? 'block' : 'none';
        }
        if (yogurtFields) {
            yogurtFields.style.display = itemType === 'yogurt' ? 'block' : 'none';
        }
    }

    /**
     * Show nutrition modal
     */
    showNutritionModal(mealCode) {
        console.log('showNutritionModal called for:', mealCode);
        console.log('Available mealsNutrition keys:', Object.keys(this.state.mealsNutrition));

        const meal = this.state.meals[mealCode] || CONFIG.meals[mealCode];
        const nutritionData = this.state.mealsNutrition[mealCode];

        console.log('Meal found:', meal?.name);
        console.log('NutritionData:', nutritionData);

        if (!meal) return;

        document.getElementById('nutrition-meal-name').textContent = meal.name;
        document.getElementById('nutrition-serving-info').textContent = `1 of ${meal.servings}`;

        const macrosContainer = document.getElementById('nutrition-macros');
        const vitaminsContainer = document.getElementById('nutrition-vitamins');
        const mineralsContainer = document.getElementById('nutrition-minerals');
        const factsContainer = document.getElementById('nutrition-facts');

        if (nutritionData) {
            const n = nutritionData.nutrition;
            const dv = nutritionData.dailyValues;

            // Render macros
            macrosContainer.innerHTML = `
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.calories)}</div>
                    <div class="nutrition-label">Calories</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.protein)}g</div>
                    <div class="nutrition-label">Protein</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.carbs)}g</div>
                    <div class="nutrition-label">Carbs</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.fat)}g</div>
                    <div class="nutrition-label">Fat</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.fiber)}g</div>
                    <div class="nutrition-label">Fiber</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-value">${Math.round(n.sugar || 0)}g</div>
                    <div class="nutrition-label">Sugar</div>
                </div>
            `;

            // Render vitamins (expanded list)
            vitaminsContainer.innerHTML = this.renderNutrientBars([
                { name: 'Vitamin A', percent: dv.vitaminA || 0 },
                { name: 'Vitamin C', percent: dv.vitaminC || 0 },
                { name: 'Vitamin D', percent: dv.vitaminD || 0 },
                { name: 'Vitamin E', percent: dv.vitaminE || 0 },
                { name: 'Vitamin K', percent: dv.vitaminK || 0 },
                { name: 'Vitamin B6', percent: dv.vitaminB6 || 0 },
                { name: 'Vitamin B12', percent: dv.vitaminB12 || 0 },
                { name: 'Folate', percent: dv.folate || 0 },
                { name: 'Choline', percent: dv.choline || 0 }
            ]);

            // Render minerals (expanded list)
            mineralsContainer.innerHTML = this.renderNutrientBars([
                { name: 'Iron', percent: dv.iron || 0 },
                { name: 'Calcium', percent: dv.calcium || 0 },
                { name: 'Potassium', percent: dv.potassium || 0 },
                { name: 'Magnesium', percent: dv.magnesium || 0 },
                { name: 'Zinc', percent: dv.zinc || 0 },
                { name: 'Selenium', percent: dv.selenium || 0 },
                { name: 'Manganese', percent: dv.manganese || 0 }
            ]);

            // Add special nutrients section (omega-3, lycopene)
            const specialContainer = document.getElementById('nutrition-special');
            if (specialContainer) {
                const hasOmega3 = (n.omega3 || 0) > 0;
                const hasLycopene = (n.lycopene || 0) > 0;

                if (hasOmega3 || hasLycopene) {
                    specialContainer.parentElement.style.display = 'block';
                    let specialHTML = '<h4 class="nutrition-section-title">Special Nutrients</h4>';

                    if (hasOmega3) {
                        specialHTML += `
                            <div class="nutrition-row">
                                <span class="nutrition-row-name">Omega-3 Fatty Acids</span>
                                <span class="nutrition-row-value">${Math.round(n.omega3)}mg</span>
                                <span class="nutrition-row-dv">(${dv.omega3 || 0}% DV)</span>
                            </div>
                        `;
                    }

                    if (hasLycopene) {
                        specialHTML += `
                            <div class="nutrition-row">
                                <span class="nutrition-row-name">Lycopene</span>
                                <span class="nutrition-row-value">${Math.round(n.lycopene)}mcg</span>
                            </div>
                        `;
                    }

                    specialContainer.innerHTML = specialHTML;
                } else {
                    specialContainer.innerHTML = '';
                    specialContainer.parentElement.style.display = 'none';
                }
            }

            // v2.0.0: Use enhanced health benefits system
            let facts = nutritionData.funFacts || [];

            // Get ingredient names for health benefits lookup
            const ingredientNames = (meal.ingredients || []).map(ing =>
                typeof ing === 'string' ? ing : (ing.name || '')
            );

            // Try to get richer facts from health-benefits.js
            if (this.v2Enabled && ingredientNames.length > 0) {
                try {
                    const enhancedFacts = getDiverseFactsForMeal(ingredientNames, 8);
                    if (enhancedFacts.length > 0) {
                        facts = enhancedFacts.map(f => ({
                            icon: this.getCategoryIcon(f.category),
                            text: f.fact,
                            category: f.category,
                            source: f.source,
                            ingredient: f.ingredient
                        }));
                    }
                } catch (e) {
                    console.warn('Could not load enhanced health facts:', e);
                }
            }

            factsContainer.innerHTML = facts.length > 0
                ? `<div class="health-facts-grid">${facts.map(f => `
                    <div class="health-fact" data-category="${f.category || 'general'}">
                        <span class="health-fact-icon">${f.icon}</span>
                        <span class="health-fact-text">${f.text}</span>
                        ${f.source ? `<span class="health-fact-source" title="Source: ${f.source}">📚</span>` : ''}
                    </div>
                `).join('')}</div>`
                : '<p class="text-muted">Calculating nutrition facts...</p>';

        } else {
            macrosContainer.innerHTML = '<p class="text-muted">Nutrition data not available</p>';
            vitaminsContainer.innerHTML = '';
            mineralsContainer.innerHTML = '';
            factsContainer.innerHTML = '<p class="text-muted">Configure USDA API key for full nutrition data</p>';
        }

        this.openModal('nutrition');
    }

    /**
     * Render nutrient bars HTML
     */
    renderNutrientBars(nutrients) {
        return nutrients.map(n => `
            <div class="nutrition-row">
                <span class="nutrition-row-name">${n.name}</span>
                <div style="flex: 1; margin: 0 1rem;">
                    <div class="nutrition-bar">
                        <div class="nutrition-bar-fill" style="width: ${Math.min(100, n.percent)}%"></div>
                    </div>
                </div>
                <span class="nutrition-row-value">${n.percent}%</span>
            </div>
        `).join('');
    }

    /**
     * v2.0.0: Get icon for health benefit category
     */
    getCategoryIcon(category) {
        const icons = {
            heart: '❤️',
            brain: '🧠',
            immunity: '🛡️',
            cancer: '🎗️',
            gut: '🦠',
            bone: '🦴',
            skin: '✨',
            eye: '👁️',
            metabolism: '🔥',
            muscle: '💪',
            regeneration: '🔄',
            dna: '🧬',
            anti_inflammatory: '🌿',
            blood_sugar: '📊',
            longevity: '⏳',
            general: '💡'
        };
        return icons[category] || '💡';
    }

    /**
     * Show meal details
     */
    showMealDetails(mealCode) {
        // For now, show nutrition modal. Could expand to full meal detail modal
        this.showNutritionModal(mealCode);
    }

    /**
     * Open add meal modal
     */
    openAddMealModal() {
        document.getElementById('meal-edit-title').textContent = 'Add New Meal';
        document.getElementById('meal-edit-form').reset();
        document.getElementById('meal-edit-form').dataset.mode = 'add';
        this.openModal('meal-edit');
    }

    /**
     * Handle save meal
     */
    async handleSaveMeal() {
        const form = document.getElementById('meal-edit-form');
        const mode = form.dataset.mode || 'add';

        const mealData = {
            name: document.getElementById('meal-name-input').value,
            servings: parseInt(document.getElementById('meal-servings-input').value),
            prepTime: parseInt(document.getElementById('meal-prep-time').value),
            cookTime: parseInt(document.getElementById('meal-cook-time').value),
            ingredients: mealLibrary.parseIngredients(document.getElementById('meal-ingredients-input').value),
            instructions: document.getElementById('meal-instructions-input').value,
            sides: document.getElementById('meal-sides-input').value.split(',').map(s => s.trim()).filter(s => s)
        };

        if (!mealData.name || !mealData.servings || !mealData.ingredients.length) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        try {
            if (mode === 'add') {
                const newMeal = mealLibrary.addMeal(mealData);
                this.state.meals[newMeal.code] = newMeal;
                this.showToast(`Added ${mealData.name}`, 'success');
            } else {
                // Edit mode - would need meal code
                this.showToast(`Updated ${mealData.name}`, 'success');
            }

            this.closeModal('meal-edit');
            this.renderDashboard();
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Render meal library with optional search filter (Feature 16)
     * @param {string} searchQuery - Optional search query
     */
    renderMealLibrary(searchQuery = '') {
        const container = document.getElementById('library-list');
        const statsContainer = document.getElementById('archive-stats');
        const totalEl = document.getElementById('archive-total');
        if (!container) return;

        // Get archived meals (with search if provided)
        const allArchivedMeals = mealLibrary.getArchivedMeals();
        const archivedMeals = searchQuery
            ? mealLibrary.searchArchivedMeals(searchQuery)
            : allArchivedMeals;

        // Update stats
        if (statsContainer && totalEl) {
            if (allArchivedMeals.length > 0) {
                statsContainer.style.display = 'flex';
                totalEl.textContent = allArchivedMeals.length;
            } else {
                statsContainer.style.display = 'none';
            }
        }

        // Get all tags for display
        const allTags = mealLibrary.getAllTags();
        const getTagName = (tagId) => {
            const tag = allTags.find(t => t.id === tagId);
            return tag?.name || tagId;
        };

        if (archivedMeals.length === 0) {
            const message = searchQuery
                ? `No archived meals match "${searchQuery}"`
                : 'Archived meals will appear here. You can restore them to your rotation at any time.';
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128218;</div>
                    <h4 class="empty-state-title">No Archived Meals</h4>
                    <p class="empty-state-text">${message}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = archivedMeals.map(meal => {
            const tagsHtml = (meal.tags || []).map(tagId =>
                `<span class="archived-meal-tag">${getTagName(tagId)}</span>`
            ).join('');

            const reasonHtml = meal.archiveReason
                ? `<span class="archived-meal-reason">${this.formatArchiveReason(meal.archiveReason)}</span>`
                : '';

            return `
                <div class="archived-meal-card" data-meal-code="${meal.code}">
                    <div class="archived-meal-header">
                        <div>
                            <h4 class="archived-meal-name">${meal.name}</h4>
                            <div class="archived-meal-meta">
                                Archived: ${meal.archivedDate || 'Unknown'}
                                ${reasonHtml}
                            </div>
                        </div>
                    </div>
                    ${tagsHtml ? `<div class="archived-meal-tags">${tagsHtml}</div>` : ''}
                    <div class="archived-meal-actions">
                        <button class="btn btn-sm btn-primary restore-meal-btn" data-meal="${meal.code}">
                            Restore to Rotation
                        </button>
                        <button class="btn btn-sm btn-danger delete-meal-btn" data-meal="${meal.code}">
                            Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Add restore handlers
        container.querySelectorAll('.restore-meal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.meal;
                try {
                    const meal = mealLibrary.restoreMeal(code);
                    this.state.meals[code] = meal;
                    this.showToast(`Restored ${meal.name}`, 'success');
                    this.renderMealLibrary(searchQuery);
                    this.renderDashboard();
                } catch (error) {
                    this.showToast(error.message, 'error');
                }
            });
        });

        // Add delete handlers
        container.querySelectorAll('.delete-meal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.meal;
                const meal = archivedMeals.find(m => m.code === code);
                if (meal && confirm(`Permanently delete "${meal.name}"? This cannot be undone.`)) {
                    try {
                        mealLibrary.deleteMeal(code);
                        this.showToast(`Deleted ${meal.name}`, 'info');
                        this.renderMealLibrary(searchQuery);
                    } catch (error) {
                        this.showToast(error.message, 'error');
                    }
                }
            });
        });
    }

    /**
     * Format archive reason for display (Feature 16)
     */
    formatArchiveReason(reason) {
        const reasonLabels = {
            seasonal: 'Seasonal',
            tired: 'Tired of it',
            expensive: 'Too expensive',
            time: 'Takes too long',
            kids: "Kids don't like it",
            other: 'Other'
        };
        return reasonLabels[reason] || reason;
    }

    /**
     * Open archive meal modal with reason prompt (Feature 16)
     */
    openArchiveModal(mealCode) {
        const meal = this.state.meals[mealCode] || mealLibrary.getMeal(mealCode);
        if (!meal) return;

        this.pendingArchiveMealCode = mealCode;

        const mealNameEl = document.getElementById('archive-meal-name');
        if (mealNameEl) mealNameEl.textContent = meal.name;

        // Reset form
        const selectEl = document.getElementById('archive-reason-select');
        const customEl = document.getElementById('archive-reason-custom');
        const customGroupEl = document.getElementById('archive-reason-custom-group');

        if (selectEl) selectEl.value = '';
        if (customEl) customEl.value = '';
        if (customGroupEl) customGroupEl.style.display = 'none';

        this.openModal('archive-reason');
    }

    /**
     * Confirm archive meal with reason (Feature 16)
     */
    confirmArchiveMeal() {
        if (!this.pendingArchiveMealCode) return;

        const selectEl = document.getElementById('archive-reason-select');
        const customEl = document.getElementById('archive-reason-custom');

        let reason = selectEl?.value || null;
        if (reason === 'other' && customEl?.value) {
            reason = customEl.value;
        }

        try {
            mealLibrary.archiveMealEnhanced(this.pendingArchiveMealCode, reason);
            delete this.state.meals[this.pendingArchiveMealCode];
            this.closeModal('archive-reason');
            this.renderDashboard();
            this.pendingArchiveMealCode = null;
        } catch (error) {
            this.showToast(error.message, 'error');
        }
    }

    /**
     * Generate shopping list
     */
    generateShoppingList() {
        const checkboxes = document.querySelectorAll('#shopping-meal-checkboxes input:checked');
        const selectedMeals = Array.from(checkboxes).map(cb => {
            const code = cb.value;
            return this.state.meals[code] || CONFIG.meals[code];
        }).filter(Boolean);

        if (selectedMeals.length === 0) {
            this.showToast('Please select at least one meal', 'error');
            return;
        }

        const shoppingList = shoppingListGenerator.generateList(selectedMeals);

        const outputContainer = document.getElementById('shopping-list-output');
        outputContainer.innerHTML = shoppingListGenerator.formatAsHTML(shoppingList);
        outputContainer.classList.remove('hidden');

        // Store for copy
        this.currentShoppingList = shoppingList;
    }

    /**
     * Copy shopping list to clipboard
     */
    async copyShoppingList() {
        if (!this.currentShoppingList) {
            this.showToast('Generate a list first', 'error');
            return;
        }

        const success = await shoppingListGenerator.copyToClipboard(this.currentShoppingList);

        if (success) {
            this.showToast('Copied to clipboard!', 'success');
        } else {
            this.showToast('Failed to copy', 'error');
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        // Loading skeletons are already in HTML
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        document.querySelectorAll('.loading-skeleton').forEach(el => {
            el.classList.remove('loading-skeleton', 'skeleton-card', 'skeleton-text');
        });
    }

    /**
     * Show toast notification
     */
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mealDashboard = new MealDashboardApp();
});

// v2.0.0: Expose modules globally for debugging/testing
console.log('[app.js] Setting up global window exports...');
window.priceService = priceService;
window.mealLibrary = mealLibrary;
window.stateManager = { getState, setState, subscribe };
window.eventBus = { emit, on, EVENTS };
console.log('[app.js] Global exports complete! priceService, mealLibrary, stateManager, eventBus now available.');

export default MealDashboardApp;
