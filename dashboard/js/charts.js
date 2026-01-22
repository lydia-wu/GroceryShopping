/**
 * Charts Module
 * Chart.js visualizations for meal and cost data
 */

// Earth tone color palette
const COLORS = {
    primary: 'rgba(194, 112, 60, 0.8)',      // Terracotta
    secondary: 'rgba(93, 64, 55, 0.8)',       // Brown
    tertiary: 'rgba(124, 148, 115, 0.8)',     // Sage
    quaternary: 'rgba(212, 165, 116, 0.8)',   // Gold
    fifth: 'rgba(183, 71, 42, 0.8)',          // Rust
    sixth: 'rgba(112, 130, 56, 0.8)',         // Olive

    // Lighter versions for backgrounds
    primaryLight: 'rgba(194, 112, 60, 0.2)',
    secondaryLight: 'rgba(93, 64, 55, 0.2)',
    tertiaryLight: 'rgba(124, 148, 115, 0.2)',
    quaternaryLight: 'rgba(212, 165, 116, 0.2)',
    fifthLight: 'rgba(183, 71, 42, 0.2)',
    sixthLight: 'rgba(112, 130, 56, 0.2)'
};

const MEAL_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.tertiary,
    COLORS.quaternary,
    COLORS.fifth,
    COLORS.sixth
];

const MEAL_COLORS_LIGHT = [
    COLORS.primaryLight,
    COLORS.secondaryLight,
    COLORS.tertiaryLight,
    COLORS.quaternaryLight,
    COLORS.fifthLight,
    COLORS.sixthLight
];

class ChartManager {
    constructor() {
        this.charts = {};
    }

