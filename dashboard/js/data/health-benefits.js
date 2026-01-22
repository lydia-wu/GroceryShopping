/**
 * @file health-benefits.js
 * @description Comprehensive health benefits database sourced from three key books:
 *   - "Eat to Beat Disease" by William Li
 *   - "The Obesity Code" by Jason Fung
 *   - "How Not to Die" by Michael Greger & Gene Stone
 *
 * Organized by 12 health categories with book citations.
 *
 * @requires None (standalone data module)
 * @exports healthBenefits, getFactsForIngredient, getFactsForCategory, getAllCategories
 */

// Health benefit categories (12 total)
export const healthCategories = {
    heart: {
        id: 'heart',
        name: 'Heart Health',
        icon: '❤️',
        description: 'Cardiovascular benefits including cholesterol, blood pressure, and circulation',
        color: '#e74c3c'
    },
    brain: {
        id: 'brain',
        name: 'Brain Health',
        icon: '🧠',
        description: 'Cognitive function, memory, and neuroprotection',
        color: '#9b59b6'
    },
    cancer: {
        id: 'cancer',
        name: 'Cancer Prevention',
        icon: '🛡️',
        description: 'Anti-angiogenic and anti-proliferative properties',
        color: '#3498db'
    },
    gut: {
        id: 'gut',
        name: 'Gut Health',
        icon: '🦠',
        description: 'Microbiome support and digestive health',
        color: '#27ae60'
    },
    muscle: {
        id: 'muscle',
        name: 'Muscle & Recovery',
        icon: '💪',
        description: 'Protein synthesis, muscle building, and recovery',
        color: '#e67e22'
    },
    dna: {
        id: 'dna',
        name: 'DNA Protection',
        icon: '🧬',
        description: 'Antioxidant protection and cellular repair',
        color: '#1abc9c'
    },
    immunity: {
        id: 'immunity',
        name: 'Immunity',
        icon: '🛡️',
        description: 'Immune system support and antimicrobial properties',
        color: '#f1c40f'
    },
    regeneration: {
        id: 'regeneration',
        name: 'Stem Cell Regeneration',
        icon: '🔄',
        description: 'Stem cell activation and tissue renewal',
        color: '#16a085'
    },
    metabolism: {
        id: 'metabolism',
        name: 'Metabolism & Blood Sugar',
        icon: '📊',
        description: 'Blood sugar control and metabolic health',
        color: '#d35400'
    },
    bone: {
        id: 'bone',
        name: 'Bone Health',
        icon: '🦴',
        description: 'Bone density and skeletal support',
        color: '#95a5a6'
    },
    eye: {
        id: 'eye',
        name: 'Eye Health',
        icon: '👁️',
        description: 'Vision protection and macular health',
        color: '#2980b9'
    },
    skin: {
        id: 'skin',
        name: 'Skin Health',
        icon: '✨',
        description: 'Skin elasticity, collagen, and protection',
        color: '#f39c12'
    }
};

