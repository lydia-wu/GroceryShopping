/**
 * @file health-benefits.js
 * @description Health benefits database with 12 categories and ingredient-specific facts
 * Based on research from:
 * - "Eat to Beat Disease" by William Li
 * - "The Obesity Code" by Jason Fung
 * - "How Not to Die" by Gene Stone & Michael Greger
 *
 * EXPORTS:
 * - healthCategories: Object with 12 health category definitions
 * - healthBenefits: Object mapping ingredients to their health benefits
 * - getDiverseFactsForMeal(ingredients, count): Get diverse facts for a meal
 * - getExpandedFactsForMeal(ingredients): Get facts organized by category
 * - getFactsForCategory(ingredients, categoryId): Get facts for a specific category
 *
 * FEATURE: Feature 10 - Up to 10 Fun Facts per Meal (expandable to 25)
 */

// =========================================================
// Health Categories (12 total)
// =========================================================

export const healthCategories = {
    heart: {
        id: 'heart',
        name: 'Heart Health',
        icon: '❤️',
        color: '#e74c3c',
        description: 'Supports cardiovascular health, blood pressure, and circulation'
    },
    brain: {
        id: 'brain',
        name: 'Brain Health',
        icon: '🧠',
        color: '#9b59b6',
        description: 'Supports cognitive function, memory, and neuroprotection'
    },
    cancer: {
        id: 'cancer',
        name: 'Cancer Prevention',
        icon: '🎗️',
        color: '#e91e63',
        description: 'Contains compounds that may help prevent cancer growth (angiogenesis)'
    },
    gut: {
        id: 'gut',
        name: 'Gut Health',
        icon: '🦠',
        color: '#27ae60',
        description: 'Supports microbiome diversity and digestive health'
    },
    muscle: {
        id: 'muscle',
        name: 'Muscle & Recovery',
        icon: '💪',
        color: '#3498db',
        description: 'Supports muscle growth, repair, and recovery'
    },
    dna: {
        id: 'dna',
        name: 'DNA Protection',
        icon: '🧬',
        color: '#1abc9c',
        description: 'Protects DNA from damage and supports cellular health'
    },
    immunity: {
        id: 'immunity',
        name: 'Immunity',
        icon: '🛡️',
        color: '#f39c12',
        description: 'Strengthens immune function and disease resistance'
    },
    regeneration: {
        id: 'regeneration',
        name: 'Stem Cell Regeneration',
        icon: '🔄',
        color: '#00bcd4',
        description: 'Supports stem cell activity and tissue regeneration'
    },
    metabolism: {
        id: 'metabolism',
        name: 'Metabolism & Blood Sugar',
        icon: '🔥',
        color: '#ff5722',
        description: 'Supports healthy metabolism and blood sugar regulation'
    },
    bone: {
        id: 'bone',
        name: 'Bone Health',
        icon: '🦴',
        color: '#795548',
        description: 'Supports bone density, strength, and calcium absorption'
    },
    eye: {
        id: 'eye',
        name: 'Eye Health',
        icon: '👁️',
        color: '#607d8b',
        description: 'Protects vision and supports eye health'
    },
    skin: {
        id: 'skin',
        name: 'Skin Health',
        icon: '✨',
        color: '#ffb74d',
        description: 'Supports skin elasticity, hydration, and protection'
    }
};

// =========================================================
// Health Benefits by Ingredient
// =========================================================

