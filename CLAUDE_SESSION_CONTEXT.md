# Claude Session Context

> **Read this file first to minimize token usage**
> Last updated: January 19, 2026

---

## Best Practices for Efficient Claude Usage

**To avoid running out of session usage prematurely:**

1. **Start with:** "Read CLAUDE_SESSION_CONTEXT.md, then [your task]"
2. **Batch updates:** Combine multiple small changes into one request
3. **Be specific:** "Update Meal D ingredients" is better than "make some changes"
4. **Reference existing data:** "Use prices from shopping data" vs. listing them all
5. **Commit in batches:** Wait until several changes are done before committing
6. **Use shorthand:** "commit and push" instead of explaining what to do

**Example efficient prompts:**
- "Add X to meal Y, update shopping list, commit"
- "I made fried rice with [ingredients]. Update README and commit."
- "Shopping trip: [items]. Update costs and mark complete."

---

## Project Structure

```
GroceryList/
├── README.md                        # Main shopping guide & meal plans
├── CLAUDE_SESSION_CONTEXT.md        # THIS FILE - read first
├── MealCostCalculator.xlsx          # Meal costs & ingredients
│   ├── Sheet: ingredients           # Ingredient costs per meal (Code A-F)
│   └── Sheet: totalMealCost         # Meal totals & servings
├── 2026_actualShoppingData.xlsx     # Actual purchase receipts
│   └── Sheet: 2026_Itemized_Pur     # Columns: Date[0], Location[2], Item[9], Qty[10], Unit[11], Price[12], Cat[15]
└── docs/                            # Additional documentation
```

---

## Current State (Jan 18, 2026)

### Cycle 1 - COMPLETE (except Fried Rice)
| Meal | Status | Date |
|------|--------|------|
| B - Kale & Chicken Pasta | ✓ DONE | Thu 1/8 |
| C - Warm Chicken Grain Bowl | ✓ DONE | Sun 1/11 |
| A - Mackerel Meatball | ✓ DONE | Wed 1/14 |
| D - Turkey Barley Soup | ✓ DONE | Fri 1/16 |
| F - Turkey Spaghetti | ✓ DONE | Sat 1/18 |
| E - Mackerel Fried Rice | ⏳ PLANNED | Tue/Wed 1/20-21 |

### Production Log
| Date | Item | Amount |
|------|------|--------|
| Sun 1/11 | Sourdough | 3 loaves |
| Sat 1/17 | Sourdough | 3 loaves |
| Sat 1/17 | Yogurt | 6.5 pints |

### Next Actions
1. **Shop Trip 4** - riced cauliflower & ginger (for fried rice)
2. **Cook Meal E** (Mackerel Fried Rice) after Trip 4
3. **Start Cycle 2** with Meal B

---

## Homemade Staple Costs

| Item | Cost | Recipe |
|------|------|--------|
| Sourdough | **$1.63/loaf** | 750g BRM whole wheat + 750g KA bread flour + 30g salt + starter |
| Yogurt | **$0.046/oz** | 1.25 gal milk + ½ FAGE cup → 6.5 pints |
| Breadcrumbs | **$0.23/cup** | 500g KA flour + yeast + oil + sugar + salt → 6 cups |

---

## Shopping Status

| Trip | Status | Amount |
|------|--------|--------|
| Trip 1 | ✓ DONE (Jan 8) | $91.20 |
| Trip 2 | ✓ DONE (Jan 14-15) | $25.56 |
| Trip 3 | ✓ DONE (Jan 19) | $149.05 |
| Trip 4 | ⏳ NEEDED | ~$73 |

### Trip 3 Completed (Jan 19)
- **Costco ($84.68):** Eggs, frozen berries, chicken thighs, ground turkey (4 pkg), squash, sweet potatoes, oranges
- **Walmart ($33.97):** Eggplant, kale, peas/carrots (3), chipotle sauce, cacao powder
- **Grains from Plains ($30.40):** 16 lb wheat berries (stone milled) - for sourdough flour

### Trip 4 - Still Needed (for Fried Rice + Cycle 2)
- **Costco:** Riced cauliflower ($12.99), parmesan ($19), maple syrup ($12.99), red grapes ($17.67)
- **H-Mart:** Ginger ($0.78), carrots ($1.96), celery ($2.49), lemon ($0.58)
- **Safeway:** Vegan cheddar ($4.98)

---

## Meal Codes & Cooking Order

| Order | Code | Meal | Servings |
|-------|------|------|----------|
| 1 | B | Kale & Chicken Pasta | 6 |
| 2 | C | Warm Chicken Grain Bowl | 8 |
| 3 | A | Mackerel Meatball | 5 |
| 4 | D | Turkey Barley Soup | 8 |
| 5 | F | Turkey Spaghetti | 6 |
| 6 | E | Mackerel Cauliflower Fried Rice | 6 |

**Total: 39 servings per cycle**

---

## Key Prices (Jan 2026)

| Item | Store | Price |
|------|-------|-------|
| Kale | H-Mart | $1.79/bunch |
| Kale (bagged, 1 lb) | Walmart | $4.76 |
| Eggs (60) | Costco | $9.39 |
| Feta | Costco | $6.99 |
| Ground Turkey (4 pkg, 5.6 lb) | Costco | $25.99 |
| Chicken Thighs (11.7 lb) | Costco | $20.94 |
| Whole Milk (2 gal) | Costco | $6.69 |
| KA Bread Flour (10 lb) | Costco | $8.99 |
| BRM Whole Wheat (5 lb) | Sprouts | $9.99 |
| Wheat Berries (16 lb, milled) | Grains from Plains | $30.40 |
| Pink Salt (5 lb) | Costco | $6.59 |
| Vine Tomatoes (4 lb) | Costco | $6.99 |
| Italian Seasoning (133g) | Costco | $3.39 |
| KS Minced Garlic (48 oz) | Costco | $6.99 |
| Sweet Potatoes (5 lb) | Costco | $4.99 |
| Frozen Peas & Carrots (12 oz) | Walmart | $0.98 |
| Triple Berry Frozen (4 lb) | Costco | $11.99 |
| Cara Cara Oranges (5 lb) | Costco | $3.39 |

---

## User Preferences

- **Stores:** Costco, H-Mart, Safeway (primary); Sprouts, Walmart (occasional)
- **Grains from the Plains - Sunflower Acres:** For wheat berries/flour for sourdough
- **Dietary:** No onions, no kimchi
- **Homemade:** Sourdough, yogurt, stock, breadcrumbs
- **Location:** Aurora, CO 80247

---

## Quick Reference Commands

```bash
# Read shopping data
python3 -c "
import openpyxl; import warnings; warnings.filterwarnings('ignore')
wb = openpyxl.load_workbook('2026_actualShoppingData.xlsx')
ws = wb['2026_Itemized_Pur']
for row in ws.iter_rows(values_only=True):
    if row[0] and row[2] in ['Costco', 'H-Mart', 'Safeway'] and row[15] == 'Food':
        print(f'{str(row[0])[:10]} | {row[2]:<8} | {str(row[9])[:40]:<42} | \${row[12]}')
"

# Git workflow
git add . && git commit -m "message

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" && git push
```

---

## Common Tasks

| Task | What to say |
|------|-------------|
| Record cooking | "Made [meal] on [date] with [any changes]. Update and commit." |
| Add shopping data | "See updated shopping xlsx. Update costs and mark complete." |
| Calculate costs | "Calculate cost for [recipe] using shopping data." |
| Update recipe | "Update Meal [X] ingredients: [list]. Commit." |
| Production log | "Made [X loaves/pints] on [date]. Update and commit." |
