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
     */
    createCostPerMealChart(canvasId, meals) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(meals).map(code => meals[code].name || `Meal ${code}`);
        const totalCosts = Object.keys(meals).map(code => meals[code].totalCost || 0);
        const costPerServing = Object.keys(meals).map(code => meals[code].costPerServing || 0);

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
                plugins: {
                    ...this.getDefaultOptions().plugins,
                    title: {
                        display: false
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
     * Create spending by trip line chart
     */
    createSpendingByTripChart(canvasId, trips) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = trips.map(trip => trip.name || `Trip ${trip.tripNumber}`);
        const totals = trips.map(trip => trip.totalCost || 0);

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
                        tension: 0.3
                    },
                    {
                        label: 'Cumulative ($)',
                        data: cumulative,
                        borderColor: COLORS.secondary,
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3
                    }
                ]
            },
            options: {
                ...this.getDefaultOptions(),
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
    createStoreBreakdownChart(canvasId, storeData) {
        this.destroyChart(canvasId);
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        const labels = Object.keys(storeData);
        const values = Object.values(storeData);

        this.charts[canvasId] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: MEAL_COLORS,
                    borderColor: MEAL_COLORS.map(c => c.replace('0.8', '1')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#3E2723',
                            padding: 10
                        }
                    },
                    tooltip: {
                        ...this.getDefaultOptions().plugins.tooltip,
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percent = Math.round((value / total) * 100);
                                return `${context.label}: $${value.toFixed(2)} (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });

        return this.charts[canvasId];
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

        if (meals) {
            this.createCostPerMealChart('cost-per-meal-chart', meals);
        }

        if (trips && trips.length > 0) {
            this.createSpendingByTripChart('spending-by-trip-chart', trips);
        }

        if (storeData) {
            this.createStoreBreakdownChart('store-breakdown-chart', storeData);
        }

        if (mealsNutrition) {
            this.createMacrosChart('macros-chart', mealsNutrition);
            this.createMicronutrientsChart('micronutrients-chart', mealsNutrition);
            this.createNutritionRadarChart('nutrition-radar-chart', mealsNutrition);
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