export const healthBenefits = {
    // PROTEINS
    salmon: {
        categories: ['heart', 'brain', 'immunity', 'skin', 'eye'],
        facts: [
            {
                text: 'Wild salmon contains astaxanthin, a powerful antioxidant that protects brain cells from oxidative stress',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['salmon', 'trout', 'shrimp']
            },
            {
                text: 'Omega-3 fatty acids in salmon reduce inflammation and lower risk of heart disease by up to 35%',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['salmon', 'mackerel', 'sardines']
            },
            {
                text: 'Salmon provides vitamin D which supports immune cell function and may reduce infection risk',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 8',
                relatedIngredients: ['salmon', 'eggs', 'fortified foods']
            },
            {
                text: 'The omega-3s in salmon help maintain skin moisture and may reduce UV damage',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['salmon', 'sardines', 'walnuts']
            }
        ]
    },
    mackerel: {
        categories: ['heart', 'brain', 'bone'],
        facts: [
            {
                text: 'Mackerel is one of the richest sources of omega-3s, with more EPA/DHA than most other fish',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['mackerel', 'salmon', 'sardines']
            },
            {
                text: 'Canned mackerel with bones provides significant calcium for bone health',
                category: 'bone',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 10',
                relatedIngredients: ['mackerel', 'sardines', 'canned fish']
            },
            {
                text: 'The DHA in mackerel supports memory and cognitive function in aging adults',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['mackerel', 'salmon', 'herring']
            }
        ]
    },
    chicken: {
        categories: ['muscle', 'immunity', 'metabolism'],
        facts: [
            {
                text: 'Chicken provides complete protein with all essential amino acids for muscle repair',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 12',
                relatedIngredients: ['chicken', 'turkey', 'eggs']
            },
            {
                text: 'Chicken contains zinc and selenium which support immune cell production',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['chicken', 'turkey', 'beef']
            },
            {
                text: 'The B vitamins in chicken help convert food to energy and support metabolism',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 14',
                relatedIngredients: ['chicken', 'turkey', 'pork']
            }
        ]
    },
    eggs: {
        categories: ['brain', 'eye', 'muscle', 'dna'],
        facts: [
            {
                text: 'Egg yolks contain choline, essential for brain development and neurotransmitter synthesis',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['eggs', 'liver', 'soybeans']
            },
            {
                text: 'Eggs contain lutein and zeaxanthin that accumulate in the retina and protect against macular degeneration',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13',
                relatedIngredients: ['eggs', 'kale', 'spinach']
            },
            {
                text: 'One egg provides 6g of complete protein with high bioavailability for muscle synthesis',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 12',
                relatedIngredients: ['eggs', 'chicken', 'fish']
            },
            {
                text: 'Eggs provide B12 and folate which support DNA synthesis and cell division',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 15',
                relatedIngredients: ['eggs', 'leafy greens', 'legumes']
            }
        ]
    },
    beef: {
        categories: ['muscle', 'brain', 'immunity'],
        facts: [
            {
                text: 'Beef provides heme iron which is more easily absorbed than plant iron, preventing anemia',
                category: 'immunity',
                source: 'The Obesity Code',
                chapter: 'Chapter 12',
                relatedIngredients: ['beef', 'lamb', 'liver']
            },
            {
                text: 'Grass-fed beef contains CLA (conjugated linoleic acid) which may support healthy body composition',
                category: 'muscle',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7',
                relatedIngredients: ['beef', 'lamb', 'dairy']
            },
            {
                text: 'Beef is rich in B12, essential for nerve function and preventing cognitive decline',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3',
                relatedIngredients: ['beef', 'fish', 'eggs']
            }
        ]
    },
    shrimp: {
        categories: ['heart', 'brain', 'immunity'],
        facts: [
            {
                text: 'Shrimp contains astaxanthin, a carotenoid that gives it color and provides powerful antioxidant protection',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['shrimp', 'salmon', 'crab']
            },
            {
                text: 'Shrimp provides selenium, a mineral that supports thyroid function and immune response',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['shrimp', 'fish', 'brazil nuts']
            }
        ]
    },

    // VEGETABLES
    kale: {
        categories: ['cancer', 'eye', 'bone', 'heart', 'brain'],
        facts: [
            {
                text: 'Kale contains sulforaphane which activates detoxification enzymes and may help prevent cancer',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['kale', 'broccoli', 'cabbage', 'brussels sprouts']
            },
            {
                text: 'One cup of kale provides over 100% of daily vitamin K needs for healthy blood clotting and bone metabolism',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['kale', 'spinach', 'collard greens']
            },
            {
                text: 'Kale has more lutein per serving than any other vegetable, protecting eyes from blue light damage',
                category: 'eye',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['kale', 'spinach', 'eggs']
            },
            {
                text: 'The nitrates in kale help blood vessels relax, lowering blood pressure naturally',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['kale', 'beets', 'arugula']
            }
        ]
    },
    spinach: {
        categories: ['muscle', 'eye', 'brain', 'heart'],
        facts: [
            {
                text: 'Spinach contains nitrates that improve muscle efficiency and exercise performance',
                category: 'muscle',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7',
                relatedIngredients: ['spinach', 'beets', 'arugula']
            },
            {
                text: 'Spinach is rich in lutein which crosses the blood-brain barrier to protect neurons',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['spinach', 'kale', 'eggs']
            },
            {
                text: 'The folate in spinach helps lower homocysteine levels, reducing heart disease risk',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['spinach', 'lentils', 'asparagus']
            }
        ]
    },
    tomatoes: {
        categories: ['cancer', 'heart', 'skin'],
        facts: [
            {
                text: 'Cooked tomatoes have 4x more bioavailable lycopene than raw, which may reduce prostate cancer risk',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['tomatoes', 'watermelon', 'pink grapefruit']
            },
            {
                text: 'Lycopene in tomatoes helps protect LDL cholesterol from oxidation, a key step in heart disease',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['tomatoes', 'tomato paste', 'watermelon']
            },
            {
                text: 'Tomato lycopene accumulates in skin and provides internal sun protection',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['tomatoes', 'carrots', 'sweet potato']
            }
        ]
    },
    garlic: {
        categories: ['heart', 'immunity', 'cancer', 'gut'],
        facts: [
            {
                text: 'Garlic contains allicin which helps relax blood vessels and may lower blood pressure by 10%',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['garlic', 'onions', 'leeks']
            },
            {
                text: 'Garlic has antimicrobial properties that support the immune system against infections',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 8',
                relatedIngredients: ['garlic', 'ginger', 'turmeric']
            },
            {
                text: 'Compounds in garlic may help starve cancer cells by blocking new blood vessel formation',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['garlic', 'onions', 'cruciferous vegetables']
            },
            {
                text: 'Garlic acts as a prebiotic, feeding beneficial gut bacteria and supporting microbiome health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['garlic', 'onions', 'asparagus']
            }
        ]
    },
    carrots: {
        categories: ['eye', 'skin', 'immunity', 'cancer'],
        facts: [
            {
                text: 'Beta-carotene in carrots converts to vitamin A, essential for night vision and eye health',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13',
                relatedIngredients: ['carrots', 'sweet potato', 'butternut squash']
            },
            {
                text: 'Carotenoids from carrots accumulate in skin, providing a natural healthy glow and UV protection',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['carrots', 'tomatoes', 'pumpkin']
            },
            {
                text: 'Carrots provide vitamin A which is critical for immune cell development and function',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['carrots', 'sweet potato', 'leafy greens']
            }
        ]
    },
    bell_pepper: {
        categories: ['immunity', 'skin', 'eye'],
        facts: [
            {
                text: 'Red bell peppers contain more vitamin C than oranges, boosting immune function',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['bell pepper', 'citrus', 'strawberries']
            },
            {
                text: 'Vitamin C in peppers is essential for collagen synthesis, keeping skin firm and youthful',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['bell pepper', 'citrus', 'berries']
            }
        ]
    },
    sweet_potato: {
        categories: ['gut', 'eye', 'immunity', 'metabolism'],
        facts: [
            {
                text: 'Sweet potatoes are rich in resistant starch that feeds beneficial gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['sweet potato', 'beans', 'oats']
            },
            {
                text: 'One sweet potato provides 400% of daily vitamin A needs for eye and immune health',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13',
                relatedIngredients: ['sweet potato', 'carrots', 'pumpkin']
            },
            {
                text: 'Despite being sweet, sweet potatoes have a lower glycemic impact than white potatoes',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['sweet potato', 'beans', 'lentils']
            }
        ]
    },
    avocado: {
        categories: ['heart', 'brain', 'skin', 'gut'],
        facts: [
            {
                text: 'Avocados are rich in monounsaturated fats that help lower LDL cholesterol',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['avocado', 'olive oil', 'nuts']
            },
            {
                text: 'Avocados help absorb fat-soluble vitamins A, D, E, and K from other vegetables',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['avocado', 'olive oil', 'nuts']
            },
            {
                text: 'The healthy fats in avocado support skin hydration and elasticity',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['avocado', 'olive oil', 'salmon']
            },
            {
                text: 'Avocados are high in fiber which supports digestive health and satiety',
                category: 'gut',
                source: 'The Obesity Code',
                chapter: 'Chapter 15',
                relatedIngredients: ['avocado', 'beans', 'vegetables']
            }
        ]
    },
    cabbage: {
        categories: ['cancer', 'gut', 'immunity'],
        facts: [
            {
                text: 'Cabbage contains glucosinolates that activate cancer-fighting enzymes in the body',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['cabbage', 'kale', 'brussels sprouts']
            },
            {
                text: 'Fermented cabbage (sauerkraut) provides probiotics that support gut microbiome diversity',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['cabbage', 'kimchi', 'yogurt']
            },
            {
                text: 'Cabbage is rich in vitamin C which supports white blood cell function',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['cabbage', 'citrus', 'bell peppers']
            }
        ]
    },
    zucchini: {
        categories: ['heart', 'eye', 'metabolism'],
        facts: [
            {
                text: 'Zucchini is rich in potassium which helps regulate blood pressure',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['zucchini', 'potatoes', 'bananas']
            },
            {
                text: 'The lutein and zeaxanthin in zucchini support eye health and reduce macular degeneration risk',
                category: 'eye',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['zucchini', 'squash', 'leafy greens']
            }
        ]
    },
    eggplant: {
        categories: ['heart', 'brain', 'cancer'],
        facts: [
            {
                text: 'Eggplant skin contains nasunin, an antioxidant that protects brain cell membranes',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['eggplant', 'blueberries', 'purple cabbage']
            },
            {
                text: 'The anthocyanins in purple eggplant support cardiovascular health',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['eggplant', 'berries', 'purple grapes']
            }
        ]
    },

    // GRAINS & LEGUMES
    beans: {
        categories: ['heart', 'gut', 'metabolism', 'cancer'],
        facts: [
            {
                text: 'Eating beans 4+ times per week reduces heart disease risk by 22%',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['beans', 'lentils', 'chickpeas']
            },
            {
                text: 'Beans are one of the best sources of resistant starch, feeding beneficial gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['beans', 'lentils', 'oats']
            },
            {
                text: 'The fiber and protein in beans help stabilize blood sugar and reduce insulin spikes',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['beans', 'lentils', 'chickpeas']
            }
        ]
    },
    lentils: {
        categories: ['heart', 'metabolism', 'gut', 'muscle'],
        facts: [
            {
                text: 'Lentils have one of the lowest glycemic indexes of any starch, ideal for blood sugar control',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['lentils', 'beans', 'chickpeas']
            },
            {
                text: 'Lentils provide plant-based protein with 18g per cup, supporting muscle maintenance',
                category: 'muscle',
                source: 'How Not to Die',
                chapter: 'Chapter 12',
                relatedIngredients: ['lentils', 'beans', 'tofu']
            },
            {
                text: 'The folate in lentils helps lower homocysteine, reducing cardiovascular risk',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['lentils', 'spinach', 'asparagus']
            }
        ]
    },
    quinoa: {
        categories: ['muscle', 'metabolism', 'gut'],
        facts: [
            {
                text: 'Quinoa is one of few plant foods with complete protein containing all 9 essential amino acids',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 12',
                relatedIngredients: ['quinoa', 'soybeans', 'hemp seeds']
            },
            {
                text: 'Quinoa has a low glycemic index and high fiber content for blood sugar stability',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['quinoa', 'oats', 'barley']
            }
        ]
    },
    oats: {
        categories: ['heart', 'gut', 'metabolism'],
        facts: [
            {
                text: 'Beta-glucan fiber in oats can lower LDL cholesterol by 5-10% in just 6 weeks',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['oats', 'barley', 'mushrooms']
            },
            {
                text: 'Oats contain prebiotic fiber that feeds Bifidobacteria and improves gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['oats', 'barley', 'bananas']
            },
            {
                text: 'The soluble fiber in oats slows digestion and helps maintain steady blood sugar',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['oats', 'beans', 'apples']
            }
        ]
    },
    rice: {
        categories: ['metabolism', 'gut'],
        facts: [
            {
                text: 'Brown rice retains the bran layer with fiber and B vitamins lost in white rice',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['rice', 'quinoa', 'barley']
            },
            {
                text: 'Cooling cooked rice creates resistant starch that feeds beneficial gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['rice', 'potatoes', 'pasta']
            }
        ]
    },
    pasta: {
        categories: ['metabolism', 'gut'],
        facts: [
            {
                text: 'Al dente pasta has a lower glycemic index than overcooked pasta',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['pasta', 'rice', 'bread']
            },
            {
                text: 'Whole grain pasta provides more fiber and resistant starch for gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['pasta', 'oats', 'bread']
            }
        ]
    },

    // FRUITS
    berries: {
        categories: ['brain', 'heart', 'cancer', 'skin'],
        facts: [
            {
                text: 'Blueberries can improve memory and cognitive function within weeks of daily consumption',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['berries', 'blueberries', 'strawberries']
            },
            {
                text: 'Berry anthocyanins help blood vessels relax and can lower blood pressure',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['berries', 'cherries', 'purple grapes']
            },
            {
                text: 'Ellagic acid in berries may help inhibit cancer cell growth',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['berries', 'pomegranate', 'walnuts']
            }
        ]
    },
    apples: {
        categories: ['gut', 'heart', 'metabolism'],
        facts: [
            {
                text: 'Apples contain pectin, a prebiotic fiber that feeds beneficial gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['apples', 'pears', 'citrus']
            },
            {
                text: 'Eating an apple before a meal can reduce calorie intake and improve blood sugar response',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 15',
                relatedIngredients: ['apples', 'pears', 'berries']
            },
            {
                text: 'Apple polyphenols help reduce LDL oxidation and support heart health',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['apples', 'grapes', 'berries']
            }
        ]
    },
    citrus: {
        categories: ['immunity', 'heart', 'skin', 'cancer'],
        facts: [
            {
                text: 'Vitamin C in citrus supports immune cell function and may shorten cold duration',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['citrus', 'oranges', 'lemons']
            },
            {
                text: 'Citrus flavonoids improve blood vessel function and reduce inflammation',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['citrus', 'oranges', 'grapefruit']
            },
            {
                text: 'Limonene in citrus peel has shown anti-cancer properties in studies',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['citrus', 'lemon zest', 'orange zest']
            }
        ]
    },

    // DAIRY & FERMENTED
    yogurt: {
        categories: ['gut', 'bone', 'immunity', 'metabolism'],
        facts: [
            {
                text: 'Live culture yogurt provides probiotics that support microbiome diversity and gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['yogurt', 'kefir', 'sauerkraut']
            },
            {
                text: 'Yogurt provides calcium and vitamin D for bone mineral density',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['yogurt', 'cheese', 'milk']
            },
            {
                text: 'Probiotics in yogurt can enhance immune response to infections',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 8',
                relatedIngredients: ['yogurt', 'kefir', 'fermented foods']
            },
            {
                text: 'Fermented dairy like yogurt may improve insulin sensitivity compared to regular dairy',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 11',
                relatedIngredients: ['yogurt', 'kefir', 'cheese']
            }
        ]
    },
    cheese: {
        categories: ['bone', 'muscle', 'brain'],
        facts: [
            {
                text: 'Aged cheeses like parmesan are rich in calcium and vitamin K2 for bone health',
                category: 'bone',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 10',
                relatedIngredients: ['cheese', 'yogurt', 'natto']
            },
            {
                text: 'Cheese provides complete protein and branched-chain amino acids for muscle maintenance',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 12',
                relatedIngredients: ['cheese', 'yogurt', 'eggs']
            }
        ]
    },
    feta: {
        categories: ['gut', 'bone', 'immunity'],
        facts: [
            {
                text: 'Traditional feta made from sheep milk contains beneficial probiotics',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['feta', 'yogurt', 'aged cheeses']
            },
            {
                text: 'Feta is lower in fat and calories than many cheeses while providing calcium for bones',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['feta', 'cottage cheese', 'yogurt']
            }
        ]
    },

    // NUTS & SEEDS
    walnuts: {
        categories: ['brain', 'heart', 'gut'],
        facts: [
            {
                text: 'Walnuts are the only nut with significant omega-3 ALA, supporting brain health',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['walnuts', 'flaxseed', 'chia seeds']
            },
            {
                text: 'Eating walnuts daily can lower LDL cholesterol and reduce cardiovascular risk',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['walnuts', 'almonds', 'pistachios']
            },
            {
                text: 'Walnuts act as a prebiotic, increasing beneficial gut bacteria populations',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['walnuts', 'almonds', 'pistachios']
            }
        ]
    },
    almonds: {
        categories: ['heart', 'metabolism', 'bone'],
        facts: [
            {
                text: 'Almonds help lower LDL cholesterol and may reduce heart disease risk by 30%',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['almonds', 'walnuts', 'pistachios']
            },
            {
                text: 'Despite being calorie-dense, almonds may help with weight management due to satiety effects',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 15',
                relatedIngredients: ['almonds', 'walnuts', 'macadamia']
            },
            {
                text: 'Almonds are one of the best non-dairy sources of calcium for bone health',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['almonds', 'sesame seeds', 'leafy greens']
            }
        ]
    },
    sesame: {
        categories: ['bone', 'heart', 'skin'],
        facts: [
            {
                text: 'Sesame seeds are extremely rich in calcium, with more per ounce than milk',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['sesame', 'tahini', 'almonds']
            },
            {
                text: 'Sesamin in sesame may help lower blood pressure and cholesterol',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['sesame', 'flaxseed', 'olive oil']
            }
        ]
    },

    // OILS & FATS
    olive_oil: {
        categories: ['heart', 'brain', 'cancer', 'gut'],
        facts: [
            {
                text: 'Extra virgin olive oil contains oleocanthal, which has anti-inflammatory effects similar to ibuprofen',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['olive oil', 'olives', 'avocado oil']
            },
            {
                text: 'Mediterranean diet rich in olive oil reduces cognitive decline and dementia risk',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['olive oil', 'nuts', 'fish']
            },
            {
                text: 'Polyphenols in olive oil may help starve cancer cells by inhibiting angiogenesis',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['olive oil', 'green tea', 'turmeric']
            },
            {
                text: 'Olive oil supports beneficial gut bacteria and may improve microbiome diversity',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['olive oil', 'nuts', 'vegetables']
            }
        ]
    },

    // HERBS & SPICES
    turmeric: {
        categories: ['brain', 'cancer', 'heart', 'immunity'],
        facts: [
            {
                text: 'Curcumin in turmeric crosses the blood-brain barrier and may help clear amyloid plaques',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['turmeric', 'ginger', 'black pepper']
            },
            {
                text: 'Curcumin has been shown to inhibit cancer cell growth through multiple mechanisms',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['turmeric', 'ginger', 'green tea']
            },
            {
                text: 'Black pepper increases curcumin absorption by 2000%, making the combination ideal',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['turmeric', 'black pepper', 'ginger']
            }
        ]
    },
    ginger: {
        categories: ['gut', 'immunity', 'heart', 'muscle'],
        facts: [
            {
                text: 'Ginger can reduce nausea and support digestive comfort through multiple mechanisms',
                category: 'gut',
                source: 'How Not to Die',
                chapter: 'Chapter 8',
                relatedIngredients: ['ginger', 'peppermint', 'fennel']
            },
            {
                text: 'Ginger has antimicrobial and anti-inflammatory properties that support immune function',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 8',
                relatedIngredients: ['ginger', 'garlic', 'turmeric']
            },
            {
                text: 'Ginger may reduce muscle soreness by 25% when consumed after exercise',
                category: 'muscle',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7',
                relatedIngredients: ['ginger', 'turmeric', 'cherries']
            }
        ]
    },
    cinnamon: {
        categories: ['metabolism', 'heart', 'brain'],
        facts: [
            {
                text: 'Cinnamon can improve insulin sensitivity and help regulate blood sugar levels',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 11',
                relatedIngredients: ['cinnamon', 'fenugreek', 'berries']
            },
            {
                text: 'Cinnamon may help lower LDL cholesterol and triglycerides',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['cinnamon', 'turmeric', 'ginger']
            }
        ]
    },
    basil: {
        categories: ['heart', 'immunity', 'cancer'],
        facts: [
            {
                text: 'Basil contains eugenol which has anti-inflammatory and blood-thinning properties',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['basil', 'oregano', 'thyme']
            },
            {
                text: 'Fresh basil has antimicrobial properties that support immune defense',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['basil', 'oregano', 'garlic']
            }
        ]
    },
    oregano: {
        categories: ['immunity', 'gut', 'cancer'],
        facts: [
            {
                text: 'Oregano has one of the highest antioxidant capacities of any herb',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['oregano', 'thyme', 'rosemary']
            },
            {
                text: 'Carvacrol in oregano has antimicrobial effects that support gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['oregano', 'thyme', 'garlic']
            }
        ]
    },
    parsley: {
        categories: ['bone', 'heart', 'immunity'],
        facts: [
            {
                text: 'Parsley is extremely high in vitamin K, essential for bone health and blood clotting',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 10',
                relatedIngredients: ['parsley', 'kale', 'basil']
            },
            {
                text: 'Parsley contains flavonoids that support heart health and reduce inflammation',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4',
                relatedIngredients: ['parsley', 'celery', 'cilantro']
            }
        ]
    },

    // SOURDOUGH (Homemade staple)
    sourdough: {
        categories: ['gut', 'metabolism', 'immunity'],
        facts: [
            {
                text: 'Sourdough fermentation creates prebiotics and beneficial acids that support gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['sourdough', 'yogurt', 'sauerkraut']
            },
            {
                text: 'Sourdough has a lower glycemic index than regular bread due to fermentation acids',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10',
                relatedIngredients: ['sourdough', 'whole grains', 'fermented foods']
            },
            {
                text: 'The fermentation process in sourdough increases mineral bioavailability',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['sourdough', 'whole wheat', 'fermented foods']
            }
        ]
    },

    // Additional common ingredients
    onions: {
        categories: ['heart', 'gut', 'immunity', 'cancer'],
        facts: [
            {
                text: 'Onions contain quercetin, a powerful antioxidant that supports heart health',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1',
                relatedIngredients: ['onions', 'apples', 'berries']
            },
            {
                text: 'Onions are rich in prebiotics that feed beneficial gut bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['onions', 'garlic', 'leeks']
            }
        ]
    },
    lemons: {
        categories: ['immunity', 'skin', 'gut'],
        facts: [
            {
                text: 'Lemon juice enhances iron absorption from plant foods when consumed together',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['lemons', 'citrus', 'vitamin C foods']
            },
            {
                text: 'Vitamin C in lemons is essential for collagen production and skin health',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 11',
                relatedIngredients: ['lemons', 'oranges', 'bell peppers']
            }
        ]
    },
    honey: {
        categories: ['immunity', 'gut', 'skin'],
        facts: [
            {
                text: 'Raw honey has antimicrobial properties and may help soothe sore throats',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5',
                relatedIngredients: ['honey', 'ginger', 'lemon']
            },
            {
                text: 'Honey acts as a prebiotic, supporting beneficial gut bacteria growth',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 9',
                relatedIngredients: ['honey', 'yogurt', 'oats']
            }
        ]
    },
    green_tea: {
        categories: ['brain', 'cancer', 'metabolism', 'heart'],
        facts: [
            {
                text: 'EGCG in green tea may help prevent beta-amyloid plaque formation in the brain',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5',
                relatedIngredients: ['green tea', 'matcha', 'white tea']
            },
            {
                text: 'Green tea catechins can inhibit cancer cell growth through anti-angiogenic effects',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6',
                relatedIngredients: ['green tea', 'matcha', 'turmeric']
            },
            {
                text: 'Green tea may slightly boost metabolism and fat oxidation',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 15',
                relatedIngredients: ['green tea', 'coffee', 'yerba mate']
            }
        ]
    }
};

