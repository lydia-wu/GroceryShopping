# The Best Household Meal Plan - Implementation Plan

> **Version:** 2.0.0 | **Created:** January 21, 2026
> **Author:** Claude Opus 4.5 + L. Best
> **Status:** Ready for Implementation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [Data Models](#data-models)
5. [File Structure](#file-structure)
6. [Implementation Phases](#implementation-phases)
7. [Feature Specifications](#feature-specifications)
8. [UI/UX Specifications](#uiux-specifications)
9. [Testing Strategy](#testing-strategy)
10. [Documentation Plan](#documentation-plan)
11. [Verification Checklist](#verification-checklist)

---

## Executive Summary

### Project Vision
Transform the existing meal planning dashboard into a beautiful, modern, data-driven household food management system that:
- Syncs seamlessly across phone and desktop
- Provides comprehensive nutrition and health insights
- Tracks costs and budgets with real shopping data
- Exports beautiful cookbooks
- Works offline with automatic sync
- Is shareable/forkable for others to use

### Key Deliverables
- 20 new features across 7 implementation phases
- Supabase backend for cross-device sync
- PWA with offline support
- Comprehensive documentation
- Clean, maintainable codebase

### Identity
| Element | Value |
|---------|-------|
| Dashboard Title | "The Best Household Meal Plan" |
| PWA Name | "Best Foods" |
| Cookbook Title | "Some Best Household Meals" |
| Cookbook Subtitle | "Seasonal, Healthy, Tasty, Research-Informed Recipes" |
| Cookbook Author | "L. Best, E. Best, and the Littles" |
| Theme Name | "Warm Harvest" |

---

## Architecture Overview

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER DEVICES                                    │
├─────────────────────────────────┬───────────────────────────────────────────┤
│         iPhone (PWA)            │           Desktop Browser                  │
│    ┌─────────────────────┐      │      ┌─────────────────────┐              │
│    │   Best Foods App    │      │      │   Dashboard (Web)   │              │
│    │   - Home Screen     │      │      │   - Full Features   │              │
│    │   - Offline Mode    │      │      │   - SQL Queries     │              │
│    └──────────┬──────────┘      │      └──────────┬──────────┘              │
└───────────────┼─────────────────┴─────────────────┼──────────────────────────┘
                │                                   │
                ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCAL STORAGE LAYER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  localStorage   │  │  IndexedDB      │  │  Service Worker │              │
│  │  - Settings     │  │  - Offline Data │  │  - Cache        │              │
│  │  - UI State     │  │  - Sync Queue   │  │  - PWA Assets   │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼ (Auto-sync when online)
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPABASE BACKEND                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  PostgreSQL DB  │  │  Real-time      │  │  Storage        │              │
│  │  - All Data     │  │  - Live Sync    │  │  - Meal Photos  │              │
│  │  - SQL Queries  │  │  - Subscriptions│  │  - Exports      │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GITHUB REPOSITORY                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Source Code    │  │  Static Data    │  │  Documentation  │              │
│  │  - /dashboard   │  │  - ingredients  │  │  - /docs        │              │
│  │  - /scripts     │  │  - health DB    │  │  - README       │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  User Action │────▶│ Local Save   │────▶│ Sync Queue   │
│  (Add meal)  │     │ (Instant)    │     │ (If offline) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                     ┌────────────────────────────┘
                     ▼
              ┌──────────────┐     ┌──────────────┐
              │ Online Check │────▶│ Supabase     │
              │              │     │ (Persist)    │
              └──────────────┘     └──────┬───────┘
                                          │
                     ┌────────────────────┘
                     ▼
              ┌──────────────┐     ┌──────────────┐
              │ Real-time    │────▶│ Other        │
              │ Broadcast    │     │ Devices      │
              └──────────────┘     └──────────────┘
```

### Offline Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    OFFLINE SYNC SYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. USER ACTION                                                 │
│     └──▶ Save to IndexedDB (immediate)                         │
│     └──▶ Add to syncQueue[] with timestamp                     │
│     └──▶ UI updates instantly                                  │
│                                                                 │
│  2. ONLINE CHECK (every 5 seconds + on focus)                  │
│     └──▶ navigator.onLine === true?                            │
│         └──▶ YES: Process syncQueue                            │
│         └──▶ NO: Continue queueing                             │
│                                                                 │
│  3. SYNC PROCESS                                                │
│     └──▶ Sort queue by timestamp (oldest first)                │
│     └──▶ Batch upsert to Supabase                              │
│     └──▶ On success: Clear synced items from queue             │
│     └──▶ On failure: Retry with exponential backoff            │
│                                                                 │
│  4. CONFLICT RESOLUTION                                         │
│     └──▶ Last-write-wins (based on updated_at timestamp)       │
│     └──▶ Server timestamp is authoritative                     │
│                                                                 │
│  5. INITIAL LOAD                                                │
│     └──▶ Fetch from Supabase                                   │
│     └──▶ Merge with local IndexedDB                            │
│     └──▶ Subscribe to real-time changes                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| Vanilla JavaScript | Core application | ES2022+ |
| CSS3 | Styling with CSS Variables | - |
| Chart.js | Data visualizations | 4.4.1 |
| SheetJS | Excel file reading | 0.20.1 |
| Sortable.js | Drag-and-drop | 1.15.0 |
| jsPDF | PDF generation | 2.5.1 |
| html2canvas | PDF screenshots | 1.4.1 |

### Backend
| Technology | Purpose | Tier |
|------------|---------|------|
| Supabase | Database + Auth + Real-time | Free |
| PostgreSQL | Data storage (via Supabase) | Free |
| Supabase Storage | Photo storage | Free (1GB) |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| GitHub Pages | Static hosting (optional) |
| Service Worker | Offline support, PWA |
| IndexedDB | Local data persistence |
| localStorage | Settings, UI state |

### External APIs
| API | Purpose | Cost |
|-----|---------|------|
| USDA FoodData Central | Nutrition data | Free |
| Instacart/Google | Price lookups | Free |

---

## Data Models

### Supabase Database Schema

```sql
-- =====================================================
-- CORE TABLES
-- =====================================================

-- Meals (dinner rotation)
CREATE TABLE meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    servings INTEGER NOT NULL DEFAULT 6,
    prep_time INTEGER, -- minutes
    cook_time INTEGER, -- minutes
    instructions TEXT,
    sides TEXT[],
    season VARCHAR(50), -- 'spring', 'summer', 'fall', 'winter', 'year-round', etc.
    is_archived BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
    color_override VARCHAR(7), -- hex color
    photo_url TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Meal Ingredients (junction table)
CREATE TABLE meal_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    grams DECIMAL(10,2),
    display_quantity VARCHAR(100), -- "2 packages chicken breast"
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients Master Database
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100), -- 'protein', 'vegetable', 'grain', etc.
    typical_quantity VARCHAR(100), -- "1 bunch", "1 lb"
    grams_per_typical DECIMAL(10,2), -- 206 (grams per bunch)
    is_organic_available BOOLEAN DEFAULT TRUE,

    -- Nutrition per 100g
    calories DECIMAL(10,2),
    protein DECIMAL(10,2),
    carbs DECIMAL(10,2),
    fat DECIMAL(10,2),
    fiber DECIMAL(10,2),
    -- ... all other nutrients

    -- Health benefits (from books)
    health_benefits JSONB, -- {"heart": ["..."], "brain": ["..."]}
    book_citations JSONB, -- {"fact": "source", ...}

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredient Prices (historical)
CREATE TABLE ingredient_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id UUID REFERENCES ingredients(id),
    store VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    quantity VARCHAR(50), -- "1 bunch", "1 lb"
    is_organic BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    source VARCHAR(50), -- 'shopping_data', 'web_lookup', 'manual'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- =====================================================
-- COOKING & TRACKING
-- =====================================================

-- Cooking Log (all-time history)
CREATE TABLE cooking_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES meals(id),
    meal_code VARCHAR(10), -- denormalized for history
    meal_name VARCHAR(255), -- denormalized for history
    date_cooked DATE NOT NULL,
    servings_made INTEGER,
    notes TEXT,
    cost_at_time DECIMAL(10,2),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Meal Rotation Order
CREATE TABLE rotation_order (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES meals(id),
    position INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id),
    UNIQUE(user_id, position)
);

-- =====================================================
-- SHOPPING & COSTS
-- =====================================================

-- Shopping Trips
CREATE TABLE shopping_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_number INTEGER,
    name VARCHAR(100),
    date DATE NOT NULL,
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Shopping Items (per trip)
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    item_name VARCHAR(255) NOT NULL,
    store VARCHAR(100),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    category VARCHAR(100),
    is_estimated BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- HOMEMADE STAPLES
-- =====================================================

CREATE TABLE staples_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(50) NOT NULL, -- 'sourdough', 'yogurt', 'breadcrumbs'
    date_made DATE NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50), -- 'loaves', 'pints', 'cups'
    notes TEXT,

    -- Ingredient details (for sourdough flour tracking)
    ingredients_used JSONB, -- {"ka_bread_flour_g": 750, "brm_whole_wheat_g": 750}

    -- For yogurt
    milk_quantity VARCHAR(50),
    starter_type VARCHAR(50),
    starter_quantity VARCHAR(50),
    incubation_time VARCHAR(50),
    straining_duration VARCHAR(50),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- =====================================================
-- BREAKFAST & LUNCH
-- =====================================================

CREATE TABLE simple_meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_type VARCHAR(20) NOT NULL, -- 'breakfast', 'lunch'
    name VARCHAR(255) NOT NULL,
    ingredients TEXT,
    calories INTEGER,
    protein DECIMAL(10,2),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

CREATE TABLE simple_meal_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simple_meal_id UUID REFERENCES simple_meals(id),
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- =====================================================
-- SETTINGS & CONFIGURATION
-- =====================================================

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,

    -- Household
    household_name VARCHAR(255),
    num_adults INTEGER DEFAULT 2,
    servings_per_day INTEGER DEFAULT 2,

    -- Dietary
    dietary_restrictions TEXT[], -- ['onion', 'mushroom', 'broccoli', 'cow milk']

    -- Stores
    preferred_stores TEXT[], -- ['Costco', 'H-Mart', 'Safeway']

    -- Budget
    weekly_budget DECIMAL(10,2),
    per_meal_budget DECIMAL(10,2),
    per_serving_budget DECIMAL(10,2),

    -- Score weights (1-10, higher = more important)
    score_weights JSONB DEFAULT '{
        "protein": 10,
        "anti_inflammatory": 9,
        "vitamins": 8,
        "blood_sugar": 7,
        "heart_health": 6,
        "fiber": 5,
        "low_sugar": 4,
        "minerals": 3,
        "omega3": 2,
        "low_sodium": 1
    }',

    -- UI State
    current_view VARCHAR(50) DEFAULT 'dashboard',
    rotation_order_snapshot TEXT[], -- For session reset
    edit_mode BOOLEAN DEFAULT FALSE,

    -- Charts
    selected_meals_radar TEXT[], -- Which meals shown on radar chart

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Custom Tags
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7),
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- =====================================================
-- SYNC & OFFLINE SUPPORT
-- =====================================================

CREATE TABLE sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'insert', 'update', 'delete'
    synced_at TIMESTAMPTZ DEFAULT NOW(),
    device_id VARCHAR(255),
    user_id UUID REFERENCES auth.users(id)
);
```

### Health Benefits JSON Structure

```json
{
  "kale": {
    "category": "vegetable",
    "health_benefits": {
      "brain": [
        {
          "fact": "Kale's lutein crosses the blood-brain barrier, protecting neurons from oxidative damage",
          "source": "Eat to Beat Disease",
          "chapter": "Chapter 4",
          "ingredients_related": ["kale", "spinach", "eggs"]
        }
      ],
      "cancer": [
        {
          "fact": "Contains sulforaphane - shown to starve cancer cells by blocking blood vessel growth",
          "source": "How Not to Die",
          "chapter": "Chapter 9",
          "ingredients_related": ["kale", "broccoli", "cauliflower"]
        }
      ],
      "heart": [...],
      "gut": [...],
      "immunity": [...],
      "bone": [...],
      "eye": [...],
      "skin": [...],
      "regeneration": [...],
      "metabolism": [...],
      "dna": [...],
      "muscle": [...]
    }
  }
}
```

---

## File Structure

```
GroceryList/
├── README.md                           # Project overview + quick start
├── CLAUDE_SESSION_CONTEXT.md           # Session context for Claude
├── IMPLEMENTATION_PLAN.md              # This document
├── CHANGELOG.md                        # Version history
│
├── dashboard/
│   ├── index.html                      # Main entry point
│   ├── manifest.json                   # PWA manifest
│   ├── sw.js                           # Service worker
│   │
│   ├── css/
│   │   ├── styles.css                  # Main styles
│   │   ├── themes/
│   │   │   └── warm-harvest.css        # Theme variables
│   │   ├── components/
│   │   │   ├── cards.css
│   │   │   ├── modals.css
│   │   │   ├── calendar.css
│   │   │   ├── charts.css
│   │   │   └── slide-panel.css
│   │   └── print/
│   │       └── cookbook.css            # Print styles for export
│   │
│   ├── js/
│   │   ├── app.js                      # Main application
│   │   ├── config.js                   # Configuration
│   │   │
│   │   ├── core/
│   │   │   ├── supabase-client.js      # Supabase initialization
│   │   │   ├── sync-manager.js         # Offline sync logic
│   │   │   ├── state-manager.js        # Global state
│   │   │   └── event-bus.js            # Cross-component events
│   │   │
│   │   ├── services/
│   │   │   ├── meals-service.js        # Meal CRUD operations
│   │   │   ├── cooking-service.js      # Cooking log operations
│   │   │   ├── shopping-service.js     # Shopping data
│   │   │   ├── nutrition-service.js    # Nutrition calculations
│   │   │   ├── price-service.js        # Price lookups & history
│   │   │   └── export-service.js       # Cookbook export
│   │   │
│   │   ├── components/
│   │   │   ├── navigation.js           # Sticky nav + scroll
│   │   │   ├── meal-cards.js           # Meal card rendering
│   │   │   ├── slide-panel.js          # Ingredients slide-out
│   │   │   ├── calendar.js             # Calendar view
│   │   │   ├── drag-drop.js            # Drag-and-drop
│   │   │   ├── charts-manager.js       # All chart logic
│   │   │   ├── modals.js               # Modal management
│   │   │   └── settings-modal.js       # Settings UI
│   │   │
│   │   ├── utils/
│   │   │   ├── date-utils.js
│   │   │   ├── format-utils.js
│   │   │   ├── validation.js
│   │   │   └── debounce.js
│   │   │
│   │   └── data/
│   │       ├── ingredients-db.js       # Ingredient database
│   │       ├── health-benefits.js      # Health facts database
│   │       └── seasonal-data.js        # Seasonal produce
│   │
│   ├── images/
│   │   ├── icons/
│   │   │   ├── icon-192.png            # PWA icon
│   │   │   ├── icon-512.png            # PWA icon large
│   │   │   └── apple-touch-icon.png    # iOS home screen
│   │   └── meals/                      # Meal photos (gitignored, stored in Supabase)
│   │
│   └── data/
│       └── ingredients.json            # Static ingredient database
│
├── docs/
│   ├── README.md                       # Documentation index
│   ├── ARCHITECTURE.md                 # System architecture
│   ├── DATA_MODELS.md                  # Database schema docs
│   ├── API_REFERENCE.md                # Function/method reference
│   ├── USER_GUIDE.md                   # End-user documentation
│   ├── SETUP_GUIDE.md                  # Setup for new users/forks
│   ├── CUSTOMIZATION.md                # How to customize
│   └── diagrams/
│       ├── architecture.png
│       ├── data-flow.png
│       └── sync-flow.png
│
├── scripts/
│   ├── README.md
│   ├── import-excel.js                 # Import shopping data
│   └── backup-data.js                  # Backup Supabase to JSON
│
└── .github/
    └── workflows/
        └── backup.yml                  # Optional: automated backups
```

---

## Implementation Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         IMPLEMENTATION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHASE 1: Foundation          ████████░░░░░░░░░░░░░░░░░░░░░░  Features 7,6,16│
│  - Supabase setup                                                           │
│  - Ingredient database                                                      │
│  - Cost/nutrition framework                                                 │
│  - Meal archive system                                                      │
│                                                                             │
│  PHASE 2: Data & Display      ░░░░░░░░████████░░░░░░░░░░░░░░  Features 4,8,9,10│
│  - Historical data import                                                   │
│  - Nutrition units                                                          │
│  - Ingredients slide-panel                                                  │
│  - Fun facts system                                                         │
│                                                                             │
│  PHASE 3: Visualizations      ░░░░░░░░░░░░░░░░████████░░░░░░  Features 11,12,13,15│
│  - Expanded nutrition radar                                                 │
│  - Color palettes                                                           │
│  - Cost charts                                                              │
│  - USDA comparisons                                                         │
│                                                                             │
│  PHASE 4: UI/UX               ░░░░░░░░░░░░░░░░░░░░░░░░████░░  Features 19,2,5,14│
│  - Navigation + sticky                                                      │
│  - Drag-and-drop                                                            │
│  - Calendar view                                                            │
│  - Next due calculation                                                     │
│                                                                             │
│  PHASE 5: Export & Media      ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Features 17,18│
│  - Cookbook export                                                          │
│  - Photo upload                                                             │
│                                                                             │
│  PHASE 6: New Sections        ░░░░░░░░░░░░░░░░░░░░░░░░░░░░██  Features 20,3│
│  - Breakfast/lunch                                                          │
│  - Fresh produce prices                                                     │
│                                                                             │
│  PHASE 7: Polish              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░█  Features 1+extras│
│  - Version system                                                           │
│  - PWA + offline                                                            │
│  - Documentation                                                            │
│  - Testing                                                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Feature Specifications

### Phase 1: Foundation & Data Architecture

#### Feature 7: Comprehensive Ingredient & Health Benefit Database

**Goal:** Create a robust database of all whole food ingredients with nutrition data and health benefits from three key books.

**Data Sources:**
- USDA FoodData Central (nutrition values)
- "Eat to Beat Disease" by William Li (health benefits)
- "The Obesity Code" by Jason Fung (metabolic insights)
- "How Not to Die" by Gene Stone & Michael Greger (disease prevention)

**Implementation:**
1. Create `/dashboard/data/ingredients.json` with ~500+ ingredients
2. Each ingredient includes:
   - Basic info (name, category, typical quantity)
   - Nutrition per 100g (all macro/micronutrients)
   - Health benefits by category (12 categories)
   - Book citations (expandable in UI)
   - Organic vs regular data where different

**Health Benefit Categories (12):**
1. Heart Health
2. Brain Health
3. Cancer Prevention (Angiogenesis)
4. Gut Health (Microbiome)
5. Muscle & Recovery
6. DNA Protection
7. Immunity
8. Stem Cell Regeneration
9. Metabolism & Blood Sugar
10. Bone Health
11. Eye Health
12. Skin Health

**Visualizations (all three, toggleable):**
- Radar chart (default view)
- Horizontal progress bars
- Circular gauge dials

**Files to modify:**
- Create: `/dashboard/data/ingredients.json`
- Create: `/dashboard/js/data/health-benefits.js`
- Modify: `/dashboard/js/nutrition.js`

---

#### Feature 6: Robust Ingredients/Cost/Nutrition Framework

**Goal:** Auto-updating cost system based on shopping history with nutrition calculations.

**Cost Logic:**
- Auto-update to latest purchase price for each ingredient
- Track by typical quantity (bunch, lb, package)
- Use USDA defaults for gram conversions, allow user override
- Include homemade items at calculated costs

**Warning System:**
- When adding a meal with unknown ingredient: show warning
- Provide both:
  - Simple web form in dashboard (name, cost, quantity)
  - Step-by-step instructions for JSON editing (for non-technical users)

**Price History:**
- Stored in `ingredient_prices` table
- Accessible in new "Price Analytics" top-level section
- Shows price trends since 2022

**Files to modify:**
- Modify: `/dashboard/js/config.js`
- Create: `/dashboard/js/services/price-service.js`
- Modify: `/dashboard/js/nutrition.js`

---

#### Feature 16: Meal Archive/Stack System

**Goal:** Flexible system to archive and restore meals with full history preservation.

**Archive Behavior:**
- Archived meals retain ALL cooking history in separate log
- When restored to rotation:
  - Current cooking count → 0
  - Last cooked date → null
  - Next due date → recalculated
  - Cost data → retained
  - All-time history → preserved, not displayed on card

**Features:**
- Custom tags (user creates via quick-add or management modal)
- Full-text search across name, ingredients, tags
- Favorites and seasonal favorites tags
- No limits on archived or active meals

**Tag System:**
- Auto-suggestions based on meal content:
  - >30g protein → suggest "High Protein"
  - <30 min total → suggest "Quick"
  - <$3/serving → suggest "Budget-Friendly"
- Quick-add while viewing meal
- Tag management modal for bulk editing

**Files to modify:**
- Modify: `/dashboard/js/meal-library.js`
- Create: `/dashboard/js/components/tag-manager.js`
- Modify: `/dashboard/index.html` (library modal expansion)

---

### Phase 2: Core Data Entry & Display

#### Feature 4: Import Historical Staples Data

**Goal:** Import all historical sourdough, yogurt, breadcrumbs production data.

**Pre-check:**
- Verify Excel contains 2022-present data
- Prompt user if date range incomplete

**Flour Tracking (separate types):**
- King Arthur Bread Flour
- Bob's Red Mill Whole Wheat
- Wheat berries by variety (Scout 66, Turkey Red, etc.)
- Prompt for gram amounts when logging sourdough

**Yogurt Tracking:**
- Milk quantity
- Starter type (FAGE, previous batch)
- Starter quantity
- Incubation time
- Straining duration

**Files to modify:**
- Modify: `/dashboard/js/staples-tracker.js`
- Create: `/scripts/import-staples.js`

---

#### Feature 8: Units on All Nutrition Information

**Goal:** Display units on all nutrition values with consistent formatting.

**Format Specifications:**
- Values with full unit names: "25 grams", "450 micrograms"
- Column header: "% DV" for daily value percentages
- All nutrients displayed with appropriate units

**Files to modify:**
- Modify: `/dashboard/js/nutrition.js` (formatNutrient function)
- Modify: `/dashboard/css/styles.css` (nutrition modal styling)

---

#### Feature 9: Ingredients Button on Meal Cards

**Goal:** Slide-out panel showing ingredients with editing capability.

**Panel Behavior:**
- Slides from right side of screen
- Shows ingredients with toggle:
  - Default: "as-is" display ("2 packages chicken breast")
  - Toggle: converted to grams/ounces
- Cost breakdown (toggle on/off, default off)
- Cooking instructions (editable)

**Edit Mode:**
- Global toggle in sticky banner (inside "..." overflow menu)
- Auto-save with "Unsaved changes" indicator
- Prevents accidental edits when toggle is off

**Files to create/modify:**
- Create: `/dashboard/js/components/slide-panel.js`
- Create: `/dashboard/css/components/slide-panel.css`
- Modify: `/dashboard/js/app.js` (edit mode state)
- Modify: `/dashboard/index.html`

---

#### Feature 10: Up to 10 Fun Facts per Meal

**Goal:** Display health facts with ingredient associations and book citations.

**Display Logic:**
- 10 facts visible by default
- Up to 25 when "expand for more facts" clicked
- Weighted random selection (prioritize most relevant based on nutrition)
- Rotate randomly each view
- Hover/click to reveal which ingredients relate to each fact
- Show book source for each fact

**Category Organization (expanded view):**
- Filterable list with checkboxes
- Show/hide categories
- Organized by the 12 health categories

**Files to modify:**
- Modify: `/dashboard/js/nutrition.js` (getFunFacts function)
- Modify: `/dashboard/js/app.js` (nutrition modal rendering)

---

### Phase 3: Visual Enhancements & Charts

#### Feature 11: Expand Nutritional Completeness Visual

**Goal:** Enhanced radar chart with blood panel relevance and scoring.

**New Axes (blood panel relevant):**
- Triglycerides impact
- LDL/HDL ratio impact
- Blood glucose impact (glycemic load)
- Inflammation markers (CRP, homocysteine)
- Liver health (ALT, AST related nutrients)
- Iron/Ferritin levels
- Vitamin D
- B12

**Meal Selection:**
- Default: ALL active rotating meals
- De-select/re-select at will
- Remember selection in localStorage

**Additional Info:**
- Total calories
- Glycemic index/load
- Anti-inflammatory score
- Specific vitamin/mineral callouts
- Cost per serving

**Summary Score:**
- Calculated from weighted factors
- Click/hover reveals formula with actual values
- Editable weights via settings modal with sliders
- "Reset to defaults" button

**Default Score Weights (1=highest priority):**
1. Protein adequacy
2. Anti-inflammatory foods
3. Vitamin completeness
4. Blood sugar impact
5. Heart health markers
6. Fiber adequacy
7. Low sugar
8. Mineral completeness
9. Omega-3 levels
10. Low sodium

**Files to modify:**
- Modify: `/dashboard/js/charts.js`
- Create: `/dashboard/js/components/settings-modal.js`
- Modify: `/dashboard/css/styles.css`

---

#### Feature 12: Distinct Colors for Micronutrients & Completeness Charts

**Goal:** Visually distinct, cohesive color palette for all charts.

**Color Assignment:**
- By rotation position (1st meal = color1, etc.)
- User can override per meal
- Auto-reassign if color conflict

**Palette Options (propose 2-3):**
- Option A: Warm Harvest Extended (earth tones)
- Option B: Seasonal Palette (spring greens to winter blues)
- Option C: High Contrast (for maximum distinction)

**Consistency:**
- Same meal = same color across ALL charts
- Legend on each chart

**Files to modify:**
- Modify: `/dashboard/js/charts.js`
- Modify: `/dashboard/css/styles.css` (CSS variables for chart colors)

---

#### Feature 13: Populate "Spending by Trip" & "Store Breakdown"

**Goal:** Real cost data from Excel with budget tracking.

**Data Source:**
- Excel shopping data (primary)
- Actual prices when available
- Estimated/average with flag when not

**Budget vs Actual:**
- Weekly budget
- Per-meal budget
- Per-serving budget
- All views available
- Suggested from historical spending (manually adjustable)

**Date Filtering:**
- Presets: "This month", "Last 30 days", "This rotation", "Custom"
- Calendar date pickers
- Default: current rotation date range

**Files to modify:**
- Modify: `/dashboard/js/charts.js`
- Modify: `/dashboard/js/app.js`
- Create: `/dashboard/js/components/date-filter.js`

---

#### Feature 15: USDA 2025-2030 Guidelines Visualizations

**Goal:** Compare meals against latest USDA dietary guidelines.

**Implementation:**
1. Web search for latest 2025-2030 guidelines
2. Create comparison visualizations

**Views (in priority order):**
1. **Nutrient bar chart** (default) - Your intake vs recommended DV
2. **"My Plate" style** - Food groups mapping
3. **Food group servings** - Actual vs recommended
4. **Report card** (low priority) - Letter grades per category

**Section Placement:**
- New top-level section: "USDA Guidelines"
- After Analytics section

**Files to create:**
- Create: `/dashboard/js/components/usda-comparison.js`
- Modify: `/dashboard/index.html`
- Modify: `/dashboard/css/styles.css`

---

### Phase 4: UI/UX Improvements

#### Feature 19: Fix Top Navigation Buttons

**Goal:** Smooth scrolling navigation with sticky header.

**Behavior:**
- Click nav button → smooth scroll to section (500ms)
- Offset for sticky header height
- Spy scrolling effect (button highlights as you scroll past sections)

**Mobile:**
- Hamburger menu
- Same scroll behavior

**Files to modify:**
- Modify: `/dashboard/js/app.js` (navigation handling)
- Create: `/dashboard/js/components/navigation.js`
- Modify: `/dashboard/css/styles.css`

---

#### Feature 2: Drag-and-Drop Meal Reordering

**Goal:** Reorder meals via drag-and-drop on timeline and modal.

**Behavior:**
- Works on both rotation timeline and modal
- Tap-and-hold for touch devices
- Visual feedback: ghost element + highlighted drop zones
- Auto-save on drop
- "Reset to default" button (resets to session start order)
- Order persists in localStorage and Supabase

**Library:** Sortable.js

**Files to modify:**
- Create: `/dashboard/js/components/drag-drop.js`
- Modify: `/dashboard/js/app.js`
- Modify: `/dashboard/css/styles.css`

---

#### Feature 5: Calendar View for Meals & Shopping Trips

**Goal:** Month/week calendar showing meals, trips, and costs.

**Views:**
- Month view (default)
- Week view (toggle)
- Week starts on Sunday

**Calendar Content:**
- Meal cooked that day (icon + name)
- Shopping trip indicator (cart icon)
- Costs: meals on left (negative), shopping on right (positive)
- Icons + position + +/- signs with colors

**Planned vs Cooked:**
- Planned: dashed border, faded, "?" icon
- Cooked: solid fill, full color, "✓" checkmark

**Interactions:**
- Click meal to mark cooked (instant log with defaults)
- Click again to edit details retroactively
- Drag meals to reschedule
- Click date to select meal from dropdown
- Drag from sidebar to plan

**Staples:** Show production (sourdough, yogurt, breadcrumbs)

**Files to create:**
- Create: `/dashboard/js/components/calendar.js`
- Create: `/dashboard/css/components/calendar.css`
- Modify: `/dashboard/index.html`

---

#### Feature 14: Fix "Next Due" Date Dynamic Calculation

**Goal:** Intelligent next-due calculation based on history and rotation.

**Calculation:**
- Average of actual cooking intervals
- Factor in servings (servings ÷ servings_per_day = days)
- Factor in rotation position (consider other meals)
- Avoid scheduling too close together

**Default (no history):**
- Calculated from rotation size × servings factor
- Example: 6 meals, 2 servings/day, 6-serving meal = 3 days

**Settings:**
- Servings per day (default 2, for 2 adults)
- Editable in Settings modal (gear icon)

**Files to modify:**
- Modify: `/dashboard/js/app.js` (calculateNextMeal function)
- Modify: `/dashboard/js/meal-library.js`

---

### Phase 5: Export & Media Features

#### Feature 17: Export to Cookbook

**Goal:** Beautiful cookbook export in multiple formats.

**Formats:**
- PDF (via jsPDF + html2canvas)
- Markdown
- HTML (styled, printable)
- "Print to PDF" option for best quality

**Design Style:** Anthropic/Claude aesthetic
- Minimal, lots of whitespace
- Clean sans-serif typography
- Generous spacing
- Subtle colors

**Recipe Page Contents:**
- Photo (if uploaded)
- Ingredients
- Instructions
- Nutrition summary
- Fun facts
- Cost breakdown
- Season indicator (icon)

**Cover Page:**
- Title: "Some Best Household Meals"
- Subtitle: "Seasonal, Healthy, Tasty, Research-Informed Recipes"
- Author: "L. Best, E. Best, and the Littles"
- Summary stats (X recipes, X total servings)
- Table of contents
- Season legend (icons)

**Season Determination:**
- Based on primary seasonal ingredients
- Options: Spring, Summer, Fall, Winter, Year-round, transitions

**Files to create:**
- Create: `/dashboard/js/services/export-service.js`
- Create: `/dashboard/css/print/cookbook.css`
- Modify: `/dashboard/index.html`

---

#### Feature 18: Upload 1 Photo per Recipe

**Goal:** Photo upload with GitHub/Supabase storage.

**Display:**
- In cookbook export
- Thumbnail on meal card (hover to reveal)
- Hidden by default, shown on demand

**Storage:**
- Supabase Storage (free tier: 1GB)
- Organized: `/meals/{meal_code}_{meal_slug}.jpg`

**Upload Interface:**
- Drag-and-drop onto meal card
- "Upload photo" button in meal details modal

**Photo Handling:**
- Auto-compression to ~200KB max
- Replace old photo (no history)

**Files to create:**
- Create: `/dashboard/js/services/photo-service.js`
- Modify: `/dashboard/js/components/meal-cards.js`
- Modify: `/dashboard/css/styles.css`

---

### Phase 6: New Sections

#### Feature 20: Breakfast & Lunch Cards Section

**Goal:** Simple tracking for breakfast/lunch with full nutrition.

**Location:**
- Very bottom of dashboard
- Collapsible/hideable

**Structure:**
- Full meal structure but 1 serving each
- 1-4 options per meal type per week
- Separate from dinner rotation

**Initial Meals:**
- **Breakfast: "Avocado Eggs"**
  - ½ avocado, 1 vine tomato, 3 eggs, 1 tbsp olive oil, 1 tsp garlic, salt/pepper, ¼ cup feta
- **Lunch: "Yogurt & Toast Plate"**
  - 8 oz yogurt, 1 diced apple, cinnamon, 2 sourdough slices, ½ tomato, 1 mashed avocado cup, sesame seeds

**Tracking:**
- Simplified checkmark "ate this today"
- Which meal (if multiple options)
- Optional notes
- Marks date automatically

**Nutrition:**
- Calculated and displayed same as dinners
- Included in daily totals
- Graceful handling if not tracked (no warnings)

**Export:**
- In cookbook with own section
- Option to deselect from export

**Files to modify:**
- Modify: `/dashboard/index.html`
- Create: `/dashboard/js/components/simple-meals.js`
- Modify: `/dashboard/css/styles.css`

---

#### Feature 3: Avg Expected Cost for "What's Fresh Now"

**Goal:** Show Denver/Aurora prices for seasonal produce.

**Price Sources:**
1. Your actual shopping data (primary)
2. Instacart prices (fallback)
3. Google Shopping (fallback)

**Display:**
- Price per unit AND per pound
- Best price indicator ("Best: H-Mart")
- Price history since 2022 (in Price Analytics section)

**Refresh:**
- Weekly by default
- On-demand "refresh prices" button

**Files to modify:**
- Modify: `/dashboard/js/seasonal-data.js`
- Create: `/dashboard/js/services/price-lookup.js`
- Modify: `/dashboard/index.html`

---

### Phase 7: Polish & Infrastructure

#### Feature 1: Update Version Number

**Goal:** Automated version management with changelog.

**Version:** 2.0.0 (major overhaul)

**Auto-bump:**
- Semi-automatic per session
- Update CONFIG.version in code
- Update display in header and footer

**Changelog:**
- CHANGELOG.md in repo
- "What's New" modal in dashboard
- Grouped by version with expandable details
- Visual timeline style
- Auto-show once per new version, then via button

**Files to modify:**
- Modify: `/dashboard/js/config.js`
- Create: `/CHANGELOG.md`
- Create: `/dashboard/js/components/whats-new.js`

---

#### PWA & Offline Support

**Goal:** Full PWA with offline capability and cross-device sync.

**PWA Manifest:**
```json
{
  "name": "The Best Household Meal Plan",
  "short_name": "Best Foods",
  "start_url": "/dashboard/index.html",
  "display": "standalone",
  "background_color": "#FDF6E3",
  "theme_color": "#5D4037",
  "icons": [
    { "src": "images/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "images/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

**Icon Design:**
- Abstract/geometric, food-related
- Subtle hidden "B" (like FedEx arrow)
- Warm Harvest color palette

**Service Worker:**
- Cache static assets
- Cache API responses
- Offline fallback page

**Offline Sync:**
- IndexedDB for local data
- Sync queue for pending changes
- Auto-sync on reconnect
- Conflict resolution: last-write-wins

**Files to create:**
- Create: `/dashboard/manifest.json`
- Create: `/dashboard/sw.js`
- Create: `/dashboard/js/core/sync-manager.js`
- Create: `/dashboard/images/icons/` (icon files)

---

#### Data Backup & Export

**Goal:** User can export all data for backup.

**Export Button:**
- Downloads all localStorage + Supabase data
- Formats: JSON and Excel/CSV

**Location:** Settings modal

**Files to modify:**
- Create: `/dashboard/js/services/backup-service.js`
- Modify: Settings modal

---

#### Household Settings

**Goal:** Centralized settings management.

**Settings Modal (gear icon in overflow menu):**
- Number of adults
- Servings per day
- Dietary restrictions
- Preferred stores
- Budget targets (weekly, per-meal, per-serving)
- Score weights (sliders)
- Theme selection (future)

**Files to create:**
- Create: `/dashboard/js/components/settings-modal.js`
- Modify: `/dashboard/index.html`

---

## UI/UX Specifications

### Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  STICKY HEADER                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ The Best Household Meal Plan    [Dashboard] [Meals]     │   │
│  │                                 [Shopping] [Analytics]   │   │
│  │                                 [USDA] [Prices] [···]   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Overflow Menu (···):                                          │
│  ┌──────────────────┐                                          │
│  │ ○ Edit Mode      │ ← Toggle                                 │
│  │ ⚙ Settings       │                                          │
│  │ ↓ Export Data    │                                          │
│  │ ? What's New     │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Responsive Behavior

```
DESKTOP (>1024px)          TABLET (768-1024px)       MOBILE (<768px)
┌────────────────────┐     ┌──────────────────┐     ┌──────────────┐
│ [Nav] [Nav] [Nav]  │     │ [Nav] [Nav] [··]│     │ [≡] Title    │
│                    │     │                  │     │              │
│ ┌────┐ ┌────┐     │     │ ┌────┐ ┌────┐   │     │ ┌──────────┐ │
│ │Card│ │Card│     │     │ │Card│ │Card│   │     │ │   Card   │ │
│ └────┘ └────┘     │     │ └────┘ └────┘   │     │ └──────────┘ │
│ ┌────┐ ┌────┐     │     │ ┌────┐ ┌────┐   │     │ ┌──────────┐ │
│ │Card│ │Card│     │     │ │Card│ │Card│   │     │ │   Card   │ │
│ └────┘ └────┘     │     │ └────┘ └────┘   │     │ └──────────┘ │
└────────────────────┘     └──────────────────┘     └──────────────┘
  3-column grid              2-column grid           1-column stack
```

### Color Palette: Warm Harvest

```css
:root {
  /* Primary */
  --color-cream: #FDF6E3;
  --color-brown: #5D4037;
  --color-terracotta: #C2703C;
  --color-sage: #7C9473;

  /* Chart Colors (10 distinct) */
  --chart-1: #C2703C;  /* Terracotta */
  --chart-2: #5D4037;  /* Brown */
  --chart-3: #7C9473;  /* Sage */
  --chart-4: #D4A574;  /* Gold */
  --chart-5: #B7472A;  /* Rust */
  --chart-6: #708238;  /* Olive */
  --chart-7: #8B6914;  /* Ochre */
  --chart-8: #6B8E23;  /* Olive Drab */
  --chart-9: #CD853F;  /* Peru */
  --chart-10: #A0522D; /* Sienna */
}
```

---

## Testing Strategy

### Manual Testing Checklist

#### Phase 1 Testing
- [ ] Supabase connection works
- [ ] Ingredients load from database
- [ ] Health benefits display correctly
- [ ] Cost calculations are accurate
- [ ] Meal archive/restore works
- [ ] Tags can be created and assigned
- [ ] Search finds meals by ingredients

#### Phase 2 Testing
- [ ] Historical staples data imports correctly
- [ ] Nutrition units display properly
- [ ] Slide panel opens/closes smoothly
- [ ] Ingredient display toggles work
- [ ] Edit mode prevents accidental edits
- [ ] Fun facts rotate and display sources

#### Phase 3 Testing
- [ ] All chart visualizations render
- [ ] Color palette is distinct
- [ ] Radar chart shows all selected meals
- [ ] Score calculation is correct
- [ ] Budget vs actual displays properly
- [ ] USDA comparisons are accurate

#### Phase 4 Testing
- [ ] Smooth scroll works on all sections
- [ ] Spy scrolling highlights correct nav
- [ ] Drag-and-drop works on desktop
- [ ] Drag-and-drop works on mobile (tap-hold)
- [ ] Calendar displays correctly
- [ ] Calendar interactions work
- [ ] Next due dates calculate properly

#### Phase 5 Testing
- [ ] PDF export generates correctly
- [ ] Markdown export is valid
- [ ] HTML export prints well
- [ ] Photo upload works
- [ ] Photos display on cards (hover)
- [ ] Photos appear in export

#### Phase 6 Testing
- [ ] Breakfast/lunch cards display
- [ ] Simple tracking checkmark works
- [ ] Prices show in "What's Fresh Now"
- [ ] Price refresh button works

#### Phase 7 Testing
- [ ] PWA installs on iPhone
- [ ] PWA icon displays correctly
- [ ] Offline mode works
- [ ] Sync resumes when online
- [ ] Cross-device sync works
- [ ] Data export downloads correctly
- [ ] "What's New" modal appears

### Cross-Device Testing
- [ ] iPhone Safari
- [ ] iPhone PWA (home screen)
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox

---

## Documentation Plan

### Documentation Structure

```
docs/
├── README.md                 # Index + quick links
├── ARCHITECTURE.md           # System overview + diagrams
├── DATA_MODELS.md            # Database schema + relationships
├── API_REFERENCE.md          # All functions + parameters
├── USER_GUIDE.md             # How to use the dashboard
├── SETUP_GUIDE.md            # Setup for forks
├── CUSTOMIZATION.md          # How to customize
└── diagrams/                 # Visual diagrams
```

### Documentation Requirements (per 25i)

Every file must include:
1. **Purpose statement** - What this file does
2. **Dependencies** - What it imports/requires
3. **Exports** - What it provides to other files
4. **Function documentation** - JSDoc for every function
5. **Data flow** - How data moves through

### In-Code Documentation

```javascript
/**
 * @file meals-service.js
 * @description Handles all meal CRUD operations with Supabase backend
 * @requires ./core/supabase-client.js
 * @requires ./core/sync-manager.js
 *
 * DATA FLOW:
 * User Action → Local Save → Sync Queue → Supabase → Real-time Broadcast
 */

/**
 * Creates a new meal in the system
 * @param {Object} mealData - The meal data
 * @param {string} mealData.name - Meal name (required)
 * @param {number} mealData.servings - Number of servings (default: 6)
 * @param {Array<Object>} mealData.ingredients - Ingredient list
 * @returns {Promise<Object>} The created meal with generated ID
 * @throws {Error} If meal name is empty or duplicate
 *
 * @example
 * const meal = await createMeal({
 *   name: 'Kale Chicken Pasta',
 *   servings: 6,
 *   ingredients: [{ name: 'kale', grams: 150 }]
 * });
 */
async function createMeal(mealData) {
  // Implementation
}
```

---

## Verification Checklist

### Pre-Implementation
- [ ] Supabase project created
- [ ] Supabase tables created (run schema SQL)
- [ ] Environment variables set up
- [ ] Excel data verified (2022-present)

### Post-Implementation (Each Phase)
- [ ] All features working
- [ ] Mobile responsive
- [ ] Offline sync working
- [ ] No console errors
- [ ] Documentation updated
- [ ] Code committed and pushed
- [ ] CHANGELOG updated

### Final Verification
- [ ] Full end-to-end test on iPhone PWA
- [ ] Full end-to-end test on desktop
- [ ] Cross-device sync verified
- [ ] Export/backup verified
- [ ] All documentation complete
- [ ] GitHub repo clean and organized
- [ ] README updated with final state

---

## Session Management Notes

### For Claude (per 25h)
- Monitor session usage throughout implementation
- At ~20% remaining capacity, pause and:
  1. Update CLAUDE_SESSION_CONTEXT.md
  2. Update README.md
  3. Commit all changes to GitHub
  4. Document current progress and next steps
  5. Ensure code is in working state

### Between Sessions
- Always read CLAUDE_SESSION_CONTEXT.md first
- Check CHANGELOG.md for recent changes
- Review any TODOs in code comments
- Continue from documented stopping point

---

## Critical Files to Modify

### Phase 1
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/data/ingredients.json` | CREATE | Ingredient database |
| `/dashboard/js/data/health-benefits.js` | CREATE | Health facts |
| `/dashboard/js/core/supabase-client.js` | CREATE | Supabase connection |
| `/dashboard/js/core/sync-manager.js` | CREATE | Offline sync |
| `/dashboard/js/services/price-service.js` | CREATE | Price tracking |
| `/dashboard/js/meal-library.js` | MODIFY | Archive system |
| `/dashboard/js/nutrition.js` | MODIFY | Enhanced nutrition |

### Phase 2
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/js/components/slide-panel.js` | CREATE | Ingredients panel |
| `/dashboard/js/staples-tracker.js` | MODIFY | Enhanced tracking |
| `/dashboard/css/components/slide-panel.css` | CREATE | Panel styles |

### Phase 3
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/js/charts.js` | MODIFY | Enhanced charts |
| `/dashboard/js/components/usda-comparison.js` | CREATE | USDA views |
| `/dashboard/js/components/settings-modal.js` | CREATE | Settings UI |

### Phase 4
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/js/components/navigation.js` | CREATE | Nav handling |
| `/dashboard/js/components/drag-drop.js` | CREATE | Drag-and-drop |
| `/dashboard/js/components/calendar.js` | CREATE | Calendar view |
| `/dashboard/css/components/calendar.css` | CREATE | Calendar styles |

### Phase 5
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/js/services/export-service.js` | CREATE | Cookbook export |
| `/dashboard/js/services/photo-service.js` | CREATE | Photo upload |
| `/dashboard/css/print/cookbook.css` | CREATE | Print styles |

### Phase 6
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/js/components/simple-meals.js` | CREATE | Breakfast/lunch |
| `/dashboard/js/services/price-lookup.js` | CREATE | Web price lookup |

### Phase 7
| File | Action | Purpose |
|------|--------|---------|
| `/dashboard/manifest.json` | CREATE | PWA manifest |
| `/dashboard/sw.js` | CREATE | Service worker |
| `/dashboard/images/icons/*` | CREATE | PWA icons |
| `/CHANGELOG.md` | CREATE | Version history |
| `/docs/*` | CREATE | Documentation |

---

## Appendix: User Preferences Summary

### Household
- 2 adults, 2 babies
- Servings per day: 2
- Location: Aurora, CO 80247

### Dietary Restrictions
- No onions (including shallots, scallions)
- No mushrooms
- No broccoli
- No cow milk (cream, etc.)

### Preferred Stores
- Costco (primary)
- H-Mart (primary)
- Safeway (primary)
- Sprouts (occasional)
- Walmart (occasional)
- Grains from the Plains (specialty flour)

### UI Preferences
- Mobile-first (critical)
- Data-driven visualizations
- Clean, minimal, modern
- No time for complicated interfaces
- Graceful handling of gaps in logging

---

*End of Implementation Plan*
