/**
 * Main Application Module
 * Ties together all components and manages UI state
 *
 * v2.0.0 - Integrated with new core infrastructure
 */

import CONFIG from './config.js';
import excelReader from './excel-reader.js';
import googleSheets from './google-sheets.js';
import nutritionAPI from './nutrition.js';
import chartManager from './charts.js';
import mealLibrary, { TAG_CATEGORIES } from './meal-library.js';
import shoppingListGenerator from './shopping-list.js';
import staplesTracker from './staples-tracker.js';
import seasonalData from './seasonal-data.js';
import dietaryAlerts from './dietary-alerts.js';

// v2.0.0 Core Infrastructure
import { getState, setState, subscribe } from './core/state-manager.js';
import { emit, on, EVENTS } from './core/event-bus.js';
import priceService from './services/price-service.js';
import { getDiverseFactsForMeal, getFactsForCategory } from './data/health-benefits.js';

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
            error: null
        };

        this.modals = {};
        this.v2Enabled = true; // Flag for v2.0.0 features
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

        document.getElementById('save-meal-edit')?.addEventListener('click', () => {
            this.handleSaveMeal();
        });

        document.getElementById('cancel-meal-edit')?.addEventListener('click', () => {
            this.closeModal('meal-edit');
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
            { backdrop: 'library-modal-backdrop', close: 'close-library', name: 'library' }
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

        for (const code of rotationOrder) {
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

            // Calculate cost (v2.0.0: use price service if available)
            let totalCost = meal.totalCost || (meal.costPerServing ? meal.costPerServing * meal.servings : 0);
            let costSource = 'config';

            if (this.v2Enabled && totalCost === 0) {
                try {
                    const costData = priceService.calculateMealCost(meal);
                    if (costData.totalCost > 0) {
                        totalCost = costData.totalCost;
                        costSource = 'tracked';
                    }
                } catch (e) {
                    // Price service not ready, use default
                }
            }

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
                                <span>Cost:</span> ${totalCost > 0 ? `$${totalCost.toFixed(2)}` : '--'}
                            </div>
                            ${meal.prepTime || meal.cookTime ? `
                            <div class="meal-meta-item">
                                <span>Time:</span> ${meal.prepTime || 0}+${meal.cookTime || 0} min
                            </div>
                            ` : ''}
                        </div>

                        <div class="meal-tags">
                            ${seasonalLocal.seasonalCount > 0 ? `
                                <span class="badge badge-seasonal">🌱 ${seasonalLocal.seasonalCount} seasonal</span>
                            ` : ''}
                            ${seasonalLocal.localCount > 0 ? `
                                <span class="badge badge-local">🏔️ ${seasonalLocal.localCount} local</span>
                            ` : ''}
                            ${alerts.hasAlerts ? `
                                <span class="badge badge-warning" title="${alerts.alerts.map(a => a.reason).join(', ')}">
                                    ⚠️ ${alerts.count} alert${alerts.count > 1 ? 's' : ''}
                                </span>
                            ` : ''}
                            ${this.v2Enabled && meal.tags?.length > 0 ? meal.tags.slice(0, 2).map(tagId => {
                                const tag = mealLibrary.getAllTags().find(t => t.id === tagId);
                                return tag ? `<span class="badge badge-tag" data-category="${tag.category}">${tag.name}</span>` : '';
                            }).join('') : ''}
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
                    </div>
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
        chartManager.updateAllCharts({
            meals: this.state.meals,
            trips: this.state.trips,
            storeData: this.state.storeData,
            mealsNutrition: this.state.mealsNutrition
        });
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
     * Handle log staple form submission
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

        try {
            await staplesTracker.addEntry(item, quantity, notes, date);

            this.showToast(`Logged ${item} production`, 'success');
            this.closeModal('staple');

            // Clear form
            document.getElementById('staple-form').reset();
            document.getElementById('staple-date').value = new Date().toISOString().split('T')[0];

            // Re-render
            this.renderStaples();

        } catch (error) {
            console.error('Error logging staple:', error);
            this.showToast('Failed to log production', 'error');
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
     * Render meal library
     */
    renderMealLibrary() {
        const container = document.getElementById('library-list');
        if (!container) return;

        const archivedMeals = mealLibrary.getArchivedMeals();

        if (archivedMeals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">&#128218;</div>
                    <h4 class="empty-state-title">No Archived Meals</h4>
                    <p class="empty-state-text">Archived meals will appear here. You can restore them to your rotation at any time.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = archivedMeals.map(meal => `
            <div class="meal-library-item" style="padding: 1rem; border: 1px solid var(--color-gray-200); border-radius: 0.5rem; margin-bottom: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${meal.name}</strong>
                        <div class="text-small text-muted">Archived: ${meal.archivedDate || 'Unknown'}</div>
                    </div>
                    <button class="btn btn-sm btn-outline restore-meal-btn" data-meal="${meal.code}">Restore</button>
                </div>
            </div>
        `).join('');

        // Add restore handlers
        container.querySelectorAll('.restore-meal-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const code = btn.dataset.meal;
                try {
                    const meal = mealLibrary.restoreMeal(code);
                    this.state.meals[code] = meal;
                    this.showToast(`Restored ${meal.name}`, 'success');
                    this.renderMealLibrary();
                    this.renderDashboard();
                } catch (error) {
                    this.showToast(error.message, 'error');
                }
            });
        });
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
window.priceService = priceService;
window.mealLibrary = mealLibrary;
window.stateManager = { getState, setState, subscribe };
window.eventBus = { emit, on, EVENTS };

export default MealDashboardApp;
