# Meal Dashboard Web App - Implementation Plan

## Overview
**"The Best Household Meal Plan"** - A GitHub Pages-hosted dashboard for tracking a 6-meal rotation.

### Core Features
- Dynamic meal schedule based on current date (auto-restart cycle when complete)
- Excel-based shopping/cost data (auto-updates from repo)
- Google Sheets for cooking logs (editable from anywhere)
- USDA API for comprehensive nutrition data (all available nutrients)
- **Warm earth tones** design (cream background, brown/terracotta accents)
- Flexible meal rotation (add/remove meals, max 10)
- Meal library for archived/retired meals
- Seasonal + Colorado local ingredient tagging
- Shopping list generator (all stores, exact quantities)
- Homemade staples tracker (sourdough, yogurt, breadcrumbs)

### User Preferences
- **Daily consumption:** 2 servings/day (for calculating next cooking date)
- **New meal fields:** All required (name, servings, ingredients, instructions, sides, prep/cook time)
- **Cost display:** Total + per serving
- **Nutrition:** Per serving, all available nutrients from USDA
- **Dietary restrictions:** ⚠️ No onions, no mushrooms, no broccoli, no cow milk
- **Alert style:** Warning icon + tooltip
- **Seasonal updates:** Weekly highlights rotation
- **Notes:** Freeform notes/comments per meal supported

## Architecture

```
GitHub Pages (Static Hosting)
    │
    ├── index.html (Main dashboard)
    ├── css/styles.css (Clean minimal styling)
    ├── js/
    │   ├── app.js (Main app logic)
    │   ├── excel-reader.js (SheetJS Excel parsing)
    │   ├── google-sheets.js (Cooking log read/write)
    │   ├── nutrition.js (USDA API integration)
    │   └── charts.js (Chart.js visualizations)
    │
    └── Data Sources:
        ├── MealCostCalculator.xlsx (GitHub raw URL)
        ├── 2026_actualShoppingData.xlsx (GitHub raw URL)
        ├── Google Sheet (Cooking logs + recipe updates)
        └── USDA FoodData API (Nutrition lookup)
```

## Data Flow

1. **Page Load**: Fetch Excel files from GitHub → Parse with SheetJS → Populate UI
2. **Cooking Log**: Read/write to Google Sheets via API
3. **Nutrition**: Lookup ingredients via USDA API → Cache in localStorage
4. **Meal Rotation**: Calculate based on last cooking dates from Google Sheets

## Files to Create

```
GroceryList/
├── dashboard/
│   ├── index.html
│   ├── css/
│   │   └── styles.css (warm earth tones theme)
│   ├── js/
│   │   ├── app.js (main app logic, version number)
│   │   ├── config.js (API keys, version: "1.0.0")
│   │   ├── excel-reader.js (SheetJS Excel parsing)
│   │   ├── google-sheets.js (cooking log read/write)
│   │   ├── nutrition.js (USDA API, all nutrients)
│   │   ├── charts.js (Chart.js visualizations)
│   │   ├── meal-library.js (add/remove/archive meals)
│   │   ├── seasonal-data.js (US seasonal + CO local produce)
│   │   ├── dietary-alerts.js (restriction flagging)
│   │   ├── shopping-list.js (list generator)
│   │   └── staples-tracker.js (sourdough/yogurt/breadcrumbs)
│   └── lib/
│       ├── xlsx.full.min.js (SheetJS)
│       └── chart.min.js (Chart.js)
└── .github/
    └── workflows/
        └── pages.yml (GitHub Pages deployment)
```

## Google Sheet Structure

Create a Google Sheet with 6 tabs:

### Sheet 1: CookingLog
| Column | Description |
|--------|-------------|
| date | Date cooked (YYYY-MM-DD) |
| meal_code | Meal identifier (A-F, or custom) |
| meal_name | Full meal name |
| notes | Any cooking notes |
| servings_made | Actual servings produced |

### Sheet 2: RecipeUpdates
| Column | Description |
|--------|-------------|
| date | Date of change |
| meal_code | Which meal changed |
| change_type | ingredient_add, ingredient_remove, quantity_change, side_change |
| field | What changed (e.g., "Kale") |
| old_value | Previous value |
| new_value | New value |

### Sheet 3: MealLibrary
| Column | Description |
|--------|-------------|
| meal_code | Unique identifier |
| name | Meal name |
| status | "active" or "archived" |
| servings | Number of servings |
| ingredients_json | JSON array of ingredients |
| instructions | Cooking instructions |
| created_date | When added |
| archived_date | When archived (if applicable) |