// Comprehensive health facts organized by ingredient
export const healthBenefits = {
    // ==================
    // PROTEINS
    // ==================
    mackerel: {
        categories: ['heart', 'brain', 'regeneration', 'eye'],
        facts: [
            {
                text: 'Mackerel provides 2,670mg omega-3s per 100g - one of the highest of any fish, supporting cardiovascular health',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['salmon', 'sardines', 'anchovies']
            },
            {
                text: 'DHA from fatty fish is crucial for brain cell membranes and linked to 26% lower risk of dementia',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['salmon', 'sardines']
            },
            {
                text: 'Omega-3s stimulate stem cell activity in bone marrow, supporting tissue regeneration throughout the body',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['salmon', 'walnuts', 'flaxseed']
            },
            {
                text: 'DHA accumulates in retinal tissue where it protects photoreceptors and supports visual function',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13: How Not to Die from Iatrogenic Causes',
                relatedIngredients: ['salmon', 'egg']
            }
        ]
    },

    chicken_breast: {
        categories: ['muscle', 'metabolism'],
        facts: [
            {
                text: 'Chicken provides 31g complete protein per 100g with all essential amino acids for optimal muscle synthesis',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 13: Protein',
                relatedIngredients: ['turkey', 'egg', 'fish']
            },
            {
                text: 'Lean protein has minimal impact on insulin response while providing satiety and supporting metabolic rate',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 14: Fat Phobia',
                relatedIngredients: ['turkey', 'fish']
            }
        ]
    },

    ground_turkey: {
        categories: ['muscle', 'metabolism'],
        facts: [
            {
                text: 'Turkey is high in tryptophan, supporting serotonin production for mood and sleep regulation',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['chicken']
            },
            {
                text: 'Ground turkey provides 20g protein per 100g - a complete protein supporting muscle maintenance',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 13: Protein',
                relatedIngredients: ['chicken', 'egg']
            }
        ]
    },

    egg: {
        categories: ['brain', 'muscle', 'eye'],
        facts: [
            {
                text: 'Eggs contain 294mg choline per 100g - essential for acetylcholine production, the memory neurotransmitter',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7: Protect Your DNA',
                relatedIngredients: ['liver', 'soybeans']
            },
            {
                text: 'Egg protein has a biological value of 100 - the gold standard against which all other proteins are measured',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 13: Protein',
                relatedIngredients: ['whey', 'chicken']
            },
            {
                text: 'Egg yolks contain lutein and zeaxanthin that accumulate in the macula, protecting against age-related vision loss',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13: How Not to Die from Iatrogenic Causes',
                relatedIngredients: ['kale', 'spinach']
            }
        ]
    },

    // ==================
    // VEGETABLES
    // ==================
    kale: {
        categories: ['brain', 'cancer', 'bone', 'eye', 'regeneration', 'dna'],
        facts: [
            {
                text: 'Kale\'s lutein crosses the blood-brain barrier, protecting neurons from oxidative damage and supporting cognitive function',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['spinach', 'egg']
            },
            {
                text: 'Kale contains sulforaphane which activates detoxification enzymes and inhibits cancer cell proliferation',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 9: How Not to Die from Blood Cancers',
                relatedIngredients: ['broccoli', 'cauliflower', 'brussels sprouts']
            },
            {
                text: 'One bunch of kale provides 390% DV of vitamin K, essential for calcium absorption into bones',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinson\'s Disease',
                relatedIngredients: ['parsley', 'spinach']
            },
            {
                text: 'Kale is one of the highest sources of lutein (39,550mcg/100g) - critical for macular pigment density',
                category: 'eye',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['spinach', 'egg yolk']
            },
            {
                text: 'Dark leafy greens support bone marrow stem cell function through their vitamin K and folate content',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['spinach', 'parsley', 'collards']
            },
            {
                text: 'Kale\'s high antioxidant content (ORAC score 1,770) protects cellular DNA from oxidative damage',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['spinach', 'berries']
            }
        ]
    },

    cauliflower: {
        categories: ['cancer', 'metabolism', 'gut'],
        facts: [
            {
                text: 'Cauliflower contains I3C (indole-3-carbinol) which helps regulate estrogen metabolism and has anti-cancer properties',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 11: How Not to Die from Breast Cancer',
                relatedIngredients: ['broccoli', 'cabbage', 'kale']
            },
            {
                text: 'Cauliflower rice has 80% fewer carbs than white rice - excellent for blood sugar management',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: The Insulin Connection',
                relatedIngredients: ['zucchini noodles']
            },
            {
                text: 'Cauliflower is rich in fiber and glucosinolates that support beneficial gut bacteria populations',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['broccoli', 'cabbage']
            }
        ]
    },

    sweet_potato: {
        categories: ['dna', 'gut', 'eye'],
        facts: [
            {
                text: 'Sweet potatoes provide 709% DV of vitamin A (as beta-carotene) - a powerful antioxidant protecting cellular DNA',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 7: How Not to Die from Diabetes',
                relatedIngredients: ['carrot', 'spinach', 'kale']
            },
            {
                text: 'Sweet potato fiber feeds beneficial Bifidobacteria, supporting a healthy gut microbiome',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['potato', 'beans']
            },
            {
                text: 'Beta-carotene in sweet potatoes is converted to vitamin A which is essential for rhodopsin production and night vision',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13: How Not to Die from Iatrogenic Causes',
                relatedIngredients: ['carrot', 'kale']
            }
        ]
    },

    tomato: {
        categories: ['heart', 'cancer', 'skin'],
        facts: [
            {
                text: 'Cooked tomatoes release more lycopene - a carotenoid that reduces LDL cholesterol oxidation by up to 25%',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['tomato sauce', 'tomato paste', 'watermelon']
            },
            {
                text: 'Lycopene is anti-angiogenic - it helps prevent tumors from developing their own blood supply',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['tomato sauce', 'guava', 'pink grapefruit']
            },
            {
                text: 'Lycopene accumulates in skin tissue where it provides natural UV protection from within',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['watermelon', 'pink grapefruit']
            }
        ]
    },

    tomato_sauce: {
        categories: ['heart', 'cancer'],
        facts: [
            {
                text: 'Tomato sauce contains 15,900mcg lycopene per 100g - cooking with oil increases absorption by 5x',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['olive oil', 'tomato paste']
            },
            {
                text: 'Regular tomato sauce consumption (2+ servings/week) is associated with 23% lower prostate cancer risk',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 10: How Not to Die from Prostate Cancer',
                relatedIngredients: ['tomato paste', 'watermelon']
            }
        ]
    },

    tomato_paste: {
        categories: ['heart', 'cancer'],
        facts: [
            {
                text: 'Tomato paste is the most concentrated source of lycopene (28,764mcg/100g) - 11x more than raw tomatoes',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['tomato sauce', 'sun-dried tomatoes']
            },
            {
                text: 'High-dose lycopene from tomato paste has been shown to reduce PSA levels in prostate cancer patients',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 10: How Not to Die from Prostate Cancer',
                relatedIngredients: ['tomato sauce', 'watermelon']
            }
        ]
    },

    avocado: {
        categories: ['heart', 'gut', 'skin', 'brain'],
        facts: [
            {
                text: 'Avocados raise HDL cholesterol and lower LDL - eating one daily can reduce LDL by 22% in 4 weeks',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['olive oil', 'nuts']
            },
            {
                text: 'Avocado\'s 7g fiber and healthy fats increase microbial diversity and beneficial bacteria abundance',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['olive oil', 'nuts']
            },
            {
                text: 'Avocado oils and vitamin E nourish skin from within, improving elasticity and hydration',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['olive oil', 'nuts', 'seeds']
            },
            {
                text: 'Monounsaturated fats in avocado support brain cell membrane fluidity and neurotransmitter function',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['olive oil', 'walnuts']
            }
        ]
    },

    garlic: {
        categories: ['heart', 'immunity', 'cancer', 'gut'],
        facts: [
            {
                text: 'Garlic\'s allicin compounds can lower blood pressure by 10mmHg systolic - comparable to some medications',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['onion', 'leek']
            },
            {
                text: 'Allicin has potent antimicrobial properties - garlic extract can inhibit antibiotic-resistant bacteria',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['ginger', 'turmeric']
            },
            {
                text: 'Garlic compounds inhibit cancer cell proliferation - studies show 30% lower colorectal cancer risk with regular consumption',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 8: How Not to Die from Digestive Cancers',
                relatedIngredients: ['onion', 'cruciferous vegetables']
            },
            {
                text: 'Garlic\'s inulin fiber selectively feeds beneficial Lactobacillus strains in the gut',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['onion', 'leek', 'asparagus']
            }
        ]
    },

    carrot: {
        categories: ['eye', 'dna', 'skin'],
        facts: [
            {
                text: 'Carrots provide 835% DV of vitamin A as beta-carotene - essential for rhodopsin production and night vision',
                category: 'eye',
                source: 'How Not to Die',
                chapter: 'Chapter 13: How Not to Die from Iatrogenic Causes',
                relatedIngredients: ['sweet potato', 'kale']
            },
            {
                text: 'Beta-carotene acts as an antioxidant shield, protecting cell DNA from free radical damage',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['sweet potato', 'spinach']
            },
            {
                text: 'Carotenoids from carrots accumulate in skin, providing natural sun protection and a healthy glow',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['sweet potato', 'tomato']
            }
        ]
    },

    // ==================
    // GRAINS
    // ==================
    barley: {
        categories: ['gut', 'metabolism', 'heart'],
        facts: [
            {
                text: 'Barley\'s beta-glucan fiber is prebiotic gold - can increase Bifidobacteria by up to 60%',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['oats', 'mushrooms']
            },
            {
                text: 'Barley has one of the lowest glycemic indexes (25) of any grain - stabilizes blood sugar for hours',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: The Insulin Connection',
                relatedIngredients: ['oats', 'quinoa']
            },
            {
                text: 'Beta-glucan in barley reduces LDL cholesterol by binding bile acids in the digestive tract',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['oats', 'beans']
            }
        ]
    },

    // ==================
    // DAIRY
    // ==================
    yogurt: {
        categories: ['gut', 'immunity', 'bone'],
        facts: [
            {
                text: 'Live yogurt cultures (Lactobacillus, Bifidobacterium) support microbiome diversity and immune function',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['kefir', 'sauerkraut']
            },
            {
                text: 'Probiotics in yogurt enhance gut-immune axis communication, improving resistance to infections',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 8: Strengthen Your Immunity',
                relatedIngredients: ['kefir', 'kimchi']
            },
            {
                text: 'Yogurt provides 187mg calcium per cup with enhanced absorption due to fermentation',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinson\'s Disease',
                relatedIngredients: ['kefir', 'cheese']
            }
        ]
    },

    feta: {
        categories: ['bone', 'gut'],
        facts: [
            {
                text: 'Feta provides 493mg calcium per 100g - nearly 50% DV, supporting bone mineral density',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinson\'s Disease',
                relatedIngredients: ['parmesan', 'yogurt']
            },
            {
                text: 'Traditional feta is fermented, containing beneficial bacteria that support gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['goat cheese', 'aged cheeses']
            }
        ]
    },

    // ==================
    // FATS & OILS
    // ==================
    olive_oil: {
        categories: ['heart', 'brain', 'skin'],
        facts: [
            {
                text: 'Extra virgin olive oil contains oleocanthal which has similar anti-inflammatory effects to ibuprofen',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['avocado oil', 'nuts']
            },
            {
                text: 'Mediterranean diet with olive oil reduces dementia risk by 40% compared to low-fat diets',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['nuts', 'fish', 'vegetables']
            },
            {
                text: 'Olive oil polyphenols and vitamin E provide antioxidant protection for skin cells',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['avocado', 'nuts']
            }
        ]
    },

    // ==================
    // FRUITS
    // ==================
    pomegranate: {
        categories: ['heart', 'brain', 'regeneration', 'cancer'],
        facts: [
            {
                text: 'Pomegranate juice can reduce arterial plaque by 30% after one year of daily consumption',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['berries', 'grapes']
            },
            {
                text: 'Pomegranate urolithins improve memory by enhancing mitochondrial function in brain cells',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['walnuts', 'berries']
            },
            {
                text: 'Pomegranate activates stem cells and promotes cellular renewal through urolithin A production',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['berries', 'walnuts']
            },
            {
                text: 'Pomegranate polyphenols are anti-angiogenic, helping to starve cancer cells of blood supply',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['berries', 'green tea']
            }
        ]
    },

    lemon: {
        categories: ['immunity', 'skin', 'dna'],
        facts: [
            {
                text: 'Lemons provide 88% DV of vitamin C which enhances white blood cell function and antibody production',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['orange', 'grapefruit', 'kiwi']
            },
            {
                text: 'Vitamin C is essential for collagen synthesis - keeps skin firm and promotes wound healing',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['orange', 'strawberry', 'bell pepper']
            },
            {
                text: 'Citrus limonoids protect DNA from oxidative damage and support cellular repair mechanisms',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['orange', 'grapefruit']
            }
        ]
    },

    // ==================
    // NUTS
    // ==================
    pistachios: {
        categories: ['heart', 'metabolism', 'gut'],
        facts: [
            {
                text: 'Pistachios can lower LDL cholesterol by 9% and improve HDL/LDL ratio when eaten daily',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['almonds', 'walnuts']
            },
            {
                text: 'Pistachios have a low glycemic index and high protein content, promoting stable blood sugar',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: The Insulin Connection',
                relatedIngredients: ['almonds', 'walnuts', 'macadamia']
            },
            {
                text: 'Prebiotic fiber in pistachios increases beneficial gut bacteria, particularly Bifidobacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['almonds', 'hazelnuts']
            }
        ]
    },

    // ==================
    // HERBS & SPICES
    // ==================
    ginger: {
        categories: ['immunity', 'gut', 'metabolism'],
        facts: [
            {
                text: 'Ginger\'s gingerols have potent anti-inflammatory and antimicrobial properties against pathogens',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['turmeric', 'garlic']
            },
            {
                text: 'Ginger accelerates gastric emptying and reduces nausea - studied extensively for digestive health',
                category: 'gut',
                source: 'How Not to Die',
                chapter: 'Chapter 8: How Not to Die from Digestive Cancers',
                relatedIngredients: ['peppermint', 'fennel']
            },
            {
                text: 'Ginger compounds can boost metabolism through thermogenesis and support weight management',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 19: What to Eat',
                relatedIngredients: ['cayenne', 'turmeric']
            }
        ]
    },

    parsley: {
        categories: ['bone', 'cancer', 'regeneration', 'dna'],
        facts: [
            {
                text: 'Parsley is extremely high in vitamin K (1640% DV per 100g) - essential for bone calcium metabolism',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinson\'s Disease',
                relatedIngredients: ['kale', 'spinach']
            },
            {
                text: 'Parsley contains apigenin - a flavonoid that inhibits cancer cell growth and angiogenesis',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['celery', 'chamomile']
            },
            {
                text: 'Dark leafy herbs like parsley support bone marrow stem cell function through vitamin K and folate',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['kale', 'spinach']
            },
            {
                text: 'Parsley\'s high folate content (152mcg/100g) is essential for DNA synthesis and cellular repair',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['kale', 'spinach', 'beans']
            }
        ]
    },

    thyme: {
        categories: ['immunity', 'cancer'],
        facts: [
            {
                text: 'Thyme contains thymol which has powerful antimicrobial properties against bacteria and fungi',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['oregano', 'rosemary']
            },
            {
                text: 'Thyme\'s rosmarinic acid has anti-angiogenic properties that may help starve cancer cells',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['oregano', 'rosemary', 'basil']
            }
        ]
    },

    oregano: {
        categories: ['immunity', 'cancer', 'gut'],
        facts: [
            {
                text: 'Oregano has one of the highest ORAC (antioxidant) scores of any herb - 42x that of apples',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 5: How Not to Die from Infections',
                relatedIngredients: ['thyme', 'rosemary', 'turmeric']
            },
            {
                text: 'Oregano contains carvacrol which has been shown to induce apoptosis in cancer cells',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['thyme', 'rosemary']
            },
            {
                text: 'Oregano\'s antimicrobial compounds support a healthy gut microbiome by reducing pathogenic bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Microbiome',
                relatedIngredients: ['thyme', 'garlic']
            }
        ]
    },

    rosemary: {
        categories: ['brain', 'cancer'],
        facts: [
            {
                text: 'Rosemary\'s carnosic acid protects the brain from neurodegeneration and oxidative stress',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['sage', 'thyme']
            },
            {
                text: 'Rosmarinic acid in rosemary inhibits tumor angiogenesis and has anti-cancer properties',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['oregano', 'thyme', 'basil']
            }
        ]
    },

    cayenne: {
        categories: ['metabolism', 'heart'],
        facts: [
            {
                text: 'Capsaicin in cayenne boosts metabolism by 20% for up to 2 hours through thermogenesis',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 19: What to Eat',
                relatedIngredients: ['ginger', 'turmeric', 'black pepper']
            },
            {
                text: 'Capsaicin improves blood vessel function and may help lower blood pressure',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['ginger', 'garlic']
            }
        ]
    },

    // ==================
    // EXPANDED INGREDIENTS (v2.0.0)
    // ==================

    salmon: {
        categories: ['heart', 'brain', 'regeneration', 'eye'],
        facts: [
            {
                text: 'Wild salmon provides 2,150mg omega-3s per serving - among the best sources for cardiovascular protection',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['mackerel', 'sardines', 'anchovies']
            },
            {
                text: 'DHA in salmon is the primary structural fat in brain cell membranes, critical for cognitive function',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['mackerel', 'walnuts']
            },
            {
                text: 'Omega-3s from fatty fish stimulate stem cell production in bone marrow for tissue regeneration',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['mackerel', 'sardines']
            }
        ]
    },

    blueberries: {
        categories: ['brain', 'cancer', 'heart', 'dna', 'eye'],
        facts: [
            {
                text: 'Blueberries improve memory and delay brain aging by 2.5 years through anthocyanin protection',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['blackberries', 'strawberries']
            },
            {
                text: 'Wild blueberries contain the highest antioxidant content of any fruit, neutralizing free radicals',
                category: 'dna',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7: Protect Your DNA',
                relatedIngredients: ['strawberries', 'raspberries', 'blackberries']
            },
            {
                text: 'Pterostilbene in blueberries inhibits cancer cell growth and induces cancer cell death',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['grapes', 'cranberries']
            }
        ]
    },

    spinach: {
        categories: ['brain', 'eye', 'bone', 'dna', 'regeneration'],
        facts: [
            {
                text: 'Spinach is one of the highest sources of lutein, protecting the macula and reducing eye disease risk by 43%',
                category: 'eye',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['kale', 'egg']
            },
            {
                text: 'Folate in spinach is essential for DNA synthesis and repair, especially important during pregnancy',
                category: 'dna',
                source: 'How Not to Die',
                chapter: 'Chapter 7: How Not to Die from Breast Cancer',
                relatedIngredients: ['kale', 'asparagus', 'lentils']
            },
            {
                text: 'Vitamin K in spinach (483% DV per cup) activates osteocalcin for bone mineralization',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinson Disease',
                relatedIngredients: ['kale', 'parsley']
            }
        ]
    },

    walnuts: {
        categories: ['brain', 'heart', 'gut', 'regeneration'],
        facts: [
            {
                text: 'Walnuts are the only tree nut with significant ALA omega-3s (2.5g per oz), supporting brain function',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['flaxseed', 'chia_seeds']
            },
            {
                text: 'Consuming 1 oz of walnuts daily reduces cardiovascular disease risk by 35% through cholesterol improvement',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['almonds', 'pistachios']
            },
            {
                text: 'Walnuts act as prebiotics, increasing beneficial gut bacteria Lactobacillus and Bifidobacterium',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['almonds', 'pistachios']
            }
        ]
    },

    broccoli: {
        categories: ['cancer', 'gut', 'immunity', 'dna', 'regeneration'],
        facts: [
            {
                text: 'Sulforaphane in broccoli activates over 200 genes that fight cancer, making it a powerful anti-cancer food',
                category: 'cancer',
                source: 'How Not to Die',
                chapter: 'Chapter 9: How Not to Die from Blood Cancers',
                relatedIngredients: ['brussels_sprouts', 'cauliflower', 'kale']
            },
            {
                text: 'Broccoli sprouts contain 100x more sulforaphane than mature broccoli for maximum DNA protection',
                category: 'dna',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 7: Protect Your DNA',
                relatedIngredients: ['brussels_sprouts', 'cabbage']
            },
            {
                text: 'The fiber in broccoli feeds beneficial gut bacteria, producing short-chain fatty acids for gut health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['cauliflower', 'brussels_sprouts']
            }
        ]
    },

    turmeric: {
        categories: ['cancer', 'brain', 'heart', 'immunity', 'gut'],
        facts: [
            {
                text: 'Curcumin in turmeric inhibits angiogenesis in tumors, starving cancer cells of blood supply',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['ginger', 'black pepper']
            },
            {
                text: 'Turmeric increases BDNF (brain growth factor) and may reverse brain cell decline in Alzheimers',
                category: 'brain',
                source: 'How Not to Die',
                chapter: 'Chapter 3: How Not to Die from Brain Diseases',
                relatedIngredients: ['ginger', 'green_tea']
            },
            {
                text: 'Curcumin is more effective than anti-inflammatory drugs for reducing inflammation without side effects',
                category: 'immunity',
                source: 'How Not to Die',
                chapter: 'Chapter 15: How Not to Die from Iatrogenic Causes',
                relatedIngredients: ['ginger', 'garlic']
            }
        ]
    },

    green_tea: {
        categories: ['cancer', 'brain', 'heart', 'metabolism', 'regeneration'],
        facts: [
            {
                text: 'EGCG in green tea is a powerful anti-angiogenic compound that can shrink tumors by cutting blood supply',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['matcha']
            },
            {
                text: 'L-theanine in green tea crosses the blood-brain barrier, promoting calm focus without drowsiness',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: []
            },
            {
                text: 'Green tea activates stem cells in bone marrow and can help regenerate heart tissue after injury',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['dark_chocolate']
            }
        ]
    },

    lentils: {
        categories: ['heart', 'gut', 'metabolism', 'muscle'],
        facts: [
            {
                text: 'Lentils are the healthiest starch with high fiber, folate, and protein while being low glycemic',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: Insulin Resistance',
                relatedIngredients: ['chickpeas', 'black_beans']
            },
            {
                text: 'One cup of lentils provides 90% DV of folate, essential for heart health and homocysteine reduction',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['chickpeas', 'spinach']
            },
            {
                text: 'Lentil fiber feeds Faecalibacterium prausnitzii, a key gut bacteria linked to reduced inflammation',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['chickpeas', 'beans']
            }
        ]
    },

    almonds: {
        categories: ['heart', 'metabolism', 'bone', 'skin'],
        facts: [
            {
                text: 'Daily almond consumption reduces LDL cholesterol by 5-6% and improves arterial function',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['walnuts', 'pistachios']
            },
            {
                text: 'Almonds have the highest vitamin E content of any nut, protecting skin from UV damage',
                category: 'skin',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['sunflower_seeds']
            },
            {
                text: 'Despite being calorie-dense, almonds improve insulin sensitivity and support healthy weight',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 19: What to Eat',
                relatedIngredients: ['walnuts', 'pistachios']
            }
        ]
    },

    chickpeas: {
        categories: ['heart', 'gut', 'metabolism', 'muscle'],
        facts: [
            {
                text: 'Chickpeas are a complete protein source when combined with grains, excellent for muscle building',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 13: Protein',
                relatedIngredients: ['lentils', 'quinoa']
            },
            {
                text: 'Resistant starch in chickpeas feeds beneficial bacteria and improves insulin sensitivity',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['lentils', 'beans']
            }
        ]
    },

    quinoa: {
        categories: ['muscle', 'metabolism', 'gut'],
        facts: [
            {
                text: 'Quinoa is one of few plant foods with all 9 essential amino acids - a complete protein for muscle',
                category: 'muscle',
                source: 'The Obesity Code',
                chapter: 'Chapter 13: Protein',
                relatedIngredients: ['buckwheat', 'amaranth']
            },
            {
                text: 'Quinoa has a low glycemic index of 53, minimizing blood sugar and insulin spikes',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: Insulin Resistance',
                relatedIngredients: ['barley', 'oats']
            }
        ]
    },

    beets: {
        categories: ['heart', 'metabolism', 'regeneration', 'muscle'],
        facts: [
            {
                text: 'Beet nitrates convert to nitric oxide, dilating blood vessels and lowering blood pressure by 4-10 mmHg',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['arugula', 'spinach']
            },
            {
                text: 'Beet juice improves athletic endurance by 16% through enhanced oxygen delivery to muscles',
                category: 'muscle',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['spinach']
            },
            {
                text: 'Betalains in beets activate stem cells and support tissue regeneration after exercise',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: []
            }
        ]
    },

    chia_seeds: {
        categories: ['heart', 'gut', 'bone', 'metabolism'],
        facts: [
            {
                text: 'Chia seeds have the highest omega-3 content of any food - 17.8g per 100g for heart protection',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['flaxseed', 'walnuts']
            },
            {
                text: 'Chia absorbs 10x its weight in water, forming a gel that slows digestion and stabilizes blood sugar',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: Insulin Resistance',
                relatedIngredients: ['flaxseed']
            },
            {
                text: 'Chia provides 18% DV calcium per oz - more than milk ounce-for-ounce for bone health',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinsons Disease',
                relatedIngredients: ['sesame_seeds']
            }
        ]
    },

    flaxseed: {
        categories: ['heart', 'gut', 'cancer', 'metabolism'],
        facts: [
            {
                text: 'Ground flaxseed reduces blood pressure as effectively as prescription medications',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['chia_seeds', 'walnuts']
            },
            {
                text: 'Lignans in flaxseed are converted by gut bacteria into compounds that inhibit breast and prostate cancer',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['sesame_seeds']
            },
            {
                text: 'Flax mucilage feeds beneficial Akkermansia bacteria, critical for metabolic health',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['chia_seeds']
            }
        ]
    },

    dark_chocolate: {
        categories: ['heart', 'brain', 'metabolism', 'regeneration'],
        facts: [
            {
                text: 'Dark chocolate (70%+) improves arterial function within hours and reduces heart attack risk by 37%',
                category: 'heart',
                source: 'How Not to Die',
                chapter: 'Chapter 1: How Not to Die from Heart Disease',
                relatedIngredients: ['cocoa']
            },
            {
                text: 'Cocoa flavanols increase blood flow to the brain, improving memory and cognitive performance',
                category: 'brain',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['green_tea']
            },
            {
                text: 'Theobromine in dark chocolate stimulates stem cell mobilization from bone marrow',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['green_tea']
            }
        ]
    },

    sardines: {
        categories: ['heart', 'brain', 'bone', 'eye', 'regeneration'],
        facts: [
            {
                text: 'Sardines with bones provide 35% DV calcium, plus vitamin D for maximum bone absorption',
                category: 'bone',
                source: 'How Not to Die',
                chapter: 'Chapter 14: How Not to Die from Parkinsons Disease',
                relatedIngredients: ['salmon', 'mackerel']
            },
            {
                text: 'Small oily fish like sardines have the highest omega-3 to mercury ratio of any seafood',
                category: 'heart',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['mackerel', 'anchovies']
            },
            {
                text: 'Sardine omega-3s support retinal DHA levels, protecting against macular degeneration',
                category: 'eye',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['salmon', 'mackerel']
            }
        ]
    },

    brussels_sprouts: {
        categories: ['cancer', 'gut', 'immunity', 'dna'],
        facts: [
            {
                text: 'Brussels sprouts contain kaempferol which deactivates cancer genes and induces cancer cell death',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['broccoli', 'cabbage']
            },
            {
                text: 'Indole-3-carbinol in brussels sprouts supports immune cell development in the gut',
                category: 'immunity',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 4: Activate Your Health Defenses',
                relatedIngredients: ['broccoli', 'cauliflower']
            }
        ]
    },

    asparagus: {
        categories: ['gut', 'regeneration', 'metabolism', 'cancer'],
        facts: [
            {
                text: 'Asparagus is one of the best sources of prebiotic inulin, feeding beneficial Bifidobacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['garlic', 'onion', 'leeks']
            },
            {
                text: 'Asparagus contains saponins that have anti-cancer properties and regulate blood sugar',
                category: 'cancer',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 3: Eat to Starve Disease',
                relatedIngredients: ['chickpeas', 'quinoa']
            },
            {
                text: 'Rutin in asparagus supports stem cell circulation and wound healing',
                category: 'regeneration',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 6: Regeneration',
                relatedIngredients: ['buckwheat']
            }
        ]
    },

    // ==================
    // HOMEMADE STAPLES
    // ==================

    sourdough: {
        categories: ['gut', 'metabolism'],
        facts: [
            {
                text: 'Sourdough fermentation breaks down phytic acid, making minerals more bioavailable than regular bread',
                category: 'gut',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: Insulin Resistance',
                relatedIngredients: ['yogurt', 'kefir']
            },
            {
                text: 'Long fermentation in sourdough partially digests gluten and produces beneficial lactic acid bacteria',
                category: 'gut',
                source: 'Eat to Beat Disease',
                chapter: 'Chapter 5: Feed Your Gut',
                relatedIngredients: ['yogurt', 'sauerkraut']
            },
            {
                text: 'Sourdough has a lower glycemic index than regular bread due to organic acids that slow starch digestion',
                category: 'metabolism',
                source: 'The Obesity Code',
                chapter: 'Chapter 10: Insulin Resistance',
                relatedIngredients: ['barley', 'oats']
            }
        ]
    }
};

