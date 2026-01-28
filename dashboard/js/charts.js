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
    seventh: 'rgba(168, 84, 108, 0.8)',       // Mauve
    eighth: 'rgba(86, 130, 153, 0.8)',        // Steel Blue
    ninth: 'rgba(156, 137, 102, 0.8)',        // Khaki
    tenth: 'rgba(119, 93, 128, 0.8)',         // Dusty Purple

    // Lighter versions for backgrounds
    primaryLight: 'rgba(194, 112, 60, 0.2)',
    secondaryLight: 'rgba(93, 64, 55, 0.2)',
    tertiaryLight: 'rgba(124, 148, 115, 0.2)',
    quaternaryLight: 'rgba(212, 165, 116, 0.2)',
    fifthLight: 'rgba(183, 71, 42, 0.2)',
    sixthLight: 'rgba(112, 130, 56, 0.2)',
    seventhLight: 'rgba(168, 84, 108, 0.2)',
    eighthLight: 'rgba(86, 130, 153, 0.2)',
    ninthLight: 'rgba(156, 137, 102, 0.2)',
    tenthLight: 'rgba(119, 93, 128, 0.2)'
};

const MEAL_COLORS = [
    COLORS.primary,
    COLORS.secondary,
    COLORS.tertiary,
    COLORS.quaternary,
    COLORS.fifth,
    COLORS.sixth,
    COLORS.seventh,
    COLORS.eighth,
    COLORS.ninth,
    COLORS.tenth
];

