# Claude Session Context

> **Read this file first to minimize token usage**
> Last updated: January 22, 2026 (Evening Session)

---

## v2.0.0 FULL IMPLEMENTATION - IN PROGRESS

### Session Summary (Jan 22, 2026 - Evening)

**Started implementation of full 20-feature v2.0.0 plan.**

**WHERE WE STOPPED:**
- Completed: Codebase exploration and understanding
- In Progress: **Feature 7 - Comprehensive Ingredient & Health Benefit Database**
- Next: Create `/dashboard/data/ingredients-database.json` with health benefits structure

**FULL IMPLEMENTATION PLAN:** See `v2_MASTER_IMPLEMENTATION_PLAN.md` in project root (unified comprehensive plan)

**Additional Documentation:**
- `v2_implementation_plan.md` - Detailed 7-phase plan (1,676 lines)
- `docs/v2_comprehensive_plan.md` - Full feature specifications
- `docs/v2_progress_tracker.md` - Progress tracking version
- `docs/planning_session_extracted.md` - All 160+ clarifying Q&A from planning sessions
- `docs/v1_original_plan.md` - Original MVP plan for reference

### Implementation Order (19 remaining features):
1. Feature 7: Ingredient Database ← **IN PROGRESS**
2. Feature 6: Cost/Nutrition Framework
3. Feature 4: Import Staples Data
4. Feature 16: Archive System
5. Feature 8: Units on Nutrition
6. Feature 9: Ingredients Button on Meal Cards
7. Feature 10: Fun Facts per Meal
8. Feature 11: Radar Chart Enhancement
9. Feature 12: Distinct Chart Colors
10. Feature 15: USDA Guidelines Visualizations
11. Feature 19: Fix Navigation
12. Feature 2: Drag-and-Drop
13. Feature 5: Calendar View
14. Feature 14: Next Due Calculation
15. Feature 17: Cookbook Export
16. Feature 18: Photo Upload
17. Feature 20: Breakfast/Lunch Section
18. Feature 3: Fresh Now Pricing
19. Feature 1: Version Update to v2.0.0

---

## PREVIOUS SESSION - MVP COMPLETE

### MVP Session Summary (Jan 22, 2026 - Morning)

**MVP Implementation completed:**
1. Module loading issues (RESOLVED)
2. Excel data parsing (RESOLVED)
3. Price calculation accuracy (DEFERRED - fix incrementally as noticed)
4. Analytics charts (COMPLETE)
5. Tag System UI (COMPLETE)

---

## WHERE TO RESUME - PRICE CALCULATION BUGS

### Critical Issues Still Remaining:

**1. Spice Price Calculations - WRONG**
- Dried spices (thyme, oregano) still matching fresh prices or wrong items
- Example: "thyme" showing $32.19 for 4 teaspoons (should be <$1)
- Need to improve matching to prefer "dried" versions in purchase data
- Excel items like "Great Value Thyme Leaves" not matching properly

**2. Parmesan Cheese - NOT MATCHING**
- Shows "missing price data" but Costco Parmigiano Reggiano IS in Excel
- $23.62 for 1.45 lb from Costco on 2025-12-06
- Check alias matching in ingredients.json

**3. Canned Tomato Sauce/Paste - WRONG**
- Calculations seem off
- Need to verify unit conversion for canned goods (oz vs cans)

**4. General Unit Conversion Issues**
- "cnt" (count) items need proper gramsPerTypical values
- Many items in Excel have qty=NaN - need better parsing
- Cross-reference ingredients.json typical quantities with actual purchase units

### Excel Data Reference (for debugging):
```
Thyme (dried): "Great Value Thyme Leaves, 0.75 oz" - $2.12 from Walmart
Oregano: "GV Dried Oregano Leaves" - $1.24 for 0.87 oz from Walmart
Parmesan: "Kirkland Signature Parmigiano Reggiano" - $23.62 for 1.45 lb from Costco
Celery: "American Celery USA/MEX" - $2.49 for 1 bunch (cnt) from H-Mart
Mackerel: "Chicken of the Sea Jack Mackerel" - $17.71 for 12 cans (180 oz) from Amazon
Olive Oil: "KS Italian EVOO" - $27.99 for 2 L from Costco
Honey: "Local Honey" - $13.99 for 3 lb from Costco
```

### Debug Commands (run in browser console):
```javascript
// Test price calculation for a meal
priceService.calculateMealCost(mealDashboard.state.meals['A'])

// Check what's stored for an ingredient
priceService.getPriceRecords('thyme')
priceService.getPriceRecords('parmesan')

// See all tracked prices
priceService.getAllPrices()

// Check ingredient matching
priceService.matchIngredient('dried thyme')
priceService.matchIngredient('parmigiano reggiano')
```

---

## TODO FOR NEXT SESSION

### High Priority - Fix Price Calculations (Deferred - fix incrementally):
1. [ ] Debug why parmesan/eggplant show "missing" when they exist in Excel
2. [ ] Fix dried spice matching (thyme, oregano, etc.)
3. [ ] Verify canned goods unit conversion (oz vs cans vs count)
4. [ ] Review and fix gramsPerTypical values in ingredients.json
5. [ ] Add more aliases to ingredients.json for better matching

### COMPLETED (Jan 22, 2026):
1. [x] REVERT store breakdown back to doughnut/pie chart ✅
2. [x] ADD NEW chart: "Spending by Store per Trip" - grouped bar chart ✅
3. [x] Add tag display on meal cards ✅
4. [x] Tag editor modal (click ✏️ on any meal) ✅
5. [x] Filter meals by tags (filter bar above meal grid) ✅