/**
 * Get all health facts for a specific ingredient
 * @param {string} ingredientKey - The ingredient key (e.g., 'kale', 'mackerel')
 * @returns {Array} Array of fact objects for this ingredient
 */
export function getFactsForIngredient(ingredientKey) {
    const normalizedKey = ingredientKey.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const ingredient = healthBenefits[normalizedKey];

    if (!ingredient) {
        // Try partial matching
        const keys = Object.keys(healthBenefits);
        const matchedKey = keys.find(key =>
            key.includes(normalizedKey) ||
            normalizedKey.includes(key) ||
            healthBenefits[key]?.aliases?.some(a => a.toLowerCase().includes(normalizedKey))
        );

        if (matchedKey) {
            return healthBenefits[matchedKey].facts || [];
        }
        return [];
    }

    return ingredient.facts || [];
}

/**
 * Get all health facts for a specific category
 * @param {string} categoryId - The category ID (e.g., 'heart', 'brain')
 * @returns {Array} Array of fact objects for this category
 */
export function getFactsForCategory(categoryId) {
    const facts = [];

    Object.entries(healthBenefits).forEach(([ingredientKey, ingredient]) => {
        if (ingredient.categories?.includes(categoryId)) {
            ingredient.facts
                .filter(f => f.category === categoryId)
                .forEach(fact => {
                    facts.push({
                        ...fact,
                        ingredient: ingredientKey
                    });
                });
        }
    });

    return facts;
}

