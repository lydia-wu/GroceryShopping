# Claude Session Context

> **Read this file first to minimize token usage**
> Last updated: January 21, 2026

---

## IMPLEMENTATION v2.0.0 - PAUSED

### What Was Completed (Jan 21, 2026)

**Phase 1 partial - Core infrastructure created:**

| File | Purpose | Status |
|------|---------|--------|
| `/dashboard/data/ingredients.json` | 40+ ingredients with full nutrition per 100g | DONE |
| `/dashboard/js/data/health-benefits.js` | Health facts from 3 books, 12 categories | DONE |
| `/dashboard/js/core/supabase-client.js` | Supabase connection & real-time | DONE |
| `/dashboard/js/core/state-manager.js` | Centralized state with persistence | DONE |
| `/dashboard/js/core/event-bus.js` | Pub/sub for components | DONE |
| `/dashboard/js/core/sync-manager.js` | Offline sync with IndexedDB | DONE |

### WHERE TO RESUME

**Next tasks (in order):**
1. Create `/dashboard/js/services/price-service.js` - Track ingredient prices from shopping data
2. Update `/dashboard/js/meal-library.js` - Add archive/restore with tag system
3. Integrate new core modules into `/dashboard/js/app.js`

**Reference:** See `IMPLEMENTATION_PLAN.md` for full 7-phase plan.

---

## Best Practices for Efficient Claude Usage

1. **Start with:** "Read CLAUDE_SESSION_CONTEXT.md, then [your task]"
2. **Batch updates:** Combine multiple small changes into one request
3. **Be specific:** "Update Meal D ingredients" is better than "make some changes"
4. **Commit in batches:** Wait until several changes are done before committing

---

## Project Structure

```
GroceryList/
├── README.md                        # Main shopping guide & meal plans
├── CLAUDE_SESSION_CONTEXT.md        # THIS FILE - read first
├── IMPLEMENTATION_PLAN.md           # Full v2.0.0 implementation plan
├── MealCostCalculator.xlsx          # Meal costs & ingredients
├── 2026_actualShoppingData.xlsx     # Actual purchase receipts
├── dashboard/
│   ├── index.html                   # Main app
│   ├── css/styles.css               # Styling
│   ├── js/
│   │   ├── app.js                   # Main app (NOT YET integrated with new modules)
│   │   ├── config.js                # Meal definitions
│   │   ├── nutrition.js             # Nutrition API
│   │   ├── core/                    # NEW - Core infrastructure
│   │   │   ├── supabase-client.js
│   │   │   ├── state-manager.js
│   │   │   ├── event-bus.js
│   │   │   └── sync-manager.js
│   │   └── data/                    # NEW - Data modules
│   │       └── health-benefits.js
│   └── data/                        # NEW - Static data
│       └── ingredients.json
└── docs/
```

---

## Current Meal State (Jan 21, 2026)

### Cycle 1 - COMPLETE (except Fried Rice)
| Meal | Status | Date |
|------|--------|------|
| B - Kale & Chicken Pasta | DONE | Thu 1/8 |
| C - Warm Chicken Grain Bowl | DONE | Sun 1/11 |
| A - Mackerel Meatball | DONE | Wed 1/14 |
| D - Turkey Barley Soup | DONE | Fri 1/16 |
| F - Turkey Spaghetti | DONE | Sat 1/18 |
| E - Mackerel Fried Rice | PLANNED | Tue/Wed 1/20-21 |

---

## Key Architecture Notes (for integration)

```javascript
// State management
import { getState, setState, subscribe } from './core/state-manager.js';
const meals = getState('meals');
setState({ meals: { ...meals, newMeal } });

// Event bus
import { emit, on, EVENTS } from './core/event-bus.js';
on(EVENTS.MEAL_ADDED, (data) => handleMealAdded(data));

// Health benefits
import { getDiverseFactsForMeal } from './data/health-benefits.js';
const facts = getDiverseFactsForMeal(meal.ingredients, 10);
```

---

## User Preferences

- **Stores:** Costco, H-Mart, Safeway (primary); Sprouts, Walmart (occasional)
- **Dietary:** No onions, no mushrooms, no broccoli, no cow milk
- **Homemade:** Sourdough, yogurt, stock, breadcrumbs
- **Location:** Aurora, CO 80247
- **Household:** 2 adults, 2 babies, 2 servings/day

---

## Quick Commands

```bash
# Test dashboard
cd dashboard && python3 -m http.server 8000

# Git commit
git add . && git commit -m "message

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" && git push
```
