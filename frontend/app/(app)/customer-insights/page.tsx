"use client";

import { useEffect, useState } from "react";
import { Users, Flame, Link2, Database } from "lucide-react";
import { getCustomerInsights, CustomerInsightsResponse } from "@/lib/api";
import { Card, PageHeader, ProgressBar, Spinner, Pill } from "@/components/ui";
import ProductImage from "@/components/ProductImage";

export default function CustomerInsightsPage() {
  const [data, setData] = useState<CustomerInsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCustomerInsights().then(setData).catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return (
      <div className="p-10 text-sm text-red-600">
        Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
      </div>
    );
  }
  if (!data) {
    return (
      <div className="p-10">
        <Spinner label="Loading customer insights..." />
      </div>
    );
  }

  const maxPurchases = Math.max(...data.top_popular.map((p) => p.purchases));
  const maxCoOccur = Math.max(...data.top_co_occurring.map((p) => p.count));

  return (
    <div className="p-8 max-w-[1400px]">
      <PageHeader
        title="Customer Insights"
        subtitle="Product popularity, co-occurrence patterns, and category relationships."
        right={
          <Pill tone="sage" className="whitespace-nowrap">
            <Database size={12} /> Based on {data.dataset_note.dataset_name}
          </Pill>
        }
      />

      <div className="mb-5 rounded-2xl bg-sage-pale/50 border border-sage/20 p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-forest text-cream flex items-center justify-center shrink-0">
          <Database size={16} />
        </div>
        <p className="text-sm text-ink/80 leading-relaxed">
          <span className="font-medium text-ink">Heads up — every number on this page is generated from a dataset, not live sales.</span>{" "}
          It&apos;s computed from{" "}
          <span className="font-medium text-ink">{data.dataset_note.transactions.toLocaleString()} synthetic transactions</span>{" "}
          across <span className="font-medium text-ink">{data.dataset_note.products} catalog products</span> (
          <span className="text-clay">{data.dataset_note.dataset_name}</span> — see{" "}
          <a href="/settings" className="text-clay underline underline-offset-2">Settings</a>). It reflects realistic
          shopping patterns for demonstrating the NLP/ML pipeline, but the popularity and pairing numbers below will
          change if you regenerate or swap the dataset — they are not a real store&apos;s performance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-1">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Flame size={16} />
            </span>
            Most popular products
          </div>
          <p className="text-[11px] text-muted mb-3">Purchase counts from the synthetic dataset above, not live sales.</p>
          <div className="space-y-3">
            {data.top_popular.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <span className="text-xs text-muted w-4">{i + 1}</span>
                <ProductImage
                  id={p.id}
                  imageQuery={p.image_query}
                  emoji={p.emoji}
                  alt={p.name}
                  size={64}
                  rounded="rounded-lg"
                  className="w-8 h-8 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink font-medium truncate">{p.name}</span>
                    <span className="text-muted">{p.purchases} baskets</span>
                  </div>
                  <ProgressBar value={(p.purchases / maxPurchases) * 100} colorClass="bg-clay" height="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-1">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Link2 size={16} />
            </span>
            Strongest co-occurring pairs
          </div>
          <p className="text-[11px] text-muted mb-3">Co-purchase counts mined from the same synthetic dataset.</p>
          <div className="space-y-3">
            {data.top_co_occurring.map((pair, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-muted w-4">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-ink font-medium truncate">
                      {pair.a} <span className="text-clay">+</span> {pair.b}
                    </span>
                    <span className="text-muted">{pair.count}x</span>
                  </div>
                  <ProgressBar value={(pair.count / maxCoOccur) * 100} colorClass="bg-sage" height="h-1.5" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 rounded-2xl bg-sage-pale/60 border border-sage/20 p-5 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-forest text-cream flex items-center justify-center shrink-0">
          <Users size={18} />
        </div>
        <p className="text-sm text-ink/80">
          These patterns are mined directly from the synthetic transaction dataset described above and feed the
          association-rule engine that powers Basket Analyzer&apos;s &ldquo;Top Associations&rdquo; and the
          Recommendations page.
        </p>
      </div>
    </div>
  );
}
