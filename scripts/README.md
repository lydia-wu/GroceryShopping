# Scripts

This directory contains Python scripts for meal planning and data analysis.

## 📁 Directory Structure

### `/analysis/`
Scripts for analyzing meal costs and shopping patterns:
- **`analyze_meals.py`** - Meal cost analysis
- **`complete_analysis.py`** - Complete cost breakdown
- **`optimize_shopping.py`** - Shopping route optimization
- **`read_excel.py`** - Excel file reader utility

### `/one-time-tasks/`
Archived scripts used for one-time modifications (not tracked in git):
- Scripts for adding/removing ingredients
- One-time data transformations
- Task-specific utilities

## 🔧 Main Script

The primary shopping list generator is located at the repository root:
- **`../revised_no_walmart.py`** - Main shopping list generation script

### Usage:
```bash
python3 revised_no_walmart.py
```

This generates an optimized shopping list based on:
- Your purchase history in `MealCostCalculator.xlsx`
- Store preferences (Costco, H-Mart, Safeway only - no Walmart)
- Dietary restrictions and preferences

## 📊 Data Source

All scripts read from **`MealCostCalculator.xlsx`** which contains:
- Ingredient lists for each meal
- Purchase history by store
- Price data
- Quantity information
