# FoodDashboard v2.0.0: Complete Implementation Plan

> **Last Updated:** January 22, 2026
> **Total Features:** 20 features across 7 phases
> **Estimated Timeline:** 45-55 development days

---

## Progress Summary

### Completed ✅
- **Phase 1 Foundation (Partial):** Core modules built (state-manager, event-bus, price-service, meal-library with tags)
- **Phase 3 Charts (Partial):** Store breakdown doughnut, Spending by Store per Trip grouped bar chart
- **Phase 2 Tags (Complete):** Tag display on cards, tag editor modal, tag filtering

### In Progress 🔄
- Price calculation bug fixes (deferred - fix incrementally)

### Remaining
- Most of Phases 1-7 features

---

## The 20 Features Overview

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| 1 | Update Version Number | 7 | ⏳ Pending |
| 2 | Drag-and-Drop Meal Reordering | 4 | ⏳ Pending |
| 3 | Avg Expected Cost for "What's Fresh Now" | 6 | ⏳ Pending |
| 4 | Import Historical Staples Data | 2 | ⏳ Pending |
| 5 | Calendar View for Meals & Shopping | 4 | ⏳ Pending |
| 6 | Robust Ingredients/Cost/Nutrition Framework | 1 | 🔄 Partial |
| 7 | Comprehensive Ingredient & Health Database | 1 | 🔄 Partial |
| 8 | Units on All Nutrition Information | 2 | ⏳ Pending |
| 9 | Ingredients Button on Meal Cards | 2 | ⏳ Pending |
| 10 | Up to 10 Fun Facts per Meal | 2 | ⏳ Pending |
| 11 | Expand Nutritional Completeness Visual | 3 | ⏳ Pending |
| 12 | Distinct Colors for Charts | 3 | ⏳ Pending |
| 13 | Populate Cost Charts | 3 | ✅ Done |
| 14 | Fix "Next Due" Date Calculation | 4 | ⏳ Pending |
| 15 | USDA 2025-2030 Guidelines Visualizations | 3 | ⏳ Pending |
| 16 | Meal Archive/Stack System | 1 | 🔄 Partial |
| 17 | Export to Cookbook | 5 | ⏳ Pending |
| 18 | Upload 1 Photo per Recipe | 5 | ⏳ Pending |
| 19 | Fix Top Navigation Buttons | 4 | ⏳ Pending |
| 20 | Breakfast & Lunch Cards Section | 6 | ⏳ Pending |

---

# Phase 1: Foundation & Data Architecture

*Build the robust systems that other features depend on*

## Feature 7: Comprehensive Ingredient & Health Benefit Database

**Status:** 🔄 Partial (ingredients.json exists, needs expansion)

**Goal:** Create comprehensive, expandable ingredient database with health benefits from "Eat to Beat Disease", "The Obesity Code", "How Not to Die"