const MEAL_COLORS_LIGHT = [
    COLORS.primaryLight,
    COLORS.secondaryLight,
    COLORS.tertiaryLight,
    COLORS.quaternaryLight,
    COLORS.fifthLight,
    COLORS.sixthLight,
    COLORS.seventhLight,
    COLORS.eighthLight,
    COLORS.ninthLight,
    COLORS.tenthLight
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
     * Create store breakdown doughnut chart
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

        // Store labels for click handler
        this.storeBreakdownLabels = labels;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: MEAL_COLORS,
                    borderColor: MEAL_COLORS.map(c => c.replace('0.8', '1')),
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const store = this.storeBreakdownLabels[index];
                        this.showStoreBreakdown(store);
                    }
                },
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#3E2723',
                            font: {
                                family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                            },
                            padding: 12,
                            generateLabels: (chart) => {
                                const data = chart.data;
                                return data.labels.map((label, i) => ({
                                    text: `${label}: $${data.datasets[0].data[i].toFixed(2)}`,
                                    fillStyle: data.datasets[0].backgroundColor[i],
                                    strokeStyle: data.datasets[0].borderColor[i],
                                    lineWidth: 1,
                                    index: i
                                }));
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(62, 39, 35, 0.9)',
                        titleColor: '#FDF6E3',
                        bodyColor: '#FDF6E3',
                        borderColor: '#C2703C',
                        borderWidth: 1,
                        padding: 12,
                        cornerRadius: 8,
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
                cutout: '50%'
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
     * Create spending by store per trip grouped bar chart
     * X-axis: dates, Multiple bars per date (one per store)
     * Click bar to show that store's item breakdown for that date
     */
    createSpendingByStorePerTripChart(canvasId, trips) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        if (!trips || trips.length === 0) {
            this.showNoDataMessage(canvasId, 'No shopping trips in selected date range');
            return null;
        }

        // Store trips for click access
        this.storePerTripData = trips;

        // Get all unique stores across all trips
        const allStores = new Set();
        for (const trip of trips) {
            if (trip.storeBreakdown) {
                Object.keys(trip.storeBreakdown).forEach(store => allStores.add(store));
            }
        }
        const stores = Array.from(allStores).sort();

        // Format dates for labels
        const labels = trips.map(trip => {
            if (trip.date) {
                const d = new Date(trip.date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return trip.name || `Trip ${trip.tripNumber}`;
        });

        // Create dataset for each store
        const datasets = stores.map((store, index) => ({
            label: store,
            data: trips.map(trip => {
                const amount = trip.storeBreakdown?.[store] || 0;
                return Math.round(amount * 100) / 100;
            }),
            backgroundColor: MEAL_COLORS[index % MEAL_COLORS.length],
            borderColor: MEAL_COLORS[index % MEAL_COLORS.length].replace('0.8', '1'),
            borderWidth: 1
        }));

        // Store mapping for click handler
        this.storePerTripStores = stores;

        this.charts[canvasId] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                ...this.getDefaultOptions(),
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const element = elements[0];
                        const tripIndex = element.index;
                        const storeIndex = element.datasetIndex;
                        const store = this.storePerTripStores[storeIndex];
                        const trip = this.storePerTripData[tripIndex];
                        this.showStoreTripBreakdown(store, trip);
                    }
                },
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#3E2723',
                            padding: 10,
                            boxWidth: 12
                        }
                    },
                    tooltip: {
                        ...this.getDefaultOptions().plugins.tooltip,
                        callbacks: {
                            title: (items) => {
                                const idx = items[0].dataIndex;
                                const trip = this.storePerTripData[idx];
                                return trip?.date || labels[idx];
                            },
                            afterBody: () => ['', 'Click for item details']
                        }
                    }
                },
                scales: {
                    ...this.getDefaultOptions().scales,
                    x: {
                        ...this.getDefaultOptions().scales.x,
                        stacked: false
                    },
                    y: {
                        ...this.getDefaultOptions().scales.y,
                        beginAtZero: true,
                        stacked: false,
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
     * Show store item breakdown for a specific trip in a modal
     */
    showStoreTripBreakdown(storeName, trip) {
        // Collect items from this store for this specific trip
        const items = [];
        if (trip.items) {
            for (const item of trip.items) {
                if (item.store === storeName) {
                    items.push(item);
                }
            }
        }

        // Sort by cost descending
        items.sort((a, b) => (b.cost || 0) - (a.cost || 0));

        const total = items.reduce((sum, item) => sum + (item.cost || 0), 0);
        const dateStr = trip.date ? new Date(trip.date).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
        }) : 'Unknown date';

        let html = `
            <div style="max-height: 400px; overflow-y: auto;">
                <h4 style="margin-bottom: 0.5rem;">${storeName}</h4>
                <p style="color: #8B7355; margin-bottom: 1rem;">${dateStr}</p>
                <p><strong>Total:</strong> $${total.toFixed(2)} | <strong>Items:</strong> ${items.length}</p>
                <hr style="margin: 1rem 0; border-color: #D4A574;">

                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr style="background: #F5E6D3;">
                            <th style="padding: 0.5rem; text-align: left;">Item</th>
                            <th style="padding: 0.5rem; text-align: right;">Qty</th>
                            <th style="padding: 0.5rem; text-align: right;">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (items.length === 0) {
            html += `<tr><td colspan="3" style="padding: 1rem; color: #8B7355; font-style: italic; text-align: center;">No itemized data available for this store on this trip</td></tr>`;
        } else {
            for (const item of items.slice(0, 50)) {
                html += `
                    <tr style="border-bottom: 1px solid #E8DCC8;">
                        <td style="padding: 0.5rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${item.name}">${item.name}</td>
                        <td style="padding: 0.5rem; text-align: right;">${item.quantity || '--'}</td>
                        <td style="padding: 0.5rem; text-align: right;"><strong>$${(item.cost || 0).toFixed(2)}</strong></td>
                    </tr>
                `;
            }

            if (items.length > 50) {
                html += `<tr><td colspan="3" style="padding: 0.5rem; color: #8B7355; font-style: italic;">...and ${items.length - 50} more items</td></tr>`;
            }
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

    // =========================================================
    // Feature 11: Blood Panel Nutrition Radar Chart
    // =========================================================

    /**
     * Calculate blood panel relevant axes from nutrition data
     * @param {Object} nutrition - Raw nutrition values
     * @param {Object} dailyValues - Daily value percentages
     * @returns {Object} Scores for each blood panel axis (0-100)
     */
    calculateBloodPanelAxes(nutrition, dailyValues) {
        const n = nutrition || {};
        const dv = dailyValues || {};

        return {
            // Blood Glucose Impact: High fiber + low sugar = better blood sugar control
            bloodGlucose: Math.min(100, Math.max(0,
                ((dv.fiber || 0) * 0.6) +
                (100 - Math.min(100, (dv.sugar || 0))) * 0.4
            )),

            // Anti-Inflammation Score: omega-3, fiber, vitamins E & C
            inflammation: Math.min(100, Math.max(0,
                ((n.omega3 || 0) / 16) +
                (dv.fiber || 0) * 0.2 +
                (dv.vitaminE || 0) * 0.15 +
                (dv.vitaminC || 0) * 0.15
            )),

            // Iron/Ferritin: iron with vitamin C absorption boost
            iron: Math.min(100, Math.max(0,
                (dv.iron || 0) * (1 + Math.min(0.5, (dv.vitaminC || 0) / 200))
            )),

            // Vitamin D
            vitaminD: Math.min(100, dv.vitaminD || 0),

            // B12
            vitaminB12: Math.min(100, dv.vitaminB12 || 0),

            // Heart Health: omega-3 + fiber - saturated fat
            heartHealth: Math.min(100, Math.max(0,
                ((n.omega3 || 0) / 16) +
                (dv.fiber || 0) * 0.3 +
                (50 - Math.min(50, (dv.saturatedFat || 0) * 0.5))
            ))
        };
    }

    /**
     * Calculate weighted nutrition score (0-100)
     * @param {Object} mealsNutrition - Nutrition data for meals
     * @param {Array} selectedMeals - Array of selected meal codes (null = all)
     * @param {Object} weights - Custom weight object (optional)
     * @returns {Object} Score and breakdown
     */
    calculateNutritionScore(mealsNutrition, selectedMeals, weights) {
        const defaultWeights = {
            protein: 10,
            antiInflammatory: 9,
            vitamins: 8,
            bloodSugar: 7,
            heartHealth: 6,
            fiber: 5,
            lowSugar: 4,
            minerals: 3,
            omega3: 2,
            lowSodium: 1
        };

        const w = weights || defaultWeights;
        const totalWeight = Object.values(w).reduce((a, b) => a + b, 0);

        const mealCodes = selectedMeals && selectedMeals.length > 0
            ? selectedMeals
            : Object.keys(mealsNutrition);

        if (mealCodes.length === 0) return { score: 0, grade: this.getLetterGrade(0), breakdown: {} };

        let totalScore = 0;
        const breakdowns = [];

        mealCodes.forEach(code => {
            const meal = mealsNutrition[code];
            if (!meal) return;

            const n = meal.nutrition || {};
            const dv = meal.dailyValues || {};
            const axes = this.calculateBloodPanelAxes(n, dv);

            const components = {
                protein: Math.min(100, dv.protein || 0),
                antiInflammatory: axes.inflammation,
                vitamins: Math.min(100, ((dv.vitaminA || 0) + (dv.vitaminC || 0) + (dv.vitaminK || 0) + (dv.vitaminB12 || 0)) / 4),
                bloodSugar: axes.bloodGlucose,
                heartHealth: axes.heartHealth,
                fiber: Math.min(100, dv.fiber || 0),
                lowSugar: Math.max(0, 100 - Math.min(100, dv.sugar || 0)),
                minerals: Math.min(100, ((dv.iron || 0) + (dv.calcium || 0) + (dv.magnesium || 0)) / 3),
                omega3: Math.min(100, (n.omega3 || 0) / 16),
                lowSodium: Math.max(0, 100 - Math.min(100, dv.sodium || 0))
            };

            let mealScore = 0;
            for (const [key, weight] of Object.entries(w)) {
                mealScore += (components[key] || 0) * weight;
            }
            totalScore += mealScore / totalWeight;
            breakdowns.push({ code, components, score: mealScore / totalWeight });
        });

        const avgScore = Math.round(totalScore / mealCodes.length);
        return {
            score: avgScore,
            grade: this.getLetterGrade(avgScore),
            breakdown: breakdowns
        };
    }

    /**
     * Get letter grade for nutrition score
     * @param {number} score - Score 0-100
     * @returns {Object} Grade info with letter, color, label
     */
    getLetterGrade(score) {
        if (score >= 85) return { grade: 'A', color: '#27ae60', label: 'Excellent' };
        if (score >= 70) return { grade: 'B', color: '#3498db', label: 'Good' };
        if (score >= 55) return { grade: 'C', color: '#f39c12', label: 'Average' };
        if (score >= 40) return { grade: 'D', color: '#e67e22', label: 'Below Average' };
        return { grade: 'F', color: '#e74c3c', label: 'Poor' };
    }

    /**
     * Create Blood Panel Nutrition Radar Chart (Feature 11)
     * Shows blood-panel-relevant nutritional metrics for selected meals
     * @param {string} canvasId - Canvas element ID
     * @param {Object} mealsNutrition - Nutrition data for meals
     * @param {Array} selectedMeals - Array of selected meal codes (null = all)
     */
    createBloodPanelRadarChart(canvasId, mealsNutrition, selectedMeals = null) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const mealCodes = selectedMeals && selectedMeals.length > 0
            ? selectedMeals
            : Object.keys(mealsNutrition).slice(0, 10);

        const axisLabels = [
            'Blood Glucose',
            'Anti-Inflammation',
            'Iron',
            'Vitamin D',
            'B12',
            'Heart Health'
        ];

        // Build datasets for each selected meal
        const datasets = mealCodes.map((code, index) => {
            const meal = mealsNutrition[code];
            if (!meal) return null;

            const axes = this.calculateBloodPanelAxes(meal.nutrition, meal.dailyValues);

            return {
                label: meal.name || `Meal ${code}`,
                data: [
                    axes.bloodGlucose,
                    axes.inflammation,
                    axes.iron,
                    axes.vitaminD,
                    axes.vitaminB12,
                    axes.heartHealth
                ],
                backgroundColor: MEAL_COLORS_LIGHT[index % MEAL_COLORS_LIGHT.length],
                borderColor: MEAL_COLORS[index % MEAL_COLORS.length],
                borderWidth: 2,
                pointBackgroundColor: MEAL_COLORS[index % MEAL_COLORS.length],
                pointBorderColor: '#fff',
                pointRadius: 4,
                pointHoverRadius: 6
            };
        }).filter(d => d !== null);

        if (datasets.length === 0) {
            console.warn('[Charts] No valid meals for blood panel chart');
            return null;
        }

        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: axisLabels,
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
                            color: '#5D4037',
                            backdropColor: 'transparent',
                            font: { size: 10 }
                        },
                        grid: {
                            color: 'rgba(93, 64, 55, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(93, 64, 55, 0.1)'
                        },
                        pointLabels: {
                            color: '#3E2723',
                            font: { size: 12, weight: '500' }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#3E2723',
                            padding: 12,
                            usePointStyle: true,
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${Math.round(context.raw)}%`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Create health benefits radar chart showing 12 health defense categories
     * Based on ingredients in active meals and their health benefits
     * @param {string} canvasId - Canvas element ID
     * @param {Object} mealsData - Meal data with ingredients
     * @param {Object} healthBenefitsData - Health benefits from health-benefits.js
     */
    createHealthBenefitsRadarChart(canvasId, mealsData, healthBenefitsData) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const { healthCategories, healthBenefits } = healthBenefitsData || {};
        if (!healthCategories || !healthBenefits) {
            console.warn('[Charts] Health benefits data not available');
            return null;
        }

        // 12 health categories
        const categories = Object.values(healthCategories);
        const categoryIds = categories.map(c => c.id);
        const categoryLabels = categories.map(c => c.name);
        const categoryColors = categories.map(c => c.color);

        // Calculate health category scores for combined active meals
        const scores = this.calculateHealthCategoryScores(mealsData, healthBenefits, categoryIds);

        // Render the legend
        this.renderHealthCategoriesLegend(categories, scores);

        // Create radar chart
        this.charts[canvasId] = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: categoryLabels,
                datasets: [{
                    label: 'Combined Meal Rotation',
                    data: scores,
                    backgroundColor: 'rgba(194, 112, 60, 0.2)',
                    borderColor: 'rgba(194, 112, 60, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: categoryColors,
                    pointBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
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
                            color: '#5D4037',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(93, 64, 55, 0.1)'
                        },
                        angleLines: {
                            color: 'rgba(93, 64, 55, 0.1)'
                        },
                        pointLabels: {
                            color: '#3E2723',
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const idx = context.dataIndex;
                                const category = categories[idx];
                                return `${category.name}: ${Math.round(context.raw)}%`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
    }

    /**
     * Calculate health category scores based on meal ingredients
     * @param {Object} mealsData - Meals with ingredients
     * @param {Object} healthBenefits - Health benefits data by ingredient
     * @param {Array} categoryIds - Array of category IDs
     * @returns {Array} Scores (0-100) for each category
     */
    calculateHealthCategoryScores(mealsData, healthBenefits, categoryIds) {
        const categoryCounts = {};
        categoryIds.forEach(id => categoryCounts[id] = 0);

        // Count ingredients that contribute to each category
        let totalIngredients = 0;

        Object.values(mealsData).forEach(meal => {
            const ingredients = meal.ingredients || [];
            ingredients.forEach(ing => {
                const ingredientName = typeof ing === 'string' ? ing : (ing.name || '');
                const normalizedName = ingredientName.toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '');

                const benefits = healthBenefits[normalizedName];
                if (benefits && benefits.categories) {
                    benefits.categories.forEach(cat => {
                        if (categoryCounts[cat] !== undefined) {
                            categoryCounts[cat]++;
                        }
                    });
                }
                totalIngredients++;
            });
        });

        // Normalize to 0-100 scale
        // Max possible: if all ingredients contributed to a category
        const maxPerCategory = Math.max(totalIngredients, 1);

        return categoryIds.map(id => {
            // Score based on coverage (how many ingredients benefit this category)
            // Scale up for better visualization (multiply by factor since not all ingredients will have all categories)
            const rawScore = (categoryCounts[id] / maxPerCategory) * 100;
            return Math.min(100, rawScore * 3); // Scale factor for visibility
        });
    }

    /**
     * Render the health categories legend with scores
     * @param {Array} categories - Health category definitions
     * @param {Array} scores - Calculated scores for each category
     */
    renderHealthCategoriesLegend(categories, scores) {
        const legendContainer = document.getElementById('health-categories-legend');
        if (!legendContainer) return;

        legendContainer.innerHTML = categories.map((cat, idx) => `
            <div class="health-category-item" style="--category-color: ${cat.color}">
                <span class="health-category-icon">${cat.icon}</span>
                <span class="health-category-name">${cat.name}</span>
                <span class="health-category-score">${Math.round(scores[idx])}%</span>
                <div class="health-category-bar">
                    <div class="health-category-bar-fill" style="width: ${scores[idx]}%; background: ${cat.color}"></div>
                </div>
            </div>
        `).join('');
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
            this.createSpendingByStorePerTripChart('store-per-trip-chart', trips);
        } else {
            // Show placeholder message for empty trips
            this.showNoDataMessage('spending-by-trip-chart', 'No shopping trips in selected date range');
            this.showNoDataMessage('store-per-trip-chart', 'No shopping trips in selected date range');
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

        // Health Benefits Radar (Feature 7)
        if (meals && data.healthBenefitsData) {
            this.createHealthBenefitsRadarChart('health-benefits-radar', meals, data.healthBenefitsData);
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