### Future Enhancements (Lower Priority):
1. [ ] **Collapsible tag filter bar** - Add toggle to collapse/expand for cleaner dashboard look
2. [ ] **Units column in store breakdown modal** - Show quantity/unit alongside item name and cost
3. [ ] **Include shipping/taxes/fees** - Add all fees to store purchase summations
4. [ ] Create price history visualization component
5. [ ] Build meal archive browser with search

---

## Configuration Quick Reference

### How to change the spending data date range (rotation start date)

**Search terms:** "rotation start date", "spending date range", "chart date filter"

**File:** `dashboard/js/config.js` → `mealRotation` section

```javascript
mealRotation: {
    // ... other settings ...

    // Option 1: Set a specific date (charts show data from this date onwards)
    rotationStartDate: '2025-12-01',

    // Option 2: Dynamic (set to null) - automatically calculates based on:
    //   - When meals in current rotation were first cooked
    //   - Minus buffer days for shelf-stable purchases
    rotationStartDate: null,
    shelfStableBufferDays: 14  // Days before first cook to include
}
```

**How dynamic mode works:**
1. Finds earliest "first cooked" date among all meals in rotation
2. Subtracts `shelfStableBufferDays` (default 14) for pantry items bought earlier
3. Only shows spending data from that date onwards in charts

---

## What Was Fixed This Session (Jan 22, 2026)

### Module Loading (RESOLVED):
- ✅ All v2.0.0 modules now load correctly
- ✅ `priceService`, `mealLibrary`, `stateManager`, `eventBus` accessible globally
- ✅ Added debug logging to app.js (can remove later)

### Excel Data Parsing (RESOLVED):
- ✅ Changed config to use local Excel files (`../MealCostCalculator.xlsx`)
- ✅ Updated excel-reader.js to handle "Itemized_Pur" sheet naming
- ✅ Fixed Excel date serial numbers (46041 → "2026-01-15")
- ✅ Group trips by DATE (not receipt ID) - one trip = one shopping day
- ✅ Filter out restaurant/prepared food items

### Analytics Charts (COMPLETE):
- ✅ Spending by Trip: shows 2026 data, sorted by date, cumulative line
- ✅ Hover on trip shows store breakdown and item count
- ✅ Cost per Meal: click bar to see ingredient breakdown with unit column
- ✅ Store Breakdown: REVERTED to doughnut chart, click segments for item details
- ✅ NEW: Spending by Store per Trip - grouped bar chart with click-to-details
- ⚠️ Cost calculations deferred - fix incrementally as noticed

### Tag System UI (COMPLETE):
- ✅ Tags display on meal cards as color-coded badges
- ✅ Edit tags button (✏️) on each meal card
- ✅ Tag editor modal with checkboxes by category
- ✅ Auto-suggested tags based on meal ingredients
- ✅ Create custom tags feature
- ✅ Tag filter bar above meals grid
- ✅ Filter by ANY or ALL matching tags
- ✅ Clear filters button

### Price Service Improvements:
- ✅ Uses most recent purchase price (not average)
- ✅ Added `getPricePerGram()` for accurate unit conversion
- ✅ Handles "cnt" (count) items using gramsPerTypical
- ✅ Attempts to parse quantity from item names when qty=NaN
- ✅ Stores unit info for display in breakdown
- ⚠️ Still issues with matching and some unit conversions

---

## Project Structure

```
GroceryList/
├── README.md                        # Main shopping guide & meal plans
├── CLAUDE_SESSION_CONTEXT.md        # THIS FILE - read first
├── MealCostCalculator.xlsx          # Meal costs & ingredients
├── Best_actualShoppingData.xlsx     # Actual purchase receipts (sheets by year)
├── dashboard/
│   ├── index.html                   # Main app
│   ├── css/styles.css               # Styling
│   ├── js/
│   │   ├── app.js                   # Main app (v2.0.0 integrated, has debug logs)
│   │   ├── config.js                # Meal definitions + rotation settings
│   │   ├── excel-reader.js          # Excel parsing (updated for itemized sheets)
│   │   ├── charts.js                # Analytics visualizations
│   │   ├── meal-library.js          # Meal CRUD + tag system
│   │   ├── nutrition.js             # Nutrition API
│   │   ├── core/                    # Core infrastructure
│   │   │   ├── state-manager.js
│   │   │   ├── event-bus.js
│   │   │   └── sync-manager.js
│   │   ├── services/
│   │   │   └── price-service.js     # Ingredient price tracking (needs fixes)
│   │   └── data/
│   │       └── health-benefits.js
│   └── data/
│       └── ingredients.json         # Ingredient definitions (needs alias updates)
└── docs/
```

---

## Running the Dashboard

```bash
# IMPORTANT: Run from project ROOT (not dashboard folder)
cd /Users/ljwubest/Documents/GroceryList && python3 -m http.server 8000

# Then open: http://localhost:8000/dashboard/
```

---

## Key Architecture Notes

```javascript
// State management
import { getState, setState, subscribe } from './core/state-manager.js';

// Event bus
import { emit, on, EVENTS } from './core/event-bus.js';

// Price service
import priceService from './services/price-service.js';
await priceService.init();
const costData = priceService.calculateMealCost(meal);

// Meal library with tags
import mealLibrary from './meal-library.js';
mealLibrary.enableStateManager();
```

---

## User Preferences

- **Stores:** Costco, H-Mart, Safeway (primary); Sprouts, Walmart (occasional)
- **Dietary:** No onions, no mushrooms, no broccoli, no cow milk
- **Homemade:** Sourdough, yogurt, stock, breadcrumbs
- **Location:** Aurora, CO 80247
- **Household:** 2 adults, 2 babies, 2 servings/day
