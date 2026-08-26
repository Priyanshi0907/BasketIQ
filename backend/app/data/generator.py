"""
Generates a synthetic but *behaviourally realistic* retail transaction log.

Real point-of-sale data isn't available offline, so transactions are sampled
from "basket archetypes" (breakfast, party, cleaning, dinner, ...). Each
archetype defines a core set of products that co-occur frequently plus a pool
of related products sampled probabilistically, and a small amount of random
noise. This produces a dataset with genuine, explainable co-purchase
structure so Apriori/FP-Growth and the classifier learn meaningful patterns
instead of memorizing randomness.
"""
import random
from datetime import datetime, timedelta

from app.data.catalog import PRODUCTS, PRODUCT_BY_ID

random.seed(42)

ARCHETYPES = [
    {
        "name": "Chai time & evening snacks",
        "core": ["tea", "milk", "sugar"],
        "pool": {
            "rusk": 0.50, "khari": 0.40, "marie_biscuits": 0.45, "glucose_biscuits": 0.45,
            "cream_biscuits": 0.35, "bhujia": 0.45, "namkeen": 0.40, "khakhra": 0.30,
            "gathiya": 0.35, "methi_puri": 0.30, "banana_chips_salted": 0.30, "diet_chivda": 0.30,
            "murukku": 0.35, "cookies": 0.35, "cardamom": 0.25, "ginger": 0.35,
            "wafers": 0.25, "bun": 0.30, "roasted_peanuts": 0.35, "masala_peanuts": 0.30,
            "roasted_makhana": 0.30, "kaju_katli": 0.20, "besan_ladoo": 0.25, "motichoor_ladoo": 0.25
        },
    },
    {
        "name": "Breakfast & cafe bakery",
        "core": ["bread", "butter", "eggs"],
        "pool": {
            "brown_bread": 0.35, "multigrain_bread": 0.30, "sourdough_bread": 0.25, "focaccia_bread": 0.20,
            "brioche_buns": 0.25, "cinnamon_roll": 0.25, "english_muffins": 0.25, "banana_bread": 0.25,
            "gluten_free_bread": 0.20, "garlic_bread": 0.25, "bagel": 0.35, "muffin": 0.35,
            "croissant": 0.30, "jam": 0.45, "marmalade": 0.25, "fruit_spread": 0.25, "cheese": 0.35,
            "cheese_slices": 0.35, "cheese_spread": 0.30, "cereal": 0.35, "corn_flakes": 0.35,
            "muesli": 0.30, "honey": 0.30, "pancake_mix": 0.25, "waffles": 0.25,
            "oats": 0.30, "peanut_butter": 0.30, "almond_butter": 0.25, "cashew_butter": 0.20,
            "hazelnut_spread": 0.25, "coffee": 0.40, "milk": 0.50, "brown_eggs": 0.25,
            "bread_spread": 0.25, "digestive_biscuits": 0.25
        },
    },
    {
        "name": "South Indian breakfast prep",
        "core": ["idli_batter", "sambar_powder"],
        "pool": {
            "toor_dal": 0.45, "urad_dal": 0.35, "chana_dal_roasted": 0.35, "mustard_seeds": 0.50,
            "curry_leaves": 0.55, "coconut": 0.50, "filter_coffee": 0.50, "upma_mix": 0.40,
            "coriander_leaves": 0.40, "green_chili": 0.35, "ginger": 0.30, "ghee": 0.35,
            "tamarind": 0.40, "drumstick": 0.30, "shallots": 0.40, "onion": 0.35, "murukku": 0.25,
            "sona_masoori_rice": 0.30, "idli_rice": 0.40, "sesame_oil": 0.30, "rasam_powder": 0.35,
            "parotta": 0.25
        },
    },
    {
        "name": "Poha, upma & quick breakfast",
        "core": ["poha", "semolina", "mustard_seeds"],
        "pool": {
            "green_chili": 0.45, "onion": 0.45, "potato": 0.40, "curry_leaves": 0.50,
            "groundnut_oil": 0.35, "lemon": 0.40, "coriander_leaves": 0.40,
            "turmeric_powder": 0.35, "tea": 0.35, "sugar": 0.30, "vermicelli": 0.35,
            "roasted_peanuts": 0.40, "dalia": 0.30, "foxtail_millet": 0.20
        },
    },
    {
        "name": "Daily Indian sabzi & roti dinner",
        "core": ["atta", "onion", "tomato", "potato"],
        "pool": {
            "cooking_oil": 0.50, "mustard_oil": 0.35, "turmeric_powder": 0.45, "chili_powder": 0.45,
            "degi_mirch": 0.35, "coriander_powder": 0.40, "cumin_seeds": 0.40, "mustard_seeds": 0.35,
            "ginger": 0.40, "garlic": 0.40, "green_chili": 0.40, "coriander_leaves": 0.45,
            "salt": 0.50, "garlic_paste": 0.30, "ghee": 0.35, "multigrain_atta": 0.20,
            "kasuri_methi": 0.30, "garam_masala": 0.35, "kitchen_king": 0.35, "amchur_powder": 0.30,
            "spices": 0.40, "naan": 0.25, "kulcha": 0.20
        },
    },
    {
        "name": "Dal-Chawal comfort meal",
        "core": ["toor_dal", "rice", "ghee"],
        "pool": {
            "cumin_seeds": 0.50, "hing": 0.45, "turmeric_powder": 0.45, "mustard_seeds": 0.40,
            "papad": 0.50, "pickle": 0.45, "salt": 0.45, "moong_dal": 0.35, "chana_dal": 0.30,
            "masoor_dal": 0.30, "urad_dal": 0.25, "moth_dal": 0.20, "lobia": 0.20,
            "basmati_rice": 0.35, "sona_masoori_rice": 0.35, "red_rice": 0.20, "tamarind": 0.25,
            "curd": 0.40, "green_moong": 0.25
        },
    },
    {
        "name": "Biryani & festive pulao feast",
        "core": ["basmati_rice", "biryani_masala", "ghee"],
        "pool": {
            "chicken": 0.45, "boneless_chicken": 0.35, "mutton": 0.25, "paneer": 0.30,
            "jeera_samba_rice": 0.30, "onion": 0.50, "shallots": 0.30, "tomato": 0.40,
            "ginger": 0.40, "garlic": 0.40, "garlic_paste": 0.45, "curd": 0.45, "mint_leaves": 0.45,
            "coriander_leaves": 0.45, "cloves": 0.35, "cardamom": 0.35, "black_cardamom": 0.30,
            "cinnamon_sticks": 0.35, "bay_leaves": 0.40, "star_anise": 0.30, "mace": 0.25,
            "caraway_seeds": 0.30, "cashews": 0.30, "raisins": 0.25, "a2_cow_ghee": 0.25
        },
    },
    {
        "name": "Pav Bhaji & street food evening",
        "core": ["bun", "pav_bhaji_masala", "butter"],
        "pool": {
            "potato": 0.55, "tomato": 0.55, "onion": 0.55, "capsicum": 0.45, "green_peas": 0.45,
            "cauliflower": 0.35, "ginger": 0.35, "garlic": 0.40, "coriander_leaves": 0.50,
            "lemon": 0.50, "chili_powder": 0.40, "green_chili": 0.35, "amchur_powder": 0.30
        },
    },
    {
        "name": "North Indian paneer feast",
        "core": ["paneer", "butter", "cream"],
        "pool": {
            "tomato_puree": 0.50, "garlic_paste": 0.45, "spices": 0.45, "shahi_paneer_masala": 0.45,
            "garam_masala": 0.40, "cashews": 0.35, "capsicum": 0.40, "capsicum_red": 0.30,
            "onion": 0.45, "basmati_rice": 0.40, "atta": 0.35, "maida": 0.25, "naan": 0.35,
            "kulcha": 0.30, "methi_leaves": 0.30, "kasuri_methi": 0.40, "frozen_peas": 0.40,
            "curd": 0.35, "frozen_paneer_tikka": 0.25, "fried_paneer_cubes": 0.25
        },
    },
    {
        "name": "Rajma & chole rice feast",
        "core": ["rajma", "chickpeas", "basmati_rice"],
        "pool": {
            "onion": 0.50, "tomato": 0.50, "ginger": 0.40, "garlic": 0.40, "spices": 0.45,
            "chole_masala": 0.45, "garam_masala": 0.40, "anardana_powder": 0.35, "amchur_powder": 0.35,
            "cumin_seeds": 0.35, "cooking_oil": 0.40, "coriander_leaves": 0.40, "green_chili": 0.35,
            "curd": 0.35, "papad": 0.40, "pickle": 0.35, "kala_chana": 0.30, "kulcha": 0.35
        },
    },
    {
        "name": "Non-veg Sunday feast",
        "core": ["chicken", "onion", "tomato"],
        "pool": {
            "mutton": 0.25, "fish": 0.30, "fish_fillet": 0.25, "prawns": 0.25, "crab": 0.20,
            "boneless_chicken": 0.35, "sausages": 0.20, "chicken_sausages": 0.25,
            "meat_masala": 0.40, "fish_curry_masala": 0.35, "tandoori_masala": 0.35,
            "ginger": 0.40, "garlic": 0.40, "garlic_paste": 0.40, "spices": 0.50,
            "garam_masala": 0.45, "cooking_oil": 0.45, "mustard_oil": 0.30, "basmati_rice": 0.45,
            "coriander_leaves": 0.45, "green_chili": 0.35, "lemon": 0.40
        },
    },
    {
        "name": "Desi Chinese & Indo-Asian",
        "core": ["hakka_noodles", "schezwan_sauce", "soy_sauce"],
        "pool": {
            "noodles": 0.40, "cup_noodles": 0.30, "ramen_korean_spicy": 0.35, "soba_noodles": 0.25,
            "udon_noodles": 0.25, "rice_noodles": 0.25, "egg_noodles": 0.30, "vinegar": 0.45,
            "chili_sauce": 0.40, "sweet_chilli_sauce": 0.35, "teriyaki_sauce": 0.30,
            "thai_green_curry_paste": 0.25, "thai_red_curry_paste": 0.25, "coconut_milk": 0.35,
            "sushi_nori_sheets": 0.20, "sushi_rice": 0.20, "capsicum": 0.45, "capsicum_red": 0.30,
            "cabbage": 0.45, "spring_onion": 0.40, "bok_choy": 0.25, "carrot": 0.40,
            "onion": 0.40, "garlic": 0.40, "ginger": 0.35, "frozen_momos": 0.35,
            "frozen_spring_roll": 0.30, "corn_flour": 0.30
        },
    },
    {
        "name": "Pasta & Italian gourmet night",
        "core": ["pasta", "pasta_sauce", "olive_oil"],
        "pool": {
            "penne": 0.45, "spaghetti": 0.40, "cheese": 0.45, "cheddar_cheese": 0.35,
            "mozzarella": 0.45, "shredded_mozzarella": 0.40, "parmesan_shredded": 0.35,
            "ricotta_cheese": 0.25, "feta_cheese": 0.25, "gouda_cheese": 0.25, "mascarpone": 0.20,
            "tomato_puree": 0.40, "balsamic_vinegar": 0.30, "truffle_oil": 0.20, "garlic": 0.40,
            "mayonnaise": 0.30, "onion": 0.35, "capsicum": 0.35, "mushroom": 0.40,
            "broccoli": 0.35, "zucchini": 0.30, "asparagus": 0.25, "arugula": 0.25,
            "frozen_pizza": 0.30, "garlic_bread": 0.40, "focaccia_bread": 0.30, "frozen_garlic_bread": 0.30,
            "salad_dressing": 0.25, "bread_crumbs": 0.20
        },
    },
    {
        "name": "Healthy morning oats & smoothies",
        "core": ["oats", "milk", "honey"],
        "pool": {
            "almond_milk": 0.40, "oat_milk": 0.35, "soy_milk": 0.30, "peanut_butter": 0.40,
            "almond_butter": 0.30, "cashew_butter": 0.25, "banana": 0.50, "apple": 0.40,
            "blueberries": 0.35, "raspberries": 0.30, "blackberries": 0.25, "cranberries": 0.25,
            "granola_bar": 0.35, "muesli": 0.40, "protein_powder": 0.35, "plant_protein_powder": 0.30,
            "green_apple": 0.30, "almonds": 0.40, "walnuts": 0.35, "fresh_figs": 0.25
        },
    },
    {
        "name": "Dairy daily run",
        "core": ["milk", "curd", "paneer"],
        "pool": {
            "butter": 0.45, "unsalted_white_butter": 0.30, "garlic_herb_butter": 0.25, "ghee": 0.40,
            "a2_cow_ghee": 0.30, "buttermilk": 0.50, "lassi": 0.40, "cream": 0.35, "sour_cream": 0.25,
            "mishti_doi": 0.35, "flavored_milk": 0.30, "skimmed_milk": 0.25, "greek_yogurt": 0.30,
            "probiotic_drink": 0.30, "flavored_yogurt_strawberry": 0.25, "flavored_yogurt_mango": 0.25,
            "labneh": 0.20, "tofu": 0.20, "milk_powder": 0.25, "condensed_milk": 0.25,
            "cheese_slices": 0.35, "almond_milk": 0.20, "soy_milk": 0.20
        },
    },
    {
        "name": "Fresh green vegetables restock",
        "core": ["onion", "tomato", "potato"],
        "pool": {
            "spinach": 0.40, "baby_spinach": 0.30, "kale": 0.25, "bok_choy": 0.25, "methi_leaves": 0.35,
            "okra": 0.40, "cauliflower": 0.40, "cabbage": 0.35, "red_cabbage": 0.25, "broccoli": 0.35,
            "asparagus": 0.25, "brussels_sprouts": 0.20, "leek": 0.25, "mushroom": 0.35,
            "brinjal": 0.35, "bottle_gourd": 0.35, "ridge_gourd": 0.30, "bitter_gourd": 0.30,
            "pointed_gourd": 0.25, "ivy_gourd": 0.25, "colocasia": 0.25, "elephant_yam": 0.20,
            "lotus_stem": 0.20, "raw_mango": 0.30, "drumstick": 0.30, "beans": 0.35,
            "green_peas": 0.40, "radish": 0.30, "beetroot": 0.30, "pumpkin": 0.30,
            "sweet_potato": 0.25, "zucchini": 0.25, "lemon": 0.40, "green_chili": 0.45,
            "jalapeno": 0.25, "coriander_leaves": 0.50, "mint_leaves": 0.35, "curry_leaves": 0.35,
            "cucumber": 0.40, "cherry_tomatoes": 0.30, "shallots": 0.35, "spring_onion": 0.30,
            "raw_banana": 0.25
        },
    },
    {
        "name": "Fresh fruit basket",
        "core": ["banana", "apple", "mango"],
        "pool": {
            "green_apple": 0.35, "blueberries": 0.30, "raspberries": 0.25, "blackberries": 0.25,
            "cranberries": 0.25, "dragon_fruit": 0.25, "papaya": 0.40, "pomegranate": 0.45,
            "watermelon": 0.40, "guava": 0.35, "grapes": 0.40, "orange": 0.40, "mosambi": 0.40,
            "grapefruit": 0.25, "pineapple": 0.30, "passion_fruit": 0.25, "custard_apple": 0.25,
            "chikoo": 0.35, "kiwi": 0.30, "pear": 0.30, "peach": 0.30, "fresh_apricots": 0.25,
            "fresh_figs": 0.25, "cherries": 0.30, "litchi": 0.30, "strawberry": 0.35,
            "coconut": 0.35, "amla": 0.30, "avocado": 0.25
        },
    },
    {
        "name": "Festive & puja shopping",
        "core": ["agarbatti", "diya", "camphor"],
        "pool": {
            "cotton_wicks": 0.55, "brass_diya": 0.35, "brass_bell": 0.30, "pooja_thali_set": 0.25,
            "sandalwood_paste": 0.35, "toran_door_hanging": 0.30, "puja_oil": 0.45,
            "roli_kumkum": 0.50, "rangoli_colors": 0.40, "havan_samagri": 0.35, "gangajal": 0.40,
            "dhoop_cones": 0.45, "ghee": 0.45, "a2_cow_ghee": 0.30, "matchbox": 0.50,
            "cardamom": 0.30, "cloves": 0.30, "sugar": 0.30, "jaggery": 0.30, "dates": 0.30,
            "coconut": 0.40, "sabudana": 0.30, "singhara_atta": 0.25, "kuttu_atta": 0.25,
            "barnyard_millet": 0.25, "vermicelli": 0.25
        },
    },
    {
        "name": "Dry fruits & gifting",
        "core": ["almonds", "cashews"],
        "pool": {
            "raisins": 0.50, "walnuts": 0.40, "pistachios": 0.40, "dates": 0.45,
            "dried_figs": 0.30, "dried_apricots": 0.30, "gift_wrap": 0.30,
            "festive_gift_box": 0.35, "chocolate": 0.35, "dark_chocolate": 0.30,
            "kaju_katli": 0.35, "besan_ladoo": 0.30, "motichoor_ladoo": 0.30, "honey": 0.30,
            "dry_fruit_mixture": 0.35, "soan_papdi": 0.30, "gulab_jamun_tin": 0.25,
            "rasgulla_tin": 0.25
        },
    },
    {
        "name": "Party & celebration prep",
        "core": ["balloons", "cake", "candles"],
        "pool": {
            "paper_plates": 0.60, "streamers": 0.50, "party_hats": 0.40, "gift_wrap": 0.35,
            "soft_drink": 0.50, "coke_zero": 0.35, "sparkling_water": 0.30, "ginger_ale": 0.30,
            "chips": 0.45, "nachos": 0.40, "salsa_dip": 0.35, "guacamole_dip": 0.30,
            "hummus_classic": 0.30, "pita_chips": 0.30, "pretzel_twists": 0.30,
            "caramel_popcorn": 0.35, "cheese_popcorn": 0.35, "chocolate": 0.40,
            "dark_chocolate": 0.30, "juice": 0.35, "confetti": 0.35, "party_poppers": 0.30,
            "disposable_cups": 0.40, "disposable_cutlery": 0.35, "party_banner": 0.30,
            "greeting_card": 0.25, "floating_candles": 0.25
        },
    },
    {
        "name": "Household cleaning & laundry restock",
        "core": ["detergent", "dish_soap", "floor_cleaner"],
        "pool": {
            "detergent_liquid": 0.45, "fabric_conditioner": 0.45, "fabric_whitener": 0.30,
            "stain_remover": 0.35, "dishwash_bar": 0.40, "dishwasher_tablets": 0.30,
            "dishwasher_rinse_aid": 0.25, "kitchen_degreaser": 0.35, "bathroom_cleaner_spray": 0.35,
            "disinfectant_liquid": 0.40, "toilet_cleaner": 0.55, "trash_bags": 0.55,
            "garbage_bags_drawstring": 0.35, "paper_towels": 0.50, "air_freshener": 0.40,
            "scented_candles_lavender": 0.30, "sponge": 0.45, "steel_wool_scrubber": 0.40,
            "microfiber_cloth": 0.35, "rubber_gloves": 0.30, "glass_cleaner": 0.35,
            "drain_cleaner": 0.30, "broom": 0.30, "mop": 0.25, "floor_wiper": 0.25,
            "mosquito_repellent": 0.35, "naphthalene_balls": 0.25, "toilet_paper": 0.35,
            "matchbox": 0.30
        },
    },
    {
        "name": "Kitchen wrap & food storage",
        "core": ["aluminium_foil", "cling_wrap", "trash_bags"],
        "pool": {
            "paper_towels": 0.50, "sponge": 0.40, "dish_soap": 0.40, "matchbox": 0.35,
            "salt": 0.30, "sugar": 0.30
        },
    },
    {
        "name": "Personal care & grooming restock",
        "core": ["shampoo", "soap", "toothpaste"],
        "pool": {
            "toothbrush": 0.55, "dental_floss_picks": 0.30, "body_wash": 0.40, "cocoa_body_butter": 0.30,
            "hand_wash": 0.45, "hair_conditioner": 0.40, "hair_serum": 0.30, "dry_shampoo": 0.25,
            "deep_conditioning_hair_mask": 0.25, "hair_oil": 0.50, "face_wash": 0.40, "face_scrub": 0.30,
            "micellar_water": 0.30, "toner_rose_water": 0.30, "hyaluronic_acid_serum": 0.30,
            "vitamin_c_serum": 0.30, "sheet_mask": 0.35, "under_eye_cream": 0.25,
            "moisturizing_cream": 0.35, "deodorant": 0.45, "razor": 0.35, "shaving_cream": 0.30,
            "shaving_foam": 0.30, "beard_oil": 0.25, "beard_wash": 0.25, "hair_wax_matte": 0.25,
            "depilatory_cream": 0.25, "talcum_powder": 0.35, "body_lotion": 0.35,
            "sunscreen": 0.30, "sunscreen_spf50": 0.30, "mouthwash": 0.25, "comb": 0.30,
            "cotton": 0.30, "cotton_pads": 0.30, "lip_balm": 0.25, "hand_sanitizer": 0.30,
            "hair_color": 0.25, "sanitary_pads": 0.40
        },
    },
    {
        "name": "Baby care shopping",
        "core": ["diapers", "baby_wipes", "baby_food"],
        "pool": {
            "baby_cereal": 0.45, "baby_puree_pouches": 0.35, "baby_oil": 0.40, "baby_lotion": 0.35,
            "baby_powder": 0.35, "baby_soap": 0.40, "baby_shampoo": 0.35, "baby_sunscreen": 0.25,
            "feeding_bottle": 0.30, "baby_cotton_buds": 0.30, "diaper_rash_cream": 0.35,
            "baby_bottle_cleaner": 0.30, "gripe_water": 0.25
        },
    },
    {
        "name": "Health, wellness & home pharmacy",
        "core": ["protein_powder", "multivitamin"],
        "pool": {
            "plant_protein_powder": 0.30, "creatine_monohydrate": 0.30, "fish_oil_omega3": 0.35,
            "biotin_tablets": 0.30, "ashwagandha_capsules": 0.30, "vitamin_c_chewable": 0.40,
            "ors": 0.35, "digestive_tablets": 0.40, "antacid_gel": 0.35, "immunity_syrup": 0.35,
            "glucose_powder": 0.35, "pain_relief_spray": 0.35, "pain_relief_balm": 0.35,
            "antiseptic_liquid": 0.40, "cough_lozenges": 0.35, "digital_thermometer": 0.25,
            "first_aid_kit": 0.30, "aloe_vera_gel": 0.30, "green_tea": 0.40, "chamomile_tea": 0.30,
            "amla_juice": 0.30, "aloe_vera_juice": 0.30, "apple_cider_vinegar": 0.25,
            "protein_bar": 0.35, "granola_bar": 0.30, "oats": 0.35, "quinoa": 0.25, "brown_rice": 0.30
        },
    },
    {
        "name": "Frozen convenience snacks",
        "core": ["frozen_fries", "frozen_nuggets", "frozen_samosa"],
        "pool": {
            "frozen_aloo_tikki": 0.40, "frozen_veg_cutlet": 0.35, "frozen_chilli_garlic_potato_pops": 0.35,
            "frozen_cheese_balls": 0.30, "frozen_onion_rings": 0.30, "frozen_momos": 0.40,
            "frozen_spring_roll": 0.35, "frozen_paratha": 0.40, "frozen_aloo_paratha": 0.35,
            "frozen_paneer_paratha": 0.30, "frozen_peas": 0.40, "frozen_corn": 0.35,
            "frozen_mixed_veg": 0.35, "frozen_paneer_tikka": 0.35, "frozen_chicken_tikka": 0.30,
            "frozen_fish_fingers": 0.30, "frozen_pizza": 0.30, "frozen_garlic_bread": 0.30,
            "ice_cream": 0.45, "gelato_belgian_chocolate": 0.30, "mango_sorbet": 0.25,
            "kulfi": 0.35, "ketchup": 0.50, "schezwan_sauce": 0.35, "green_chutney": 0.35,
            "tamarind_chutney": 0.35, "peri_peri_sauce": 0.30, "barbecue_sauce": 0.25
        },
    },
    {
        "name": "Evening samosa, pakora & chaat treat",
        "core": ["frozen_samosa", "tea", "green_chutney"],
        "pool": {
            "tamarind_chutney": 0.50, "besan": 0.40, "onion": 0.45, "potato": 0.40,
            "cooking_oil": 0.35, "curd": 0.45, "poha": 0.30, "bhujia": 0.40,
            "namkeen": 0.40, "chips": 0.35, "soft_drink": 0.35, "glucose_biscuits": 0.30,
            "chaat_masala": 0.40, "amchur_powder": 0.30
        },
    },
    {
        "name": "Pet care & pampering",
        "core": ["dog_food"],
        "pool": {
            "wet_dog_food_pouches": 0.45, "cat_food": 0.30, "wet_cat_food_pouches": 0.35,
            "pet_shampoo": 0.40, "pet_treats": 0.50, "pet_chew_bones": 0.45,
            "pet_biscuits": 0.45, "pet_grooming_brush": 0.30, "pet_dental_spray": 0.25,
            "cat_litter": 0.30
        },
    },
    {
        "name": "Weekly grocery mega pantry run",
        "core": ["atta", "rice", "cooking_oil", "toor_dal"],
        "pool": {
            "sugar": 0.55, "brown_sugar": 0.30, "salt": 0.55, "rock_salt": 0.35, "black_salt": 0.30,
            "besan": 0.40, "maida": 0.35, "poha": 0.35, "semolina": 0.35, "dalia": 0.30,
            "ragi_flour": 0.25, "jowar_flour": 0.25, "bajra_flour": 0.25, "sona_masoori_rice": 0.40,
            "basmati_rice": 0.40, "idli_rice": 0.30, "moong_dal": 0.35, "chana_dal": 0.35,
            "chana_dal_roasted": 0.30, "urad_dal": 0.35, "masoor_dal": 0.30, "rajma": 0.35,
            "chickpeas": 0.35, "kala_chana": 0.30, "lobia": 0.25, "moth_dal": 0.25,
            "soya_beans": 0.25, "soya_chunks": 0.35, "corn_flour": 0.30, "rice_flour": 0.30,
            "jaggery": 0.35, "turmeric_powder": 0.45, "chili_powder": 0.45, "degi_mirch": 0.35,
            "coriander_powder": 0.40, "cumin_seeds": 0.40, "mustard_seeds": 0.40, "garam_masala": 0.40,
            "kitchen_king": 0.35, "hing": 0.35, "ghee": 0.40, "a2_cow_ghee": 0.25,
            "mustard_oil": 0.30, "sunflower_oil": 0.30, "rice_bran_oil": 0.25, "canola_oil": 0.20,
            "papad": 0.35, "pickle": 0.35, "kasuri_methi": 0.30
        },
    },
    {
        "name": "Summer refreshment & cool drinks",
        "core": ["ice_cream", "soft_drink", "lemon"],
        "pool": {
            "mint_leaves": 0.45, "soda_water": 0.50, "sparkling_water": 0.35, "tonic_water": 0.30,
            "ginger_ale": 0.30, "packaged_water": 0.45, "iced_tea": 0.40, "iced_tea_peach": 0.35,
            "coconut_water": 0.45, "rose_syrup": 0.40, "lemonade": 0.45, "juice": 0.40,
            "mango_frooti": 0.35, "glucose_powder": 0.35, "buttermilk": 0.40, "lassi": 0.40,
            "kulfi": 0.35, "gelato_belgian_chocolate": 0.25, "mango_sorbet": 0.30, "watermelon": 0.40,
            "mango": 0.45, "cold_coffee": 0.35, "kombucha_ginger": 0.25
        },
    },
    {
        "name": "Snacking, movies & munchies",
        "core": ["chips", "cookies", "chocolate"],
        "pool": {
            "dark_chocolate": 0.35, "nachos": 0.45, "salsa_dip": 0.40, "guacamole_dip": 0.30,
            "roasted_peanuts": 0.40, "masala_peanuts": 0.35, "roasted_makhana": 0.35, "wafers": 0.40,
            "popcorn": 0.45, "caramel_popcorn": 0.35, "cheese_popcorn": 0.35, "pretzel_twists": 0.30,
            "banana_chips_salted": 0.30, "banana_chips_peri_peri": 0.30, "tapioca_chips": 0.30,
            "energy_drink": 0.30, "coke_zero": 0.35, "iced_tea": 0.30, "cold_coffee": 0.30,
            "soft_drink": 0.40, "cream_biscuits": 0.40, "noodles": 0.40, "cup_noodles": 0.35,
            "ramen_korean_spicy": 0.35, "ketchup": 0.40, "mayonnaise": 0.35, "peri_peri_sauce": 0.30,
            "kaju_katli": 0.25, "besan_ladoo": 0.25, "motichoor_ladoo": 0.25, "gulab_jamun_tin": 0.25,
            "rasgulla_tin": 0.25, "soan_papdi": 0.25
        },
    },
]

