# Claude Session Context

> **Read this file first to minimize token usage**
> Last updated: January 18, 2026

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
1. **Shop Trip 3** for fried rice ingredients
2. **Cook Meal E** (Mackerel Fried Rice) Tue/Wed 1/20-21
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
| Trip 2 | PARTIAL | milk, FAGE, tomatoes, flour |
| Trip 3 | ⏳ NEEDED | ~$85-100 |

### Trip 3 - Immediate (for Fried Rice)
- **Costco:** Riced cauliflower ($12.99), red grapes ($17.67)
- **H-Mart:** Frozen peas/carrots ($0.98), ginger ($0.78)

### Trip 3 - Also Needed (Cycle 2)
- **Costco:** Apples, parmesan, maple syrup, turkey (2+ pkg), milk
- **H-Mart:** Kale (2-3), carrots, celery, sweet potatoes, lemon
- **Safeway:** Vegan cheddar

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
| Eggs (60) | Costco | $9.39 |
| Feta | Costco | $6.99 |
| Ground Turkey (4 pkg) | Costco | $24.99 |
| Whole Milk (2 gal) | Costco | $6.69 |
| KA Bread Flour (10 lb) | Costco | $8.99 |
| BRM Whole Wheat (5 lb) | Sprouts | $9.99 |
| Pink Salt (5 lb) | Costco | $6.59 |
| Vine Tomatoes (4 lb) | Costco | $6.99 |
| Italian Seasoning (133g) | Costco | $3.39 |
| KS Minced Garlic (48 oz) | Costco | $6.99 |

---

## User Preferences

- **Stores:** Costco, H-Mart, Safeway only (no Walmart)
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
