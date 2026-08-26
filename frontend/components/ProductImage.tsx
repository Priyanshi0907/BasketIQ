"use client";

/**
 * Product visual — renders a tailored, distinct icon badge for each product.
 * Uses category-specific pastel palette tints and subtle accents to make every
 * item visually distinctive and recognizable.
 */

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text?: string }> = {
  "Breakfast & Bakery": { bg: "bg-amber-50/80 hover:bg-amber-100/70", border: "border-amber-200/60" },
  "Dairy & Essentials": { bg: "bg-sky-50/80 hover:bg-sky-100/70", border: "border-sky-200/60" },
  "Fruits & Vegetables": { bg: "bg-emerald-50/80 hover:bg-emerald-100/70", border: "border-emerald-200/60" },
  "Snacks & Beverages": { bg: "bg-orange-50/80 hover:bg-orange-100/70", border: "border-orange-200/60" },
  "Party & Celebration": { bg: "bg-pink-50/80 hover:bg-pink-100/70", border: "border-pink-200/60" },
  "Home & Cleaning": { bg: "bg-cyan-50/80 hover:bg-cyan-100/70", border: "border-cyan-200/60" },
  "Personal Care": { bg: "bg-purple-50/80 hover:bg-purple-100/70", border: "border-purple-200/60" },
  "Daily Essentials": { bg: "bg-yellow-50/80 hover:bg-yellow-100/70", border: "border-yellow-200/60" },
  "Baby Care": { bg: "bg-rose-50/80 hover:bg-rose-100/70", border: "border-rose-200/60" },
  "Meat & Seafood": { bg: "bg-red-50/80 hover:bg-red-100/70", border: "border-red-200/60" },
  "Grains & Pasta": { bg: "bg-stone-50/80 hover:bg-stone-100/70", border: "border-stone-200/60" },
  "Condiments & Sauces": { bg: "bg-amber-50/80 hover:bg-amber-100/70", border: "border-amber-200/60" },
  "Frozen Foods": { bg: "bg-blue-50/80 hover:bg-blue-100/70", border: "border-blue-200/60" },
  "Dry Fruits & Nuts": { bg: "bg-amber-100/60 hover:bg-amber-200/60", border: "border-amber-300/60" },
  "Health & Wellness": { bg: "bg-teal-50/80 hover:bg-teal-100/70", border: "border-teal-200/60" },
  "Festive & Religious": { bg: "bg-orange-100/60 hover:bg-orange-200/60", border: "border-orange-300/60" },
  "Pet Care": { bg: "bg-lime-50/80 hover:bg-lime-100/70", border: "border-lime-200/60" },
};

function getCategoryFromId(id?: string): string {
  if (!id) return "Daily Essentials";
  if (id.includes("bread") || id.includes("bun") || id.includes("muffin") || id.includes("waffle") || id.includes("croissant") || id.includes("cereal") || id.includes("oats") || id.includes("jam")) return "Breakfast & Bakery";
  if (id.includes("milk") || id.includes("cheese") || id.includes("paneer") || id.includes("curd") || id.includes("ghee") || id.includes("butter") || id.includes("yogurt")) return "Dairy & Essentials";
  if (id.includes("apple") || id.includes("banana") || id.includes("mango") || id.includes("tomato") || id.includes("onion") || id.includes("potato") || id.includes("spinach") || id.includes("lemon") || id.includes("chili") || id.includes("garlic") || id.includes("ginger") || id.includes("mushroom") || id.includes("broccoli") || id.includes("berry") || id.includes("fruit")) return "Fruits & Vegetables";
  if (id.includes("chips") || id.includes("chocolate") || id.includes("cookie") || id.includes("biscuit") || id.includes("tea") || id.includes("coffee") || id.includes("soda") || id.includes("juice") || id.includes("popcorn") || id.includes("namkeen") || id.includes("ladoo") || id.includes("sweet")) return "Snacks & Beverages";
  if (id.includes("cleaner") || id.includes("detergent") || id.includes("soap") && id.includes("dish") || id.includes("mop") || id.includes("broom") || id.includes("trash") || id.includes("paper_towel")) return "Home & Cleaning";
  if (id.includes("shampoo") || id.includes("lotion") || id.includes("serum") || id.includes("toothpaste") || id.includes("sunscreen") || id.includes("razor") || id.includes("cream") && id.includes("face")) return "Personal Care";
  if (id.includes("baby") || id.includes("diaper") || id.includes("feeding")) return "Baby Care";
  if (id.includes("protein") || id.includes("vitamin") || id.includes("aid") || id.includes("balm") || id.includes("spray") && id.includes("pain") || id.includes("dettol")) return "Health & Wellness";
  if (id.includes("puja") || id.includes("diya") || id.includes("camphor") || id.includes("agarbatti") || id.includes("havan")) return "Festive & Religious";
  if (id.includes("dog") || id.includes("cat") || id.includes("pet")) return "Pet Care";
  if (id.includes("frozen") || id.includes("ice_cream") || id.includes("kulfi")) return "Frozen Foods";
  if (id.includes("sauce") || id.includes("pickle") || id.includes("ketchup") || id.includes("mayo") || id.includes("chutney") || id.includes("dip")) return "Condiments & Sauces";
  if (id.includes("noodle") || id.includes("pasta") || id.includes("spaghetti") || id.includes("penne") || id.includes("taco") || id.includes("ramen")) return "Grains & Pasta";
  if (id.includes("chicken") || id.includes("fish") || id.includes("mutton") || id.includes("prawn") || id.includes("sausage") || id.includes("bacon")) return "Meat & Seafood";
  if (id.includes("almond") || id.includes("cashew") || id.includes("walnut") || id.includes("pista") || id.includes("date") || id.includes("fig") || id.includes("raisin")) return "Dry Fruits & Nuts";
  if (id.includes("balloon") || id.includes("cake") || id.includes("candle") || id.includes("party") || id.includes("popper")) return "Party & Celebration";
  return "Daily Essentials";
}

export default function ProductImage({
  id,
  emoji,
  alt,
  className = "",
  rounded = "rounded-xl",
}: {
  id?: string;
  imageQuery?: string;
  emoji?: string;
  alt: string;
  size?: number;
  className?: string;
  rounded?: string;
}) {
  const category = getCategoryFromId(id);
  const style = CATEGORY_STYLES[category] || { bg: "bg-clay-pale/70", border: "border-black/[0.06]" };

  return (
    <div
      className={`${rounded} ${style.bg} ${style.border} border flex items-center justify-center text-2xl transition-all select-none ${className}`}
      role="img"
      aria-label={alt}
      title={alt}
    >
      <span className="transform transition-transform duration-150 hover:scale-110">
        {emoji || "🛒"}
      </span>
    </div>
  );
}