### Sheet 4: RotationOrder
| Column | Description |
|--------|-------------|
| position | Order in rotation (1-10) |
| meal_code | Which meal is in this slot |

### Sheet 5: StaplesLog
| Column | Description |
|--------|-------------|
| date | Production date (YYYY-MM-DD) |
| item | sourdough, yogurt, or breadcrumbs |
| quantity | Amount made (e.g., "3 loaves", "6.5 pints") |
| notes | Any notes about the batch |

### Sheet 6: MealNotes
| Column | Description |
|--------|-------------|
| meal_code | Which meal |
| date | Note date |
| note | Freeform text (tips, variations, etc.) |

## Implementation Steps

### Phase 1: Core Dashboard Structure
1. Create `dashboard/index.html` with responsive layout
2. Create `css/styles.css` with clean minimal design
3. Set up basic meal rotation table component
4. Add placeholder sections for charts

### Phase 2: Excel Data Integration
1. Add SheetJS library for Excel parsing
2. Create `excel-reader.js` to fetch and parse:
   - `MealCostCalculator.xlsx` (ingredients, costs)
   - `2026_actualShoppingData.xlsx` (purchase history)
3. Populate meal cards with ingredient lists and costs
4. Build shopping cost summary by trip

### Phase 3: Meal Rotation Logic
1. Define the 6-meal cooking order (B→C→A→D→F→E)
2. Calculate "days since last cooked" for each meal
3. Determine next meal to cook based on rotation
4. Display dynamic schedule with dates

### Phase 4: Google Sheets Integration
1. Create Google Sheet with structure:
   - Sheet 1: `CookingLog` (date, meal_code, notes)
   - Sheet 2: `RecipeUpdates` (meal_code, field, old_value, new_value, date)
2. Create `google-sheets.js` with:
   - Read cooking history
   - Add new cooking entry
   - Update recipe modifications
3. Build UI form for logging cooked meals

### Phase 5: Nutrition Data & Charts
1. Create `nutrition.js` for USDA FoodData API
2. Map ingredient names to USDA food IDs
3. Fetch comprehensive nutrition data:
   - **Macros**: Calories, protein, carbs, fat, fiber, sugar
   - **Micronutrients**: Vitamins (A, C, D, E, K, B vitamins), minerals (iron, calcium, potassium, magnesium, zinc)
   - **Fun facts**: Omega-3 content, antioxidants, glycemic index where available
4. Create Chart.js visualizations:
   - Bar chart: Macros per meal
   - Stacked bar: Micronutrient comparison across meals
   - Radar chart: Nutritional completeness per meal
5. Add nutrition summary cards with daily value percentages

### Phase 5b: Seasonal & Local Colorado Ingredient Tagging
1. Create `seasonal-data.js` with TWO separate data sets:

   **A. National "In Season" produce** (available fresh anywhere in US):
   - **Winter**: Citrus, kale, cabbage, root vegetables, squash, pomegranate
   - **Spring**: Asparagus, peas, strawberries, artichokes, spinach
   - **Summer**: Tomatoes, corn, berries, peaches, melons, zucchini, peppers
   - **Fall**: Apples, pears, squash, pumpkin, cranberries, Brussels sprouts

   **B. Colorado-specific local produce** (grown in CO):
   - **Winter**: Storage crops (potatoes, carrots, beets, turnips), greenhouse greens
   - **Spring**: Asparagus, spinach, lettuce, radishes, peas
   - **Summer**: Peaches (Palisade!), sweet corn, tomatoes, peppers, melons, berries
   - **Fall**: Apples, squash, pumpkin, potatoes, late greens
   - **Year-round local**: Colorado beef, eggs (local farms), Grains from the Plains flour

2. **Two independent tags** (items can have one or both):
   - 🌱 **In Season** - green badge (available fresh this time of year, grown anywhere)
   - 🏔️ **CO Local** - blue badge (specifically grown/produced in Colorado)

3. **Tag combinations:**
   - Idaho potato in winter → 🌱 only (in season, but not CO-grown)
   - Palisade peach in August → 🌱🏔️ both (in season AND Colorado-grown)
   - Grains from Plains flour → 🏔️ only (local year-round, not seasonal)

4. Auto-detect current season from date
5. Add filter to show only seasonal/local ingredients
6. Highlight meals with highest % of seasonal/local ingredients

### Phase 5b-2: Seasonal Produce Discovery Section
1. Add a "What's Fresh Now" section at **bottom of dashboard**
2. Display two lists side-by-side:
   - **10 In-Season Fruits** (current month)
   - **10 In-Season Vegetables** (current month)