// =========================================================
// Helper Functions
// =========================================================

/**
 * Normalize ingredient name for matching
 * @param {string} name - Ingredient name
 * @returns {string} Normalized name
 */
function normalizeIngredientName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        // Handle common variations
        .replace(/^canned /, '')
        .replace(/ canned$/, '')
        .replace(/^fresh /, '')
        .replace(/ fresh$/, '')
        .replace(/^dried /, '')
        .replace(/ dried$/, '')
        .replace(/^frozen /, '')
        .replace(/ frozen$/, '');
}

/**
 * Find matching ingredient in health benefits database
 * @param {string} ingredientName - Name to find
 * @returns {Object|null} Health benefits entry or null
 */
function findIngredientBenefits(ingredientName) {
    const normalized = normalizeIngredientName(ingredientName);

    // Direct match
    if (healthBenefits[normalized]) {
        return { key: normalized, data: healthBenefits[normalized] };
    }

    // Try underscore version
    const underscored = normalized.replace(/ /g, '_');
    if (healthBenefits[underscored]) {
        return { key: underscored, data: healthBenefits[underscored] };
    }

    // Partial match - check if ingredient name contains or is contained by a key
    for (const [key, data] of Object.entries(healthBenefits)) {
        const keyNorm = normalizeIngredientName(key);
        if (normalized.includes(keyNorm) || keyNorm.includes(normalized)) {
            return { key, data };
        }
    }

    // Common aliases
    const aliases = {
        'chicken breast': 'chicken',
        'chicken thigh': 'chicken',
        'chicken thighs': 'chicken',
        'ground beef': 'beef',
        'beef chuck': 'beef',
        'sirloin': 'beef',
        'atlantic salmon': 'salmon',
        'wild salmon': 'salmon',
        'salmon fillet': 'salmon',
        'canned mackerel': 'mackerel',
        'atlantic mackerel': 'mackerel',
        'baby spinach': 'spinach',
        'curly kale': 'kale',
        'lacinato kale': 'kale',
        'dinosaur kale': 'kale',
        'cherry tomatoes': 'tomatoes',
        'roma tomatoes': 'tomatoes',
        'tomato paste': 'tomatoes',
        'tomato sauce': 'tomatoes',
        'red bell pepper': 'bell_pepper',
        'green bell pepper': 'bell_pepper',
        'yellow bell pepper': 'bell_pepper',
        'bell peppers': 'bell_pepper',
        'greek yogurt': 'yogurt',
        'plain yogurt': 'yogurt',
        'parmesan': 'cheese',
        'parmigiano': 'cheese',
        'mozzarella': 'cheese',
        'cheddar': 'cheese',
        'feta cheese': 'feta',
        'extra virgin olive oil': 'olive_oil',
        'evoo': 'olive_oil',
        'black beans': 'beans',
        'kidney beans': 'beans',
        'pinto beans': 'beans',
        'cannellini beans': 'beans',
        'white beans': 'beans',
        'red lentils': 'lentils',
        'green lentils': 'lentils',
        'brown lentils': 'lentils',
        'brown rice': 'rice',
        'white rice': 'rice',
        'jasmine rice': 'rice',
        'basmati rice': 'rice',
        'blueberries': 'berries',
        'strawberries': 'berries',
        'raspberries': 'berries',
        'blackberries': 'berries',
        'mixed berries': 'berries',
        'orange': 'citrus',
        'oranges': 'citrus',
        'lemon': 'lemons',
        'lime': 'citrus',
        'grapefruit': 'citrus',
        'fresh ginger': 'ginger',
        'ground ginger': 'ginger',
        'fresh garlic': 'garlic',
        'garlic cloves': 'garlic',
        'minced garlic': 'garlic',
        'fresh basil': 'basil',
        'dried basil': 'basil',
        'fresh oregano': 'oregano',
        'dried oregano': 'oregano',
        'fresh parsley': 'parsley',
        'italian parsley': 'parsley',
        'flat leaf parsley': 'parsley',
        'ground turmeric': 'turmeric',
        'turmeric powder': 'turmeric',
        'ground cinnamon': 'cinnamon',
        'cinnamon stick': 'cinnamon',
        'sesame seeds': 'sesame',
        'tahini': 'sesame',
        'sesame oil': 'sesame',
        'whole wheat': 'oats',
        'wheat berries': 'oats',
        'sourdough bread': 'sourdough',
        'homemade sourdough': 'sourdough',
        'napa cabbage': 'cabbage',
        'green cabbage': 'cabbage',
        'red cabbage': 'cabbage',
        'purple cabbage': 'cabbage'
    };

    const aliasMatch = aliases[normalized];
    if (aliasMatch && healthBenefits[aliasMatch]) {
        return { key: aliasMatch, data: healthBenefits[aliasMatch] };
    }

    return null;
}

