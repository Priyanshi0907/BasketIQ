"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  Tag,
  Heart,
  Users,
  ShoppingBag,
  ShoppingBasket,
  Grid2x2,
  Repeat,
  TrendingUp,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import {
  analyzeBasket,
  getDashboard,
  getRules,
  AnalyzeResponse,
  DashboardResponse,
  RuleRecord,
} from "@/lib/api";
import { Card, ProgressBar, Spinner } from "@/components/ui";
import ProductImage from "@/components/ProductImage";
import VoiceMicButton from "@/components/VoiceMicButton";
import HeaderControls from "@/components/HeaderControls";
import { useAuthUser } from "@/lib/auth";

const DEFAULT_BASKET = "I bought bread, butter, eggs and milk.";

export default function DashboardPage() {
  const { user } = useAuthUser();
  const [summary, setSummary] = useState<DashboardResponse | null>(null);
  const [rules, setRules] = useState<RuleRecord[]>([]);
  const [text, setText] = useState(DEFAULT_BASKET);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDashboard().then(setSummary).catch((e) => setError(String(e)));
    getRules(4).then((r) => setRules(r.rules)).catch(() => {});
    runAnalyze(DEFAULT_BASKET);
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
    } finally {
      setLoading(false);
    }
  }

  const primaryConfidence = result ? Math.round(result.classification.primary_confidence * 100) : 0;
  const confidenceLabel =
    primaryConfidence >= 75 ? "High Confidence" : primaryConfidence >= 45 ? "Medium Confidence" : "Low Confidence";

  return (
    <div className="p-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-6 mb-7">
        <div>
          <h1 className="font-display text-3xl text-ink flex items-center gap-2">
            Hello, {user.name} <span className="text-2xl">🌿</span>
          </h1>
          <p className="text-muted text-sm mt-1.5">
            Analyze baskets, uncover patterns and delight your customers.
          </p>
        </div>
        <HeaderControls />
      </div>

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
        </div>
      )}

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Analyze your basket */}
        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-1">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Sparkles size={16} />
            </span>
            Analyze your basket
          </div>
          <p className="text-sm text-muted mb-4">
            Enter products in <span className="text-clay">natural language</span> (e.g. &ldquo;bread, butter, eggs and milk&rdquo;)
          </p>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 200))}
              rows={3}
              className="w-full resize-none rounded-xl border border-black/[0.08] bg-cream-soft/40 px-4 py-3 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-clay/30"
              placeholder='e.g. "I bought bread, butter, eggs and milk."'
            />
            <span className="absolute bottom-2.5 right-3 text-[11px] text-muted">{text.length}/200</span>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <VoiceMicButton
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
              className="inline-flex items-center gap-2 bg-clay hover:bg-clay/90 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors shadow-sm"
            >
              {loading ? "Analyzing..." : "Analyze Basket"}
              <ArrowRight size={15} />
            </button>
          </div>
        </Card>

        {/* Basket Classification */}
        <div className="rounded-2xl bg-forest text-cream p-5 relative overflow-hidden">
          <div className="flex items-center gap-2.5 font-display text-lg mb-4 relative z-10">
            <span className="w-8 h-8 rounded-lg bg-cream/10 flex items-center justify-center">
              <Tag size={16} />
            </span>
            Basket Classification
          </div>

          {result && result.classification.primary_category ? (
            <>
              <div className="bg-cream rounded-xl px-4 py-3.5 flex items-center gap-4 relative z-10">
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

              <div className="mt-4 relative z-10">
                <div className="flex justify-between text-xs text-cream/70 mb-1.5">
                  <span>Confidence Score</span>
                  <span className="text-cream font-medium">{primaryConfidence}%</span>
                </div>
                <ProgressBar value={primaryConfidence} colorClass="bg-clay" trackClass="bg-cream/15" />
              </div>

              <div className="mt-4 relative z-10">
                <div className="text-xs text-cream/60 mb-2">Why this category?</div>
                <div className="flex flex-wrap gap-2">
                  {result.extracted_products.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1 text-xs bg-cream/10 text-cream px-2.5 py-1 rounded-full"
                    >
                      <CheckCircle2 size={11} className="text-clay-soft" />
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="relative z-10 py-10 text-center text-cream/50 text-sm">
              {loading ? "Classifying basket..." : "Analyze a basket to see its classification here."}
            </div>
          )}

          <div className="pointer-events-none absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-cream/[0.04]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* You may also like */}
        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-1">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Heart size={16} />
            </span>
            You may also like
          </div>
          <p className="text-sm text-muted mb-4">Products frequently purchased with your basket</p>
          {result && result.top_associations.length > 0 ? (
            <div className="grid grid-cols-4 gap-3">
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
                    <div className="text-xs font-medium text-ink truncate">{a.name}</div>
                    <div className="text-[10px] text-muted mt-1">Support: {Math.round(a.support * 100)}%</div>
                    <div className="text-[10px] text-muted">Lift: {a.lift.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted py-8 text-center">
              {loading ? "Finding associations..." : "No suggestions yet — analyze a basket first."}
            </div>
          )}
        </Card>

        {/* Top Association Rules */}
        <Card>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2.5 text-ink font-display text-lg">
              <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                <Users size={16} />
              </span>
              Top Association Rules
            </div>
          </div>
          <p className="text-sm text-muted mb-3">&nbsp;</p>
          <div className="text-xs text-muted grid grid-cols-[1fr_70px_80px_60px] gap-2 px-1 pb-2 border-b border-black/[0.06]">
            <span>Rule</span>
            <span>Support</span>
            <span>Confidence</span>
            <span>Lift</span>
          </div>
          <div className="divide-y divide-black/[0.05]">
            {rules.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_70px_80px_60px] gap-2 items-center px-1 py-2.5 text-sm">
                <span className="text-ink truncate">
                  {r.antecedents.join(" + ")} <span className="text-clay">→</span> {r.consequents.join(", ")}
                </span>
                <span className="text-muted text-xs">{r.support.toFixed(2)}</span>
                <span className="text-muted text-xs">{r.confidence.toFixed(2)}</span>
                <span className="text-muted text-xs flex items-center gap-1">
                  <BarChart3 size={12} className="text-sage" />
                  {r.lift.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/association-rules"
            className="mt-4 inline-flex items-center gap-2 bg-clay-pale text-clay text-sm font-medium px-4 py-2 rounded-full hover:bg-clay/20 transition-colors"
          >
            View all rules <ArrowRight size={14} />
          </Link>
        </Card>
      </div>

      {/* Basket Insights */}
      <Card>
        <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
          <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
            <ShoppingBag size={16} />
          </span>
          Basket Insights
        </div>
        {summary ? (
          <div className="grid grid-cols-5 gap-4">
            <InsightStat icon={<ShoppingBag size={16} />} value={summary.total_transactions.toLocaleString()} label="Total Transactions" />
            <InsightStat icon={<ShoppingBasket size={16} />} value={`${summary.avg_basket_size}`} label="Avg. Items per Basket" />
            <InsightStat icon={<Grid2x2 size={16} />} value={`${summary.top_categories_count}`} label="Top Categories" />
            <InsightStat icon={<Repeat size={16} />} value={`${Math.round(summary.category_model_accuracy * 100)}%`} label="Classifier Accuracy" />
            <InsightStat icon={<TrendingUp size={16} />} value={`${summary.avg_lift}x`} label="Avg. Lift Score" />
          </div>
        ) : (
          <Spinner label="Loading insights..." />
        )}
      </Card>
    </div>
  );
}

function InsightStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="rounded-xl border border-black/[0.05] bg-cream-soft/50 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-clay-pale text-clay flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="font-display text-lg text-ink leading-none">{value}</div>
        <div className="text-[11px] text-muted mt-1">{label}</div>
      </div>
    </div>
  );
}