3. Each item tagged with:
   - 🌱 badge (all items have this - they're all in season)
   - 🏔️ badge if Colorado-grown
4. Example for January:
   ```
   FRUITS                    VEGETABLES
   • Citrus (oranges, etc.)  • Kale 🏔️
   • Apples 🏔️               • Cabbage 🏔️
   • Pears                    • Carrots 🏔️
   • Pomegranate             • Potatoes 🏔️
   • Grapefruit              • Beets 🏔️
   • Persimmon               • Turnips 🏔️
   • Kiwi                    • Parsnips
   • Cranberries             • Winter Squash 🏔️
   • Dates                   • Brussels Sprouts
   • Passion fruit           • Leeks
   ```
5. Update list automatically based on current month

### Phase 5c: Dietary Restriction Alerts
1. Create `dietary-alerts.js` with restricted ingredients list:
   - **Restricted:** onions, mushrooms, broccoli, cow milk (and variants: whole milk, 2% milk, skim milk, cream, half-and-half)
2. Scan ingredient lists and flag matches
3. Display: ⚠️ icon next to ingredient, hover/tap shows restriction reason
4. Summary at top of meal card if any restrictions present
5. Filter option: "Show meals without restricted ingredients"

### Phase 5d: Meal Library & Rotation Management
1. Create `meal-library.js` for meal management
2. Google Sheets structure additions:
   - Sheet 3: `MealLibrary` (meal_code, name, status: active/archived, ingredients_json, created_date, archived_date)
   - Sheet 4: `RotationOrder` (position 1-10, meal_code)
3. Build UI components:
   - "Manage Rotation" panel showing current meals (max 10)
   - "Add Meal" form: name, servings, ingredients list, cooking instructions
   - "Archive Meal" button → moves to library, removes from rotation
   - "Meal Library" sidebar: browse archived meals, click to restore
4. Validation: Prevent more than 10 active meals
5. When restoring archived meal, prompt for rotation position

### Phase 6: Cost Analytics
1. Create spending charts:
   - Line chart: Spending over time by trip
   - Bar chart: Cost per meal (total + per serving)
   - Pie chart: Spending by store
2. Add cost-per-serving calculations

### Phase 6b: Shopping List Generator
1. Create `shopping-list.js` for list generation
2. Features:
   - Select upcoming meals to shop for (checkboxes)
   - Generate ingredient list with exact recipe quantities
   - Group by store (all stores from shopping history: Costco, H-Mart, Safeway, Sprouts, Walmart, Grains from the Plains)
   - Show estimated cost per store
   - Export as printable list or copy to clipboard
3. UI: Button in header "Generate Shopping List" → modal with options

### Phase 6c: Homemade Staples Tracker
1. Create `staples-tracker.js` for production tracking
2. Track homemade items:
   - **Sourdough bread**: batches made, loaves per batch, cost/loaf
   - **Yogurt**: batches made, pints per batch, cost/oz
   - **Breadcrumbs**: batches made, cups per batch, cost/cup
3. Google Sheets tab: `StaplesLog` (date, item, quantity, notes)
4. UI: "Staples" section showing:
   - Last production date for each item
   - Current inventory estimate (based on usage)
   - "Log Production" button

### Phase 6d: Prep & Cook Time Display
1. Add to meal data structure:
   - `prep_time_minutes`: Active prep time
   - `cook_time_minutes`: Passive cooking time
   - `total_time_minutes`: Sum of prep + cook
2. Display on meal cards: "Prep: 20 min | Cook: 45 min"
3. Include in "Add New Meal" form as required fields

### Phase 7: Responsive Design (Desktop + iPhone Safari)
1. **Mobile-first CSS** with breakpoints:
   - Mobile: 320px - 480px (iPhone SE, iPhone 14)
   - Tablet: 481px - 768px
   - Desktop: 769px+
2. **Desktop layout**:
   - Side-by-side meal cards (3 per row)
   - Charts in 2x3 grid
   - Sidebar navigation for meal library
   - Full nutrition modal with all details visible
3. **iPhone Safari optimizations**:
   - Stack meal cards vertically (1 per row)
   - Swipeable meal rotation carousel
   - Bottom sheet modals instead of centered modals
   - Touch-friendly buttons (min 44px tap targets)
   - Safe area insets for notch/home bar
   - Smooth scroll with momentum (-webkit-overflow-scrolling)
4. **Visual polish**:
   - Subtle shadows and rounded corners
   - Smooth transitions (0.2s ease)
   - Loading skeletons while data fetches
   - Empty states with helpful illustrations
   - Consistent spacing using CSS variables

### Phase 8: Deploy & Documentation
1. Add loading states and error handling
2. Configure GitHub Pages deployment
3. Write setup instructions for API keys
4. Add README with screenshots and setup guide

## UI Components

### 0. Header with Version Number
```
┌─────────────────────────────────────────────────────────┐
│ Meal Planner Dashboard                        v1.0.0   │
└─────────────────────────────────────────────────────────┘
```
- Version number in small gray text at top right
- Format: `v{major}.{minor}.{patch}` (e.g., v1.0.0, v1.2.3)
- Defined in `config.js` for easy updating during development/debugging
- Click to see changelog (optional enhancement)

### 1. Meal Rotation Calendar (Hero Section)
```
┌─────────────────────────────────────────────────────────┐
│  TODAY: January 19, 2026                                │
│                                                         │
│  NEXT UP: Meal E - Mackerel Fried Rice                 │
│  Scheduled: Jan 20-21 | 6 servings | ~$8.50            │
│                                                         │
│  ┌───────┬───────┬───────┬───────┬───────┬───────┐    │
│  │ Meal B│ Meal C│ Meal A│ Meal D│ Meal F│ Meal E│    │
│  │ ✓ 1/8 │ ✓ 1/11│ ✓ 1/14│ ✓ 1/16│ ✓ 1/18│ NEXT  │    │
│  └───────┴───────┴───────┴───────┴───────┴───────┘    │
└─────────────────────────────────────────────────────────┘
```

### 2. Meal Cards (Expandable)
```
┌─────────────────────────────────────┐
│ B  Kale & Chicken Pasta             │
│ ─────────────────────────────────── │
│ Servings: 6  |  Cost: $24.50        │
│ Last cooked: Jan 8, 2026            │
│ Next due: ~Jan 22 (Cycle 2)         │
│                                     │
│ [View Ingredients] [Log Cooking]    │
└─────────────────────────────────────┘
```

### 3. Log Cooking Modal
```
┌─────────────────────────────────────┐
│ Log Cooking Session                 │
│ ─────────────────────────────────── │
│ Meal: [Dropdown: A-F]               │
│ Date: [Date picker]                 │
│ Notes: [Text area]                  │
│                                     │
│ Recipe changes? (optional)          │
│ [+ Add ingredient change]           │
│                                     │
│ [Cancel]              [Save]        │
└─────────────────────────────────────┘
```

### 4. Charts Section
```
┌──────────────────┐ ┌──────────────────┐
│ Cost per Meal    │ │ Spending by Trip │
│ [Bar Chart]      │ │ [Line Chart]     │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Macros per Meal  │ │ Store Breakdown  │
│ [Stacked Bar]    │ │ [Pie Chart]      │
└──────────────────┘ └──────────────────┘

┌──────────────────┐ ┌──────────────────┐
│ Micronutrients   │ │ Nutritional      │
│ [Grouped Bar]    │ │ Completeness     │
│ Vitamins/Minerals│ │ [Radar Chart]    │
└──────────────────┘ └──────────────────┘
```

### 5. Meal Card (with seasonal + local tags)
```
┌─────────────────────────────────────┐
│ B  Kale & Chicken Pasta             │
│ ─────────────────────────────────── │
│ Servings: 6  |  Cost: $24.50        │
│ Last cooked: Jan 8  |  Next: Jan 22 │
│ 🌱 3 seasonal  📍 2 local           │
│                                     │
│ Ingredients:                        │
│ • Kale 🌱📍 LOCAL & IN SEASON       │
│ • Chicken breast                    │
│ • Eggplant                          │
│ • Feta cheese                       │
│ • Wheat flour 📍 LOCAL (Grains/Plains)│
│                                     │
│ [View All] [Nutrition] [Log] [Edit] │
└─────────────────────────────────────┘
```

### 5b. Mobile Meal Card (iPhone)
```
┌─────────────────────────┐
│ B Kale & Chicken Pasta  │
├─────────────────────────┤
│ 6 servings • $24.50     │
│ Last: Jan 8 → Next: 1/22│
│ 🌱 3  📍 2              │
├─────────────────────────┤
│ [Nutrition] [Log Cook]  │
└─────────────────────────┘
```

### 6. Manage Rotation Panel
```
┌─────────────────────────────────────┐
│ Meal Rotation (6 of 10 max)         │
│ ─────────────────────────────────── │
│ 1. B - Kale Chicken Pasta    [⋮]   │
│ 2. C - Warm Grain Bowl       [⋮]   │
│ 3. A - Mackerel Meatball     [⋮]   │
│ 4. D - Turkey Barley Soup    [⋮]   │
│ 5. F - Turkey Spaghetti      [⋮]   │
│ 6. E - Mackerel Fried Rice   [⋮]   │
│                                     │
│ [+ Add New Meal] [📚 View Library]  │
└─────────────────────────────────────┘
   ↓ Click [⋮] shows:
   ┌────────────────┐
   │ Move Up        │
   │ Move Down      │
   │ Edit Meal      │
   │ Archive Meal   │
   └────────────────┘
```

### 7. Meal Library Sidebar
```
┌─────────────────────────────────────┐
│ 📚 Meal Library                     │
│ ─────────────────────────────────── │
│ Archived Meals:                     │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Salmon Teriyaki Bowl            │ │
│ │ Archived: Dec 15, 2025          │ │
│ │ [Restore to Rotation]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Vegetable Curry                 │ │
│ │ Archived: Nov 3, 2025           │ │
│ │ [Restore to Rotation]           │ │
│ └─────────────────────────────────┘ │
│                                     │
│                      [Close]        │
└─────────────────────────────────────┘
```

### 8. Nutrition Detail Modal
```
┌─────────────────────────────────────┐
│ Nutrition: Kale & Chicken Pasta     │
│ ─────────────────────────────────── │
│ Per Serving (1 of 6)                │
│                                     │
│ MACROS                              │
│ Calories: 485      Protein: 38g     │
│ Carbs: 42g         Fat: 18g         │
│ Fiber: 6g          Sugar: 8g        │
│                                     │
│ VITAMINS           % Daily Value    │
│ Vitamin A ████████████░░ 85%        │
│ Vitamin C ██████████████ 120%       │
│ Vitamin K ██████████████ 180%       │
│ Vitamin B6 ████████░░░░░ 45%        │
│                                     │
│ MINERALS                            │
│ Iron      ██████████░░░░ 65%        │
│ Calcium   ████████░░░░░░ 42%        │
│ Potassium ███████░░░░░░░ 38%        │
│                                     │
│ FUN FACTS                           │
│ 🥬 High in antioxidants (kale)     │
│ 🐟 Good omega-3 source             │
│ 💪 Complete protein meal           │
│                                     │
│                      [Close]        │
└─────────────────────────────────────┘
```

### 9. What's Fresh Now Section (Bottom of Dashboard)
```
┌─────────────────────────────────────────────────────────┐
│  🌱 What's Fresh Now - January                          │
├────────────────────────┬────────────────────────────────┤
│  FRUITS                │  VEGETABLES                    │
│  ─────────────────     │  ─────────────────             │
│  • Citrus              │  • Kale 🏔️ CO                  │
│  • Apples 🏔️ CO        │  • Cabbage 🏔️ CO              │
│  • Pears               │  • Carrots 🏔️ CO              │
│  • Pomegranate         │  • Potatoes 🏔️ CO             │
│  • Grapefruit          │  • Beets 🏔️ CO                │
│  • Persimmon           │  • Turnips 🏔️ CO              │
│  • Kiwi                │  • Parsnips                    │
│  • Cranberries         │  • Winter Squash 🏔️ CO        │
│  • Dates               │  • Brussels Sprouts            │
│  • Passion fruit       │  • Leeks                       │
└────────────────────────┴────────────────────────────────┘
```
- Auto-updates based on current month
- 🏔️ badge indicates Colorado-grown
- Tap item to see local farms/sources (future enhancement)

## API Setup Requirements

### Google Sheets API
1. Create Google Cloud project
2. Enable Google Sheets API
3. Create API key (restricted to Sheets API + your domain)
4. Create a Google Sheet and share it (view/edit link)
5. Add Sheet ID and API key to `config.js`

### USDA FoodData Central API
1. Register at https://fdc.nal.usda.gov/api-key-signup.html
2. Receive API key via email
3. Add to `config.js`

## Key Libraries
- **SheetJS (xlsx)**: Excel file parsing in browser
- **Chart.js**: Simple, responsive charts
- **No framework**: Vanilla JS for simplicity and GitHub Pages compatibility

## Verification
1. Open `dashboard/index.html` locally in browser
2. Verify Excel data loads and displays
3. Test Google Sheets read/write
4. Verify nutrition API calls work
5. Check charts render correctly
6. Test on mobile viewport
7. Deploy to GitHub Pages and verify live site

## Future Enhancements (Not in Scope)
- PWA offline support
- Email/SMS reminders for next meal
- Barcode scanning for shopping
- Multi-user household support