// =========================================================
// Main Export Functions
// =========================================================

/**
 * Get diverse health facts for a meal (Feature 10)
 * Selects facts from different categories for variety
 *
 * @param {Array<string>} ingredientNames - List of ingredient names in the meal
 * @param {number} count - Maximum number of facts to return (default 10)
 * @returns {Array<Object>} Array of fact objects with text, category, source, etc.
 */
export function getDiverseFactsForMeal(ingredientNames, count = 10) {
    if (!ingredientNames || ingredientNames.length === 0) {
        return [];
    }

    // Collect all facts from ingredients
    const allFacts = [];
    const usedCategories = new Set();
    const usedTexts = new Set();

    for (const name of ingredientNames) {
        const match = findIngredientBenefits(name);
        if (match && match.data && match.data.facts) {
            for (const fact of match.data.facts) {
                // Add ingredient name to fact
                allFacts.push({
                    ...fact,
                    ingredientName: name,
                    ingredientKey: match.key
                });
            }
        }
    }

    // Shuffle for randomness
    const shuffled = allFacts.sort(() => Math.random() - 0.5);

    // Select diverse facts - prioritize different categories
    const selected = [];

    // First pass: one fact per category
    for (const fact of shuffled) {
        if (selected.length >= count) break;
        if (!usedCategories.has(fact.category) && !usedTexts.has(fact.text)) {
            selected.push(fact);
            usedCategories.add(fact.category);
            usedTexts.add(fact.text);
        }
    }

    // Second pass: fill remaining slots with any unused facts
    for (const fact of shuffled) {
        if (selected.length >= count) break;
        if (!usedTexts.has(fact.text)) {
            selected.push(fact);
            usedTexts.add(fact.text);
        }
    }

    return selected;
}

