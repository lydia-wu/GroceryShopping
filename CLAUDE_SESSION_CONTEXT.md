# Claude Session Context

> **Read this file first to minimize token usage**
> Last updated: January 12, 2026

## Quick Start Command

```bash
# Read 2026 shopping data
python3 -c "
import openpyxl
import warnings
warnings.filterwarnings('ignore')
wb = openpyxl.load_workbook('2026_actualShoppingData.xlsx')
ws = wb['2026_Itemized_Pur']
for row in ws.iter_rows(values_only=True):
    if row[0] and row[2] in ['Costco', 'H-Mart', 'Safeway'] and row[15] == 'Food':
        print(f'{str(row[0])[:10]} | {row[2]:<8} | {str(row[9])[:40]:<42} | \${row[12]}')
"
```

## Project Structure

```
GroceryList/
├── MealCostCalculator.xlsx          # Meal costs & ingredients
│   ├── Sheet: ingredients           # Ingredient costs per meal (Code A-F)
│   └── Sheet: totalMealCost         # Meal totals & servings
├── 2026_actualShoppingData.xlsx     # Actual purchase receipts
│   └── Sheet: 2026_Itemized_Pur     # Columns: Date[0], Location[2], Item[9], Qty[10], Unit[11], Price[12], Cat[15]
├── README.md                        # Main shopping guide
└── docs/UPDATED_SHOPPING_LIST.md    # Detailed trip checklist
```

## Current State (Jan 12, 2026)

### Shopping Status
| Trip | Status | Amount |
|------|--------|--------|
| Trip 1 | COMPLETED (Jan 8) | $91.20 |
| Trip 2 | PENDING | ~$84.81 |
| Pantry | Already have | ~$217.81 saved |
| **Total** | | **$176.01** |

### Pantry Items (from 2025, don't need to buy)
- Chicken, Ground Turkey, Pomegranate Arils
- Brami Pasta, Canned Mackerel, Tomato Sauce
- Green Beans, Peanut Butter, Pistachios, Lemon Juice, Pearl Barley

### Trip 2 Still Needed
**Costco** (~$67.54): Red grapes, apples, riced cauliflower, parmesan, maple syrup
**H-Mart** (~$12.29): Kale (1 more bunch), carrots, celery, sweet potatoes, frozen peas/carrots, lemon, ginger
**Safeway** (~$4.98): Vegan cheddar

## Meal Codes Reference

| Code | Meal | Servings |
|------|------|----------|
| A | Mackerel Meatball | 5 |
| B | Kale & Chicken Pasta | 6 |
| C | Warm Chicken Grain Bowl | 8 |
| D | Turkey Barley Soup | 8 |
| E | Mackerel Cauliflower Fried Rice | 6 |
| F | Turkey Spaghetti | 6 |

## Common Tasks

### 1. Update ingredient costs from new shopping data
```bash
# 1. Read new purchases from 2026_actualShoppingData.xlsx
# 2. Match items to ingredients in MealCostCalculator.xlsx
# 3. Update CostTot column in ingredients sheet
# 4. Recalculate meal costs
```

### 2. Add new shopping trip data
```bash
# User adds data to 2026_actualShoppingData.xlsx manually
# Then ask Claude to:
# - Extract food items from Costco/H-Mart/Safeway
# - Update docs with actual vs estimated costs
# - Mark purchased items as complete
```

### 3. Update shopping lists
- Edit: `README.md` (Shopping Lists section)
- Edit: `docs/UPDATED_SHOPPING_LIST.md` (detailed checklist)

## Key Prices (Actual from Jan 8, 2026)

| Item | Store | Actual Price |
|------|-------|--------------|
| Kale | H-Mart | $1.79/bunch |
| Eggs (60) | Costco | $9.39 |
| Feta | Costco | $6.99 |
| Grapefruit (6) | Costco | $5.69 |
| Tomato Paste | Costco | $9.99 |
| Dill | H-Mart | $3.60 |
| Eggplant | H-Mart | $0.77 |

## User Preferences

- No Walmart shopping
- No onions or kimchi
- Makes homemade: sourdough, yogurt, stock, breadcrumbs
- Location: Aurora, CO 80247
- Stores: Costco, H-Mart, Safeway only

## Git Workflow

```bash
git add . && git commit -m "description" && git push
```

Always include: `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