**User Specifications:**
- Use publicly available summaries/principles (don't need actual books)
- Include future ingredients, Whole Foods data, organic vs regular
- Citations expandable (button: "show expanded view with citations")
- 12 health categories with high-level summation visualization
- Separate JSON file for sustainability

**Database Structure (`/dashboard/data/ingredients-database.json`):**
```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2026-01-20",
    "totalIngredients": 85,
    "sources": ["USDA FoodData", "Eat to Beat Disease", "User research"]
  },
  "ingredients": {
    "kale": {
      "id": "kale",
      "name": "Kale",
      "category": "leafy_greens",
      "aliases": ["curly kale", "dinosaur kale", "lacinato kale"],
      "nutrition_per_100g": {
        "calories": 49, "protein": 3.3, "carbs": 8.7, "fat": 0.9,
        "fiber": 1.6, "sugar": 0.2, "calcium": 135, "iron": 1.7,
        "vitaminA": 500, "vitaminC": 120, "vitaminK": 705
      },
      "health_benefits": [
        {
          "category": "brain",
          "benefit": "Lutein crosses blood-brain barrier, protecting neurons",
          "sources": ["Eat to Beat Disease"],
          "relevance": "high"
        }
      ],
      "cost_typical": { "amount": 2.75, "unit": "bunch", "weight_grams": 200 },
      "store_sources": ["H-Mart", "Safeway", "Sprouts"],
      "seasonality": { "peak_months": [5,6,7,8,9,10], "colorado_local_months": [5,6,7,8,9,10] }
    }
  }
}
```

**Health Benefit Categories (12):**
Heart, Brain, Cancer Prevention, Gut Health, Muscle & Recovery, DNA Protection, Immunity, Regeneration, Metabolism, Bone Health, Eye Health, Skin Health

**Files to Create/Modify:**
- Create: `/dashboard/data/ingredients-database.json`
- Modify: `/dashboard/js/nutrition.js`

---

## Feature 6: Robust Ingredients/Cost/Nutrition Framework

**Status:** 🔄 Partial (price-service exists, needs enhancement)

**Goal:** Flexible framework supporting custom meals and automatic cost/nutrition calculations

**User Specifications:**
- Auto-update costs from shopping data (latest price, not average)
- Per "typical quantity" (per bunch, per package) - more intuitive
- Warn when ingredients lack price/nutrition data + ability to add
- Include homemade items at calculated costs

**Architecture (3 Layers):**
1. **Ingredient Loader** - Loads from database
2. **Cost Calculator** - Pulls from shopping history + manual entries
3. **Nutrition Aggregator** - Sums per-serving nutrition

**Homemade Item Pricing:**
- Sourdough: $1.63/loaf (flour + water + salt + time)
- Yogurt: $0.046/oz (milk + starter culture)
- Breadcrumbs: $0 (uses stale bread)

**Files:**
- Existing: `/dashboard/js/services/price-service.js`
- Modify: Add validation warnings, homemade cost integration

---

## Feature 16: Meal Archive/Stack System

**Status:** 🔄 Partial (meal-library.js has basic archive)

**Goal:** Manage archived meals with ability to temporarily pull recipes

**User Specifications:**
- Expand existing library modal with better organization
- Retain cooking history in separate log, start fresh in dashboard
- Add "favorites" and "seasonal favorites" tags
- No limit to rotation or archived

**Enhanced Archive Modal:**
- Filter buttons: All, Seasonal Favorites, By Category, By Ingredients
- Search bar for recipe lookup
- Drag-to-active-rotation to reactivate

**New Meal Properties:**
```javascript
{
  isArchived: false,
  seasonalFavorites: ["summer", "holiday"],
  category: "comfort" // comfort, quick, special occasion
}
```

---

# Phase 2: Core Data Entry & Display

*Import historical data and improve information display*

## Feature 4: Import Historical Staples Data

**Status:** ⏳ Pending

**Goal:** Populate production logs with sourdough, yogurt, breadcrumbs data

**User Specifications:**
- Pull from README notes and Excel files
- Date range: 2022-present
- Track: date, quantity, cost, notes, flour/yogurt ingredients

**Data Structure:**
```json
{
  "staples_log": [
    {
      "id": "sourdough_20260111",
      "item": "sourdough",
      "quantity": 3,
      "unit": "loaves",
      "date": "2026-01-11",
      "cost": 2.50,
      "notes": "3-hour fermentation",
      "ingredients": { "flour": "King Arthur", "hydration": "75%" }
    }
  ]
}
```

---

## Feature 8: Units on All Nutrition Information

**Status:** ⏳ Pending

**Goal:** Display complete nutritional data with proper units

**User Specifications:**
- All nutrients with full names (e.g., "25 grams")
- "45%" with "DV" column header
- 2020 FDA standards footnote

**Nutrient Units:**
- Macros: grams
- Calories: kcal
- Vitamins: mcg (A, D, E, K, B12), mg (B vitamins)
- Minerals: mg
- Display: "Protein: 25 grams" / "Vitamin A: 120mcg (15% DV)"

---

## Feature 9: Ingredients Button on Meal Cards

**Status:** ⏳ Pending

**Goal:** Quick access to ingredient list, quantities, and cooking instructions

**User Specifications:**
- Slide-out panel (not modal)
- Editable instructions
- Toggle between "as-is" (2 packages chicken) and "converted" (grams/oz)
- Toggle cost breakdown on/off (default: off)

**Panel Structure:**
```
[Meal Name] Ingredients & Instructions
──────────────────────────────────────
INGREDIENTS:
☐ Chicken breast (2 packages) - $8.50 (32%)
☐ Kale (1 bunch) - $2.25 (8%)
...
Cost Total: $26.50 per meal ($4.42 per serving)

COOKING INSTRUCTIONS:
1. Preheat oven...
```

---

## Feature 10: Up to 10 Fun Facts per Meal

**Status:** ⏳ Pending

**Goal:** Display expanded health benefit facts with visual ingredient indicators

**User Specifications:**
- 10 visible at once, up to 25 with "click expand for more facts"
- Hover/click to reveal which ingredients relate to facts
- Rotate randomly each time viewed
- Show categories organized cleanly with icons

**Display Format:**
```
❤️ HEART HEALTH
Mackerel provides omega-3 DHA which supports...
[hover: mackerel, garlic]

🧠 BRAIN HEALTH
Eggs contain choline for memory support...
[hover: eggs]
```

---

# Phase 3: Visual Enhancements & Charts

*Improve existing visualizations and add new ones*

## Feature 11: Expand Nutritional Completeness Visual

**Status:** ⏳ Pending

**Goal:** Enhanced radar chart with more dimensions and summary score

**User Specifications:**
- Add blood panel relevant axes (for annual physical)
- Default ALL meals, selectable, remember selection
- Summary score (0-100) with expandable formula
- Editable weights (settings modal or Excel-based)

**9 Radar Axes:**
1. Protein (% DV)
2. Fiber (% DV)
3. Vitamins (avg A, C, K, B vitamins)
4. Minerals (avg Iron, Calcium, Potassium, Magnesium)
5. Omega-3 (g, capped at 100)
6. Low Sodium (inverse 100 - % of 2300mg limit)
7. Low Glycemic Load (inverse, capped at 100)
8. Anti-inflammatory Score
9. Micronutrient Density

**Scoring Formula:**
```
Nutrition Score = (
  (Protein × 0.12) + (Fiber × 0.12) + (Vitamins × 0.12) +
  (Minerals × 0.12) + (Omega-3 × 0.10) + (Low Sodium × 0.10) +
  (Low Glycemic × 0.12) + (Anti-inflammatory × 0.10) +
  (Micronutrient Density × 0.10)
) / 100

Grade: A (85-100), B (70-84), C (55-69), D (40-54), F (0-39)
```

---

## Feature 12: Distinct Colors for Charts

**Status:** ⏳ Pending

**Goal:** Consistent, visually cohesive color palettes across all charts

**User Specifications:**
- No color blindness concerns
- Maintain earth tone theme
- Consistent meal colors across all charts

**Color Palette - Warm Harvest Extended:**
- Meal A: Terracotta (#C85A3A)
- Meal B: Deep Brown (#6F4E37)
- Meal C: Sage Green (#A9B494)
- Meal D: Rust (#8B4513)
- Meal E: Gold (#D4A574)
- Meal F: Olive Green (#6B8E23)

**Store Colors:**
- Costco: Terracotta (#C85A3A)
- H-Mart: Sage Green (#A9B494)
- Safeway: Gold (#D4A574)

---

## Feature 13: Populate Cost Charts ✅ DONE

**Status:** ✅ Complete

**Completed:**
- Spending by Trip (line chart with cumulative)
- Store Breakdown (doughnut with click-to-details)
- Spending by Store per Trip (grouped bar chart)
- Filterable by date range

---

## Feature 15: USDA 2025-2030 Guidelines Visualizations

**Status:** ⏳ Pending

**Goal:** Compare meals against latest USDA dietary guidelines

**User Specifications:**
- Multiple comparison views
- All three types: nutrient bar, MyPlate, food groups
- Web search for latest 2025-2030 guidelines

**Three Visualization Options:**
1. **Nutrient Bar Chart** (default) - % of daily value with 100% line
2. **MyPlate Style** - Circular plate divided by food groups
3. **Food Group Servings** - Recommended vs. Actual bar chart

**USDA Targets File (`/dashboard/data/usda-guidelines.json`):**
```json
{
  "version": "2025-2030",
  "daily_values": {
    "calories": 2000, "protein": 50, "carbs": 300, "fat": 78,
    "fiber": 28, "sodium": 2300, "calcium": 1300, "iron": 18
  },
  "macronutrient_percentages": {
    "carbs_min": 45, "carbs_max": 65,
    "protein_min": 20, "protein_max": 35,
    "fat_min": 20, "fat_max": 35
  }
}
```

---

# Phase 4: UI/UX Improvements

*Navigation, calendar views, and interaction improvements*

## Feature 19: Fix Top Navigation Buttons

**Status:** ⏳ Pending

**User Specifications:**
- Smooth scroll to section (A)
- 80px offset for sticky header
- Mobile hamburger menu (< 768px)

---

## Feature 2: Drag-and-Drop Meal Reordering

**Status:** ⏳ Pending

**User Specifications:**
- Both timeline AND modal
- Tap-and-hold for touch (400ms)
- Reset to default button (with confirmation)
- Auto-save on drop (retain session undo ability)

**Implementation:**
- Desktop: Click and drag
- Touch: Tap-and-hold then drag
- Visual feedback: Semi-transparent dragged element, highlighted drop zone

---

## Feature 5: Calendar View for Meals & Shopping Trips

**Status:** ⏳ Pending

**User Specifications:**
- Both month and week views, default to month
- Show: meal icon/name, shopping trip indicator, cost (negative meal / positive shopping)
- Draggable to reschedule: YES, distinguish scheduled vs. cooked
- Quick-log cooking from calendar
- Include staples production

**Cell Contents:**
```
Mon, Jan 20
───────────
🍝 Pasta Night
🛒 Shopping
🍞 Sourdough
```

---

## Feature 14: Fix "Next Due" Date Calculation

**Status:** ⏳ Pending

**User Specifications:**
- Calculate from average of actual cooking intervals (not fixed 14 days)
- Factor in servings (larger servings = longer interval)
- No urgency colors
- Factor in rotation position: YES

**Algorithm:**
```
1. Look back 6 cooking instances
2. Calculate average days between cooking
3. Factor servings: multiplier = meal_servings / 6
4. adjusted_interval = average_interval × multiplier
5. Due date = last_cooked + adjusted_interval
```

---

# Phase 5: Export & Media Features

*Cookbook export and photo upload*

## Feature 17: Export to Cookbook

**Status:** ⏳ Pending

**User Specifications:**
- All formats: PDF (primary), Markdown, HTML
- Clean, minimal aesthetic
- Include: ingredients, instructions, nutrition, fun facts, cost, season, photo
- Cover page + TOC
- Season as icon + legend on TOC page

**Recipe Page Layout:**
```
═══════════════════════════════════════════
MEAL A: Chicken & Kale Bowl          [SEASONAL]
═══════════════════════════════════════════

[Photo - 4"×4" square]

BASIC INFO
• Servings: 6 | Cost/Serving: $4.42
• Prep: 20 min | Cook: 30 min

INGREDIENTS
□ Chicken breast (2 packages) - $8.50
...

NUTRITION PER SERVING
Calories: 380 kcal | Protein: 42g | Carbs: 28g
Completeness Score: 82/100 (Grade B)

COOKING INSTRUCTIONS
1. Preheat oven...

HEALTH BENEFITS
❤️ High in omega-3 for heart health (mackerel)
🧠 Lutein supports brain function (kale)
```

---

## Feature 18: Upload 1 Photo per Recipe

**Status:** ⏳ Pending

**User Specifications:**
- Appear in: cookbook export, thumbnail on hover (meal card), hidden by default
- Max 2MB, max 1200×1200px (resize if needed)
- Store in GitHub (organized folder structure `/images/meals/A.jpg`)
- localStorage as base64 backup

---

# Phase 6: New Sections

*Add new dashboard sections*

## Feature 20: Breakfast & Lunch Cards Section

**Status:** ⏳ Pending

**User Specifications:**
- Full structure (ingredients, nutrition, cost) but 1 serving each
- 1-4 per week for each category
- Separate from dinner rotation
- Include in cookbook with own sections

**User's Examples:**
- **Breakfast:** "half a medium avocado, 1 vine tomato, 3 eggs, 1 tbsp olive oil, 1 tsp minced garlic, salt/pepper, 1/4 cup feta cheese"
- **Lunch:** "8 oz yogurt, 1 diced apple, cinnamon, 2 slices homemade sourdough, 1/2 vine tomato, 1 mashed avocado cup, sesame seeds"

**Card Structure (Simplified):**
```
┌──────────────────────────────┐
│ Overnight Oats               │
├──────────────────────────────┤
│ Calories: 380 kcal           │
│ Protein: 12g | Fiber: 8g     │
│ Time: 5 min prep             │
│ Cost: $1.25                  │
│ [View Details] [Log]         │
└──────────────────────────────┘
```

---

## Feature 3: Avg Expected Cost for "What's Fresh Now"

**Status:** ⏳ Pending

**User Specifications:**
- Own shopping data (primary) + web lookup for Denver/Aurora (fallback)
- Show both: price per pound AND per typical unit
- Indicate cheapest store
- Price history since 2022 (sparkline, not cluttering)

**Display:**
```
🥬 VEGETABLES
─────────────────────────────────────
Kale 🏔️ CO
  $2.50/lb | $2.75/bunch
  Best: H-Mart
  ▁▂▂ (trend sparkline)
```

---

# Phase 7: Quick Fixes

## Feature 1: Update Version Number

**Status:** ⏳ Pending

**User Specifications:**
- v2.0.0 (major overhaul)
- Auto-update with each change
- Add changelog in README

---

# Implementation Order

| Order | Feature # | Name | Dependencies | Complexity |
|-------|-----------|------|--------------|------------|
| 1 | 7 | Ingredient Database | None | High |
| 2 | 6 | Cost/Nutrition Framework | 7 | High |
| 3 | 4 | Import Staples Data | None | Low |
| 4 | 16 | Archive System | 6 | Medium |
| 5 | 8 | Units on Nutrition | 7 | Low |
| 6 | 9 | Ingredients Button | 6 | Medium |
| 7 | 10 | Fun Facts | 7 | Medium |
| 8 | 11 | Radar Enhancement | 6, 8 | High |
| 9 | 12 | Chart Colors | None | Low |
| 10 | 13 | Cost Charts | 6 | ✅ Done |
| 11 | 15 | USDA Guidelines | 11 | High |
| 12 | 19 | Navigation | None | Low |
| 13 | 2 | Drag-and-Drop | None | Medium |
| 14 | 5 | Calendar | 4 | High |
| 15 | 14 | Next Due Calc | 4 | Medium |
| 16 | 17 | Cookbook Export | 16, 9 | High |
| 17 | 18 | Photo Upload | 17 | Medium |
| 18 | 20 | Breakfast/Lunch | 6, 16 | High |
| 19 | 3 | Fresh Now Pricing | 6 | Medium |
| 20 | 1 | Version Update | All | Trivial |

---

# Feature Dependency Graph

```
                    Feature 1 (Version)
                           │
                           ▼
Feature 7 ◄──────── Feature 6 ◄──────── Feature 16
(Ingredient DB)     (Cost/Nutrition)    (Archive)
    │                   │                   │
    ├─────┬──────────┬──┤                   │
    │     │          │  │                   │
    ▼     ▼          ▼  ▼                   │
    8     9         10  4                   │
  (Units)(Ingredients)(Facts)(Staples)     │
    │     │          │       │              │
    │     │          └───┬───┘              │
    │     │              │                  │
    │     └──────────┬───┤                  │
    │               │   │                  │
    └───────────┬───┤   ▼                  ▼
                │   └──► 11 ◄──────────── 17
                │   (Radar)             (Cookbook)
                ▼                          ◄─── 18
               15                       (Photos)
         (USDA Guidelines)
```

---

# Dashboard Layout Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  🍽️  FoodDashboard  │ Dashboard │ Meals │ Shopping │ Analytics │ v2.0.0
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  NEXT MEAL UP                                                │
│  ═══════════════════════════════════════════════════════════│
│  ▌ PASTA & TOMATO                                           │
│    Scheduled: 1/22 | Servings: 6 | Cost: $12.50 | 30+40min  │
│                                                              │
│  MEAL ROTATION TIMELINE (drag-to-reorder)                   │
│  ═══════════════════════════════════════════════════════════│
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  NEXT   │ │ ✓ 1/15  │ │ Pending │ │ Pending │ ...       │
│  │ PASTA   │ │ KALE    │ │ EGGS    │ │ SEAFOOD │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                              │
│  [Filter by Tag: 🐔Chicken 🐟Fish 🥬Vegetarian ⚡Quick ❄️Winter] │
│                                                              │
│  MEAL CARDS (6-10 cards)                                    │
│  ═══════════════════════════════════════════════════════════│
│  ┌───────────────────┐ ┌───────────────────┐                │
│  │ A | Chicken Kale  │ │ B | Pasta Tomato  │                │
│  │ 6 serv | $4.42/sv │ │ 6 serv | $2.08/sv │                │
│  │ 🐔Chicken ⚡Quick  │ │ 🥬Vegetarian      │                │
│  │ [Nutrition][✏️Tags]│ │ [Nutrition][✏️Tags]│                │
│  │ [Ingredients][Log]│ │ [Ingredients][Log]│                │
│  └───────────────────┘ └───────────────────┘                │
│                                                              │
│  📅 MEAL CALENDAR (new section)                             │
│  ═══════════════════════════════════════════════════════════│
│  Jan 2026       [< Month >] [Week]                          │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐              │
│  │ Sun │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │              │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤              │
│  │  19 │ 20  │ 21  │ 22  │ 23  │ 24  │ 25  │              │
│  │     │🍝   │     │🍝   │     │🛒   │     │              │
│  │     │Pasta│     │Pasta│     │$91  │     │              │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘              │
│                                                              │
│  ANALYTICS (6 charts)                                       │
│  ═══════════════════════════════════════════════════════════│
│  [Cost/Meal][Spending/Trip][Macros][Store][Micro][Radar]   │
│                                                              │
│  USDA GUIDELINES COMPARISON (new section)                   │
│  ═══════════════════════════════════════════════════════════│
│  [Nutrient Bar] | [My Plate] | [Food Groups]               │
│                                                              │
│  QUICK MEALS: BREAKFAST & LUNCH (new section)              │
│  ═══════════════════════════════════════════════════════════│
│  [Breakfast Tab] | [Lunch Tab]                              │
│  ┌──────────────┐ ┌──────────────┐                         │
│  │ Eggs & Toast │ │ Yogurt Bowl  │                         │
│  │ 420 kcal     │ │ 350 kcal     │                         │
│  │ $2.50        │ │ $1.75        │                         │
│  └──────────────┘ └──────────────┘                         │
│                                                              │
│  HOMEMADE STAPLES                                           │
│  ═══════════════════════════════════════════════════════════│
│  [Sourdough: 3 loaves, Jan 17] [Yogurt: 6.5 pints, Jan 17] │
│                                                              │
│  WHAT'S FRESH NOW - January 🏔️                             │
│  ═══════════════════════════════════════════════════════════│
│  VEGETABLES              FRUITS                             │
│  Kale $2.50/lb ▁▂▂      Apples $1.50/lb                    │
│  Best: H-Mart            Best: Costco                       │
│                                                              │
│  ─────────────────────────────────────────────────────────  │
│  FoodDashboard v2.0.0 | [Export Cookbook]                   │
└─────────────────────────────────────────────────────────────┘
```

---

# Future Enhancements (Post-v2.0.0)

- [ ] Collapsible tag filter bar (for cleaner dashboard)
- [ ] Units column in store breakdown modal
- [ ] Include shipping/taxes/fees in store summations
- [ ] Price history visualization component
- [ ] Meal archive browser with search

---

# Deferred Bug Fixes (Fix Incrementally)

- Dried spice price matching (thyme, oregano showing wrong values)
- Parmesan/eggplant alias issues
- Canned goods unit conversion
- gramsPerTypical refinements

---

# Verification Checklist

```bash
# Run server
cd /Users/ljwubest/Documents/GroceryList && python3 -m http.server 8000

# Open dashboard
open http://localhost:8000/dashboard/
```

**Test Each Feature:**
- [ ] Store breakdown is doughnut style with click-to-details
- [ ] Spending by Store per Trip grouped bar chart works
- [ ] Tags display on meal cards
- [ ] Tag editor modal opens and saves
- [ ] Tag filtering works (ANY/ALL modes)
- [ ] Navigation smooth scrolls with offset
- [ ] Calendar shows meals and shopping trips
- [ ] Cookbook exports to PDF/Markdown
- [ ] Photos upload and display

---

# Files Reference

**Core Files:**
- `dashboard/js/app.js` - Main orchestration
- `dashboard/js/config.js` - Meal definitions
- `dashboard/js/charts.js` - Chart.js visualizations
- `dashboard/js/meal-library.js` - Meal CRUD + tags
- `dashboard/js/services/price-service.js` - Cost calculations

**Data Files:**
- `dashboard/data/ingredients.json` - Ingredient definitions
- `MealCostCalculator.xlsx` - Meal costs
- `Best_actualShoppingData.xlsx` - Shopping receipts

**New Files to Create:**
- `/dashboard/data/ingredients-database.json` - Full ingredient DB
- `/dashboard/data/usda-guidelines.json` - USDA targets
- `/dashboard/js/components/calendar-view.js`
- `/dashboard/js/components/cookbook-exporter.js`
- `/dashboard/js/components/usda-comparison.js`
- `/dashboard/js/quick-meals.js`