ALL_IDS = [p["id"] for p in PRODUCTS]


def _sample_basket(archetype):
    items = set(archetype["core"])
    for pid, prob in archetype["pool"].items():
        if random.random() < prob:
            items.add(pid)
    # small chance of a random cross-category item (real shoppers aren't perfectly tidy)
    if random.random() < 0.12:
        items.add(random.choice(ALL_IDS))
    return list(items)


ARCHETYPE_WEIGHTS = [1.0] * len(ARCHETYPES)


def generate_transactions(n=10000, start_days_ago=120):
    """Returns list of dicts: {id, date, archetype, items: [product_id,...]}"""
    transactions = []
    today = datetime.now()
    for i in range(n):
        archetype = random.choices(
            ARCHETYPES,
            weights=ARCHETYPE_WEIGHTS,
            k=1,
        )[0]
        items = _sample_basket(archetype)
        day_offset = random.randint(0, start_days_ago)
        date = today - timedelta(days=day_offset, hours=random.randint(0, 23))
        transactions.append({
            "id": f"TXN{i+1:05d}",
            "date": date.strftime("%Y-%m-%d"),
            "archetype": archetype["name"],
            "items": items,
        })
    return transactions


# Generated once at import time; cheap and deterministic (seeded).
TRANSACTIONS = generate_transactions()