    /**
     * Get default chart options
     */
    getDefaultOptions() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#3E2723',
                        font: {
                            family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(62, 39, 35, 0.9)',
                    titleColor: '#FDF6E3',
                    bodyColor: '#FDF6E3',
                    borderColor: '#C2703C',
                    borderWidth: 1,
                    padding: 12,
                    cornerRadius: 8
                }
            },
            scales: {
                x: {
                    ticks: { color: '#5D4037' },
                    grid: { color: 'rgba(93, 64, 55, 0.1)' }
                },
                y: {
                    ticks: { color: '#5D4037' },
                    grid: { color: 'rgba(93, 64, 55, 0.1)' }
                }
            }
        };
    }

    /**
     * Destroy existing chart if present
     */
    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
            delete this.charts[chartId];
        }
    }

    /**
     * Create cost per meal bar chart
     * Click on a bar to see ingredient cost breakdown
     */
    createCostPerMealChart(canvasId, meals) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const mealCodes = Object.keys(meals);
        const labels = mealCodes.map(code => meals[code].name || `Meal ${code}`);
        const totalCosts = mealCodes.map(code => meals[code].totalCost || 0);
        const costPerServing = mealCodes.map(code => meals[code].costPerServing || 0);

        // Store meals reference for click handler
        this.currentMeals = meals;
        this.currentMealCodes = mealCodes;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Total Cost ($)',
                        data: totalCosts,
                        backgroundColor: COLORS.primary,
                        borderColor: COLORS.primary.replace('0.8', '1'),
                        borderWidth: 1
                    },
                    {
                        label: 'Cost per Serving ($)',
                        data: costPerServing,
                        backgroundColor: COLORS.tertiary,
                        borderColor: COLORS.tertiary.replace('0.8', '1'),
                        borderWidth: 1
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const mealCode = this.currentMealCodes[index];
                        this.showCostBreakdown(mealCode, this.currentMeals[mealCode]);
                    }
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: false
                    },
                    tooltip: {
                        ...this.getDefaultOptions().plugins.tooltip,
                        callbacks: {
                            afterBody: () => ['', 'Click for ingredient breakdown']
                        }
                    }
                },
                scales: {
                    ...this.getDefaultOptions().scales,
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        beginAtZero: true,
                        ticks: {
                            ...this.getDefaultOptions().scales.y.ticks,
                            callback: value => `$${value}`
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Show cost breakdown popup for a meal
     * Requires priceService to be available globally (window.priceService)
     */
    showCostBreakdown(mealCode, meal) {
        if (!window.priceService) {
            console.error('priceService not available');
            return;
        }

        const costData = window.priceService.calculateMealCost(meal);

        // Create modal content
        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="margin-bottom: 1rem;">Meal ${mealCode}: ${meal.name}</h4>
                <p><strong>Total Cost:</strong> $${costData.totalCost.toFixed(2)} | <strong>Per Serving:</strong> $${costData.costPerServing.toFixed(2)} (${meal.servings} servings)</p>
                <hr style="margin: 1rem 0; border-color: #D4A574;">

                <h5 style="margin-bottom: 0.5rem;">Ingredient Breakdown:</h5>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #F5E6D3;">
                            <th style="padding: 0.5rem; text-align: left;">Ingredient</th>
                            <th style="padding: 0.5rem; text-align: left;">Recipe Amt</th>
                            <th style="padding: 0.5rem; text-align: left;">Unit</th>
                            <th style="padding: 0.5rem; text-align: right;">$/Unit</th>
                            <th style="padding: 0.5rem; text-align: right;">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const item of costData.breakdown) {
            html += `
                <tr style="border-bottom: 1px solid #E8DCC8;">
                    <td style="padding: 0.5rem;">${item.name}</td>
                    <td style="padding: 0.5rem;">${item.quantity}</td>
                    <td style="padding: 0.5rem; color: #8B7355; font-size: 0.8rem;">${item.unit || '--'}</td>
                    <td style="padding: 0.5rem; text-align: right;">$${item.pricePerUnit?.toFixed(2) || '--'}</td>
                    <td style="padding: 0.5rem; text-align: right;"><strong>$${item.estimatedCost.toFixed(2)}</strong></td>
                </tr>
            `;
        }

        if (costData.missing.length > 0) {
            html += `
                <tr><td colspan="4" style="padding: 1rem 0.5rem; color: #8B7355; font-style: italic;">
                    <strong>Missing price data:</strong> ${costData.missing.map(m => m.name).join(', ')}
                </td></tr>
            `;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        // Show in alert or create a simple modal
        this.showBreakdownModal(html);
    }

    /**
     * Show a simple modal with the breakdown content
     */
    showBreakdownModal(content) {
        // Remove existing modal if any
        const existing = document.getElementById('cost-breakdown-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'cost-breakdown-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 1000;
        `;
        modal.innerHTML = `
            <div style="background: #FDF6E3; padding: 1.5rem; border-radius: 12px;
                        max-width: 600px; width: 90%; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
                ${content}
                <div style="margin-top: 1rem; text-align: right;">
                    <button onclick="document.getElementById('cost-breakdown-modal').remove()"
                            style="background: #5D4037; color: white; border: none;
                                   padding: 0.5rem 1.5rem; border-radius: 6px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        document.body.appendChild(modal);
    }

    /**
     * Create spending by trip line chart
     */
    createSpendingByTripChart(canvasId, trips) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Store trips for hover/click access
        this.currentTrips = trips;

        // Format dates nicely (e.g., "Jan 8" instead of "2026-01-08")
        const labels = trips.map(trip => {
            if (trip.date) {
                const d = new Date(trip.date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return trip.name || `Trip ${trip.tripNumber}`;
        });

        const totals = trips.map(trip => Math.round((trip.totalCost || 0) * 100) / 100);

        console.log('[Charts] Spending by trip data:', trips.map(t => ({
            date: t.date,
            total: t.totalCost,
            items: t.items?.length || 0
        })));

        // Cumulative spending
        const cumulative = [];
        let sum = 0;
        for (const total of totals) {
            sum += total;
            cumulative.push(sum);
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Per Trip ($)',
                        data: totals,
                        borderColor: COLORS.primary,
                        backgroundColor: COLORS.primaryLight,
                        fill: true,
                        tension: 0.3,
                        pointRadius: 6,
                        pointHoverRadius: 8
                    },
                    {
                        label: 'Cumulative ($)',
                        data: cumulative,
                        borderColor: COLORS.secondary,
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3,
                        pointRadius: 3,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    tooltip: {
                        ...this.getDefaultOptions().plugins.tooltip,
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                const trip = this.currentTrips[idx];
                                return trip?.date || labels[idx];
                            },
                            afterBody: (items) => {
                                const idx = items[0].dataIndex;
                                const trip = this.currentTrips[idx];
                                if (!trip?.storeBreakdown) return '';

                                const lines = ['\nBy Store:'];
                                for (const [store, amount] of Object.entries(trip.storeBreakdown)) {
                                    lines.push(`  ${store}: $${amount.toFixed(2)}`);
                                }
                                lines.push(`\nItems: ${trip.items?.length || 0}`);
                                return lines;
                            }
                        }
                    }
                },
                scales: {
                    ...this.getDefaultOptions().scales,
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        beginAtZero: true,
                        ticks: {
                            ...this.getDefaultOptions().scales.y.ticks,
                            callback: value => `$${value}`
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create macros stacked bar chart
     */
    createMacrosChart(canvasId, mealsNutrition) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(mealsNutrition).map(code =>
            mealsNutrition[code].name || `Meal ${code}`
        );

        const proteins = Object.keys(mealsNutrition).map(code =>
            mealsNutrition[code].nutrition?.protein || 0
        );
        const carbs = Object.keys(mealsNutrition).map(code =>
            mealsNutrition[code].nutrition?.carbs || 0
        );
        const fats = Object.keys(mealsNutrition).map(code =>
            mealsNutrition[code].nutrition?.fat || 0
        );

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Protein (g)',
                        data: proteins,
                        backgroundColor: COLORS.primary
                    },
                    {
                        label: 'Carbs (g)',
                        data: carbs,
                        backgroundColor: COLORS.tertiary
                    },
                    {
                        label: 'Fat (g)',
                        data: fats,
                        backgroundColor: COLORS.quaternary
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
                scales: {
                    ...this.getDefaultOptions().scales,
                    x: {
                        ...this.getDefaultOptions().scales.x,
                        stacked: true
                    },
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            ...this.getDefaultOptions().scales.y.ticks,
                            callback: value => `${value}g`
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create store breakdown pie chart
     */
    createStoreBreakdownChart(canvasId, storeData, trips = null) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        // Store data for click access
        this.currentStoreData = storeData;
        this.currentStoreTrips = trips || this.currentTrips || [];

        const labels = Object.keys(storeData).sort((a, b) => storeData[b] - storeData[a]);
        const values = labels.map(l => Math.round(storeData[l] * 100) / 100);
        const total = values.reduce((a, b) => a + b, 0);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Spending ($)',
                    data: values,
                    backgroundColor: MEAL_COLORS,
                    borderColor: MEAL_COLORS.map(c => c.replace('0.8', '1')),
                    borderWidth: 1
                }]
            },
            options: {
                ...this.getDefaultOptions(),
                indexAxis: 'y', // Horizontal bars
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const store = labels[index];
                        this.showStoreBreakdown(store);
                    }
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    legend: {
                        display: false
                    },
                    tooltip: {
                        ...this.getDefaultOptions().plugins.tooltip,
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const percent = Math.round((value / total) * 100);
                                return `$${value.toFixed(2)} (${percent}%)`;
                            },
                            afterBody: () => ['', 'Click for item details']
                        }
                    }
                },
                scales: {
                    x: {
                        ...this.getDefaultOptions().scales.x,
                        beginAtZero: true,
                        ticks: {
                            ...this.getDefaultOptions().scales.x.ticks,
                            callback: value => `$${value}`
                        }
                    },
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        ticks: {
                            ...this.getDefaultOptions().scales.y.ticks
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Show store item breakdown in a modal
     */
    showStoreBreakdown(storeName) {
        // Collect all items from this store across all trips
        const items = [];
        for (const trip of this.currentStoreTrips) {
            if (trip.items) {
                for (const item of trip.items) {
                    if (item.store === storeName) {
                        items.push({
                            ...item,
                            tripDate: trip.date
                        });
                    }
                }
            }
        }

        // Sort by cost descending
        items.sort((a, b) => (b.cost || 0) - (a.cost || 0));

        const total = items.reduce((sum, item) => sum + (item.cost || 0), 0);

        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="margin-bottom: 1rem;">${storeName}</h4>
                <p><strong>Total:</strong> $${total.toFixed(2)} | <strong>Items:</strong> ${items.length}</p>
                <hr style="margin: 1rem 0; border-color: #D4A574;">

                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #F5E6D3;">
                            <th style="padding: 0.5rem; text-align: left;">Item</th>
                            <th style="padding: 0.5rem; text-align: left;">Date</th>
                            <th style="padding: 0.5rem; text-align: right;">Qty</th>
                            <th style="padding: 0.5rem; text-align: right;">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        for (const item of items.slice(0, 50)) { // Limit to 50 items
            const dateStr = item.tripDate ? new Date(item.tripDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '--';
            html += `
                <tr style="border-bottom: 1px solid #E8DCC8;">
                    <td style="padding: 0.5rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.name}">${item.name}</td>
                    <td style="padding: 0.5rem; color: #8B7355;">${dateStr}</td>
                    <td style="padding: 0.5rem; text-align: right;">${item.quantity || '--'}</td>
                    <td style="padding: 0.5rem; text-align: right;"><strong>$${(item.cost || 0).toFixed(2)}</strong></td>
                </tr>
            `;
        }

        if (items.length > 50) {
            html += `<tr><td colspan="4" style="padding: 0.5rem; color: #8B7355; font-style: italic;">...and ${items.length - 50} more items</td></tr>`;
        }

        html += `
                    </tbody>
                </table>
            </div>
        `;

        this.showBreakdownModal(html);
    }

    /**
     * Create micronutrients grouped bar chart
     */
    createMicronutrientsChart(canvasId, mealsNutrition) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const micronutrients = ['vitaminA', 'vitaminC', 'vitaminK', 'iron', 'calcium', 'potassium'];
        const labels = micronutrients.map(n => {
            const name = n.replace('vitamin', 'Vit ');
            return name.charAt(0).toUpperCase() + name.slice(1);
        });

        const datasets = Object.keys(mealsNutrition).map((code, index) => {
            const meal = mealsNutrition[code];
            const dailyValues = meal.dailyValues || {};

            return {
                label: meal.name || `Meal ${code}`,
                data: micronutrients.map(n => dailyValues[n] || 0),
                backgroundColor: MEAL_COLORS[index % MEAL_COLORS.length]
            };
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                ...this.getDefaultOptions(),
                scales: {
                    ...this.getDefaultOptions().scales,
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        beginAtZero: true,
                        max: 200,
                        ticks: {
                            ...this.getDefaultOptions().scales.y.ticks,
                            callback: value => `${value}%`
                        }
                    }
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    annotation: {
                        annotations: {
                            line1: {
                                type: 'line',
                                yMin: 100,
                                yMax: 100,
                                borderColor: 'rgba(183, 71, 42, 0.5)',
                                borderWidth: 2,
                                borderDash: [6, 6],
                                label: {
                                    content: '100% DV',
                                    display: true
                                }
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create nutritional completeness radar chart
     */
    createNutritionRadarChart(canvasId, mealsNutrition) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const categories = ['Protein', 'Fiber', 'Vitamins', 'Minerals', 'Omega-3', 'Low Sodium'];

        // Calculate scores for each meal
        const datasets = Object.keys(mealsNutrition).slice(0, 3).map((code, index) => {
            const meal = mealsNutrition[code];
            const n = meal.nutrition || {};
            const dv = meal.dailyValues || {};

            // Calculate category scores (0-100)
            const scores = [
                Math.min(100, (dv.protein || 0)),
                Math.min(100, (dv.fiber || 0)),
                Math.min(100, ((dv.vitaminA || 0) + (dv.vitaminC || 0) + (dv.vitaminK || 0)) / 3),
                Math.min(100, ((dv.iron || 0) + (dv.calcium || 0) + (dv.potassium || 0)) / 3),
                Math.min(100, n.omega3 ? (n.omega3 / 250) * 100 : 20),
                Math.min(100, n.sodium ? 100 - ((n.sodium / 2300) * 100) : 50)
            ];

            return {
                label: meal.name || `Meal ${code}`,
                data: scores,
                backgroundColor: MEAL_COLORS_LIGHT[index % MEAL_COLORS_LIGHT.length],
                borderColor: MEAL_COLORS[index % MEAL_COLORS.length],
                borderWidth: 2,
                pointBackgroundColor: MEAL_COLORS[index % MEAL_COLORS.length]
            };
        });

        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: categories,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#5D4037'
                        },
                        grid: {
                            color: 'rgba(93, 64, 55, 0.1)'
                        },
                        pointLabels: {
                            color: '#3E2723',
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#3E2723',
                            padding: 15
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Update all charts with new data
     */
    updateAllCharts(data) {
        const { meals, trips, storeData, mealsNutrition } = data;

        console.log('[Charts] Updating charts with:', {
            mealCount: meals ? Object.keys(meals).length : 0,
            tripCount: trips ? trips.length : 0,
            storeCount: storeData ? Object.keys(storeData).length : 0,
            nutritionCount: mealsNutrition ? Object.keys(mealsNutrition).length : 0
        });

        if (meals && Object.keys(meals).length > 0) {
            this.createCostPerMealChart('cost-per-meal-chart', meals);
        }

        if (trips && trips.length > 0) {
            this.createSpendingByTripChart('spending-by-trip-chart', trips);
        } else {
            // Show placeholder message for empty trips
            this.showNoDataMessage('spending-by-trip-chart', 'No shopping trips in selected date range');
        }

        if (storeData && Object.keys(storeData).length > 0) {
            this.createStoreBreakdownChart('store-breakdown-chart', storeData, trips);
        } else {
            this.showNoDataMessage('store-breakdown-chart', 'No store data in selected date range');
        }

        if (mealsNutrition && Object.keys(mealsNutrition).length > 0) {
            this.createMacrosChart('macros-chart', mealsNutrition);
            this.createMicronutrientsChart('micronutrients-chart', mealsNutrition);
            this.createNutritionRadarChart('nutrition-radar-chart', mealsNutrition);
        }
    }

    /**
     * Show a "no data" message in place of a chart
     */
    showNoDataMessage(canvasId, message) {
        this.destroyChart(canvasId);
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const container = canvas.parentElement;
        if (container) {
            // Check if message already exists
            let msgEl = container.querySelector('.no-data-message');
            if (!msgEl) {
                msgEl = document.createElement('div');
                msgEl.className = 'no-data-message';
                msgEl.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#8B7355;font-style:italic;';
                container.appendChild(msgEl);
            }
            msgEl.textContent = message;
            canvas.style.display = 'none';
        }
    }

    /**
     * Destroy all charts
     */
    destroyAllCharts() {
        for (const chartId in this.charts) {
            this.destroyChart(chartId);
        }
    }
}

// Export singleton instance
const chartManager = new ChartManager();
export default chartManager;