/**
 * Get expanded facts for a meal, organized by category (Feature 10 expanded view)
 * Returns up to 25 facts organized by health category
 *
 * @param {Array<string>} ingredientNames - List of ingredient names in the meal
 * @returns {Object} Object with category IDs as keys and arrays of facts as values
 */
export function getExpandedFactsForMeal(ingredientNames) {
    if (!ingredientNames || ingredientNames.length === 0) {
        return {};
    }

    const factsByCategory = {};

    for (const name of ingredientNames) {
        const match = findIngredientBenefits(name);
        if (match && match.data && match.data.facts) {
            for (const fact of match.data.facts) {
                const category = fact.category || 'general';
                if (!factsByCategory[category]) {
                    factsByCategory[category] = [];
                }

                // Avoid duplicates
                const exists = factsByCategory[category].some(f => f.text === fact.text);
                if (!exists) {
                    factsByCategory[category].push({
                        ...fact,
                        ingredientName: name,
                        ingredientKey: match.key
                    });
                }
            }
        }
    }

    // Sort categories by number of facts (most first)
    const sorted = {};
    const sortedKeys = Object.keys(factsByCategory).sort(
        (a, b) => factsByCategory[b].length - factsByCategory[a].length
    );

    for (const key of sortedKeys) {
        sorted[key] = factsByCategory[key];
    }

    return sorted;
}

/**
 * Get facts for a specific health category from given ingredients
 *
 * @param {Array<string>} ingredientNames - List of ingredient names
 * @param {string} categoryId - Health category ID (e.g., 'heart', 'brain')
 * @returns {Array<Object>} Array of facts for that category
 */
export function getFactsForCategory(ingredientNames, categoryId) {
    if (!ingredientNames || !categoryId) {
        return [];
    }

    const facts = [];

    for (const name of ingredientNames) {
        const match = findIngredientBenefits(name);
        if (match && match.data && match.data.facts) {
            for (const fact of match.data.facts) {
                if (fact.category === categoryId) {
                    const exists = facts.some(f => f.text === fact.text);
                    if (!exists) {
                        facts.push({
                            ...fact,
                            ingredientName: name,
                            ingredientKey: match.key
                        });
                    }
                }
            }
        }
    }

    return facts;
}

// Default export for convenience
export default {
    healthCategories,
    healthBenefits,
    getDiverseFactsForMeal,
    getExpandedFactsForMeal,
    getFactsForCategory
};