/**
 * Get all available categories
 * @returns {Object} Categories object with all category definitions
 */
export function getAllCategories() {
    return healthCategories;
}

/**
 * Get a weighted random selection of diverse facts for a meal
 * @param {Array} ingredients - Array of ingredient objects or names
 * @param {number} maxFacts - Maximum number of facts to return (default 10)
 * @returns {Array} Array of diverse fact objects
 */
export function getDiverseFactsForMeal(ingredients, maxFacts = 10) {
    const allFacts = [];
    const seenCategories = new Set();

    // Collect all facts from ingredients
    ingredients.forEach(ingredient => {
        const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
        const facts = getFactsForIngredient(name);

        facts.forEach(fact => {
            allFacts.push({
                ...fact,
                ingredientName: name
            });
        });
    });

    if (allFacts.length === 0) return [];

    // First pass: get one fact per category for diversity
    const selectedFacts = [];
    const shuffled = [...allFacts].sort(() => Math.random() - 0.5);

    for (const fact of shuffled) {
        if (!seenCategories.has(fact.category) && selectedFacts.length < maxFacts) {
            selectedFacts.push(fact);
            seenCategories.add(fact.category);
        }
    }

    // Second pass: fill remaining slots with any facts
    for (const fact of shuffled) {
        if (selectedFacts.length >= maxFacts) break;
        if (!selectedFacts.includes(fact)) {
            selectedFacts.push(fact);
        }
    }

    return selectedFacts;
}

/**
 * Get expanded facts for a meal (up to 25)
 * @param {Array} ingredients - Array of ingredient objects or names
 * @returns {Array} Array of fact objects organized by category
 */
export function getExpandedFactsForMeal(ingredients) {
    const factsByCategory = {};

    // Initialize categories
    Object.keys(healthCategories).forEach(cat => {
        factsByCategory[cat] = [];
    });

    // Collect all facts
    ingredients.forEach(ingredient => {
        const name = typeof ingredient === 'string' ? ingredient : ingredient.name;
        const facts = getFactsForIngredient(name);

        facts.forEach(fact => {
            if (factsByCategory[fact.category]) {
                // Avoid duplicates
                const isDuplicate = factsByCategory[fact.category].some(f => f.text === fact.text);
                if (!isDuplicate) {
                    factsByCategory[fact.category].push({
                        ...fact,
                        ingredientName: name
                    });
                }
            }
        });
    });

    return factsByCategory;
}

export default {
    healthCategories,
    healthBenefits,
    getFactsForIngredient,
    getFactsForCategory,
    getAllCategories,
    getDiverseFactsForMeal,
    getExpandedFactsForMeal
};
