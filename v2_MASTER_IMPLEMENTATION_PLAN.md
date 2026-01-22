# The Best Household Meal Plan - MASTER Implementation Plan v2.0.0

> **Version:** 2.0.0 | **Last Updated:** January 22, 2026
> **Author:** Claude Opus 4.5 + L. Best
> **Status:** In Progress (Feature 7 - Ingredient Database)

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Executive Summary](#executive-summary) | Project vision, deliverables, identity |
| [User Requirements (25a-25i)](#user-requirements-25a-25i) | Critical requirements from planning sessions |
| [Architecture](#architecture-overview) | System diagrams, data flow, offline sync |
| [Technology Stack](#technology-stack) | Frontend, backend, APIs |
| [Database Schema](#database-schema) | Full Supabase PostgreSQL schema |
| [7 Implementation Phases](#implementation-phases) | All 20 features organized by phase |
| [Feature Specifications](#feature-specifications) | Detailed specs for each feature |
| [UI/UX Specifications](#uiux-specifications) | Navigation, mobile, color palette |
| [Documentation Requirements](#documentation-requirements) | In-code docs, architecture docs, user guides |
| [Testing Checklist](#testing-checklist) | Manual testing for each phase |
| [Planning Session Q&A](#planning-session-qa-summary) | All clarifying questions and answers |
| [Progress Tracking](#progress-tracking) | Current status and next steps |

---

## Executive Summary

### Project Vision
Transform the existing meal planning dashboard into a beautiful, modern, data-driven household food management system that:
- Syncs seamlessly across phone and desktop (Supabase real-time)
- Provides comprehensive nutrition and health insights (12 categories)
- Tracks costs and budgets with real shopping data
- Exports beautiful cookbooks (Anthropic/Claude aesthetic)
- Works offline with automatic sync
- Is shareable/forkable for others to use

### Key Deliverables
- 20 new features across 7 implementation phases
- Supabase backend for cross-device sync
- PWA with offline support
- Comprehensive documentation (in-code, architecture, user guides)
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
| Icon Style | Abstract/geometric, food-related, subtle hidden "B" (like FedEx arrow) |

---

## User Requirements (25a-25i)

These critical requirements were provided during the planning session and MUST be followed throughout implementation:

### 25a. Graceful Missing Data
> "Sometimes we eat out; on those days, I just won't log anything. No need to panic if many days in a given month have no logging."

**Implementation:** System should not show warnings or errors for missing log entries. Calendar and analytics should gracefully handle gaps.

### 25b. User Context
> "I am a mom of two babies and don't have time for nonsense or complicated things, but I am very motivated by data and data visualizations."

**Implementation:** Keep UI simple and fast. Prioritize data visualizations. Minimize clicks/taps to complete actions.

### 25c. Tool Purpose
> "I am creating this tool to help myself with grocery/budget planning for feeding my household. And I want it to be beautiful, modern, seamless, and very easy to use from today onwards."

**Implementation:** Focus on grocery/budget planning features. Maintain modern, clean aesthetic throughout.

### 25d. Shareability
> "I want this to be built in such a way that I could potentially sell or give a copy of it to someone (maybe forking the GitHub repo?) so that they can use it themselves."

**Implementation:**
- Clear setup documentation for forks
- Customizable config for: dashboard title, stores, dietary restrictions
- Users set up their own Supabase account

### 25e. PWA Icon
> "I'd like to save this as a little quick link on my iPhone home page. I would like there to be a little graphic or image displayed."

**Implementation:**
- Create `manifest.json` with PWA configuration
- Design icon: abstract/geometric, food-related, subtle hidden "B", Warm Harvest colors
- Icon sizes: 192x192, 512x512 for iOS/Android

### 25f. Cross-Device Sync
> "However I left the dashboard, whether on my phone or on the desktop, when I open it, whether on the phone or desktop, it looks exactly the same, with the same configurations and data."

**Implementation:**
- Supabase real-time subscriptions for live sync
- All state persisted to database
- UI state (collapsed sections, selected filters) in localStorage synced via Supabase

### 25g. Data Persistence
> "Anytime I add information in the dashboard I want to make sure that it gets saved forever and is not just cached in some local place where I'll lose it. If I add things and I'm not connected to the internet, then I want to make sure that there's some mechanism that checks to see if there's something I did when I was offline such that once I'm back online then it uploads it."

**Implementation:**
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
└─────────────────────────────────────────────────────────────────┘
```

### 25h. Session Management
> "I want to make sure that the implementation plan also instructs Claude to periodically check the usage of my current session. It wraps up implementation work with enough spare usage to make sure that documentation, readme, code notes etc and final notes are added to the session notes, and that everything gets pushed to GitHub."

**Implementation:**
- At ~20% remaining session capacity, pause implementation
- Update: CLAUDE_SESSION_CONTEXT.md, README.md, code comments
- Commit all changes to GitHub
- Document current progress and next steps

### 25i. Documentation Requirements
> "I want this to be designed such that if I want to make future changes, I don't need access to Claude Code to figure out what the code is doing and how it works. Therefore, I want complex, detailed, extremely CLEAR documentation about how this whole dashboard's code and design works."

**Implementation:**
- **In-code:** JSDoc for every function with parameters, returns, examples
- **Architecture:** `/docs/ARCHITECTURE.md` with diagrams
- **Data flow:** `/docs/DATA_MODELS.md` with relationships
- **API reference:** `/docs/API_REFERENCE.md` for all functions
- **User guide:** `/docs/USER_GUIDE.md` for end users
- **Setup guide:** `/docs/SETUP_GUIDE.md` for forks
- **GitHub Wiki:** Mirror of /docs with navigation

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

### External APIs
| API | Purpose | Cost |
|-----|---------|------|
| USDA FoodData Central | Nutrition data | Free |
| Instacart/Google | Price lookups | Free |

---

## Database Schema

Full PostgreSQL schema for Supabase:

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
    prep_time INTEGER,
    cook_time INTEGER,
    instructions TEXT,
    sides TEXT[],
    season VARCHAR(50),
    is_archived BOOLEAN DEFAULT FALSE,
    is_favorite BOOLEAN DEFAULT FALSE,
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
    display_quantity VARCHAR(100),
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredients Master Database
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100),
    typical_quantity VARCHAR(100),
    grams_per_typical DECIMAL(10,2),

    -- Nutrition per 100g
    calories DECIMAL(10,2),
    protein DECIMAL(10,2),
    carbs DECIMAL(10,2),
    fat DECIMAL(10,2),
    fiber DECIMAL(10,2),

    -- Health benefits
    health_benefits JSONB,
    book_citations JSONB,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cooking Log (all-time history)
CREATE TABLE cooking_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meal_id UUID REFERENCES meals(id),
    meal_code VARCHAR(10),
    meal_name VARCHAR(255),
    date_cooked DATE NOT NULL,
    servings_made INTEGER,
    notes TEXT,
    cost_at_time DECIMAL(10,2),
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Shopping Trips
CREATE TABLE shopping_trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    total_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Shopping Items
CREATE TABLE shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES shopping_trips(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES ingredients(id),
    item_name VARCHAR(255) NOT NULL,
    store VARCHAR(100),
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    price DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staples Log (sourdough, yogurt, breadcrumbs)
CREATE TABLE staples_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type VARCHAR(50) NOT NULL,
    date_made DATE NOT NULL,
    quantity DECIMAL(10,2),
    unit VARCHAR(50),
    notes TEXT,
    ingredients_used JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- User Settings
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    household_name VARCHAR(255),
    num_adults INTEGER DEFAULT 2,
    servings_per_day INTEGER DEFAULT 2,
    dietary_restrictions TEXT[],
    preferred_stores TEXT[],
    weekly_budget DECIMAL(10,2),
    score_weights JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
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
│  - Supabase setup             ← IN PROGRESS                                  │
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

### Implementation Order

| Order | Feature # | Name | Phase | Status |
|-------|-----------|------|-------|--------|
| 1 | 7 | Comprehensive Ingredient & Health Database | 1 | IN PROGRESS |
| 2 | 6 | Robust Cost/Nutrition Framework | 1 | Pending |
| 3 | 16 | Meal Archive/Stack System | 1 | Partial |
| 4 | 4 | Import Historical Staples Data | 2 | Pending |
| 5 | 8 | Units on All Nutrition Information | 2 | Pending |
| 6 | 9 | Ingredients Button on Meal Cards | 2 | Pending |
| 7 | 10 | Up to 10 Fun Facts per Meal | 2 | Pending |
| 8 | 11 | Expand Nutritional Completeness Visual | 3 | Pending |
| 9 | 12 | Distinct Colors for Charts | 3 | Pending |
| 10 | 13 | Populate Cost Charts | 3 | DONE |
| 11 | 15 | USDA 2025-2030 Guidelines Visualizations | 3 | Pending |
| 12 | 19 | Fix Top Navigation Buttons | 4 | Pending |
| 13 | 2 | Drag-and-Drop Meal Reordering | 4 | Pending |
| 14 | 5 | Calendar View for Meals & Shopping | 4 | Pending |
| 15 | 14 | Fix "Next Due" Date Calculation | 4 | Pending |
| 16 | 17 | Export to Cookbook | 5 | Pending |
| 17 | 18 | Upload 1 Photo per Recipe | 5 | Pending |
| 18 | 20 | Breakfast & Lunch Cards Section | 6 | Pending |
| 19 | 3 | Avg Expected Cost for "What's Fresh Now" | 6 | Pending |
| 20 | 1 | Update Version Number | 7 | Pending |

### Feature Dependency Graph

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
    └───────────┬────┤       │              │
                │    └───────┤              │
                ▼            ▼              ▼
               11 ◄─────────────────────── 17
            (Radar)                    (Cookbook)
                                           │
               15                          18
         (USDA Guidelines)             (Photos)
```

---

## Feature Specifications

### Feature 7: Comprehensive Ingredient & Health Benefit Database

**Goal:** Create a robust database of all whole food ingredients with nutrition data and health benefits from three key books.

**Data Sources:**
- USDA FoodData Central (nutrition values)
- "Eat to Beat Disease" by William Li (health benefits)
- "The Obesity Code" by Jason Fung (metabolic insights)
- "How Not to Die" by Gene Stone & Michael Greger (disease prevention)

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

**Visualizations (all three, toggleable, radar chart default):**
- Radar chart (default view)
- Horizontal progress bars
- Circular gauge dials

**Files to create/modify:**
- Create: `/dashboard/data/ingredients-database.json`
- Modify: `/dashboard/js/nutrition.js`

---

### Feature 6: Robust Ingredients/Cost/Nutrition Framework

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

---

### Feature 9: Ingredients Button on Meal Cards

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

---

[Additional feature specifications continue in the detailed plan files in /docs]

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

## Documentation Requirements

Per requirement 25i, comprehensive documentation is MANDATORY.

### In-Code Documentation

Every file must include:
1. **Purpose statement** - What this file does
2. **Dependencies** - What it imports/requires
3. **Exports** - What it provides to other files
4. **Function documentation** - JSDoc for every function
5. **Data flow** - How data moves through

Example:
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

---

## Testing Checklist

### Phase 1 Testing
- [ ] Supabase connection works
- [ ] Ingredients load from database
- [ ] Health benefits display correctly
- [ ] Cost calculations are accurate
- [ ] Meal archive/restore works
- [ ] Tags can be created and assigned

### Phase 2 Testing
- [ ] Historical staples data imports correctly
- [ ] Nutrition units display properly
- [ ] Slide panel opens/closes smoothly
- [ ] Edit mode prevents accidental edits
- [ ] Fun facts rotate and display sources

### Phase 3 Testing
- [ ] All chart visualizations render
- [ ] Color palette is distinct
- [ ] Radar chart shows all selected meals
- [ ] USDA comparisons are accurate

### Phase 4 Testing
- [ ] Smooth scroll works on all sections
- [ ] Drag-and-drop works on desktop and mobile
- [ ] Calendar displays correctly
- [ ] Next due dates calculate properly

### Cross-Device Testing
- [ ] iPhone Safari
- [ ] iPhone PWA (home screen)
- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] Desktop Firefox

---

## Planning Session Q&A Summary

### Total Questions Asked: 160+

The planning session included:
- 72 initial clarifying questions (Features 1-20)
- 63 follow-up questions (implementation details)
- 25 final clarifying questions (UI/UX specifics)
- Additional micro-clarifications

### Key Decisions Made

| Topic | Decision |
|-------|----------|
| Backend | Supabase (PostgreSQL) for SQL query access |
| Offline sync | IndexedDB + sync queue + Supabase |
| Photo storage | Supabase Storage (1GB free) |
| Cost tracking | Auto-update to latest price, not average |
| Edit mode | Global toggle in overflow menu |
| Calendar | Month + week views, Sunday start |
| Export formats | PDF, Markdown, HTML |
| Score weights | Protein > Anti-inflammatory > Vitamins > Blood sugar > Heart > Fiber > Low sugar > Minerals > Omega-3 > Low sodium |

### User Preferences Summary

| Preference | Value |
|------------|-------|
| Household | 2 adults, 2 babies |
| Servings/day | 2 |
| Location | Aurora, CO 80247 |
| Dietary restrictions | No onions, mushrooms, broccoli, cow milk |
| Preferred stores | Costco, H-Mart, Safeway |
| Mobile importance | Critical |

---

## Progress Tracking

### Current Status (Jan 22, 2026)

**Completed:**
- MVP dashboard functional
- Module loading (state-manager, event-bus, price-service)
- Excel data parsing
- Basic analytics charts
- Tag system UI

**In Progress:**
- Feature 7: Comprehensive Ingredient Database

**Next Steps:**
1. Create `/dashboard/data/ingredients-database.json` with health benefits structure
2. Expand from 40 to 500+ ingredients
3. Implement health benefit visualization (radar chart)

### Files Reference

| File | Purpose |
|------|---------|
| `CLAUDE_SESSION_CONTEXT.md` | Session context for resuming work |
| `v2_MASTER_IMPLEMENTATION_PLAN.md` | This comprehensive plan |
| `docs/v2_comprehensive_plan.md` | Detailed feature specifications |
| `docs/v2_progress_tracker.md` | Progress tracking version |
| `docs/planning_session_extracted.md` | Full Q&A from planning sessions |

---

## Running the Dashboard

```bash
# Start local server from project ROOT
cd /Users/ljwubest/Documents/GroceryList && python3 -m http.server 8000

# Open in browser
open http://localhost:8000/dashboard/
```

---

*End of Master Implementation Plan*
*Last updated: January 22, 2026*
