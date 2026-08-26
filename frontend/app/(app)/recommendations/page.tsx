"use client";

import { useEffect, useState } from "react";
import { ThumbsUp, ShoppingBasket, X, Plus, Trash2, Check } from "lucide-react";
import { getProducts, getRecommendations, Product, Association } from "@/lib/api";
import { Card, PageHeader, ProgressBar, Spinner, EmptyState } from "@/components/ui";
import ProductImage from "@/components/ProductImage";
import VoiceMicButton from "@/components/VoiceMicButton";

export default function RecommendationsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<string[]>(["bread", "milk"]);
  const [recs, setRecs] = useState<Association[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    getProducts().then((r) => setProducts(r.products)).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => {
    getRecommendations(selected).then((r) => setRecs(r.recommendations)).catch((e) => setError(String(e)));
  }, [selected]);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchesQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase()) ||
      p.aliases?.some((a) => a.toLowerCase().includes(query.toLowerCase()));
    const matchesCat = selectedCategory === "All" || p.category === selectedCategory;
    return matchesQuery && matchesCat;
  });

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function addProduct(id: string) {
    if (!selected.includes(id)) {
      setSelected((prev) => [...prev, id]);
    }
  }

  function handleVoiceTranscript(spoken: string) {
    setQuery(spoken);
    // Also try matching spoken tokens to catalog products to auto-add
    const lower = spoken.toLowerCase();
    const matched = products.filter(
      (p) =>
        lower.includes(p.name.toLowerCase()) ||
        p.aliases?.some((a) => lower.includes(a.toLowerCase()))
    );
    if (matched.length > 0) {
      setSelected((prev) => {
        const next = new Set(prev);
        matched.forEach((m) => next.add(m.id));
        return Array.from(next);
      });
    }
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <PageHeader
        title="Recommendations"
        subtitle="Build a basket and see frequently-bought-together suggestions, powered by mined association rules."
      />

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <Card className="col-span-2">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2.5 text-ink font-display text-lg">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <ShoppingBasket size={16} />
              </span>
              Build a basket
              <span className="text-xs font-normal text-muted ml-1">
                ({selected.length} {selected.length === 1 ? "item" : "items"})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="text-sm border border-black/[0.08] rounded-full px-4 py-2 w-48 focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
              <VoiceMicButton
                size={14}
                className="w-9 h-9 !bg-cream-soft !text-clay hover:!bg-clay hover:!text-white border border-black/[0.08]"
                onTranscript={handleVoiceTranscript}
                title="Speak to search or add items"
              />
              {selected.length > 0 && (
                <button
                  onClick={() => setSelected([])}
                  title="Clear basket"
                  className="text-xs text-muted hover:text-red-500 flex items-center gap-1 border border-black/[0.08] px-2.5 py-2 rounded-full transition-colors"
                >
                  <Trash2 size={13} />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Selected Basket Chips */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-cream-soft/60 rounded-xl border border-black/[0.04]">
              {selected.map((id) => {
                const p = products.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 bg-white border border-clay/30 text-clay text-xs font-medium pl-1.5 pr-2.5 py-1 rounded-full shadow-sm"
                  >
                    <ProductImage
                      id={p.id}
                      imageQuery={p.image_query}
                      emoji={p.emoji}
                      alt={p.name}
                      size={48}
                      rounded="rounded-full"
                      className="w-5 h-5 shrink-0"
                    />
                    {p.name}
                    <button
                      onClick={() => toggle(id)}
                      className="text-muted hover:text-red-500 ml-0.5"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-2 mb-3 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? "bg-forest text-cream font-medium shadow-sm"
                    : "bg-cream-soft text-muted hover:text-ink hover:bg-cream-soft/80"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-4 gap-2.5 max-h-[500px] overflow-y-auto scrollbar-thin pr-1">
            {filtered.map((p) => {
              const active = selected.includes(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all ${
                    active
                      ? "border-clay bg-clay-pale/70 shadow-sm"
                      : "border-black/[0.06] bg-cream-soft/40 hover:border-clay/40 hover:bg-white"
                  }`}
                >
                  {active && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-clay text-white flex items-center justify-center text-[10px]">
                      <Check size={10} strokeWidth={3} />
                    </span>
                  )}
                  <span className="w-10 h-10">
                    <ProductImage
                      id={p.id}
                      imageQuery={p.image_query}
                      emoji={p.emoji}
                      alt={p.name}
                      size={80}
                      rounded="rounded-lg"
                      className="w-10 h-10"
                    />
                  </span>
                  <span className="text-xs text-ink font-medium leading-tight line-clamp-2">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-muted">₹{p.avg_price}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recommendations Column */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 text-ink font-display text-lg">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <ThumbsUp size={16} />
              </span>
              Frequently bought together
            </div>
            {recs && recs.length > 0 && (
              <span className="text-xs font-medium text-forest bg-sage-pale px-2.5 py-0.5 rounded-full">
                {recs.length} suggested
              </span>
            )}
          </div>

          {!recs ? (
            <Spinner label="Finding recommendations..." />
          ) : recs.length === 0 ? (
            <EmptyState
              icon={<ThumbsUp size={20} />}
              title="No recommendations yet"
              subtitle="Add a few products to your basket on the left to see suggestions."
            />
          ) : (
            <div className="space-y-3">
              {recs.map((r) => {
                const inBasket = selected.includes(r.id);
                return (
                  <div
                    key={r.id}
                    className="rounded-xl border border-black/[0.06] p-3 flex items-center gap-3 bg-white/60 hover:bg-white hover:border-clay/30 transition-colors"
                  >
                    <div className="w-12 h-12 shrink-0">
                      <ProductImage
                        id={r.id}
                        imageQuery={r.image_query}
                        emoji={r.emoji}
                        alt={r.name}
                        size={96}
                        rounded="rounded-lg"
                        className="w-12 h-12"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink truncate">{r.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <ProgressBar value={Math.min(r.confidence * 100, 100)} colorClass="bg-sage" height="h-1.5" />
                        <span className="text-[10px] text-muted whitespace-nowrap">
                          {Math.round(r.confidence * 100)}% conf
                        </span>
                      </div>
                      <div className="text-[10px] text-clay font-medium mt-0.5">
                        {r.lift.toFixed(2)}x higher co-purchase lift
                      </div>
                    </div>
                    <button
                      onClick={() => addProduct(r.id)}
                      disabled={inBasket}
                      title={inBasket ? "Already in basket" : "Add to basket"}
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        inBasket
                          ? "bg-sage-pale text-forest cursor-default"
                          : "bg-clay-pale text-clay hover:bg-clay hover:text-white"
                      }`}
                    >
                      {inBasket ? <Check size={14} /> : <Plus size={15} />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
