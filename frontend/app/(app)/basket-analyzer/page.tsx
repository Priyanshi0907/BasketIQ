"use client";

import { useEffect, useState } from "react";
import {
  Smile,
  Tag,
  Sparkles,
  HelpCircle,
  Share2,
  Compass,
  ArrowRight,
  X,
} from "lucide-react";
import { analyzeBasket, getExamples, AnalyzeResponse } from "@/lib/api";
import { Card, ProgressBar } from "@/components/ui";
import ProductImage from "@/components/ProductImage";
import VoiceMicButton from "@/components/VoiceMicButton";
import HeaderControls from "@/components/HeaderControls";

const DEFAULT_TEXT = "I bought bread, butter, eggs and milk.";
const FALLBACK_EXAMPLES: Record<string, string> = {
  "Weekend breakfast": "I bought bread, butter, eggs and milk.",
  "Birthday party supplies": "Getting balloons, a cake, candles and paper plates for the party.",
  "Home decor items": "Need some candles, streamers and gift wrap for decorating.",
};

const CONF_COLOR = (n: number) => (n >= 0.75 ? "bg-sage" : n >= 0.45 ? "bg-clay" : "bg-red-300");

export default function BasketAnalyzerPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [examples, setExamples] = useState<Record<string, string>>(FALLBACK_EXAMPLES);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  useEffect(() => {
    getExamples().then(setExamples).catch(() => {});
    runAnalyze(DEFAULT_TEXT);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runAnalyze(basketText: string) {
    if (!basketText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await analyzeBasket(basketText);
      setResult(res);
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const extractionConf = result ? Math.round(result.extraction_confidence * 100) : 0;
  const primaryConf = result ? Math.round(result.classification.primary_confidence * 100) : 0;
  const confidenceLabel = primaryConf >= 75 ? "High Confidence" : primaryConf >= 45 ? "Medium Confidence" : "Low Confidence";

  return (
    <div className="p-8 max-w-[1400px]">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div>
          <h1 className="font-display text-3xl text-ink">Basket Analyzer</h1>
          <p className="text-muted text-sm mt-1.5">
            Enter a basket in <span className="text-clay">natural language</span> and let AI understand it.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center gap-2 border border-black/[0.1] bg-cream-card text-ink text-sm px-4 py-2.5 rounded-full hover:bg-cream-soft hover:border-clay/40 transition-colors shadow-sm"
          >
            <HelpCircle size={15} className="text-clay" /> How it works
          </button>
          <HeaderControls />
        </div>
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
        </div>
      )}

      <div className="grid grid-cols-3 gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="col-span-2 space-y-5">
          {/* 1. Enter your basket */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-ink font-display text-lg">
                <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                  <Smile size={16} />
                </span>
                1. Enter your basket
              </div>
              <span className="text-xs font-medium text-sage bg-sage-pale px-3 py-1 rounded-full">
                Natural Language 🌿
              </span>
            </div>
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, 200))}
                rows={4}
                className="w-full resize-none rounded-xl border border-black/[0.08] bg-cream-soft/40 px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-clay/30"
              />
              <span className="absolute bottom-2.5 right-3 text-[11px] text-muted">{text.length}/200</span>
            </div>
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-muted mr-1">Try examples:</span>
              {Object.entries(examples).map(([label, value]) => (
                <button
                  key={label}
                  onClick={() => {
                    setText(value);
                    runAnalyze(value);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-black/[0.08] bg-cream-card text-ink hover:border-clay/40 hover:text-clay transition-colors"
                >
                  {label}
                </button>
              ))}
              <div className="ml-auto flex items-center gap-2.5">
                <VoiceMicButton
                  size={15}
                  className="w-10 h-10 !bg-cream-soft !text-clay hover:!bg-clay hover:!text-white border border-black/[0.08]"
                  onTranscript={(spoken) => {
                    setText(spoken.slice(0, 200));
                  }}
                  onFinalTranscript={(spoken) => {
                    setText(spoken.slice(0, 200));
                    runAnalyze(spoken.slice(0, 200));
                  }}
                />
                <button
                  onClick={() => runAnalyze(text)}
                  disabled={loading}
                  className="inline-flex items-center gap-2 bg-clay hover:bg-clay/90 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-sm"
                >
                  <Sparkles size={15} />
                  {loading ? "Analyzing..." : "Analyze Basket"}
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </Card>

          {/* 2. Extracted Products */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-ink font-display text-lg">
                <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                  <Tag size={16} />
                </span>
                2. Extracted Products
              </div>
              <span className="text-xs font-medium text-sage bg-sage-pale px-3 py-1 rounded-full">
                {result ? `${result.extracted_products.length} items detected` : "—"}
              </span>
            </div>
            {result && result.extracted_products.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2.5 mb-4">
                  {result.extracted_products.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-2 bg-cream-soft border border-black/[0.06] pl-2 pr-3.5 py-2 rounded-xl text-sm text-ink"
                    >
                      <ProductImage
                        id={p.id}
                        imageQuery={p.image_query}
                        emoji={p.emoji}
                        alt={p.name}
                        size={64}
                        rounded="rounded-full"
                        className="w-6 h-6 shrink-0"
                      />
                      {p.name}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted whitespace-nowrap">Confidence in extraction:</span>
                  <span className="text-xs font-medium text-ink">{extractionConf}%</span>
                  <ProgressBar value={extractionConf} colorClass="bg-forest-light" />
                </div>
              </>
            ) : (
              <div className="text-sm text-muted py-6 text-center">
                {loading ? "Extracting products..." : "No products detected yet."}
              </div>
            )}
          </Card>

          {/* 3. Understanding the Basket */}
          <Card>
            <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <Compass size={16} />
              </span>
              3. Understanding the Basket
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div className="rounded-xl border border-black/[0.06] p-4">
                <div className="text-sm font-medium text-ink mb-4">Key Terms</div>
                {result && result.extracted_products.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline">
                    {result.extracted_products.map((p, i) => {
                      const sizes = ["text-2xl", "text-xl", "text-lg", "text-base"];
                      const colors = ["text-forest", "text-clay", "text-sage", "text-muted"];
                      return (
                        <span key={p.id} className={`font-display ${sizes[i % sizes.length]} ${colors[i % colors.length]}`}>
                          {p.name.toLowerCase()}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted py-4">No key terms yet.</div>
                )}
                <div className="flex items-center gap-4 mt-5 text-[11px] text-muted">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-forest inline-block" /> High relevance</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-clay inline-block" /> Medium</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted inline-block" /> Low</span>
                </div>
              </div>
              <div className="rounded-xl border border-black/[0.06] p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-ink mb-3">
                  <Compass size={14} className="text-clay" /> Intent Detected
                </div>
                {result && result.classification.intent ? (
                  <>
                    <div className="font-display text-lg text-clay mb-1.5">{result.classification.intent}</div>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      {result.classification.intent_description}
                    </p>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-muted">Confidence</span>
                      <span className="text-ink font-medium">
                        {Math.round(result.classification.intent_confidence * 100)}%
                      </span>
                    </div>
                    <ProgressBar value={result.classification.intent_confidence * 100} colorClass="bg-clay" />
                  </>
                ) : (
                  <div className="text-sm text-muted py-4">No intent detected yet.</div>
                )}
              </div>
            </div>
          </Card>

          {/* AI Insight */}
          <div className="rounded-2xl bg-sage-pale/70 border border-sage/20 p-5 relative overflow-hidden">
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-forest mb-2">
                  <Sparkles size={14} /> AI Insight
                </div>
                <p className="text-sm text-ink/80 leading-relaxed">
                  {result?.ai_insight?.headline || "Analyze a basket to see a personalized AI insight here."}
                </p>
              </div>
              <div>
                <div className="text-sm font-semibold text-forest mb-2">Why these recommendations?</div>
                <ul className="space-y-1.5 text-sm text-ink/80">
                  {(result?.ai_insight?.reasons || ["Frequently bought together", "High confidence association rules", "Similar customer behavior"]).map(
                    (r) => (
                      <li key={r} className="flex items-center gap-2">
                        <span className="text-sage">✓</span> {r}
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-6xl opacity-10">🧠</div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-5">
          {/* 4. Basket Classification */}
          <Card>
            <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <Tag size={16} />
              </span>
              4. Basket Classification
            </div>
            {result && result.classification.primary_category ? (
              <>
                <div className="bg-cream-soft rounded-xl px-4 py-3.5 flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {result.extracted_products[0] ? (
                      <ProductImage
                        id={result.extracted_products[0].id}
                        imageQuery={result.extracted_products[0].image_query}
                        emoji={result.extracted_products[0].emoji}
                        alt={result.extracted_products[0].name}
                        size={96}
                        rounded="rounded-full"
                        className="w-12 h-12"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-clay-pale flex items-center justify-center text-2xl">🛍️</div>
                    )}
                  </div>
                  <div>
                    <div className="font-display text-lg text-ink leading-tight">
                      {result.classification.primary_category}
                    </div>
                    <span className="inline-block mt-1 text-[11px] font-medium text-clay bg-clay-pale px-2 py-0.5 rounded-full">
                      {confidenceLabel}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted">Confidence Score</span>
                  <span className="text-ink font-medium">{primaryConf}%</span>
                </div>
                <ProgressBar value={primaryConf} colorClass="bg-clay" />

                <div className="mt-5">
                  <div className="text-xs text-muted mb-2.5">Top Matched Categories</div>
                  <div className="space-y-2.5">
                    {result.classification.top_categories.map((c, i) => (
                      <div key={c.category} className="flex items-center gap-3 text-xs">
                        <span className="text-muted w-3">{i + 1}.</span>
                        <span className="text-ink flex-1 truncate">{c.category}</span>
                        <div className="w-24">
                          <ProgressBar value={c.confidence * 100} colorClass={CONF_COLOR(c.confidence)} height="h-1.5" />
                        </div>
                        <span className="text-muted w-9 text-right">{Math.round(c.confidence * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted py-10 text-center">
                {loading ? "Classifying..." : "Analyze a basket to see its classification."}
              </div>
            )}
          </Card>

          {/* 5. Top Associations */}
          <Card>
            <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <Share2 size={16} />
              </span>
              5. Top Associations
            </div>
            {result && result.top_associations.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {result.top_associations.map((a) => (
                    <div key={a.id} className="rounded-xl border border-black/[0.05] overflow-hidden bg-cream-soft/50">
                      <div className="h-16">
                        <ProductImage
                          id={a.id}
                          imageQuery={a.image_query}
                          emoji={a.emoji}
                          alt={a.name}
                          size={200}
                          rounded="rounded-none"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="p-2.5">
                        <div className="text-xs font-medium text-ink">{a.name}</div>
                        <div className="text-[10px] text-muted mt-1">Support: {Math.round(a.support * 100)}%</div>
                        <div className="text-[10px] text-muted">Lift: {a.lift.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <a
                  href="/recommendations"
                  className="inline-flex items-center justify-center gap-2 w-full bg-forest hover:bg-forest-light text-cream text-sm font-medium px-4 py-2.5 rounded-full transition-colors"
                >
                  View all recommendations <ArrowRight size={14} />
                </a>
              </>
            ) : (
              <div className="text-sm text-muted py-8 text-center">
                {loading ? "Finding associations..." : "No associations yet."}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Interactive How It Works Modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="bg-cream-card border border-black/[0.08] rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-sage-pale text-forest flex items-center justify-center text-lg">
                  💡
                </span>
                <div>
                  <h2 className="font-display text-xl text-ink">How Basket Analyzer Works</h2>
                  <p className="text-xs text-muted">From natural language input to market association intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setShowHowItWorks(false)}
                className="w-8 h-8 rounded-full hover:bg-black/[0.05] flex items-center justify-center text-muted hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Step 1 */}
              <div className="p-4 rounded-xl bg-white border border-black/[0.05] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest">
                  <span className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center text-[11px]">1</span>
                  Entity Extraction (NLP)
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Tokenizes input text, cleans filler words, and matches 3-word n-grams against our 276 Indian grocery product index with fuzzy spelling correction.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl bg-white border border-black/[0.05] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-clay">
                  <span className="w-5 h-5 rounded-full bg-clay-pale flex items-center justify-center text-[11px]">2</span>
                  Category Classification
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  TF-IDF vectorizer + Logistic Regression evaluates product tokens to compute category probability distributions (*e.g., Dairy, Bakery, Produce*).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl bg-white border border-black/[0.05] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-clay">
                  <span className="w-5 h-5 rounded-full bg-clay-pale flex items-center justify-center text-[11px]">3</span>
                  Intent Archetype Detection
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Identifies shopper motives (*e.g. Chai Time & Snacks, Daily Sabzi Tadka, Samosa Chaat, Breakfast Feast*) across 28 consumer archetypes.
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl bg-white border border-black/[0.05] flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-forest">
                  <span className="w-5 h-5 rounded-full bg-sage-pale flex items-center justify-center text-[11px]">4</span>
                  FP-Growth Association Rules
                </div>
                <p className="text-xs text-ink/80 leading-relaxed">
                  Queries 57,773 mined retail association rules to rank complementary products by **Support**, **Confidence**, and **Lift multiplier**.
                </p>
              </div>
            </div>

            {/* Try Example Action */}
            <div className="p-3.5 bg-sage-pale/60 border border-sage/30 rounded-xl flex items-center justify-between">
              <div className="text-xs text-ink/90">
                <span className="font-semibold text-forest">Quick Test:</span> Try analyzing a Chai & Morning breakfast basket.
              </div>
              <button
                onClick={() => {
                  const sample = "I bought tea, milk, sugar and marie biscuits.";
                  setText(sample);
                  runAnalyze(sample);
                  setShowHowItWorks(false);
                }}
                className="inline-flex items-center gap-1.5 bg-forest hover:bg-forest-light text-cream text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors"
              >
                <Sparkles size={12} /> Try Chai Basket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
