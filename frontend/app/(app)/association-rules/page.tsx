"use client";

import { useEffect, useState } from "react";
import { Share2, Layers, SlidersHorizontal } from "lucide-react";
import { getRules, getItemsets, RuleRecord } from "@/lib/api";
import { Card, PageHeader, ProgressBar, Spinner } from "@/components/ui";

export default function AssociationRulesPage() {
  const [rules, setRules] = useState<RuleRecord[] | null>(null);
  const [itemsets, setItemsets] = useState<{ items: string[]; support: number }[] | null>(null);
  const [minLift, setMinLift] = useState(1.0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getItemsets(12).then((r) => setItemsets(r.itemsets)).catch(() => {});
  }, []);

  useEffect(() => {
    getRules(60)
      .then((r) => {
        setTotal(r.total);
        setRules(r.rules.filter((x) => x.lift >= minLift));
      })
      .catch((e) => setError(String(e)));
  }, [minLift]);

  const maxLift = rules && rules.length ? Math.max(...rules.map((r) => r.lift)) : 1;

  return (
    <div className="p-8 max-w-[1400px]">
      <PageHeader
        title="Association Rules"
        subtitle="Apriori-mined product relationships, ranked by support, confidence and lift."
      />

      {error && (
        <div className="mb-5 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
          Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-ink font-display text-lg">
                <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
                  <Share2 size={16} />
                </span>
                Mined Rules
                <span className="text-xs font-normal text-muted bg-black/[0.04] px-2.5 py-1 rounded-full ml-1">
                  {total} total
                </span>
              </div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={13} className="text-muted" />
                <span className="text-xs text-muted">Min lift</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={minLift}
                  onChange={(e) => setMinLift(parseFloat(e.target.value))}
                  className="accent-clay"
                />
                <span className="text-xs text-ink font-medium w-8">{minLift.toFixed(1)}x</span>
              </div>
            </div>

            {!rules ? (
              <Spinner label="Mining association rules..." />
            ) : rules.length === 0 ? (
              <div className="text-sm text-muted py-10 text-center">No rules meet this lift threshold.</div>
            ) : (
              <div>
                <div className="grid grid-cols-[1fr_70px_80px_100px] gap-3 text-xs text-muted px-1 pb-2 border-b border-black/[0.06]">
                  <span>Rule</span>
                  <span>Support</span>
                  <span>Confidence</span>
                  <span>Lift</span>
                </div>
                <div className="divide-y divide-black/[0.05] max-h-[560px] overflow-y-auto scrollbar-thin">
                  {rules.map((r, i) => (
                    <div key={i} className="grid grid-cols-[1fr_70px_80px_100px] gap-3 items-center px-1 py-3 text-sm">
                      <span className="text-ink">
                        <span className="font-medium">{r.antecedents.join(" + ")}</span>{" "}
                        <span className="text-clay">→</span> {r.consequents.join(", ")}
                      </span>
                      <span className="text-muted text-xs">{r.support.toFixed(2)}</span>
                      <span className="text-muted text-xs">{(r.confidence * 100).toFixed(0)}%</span>
                      <div className="flex items-center gap-2">
                        <ProgressBar value={(r.lift / maxLift) * 100} colorClass="bg-sage" height="h-1.5" />
                        <span className="text-xs text-ink font-medium w-9">{r.lift.toFixed(2)}x</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Layers size={16} />
            </span>
            Frequent Itemsets
          </div>
          {!itemsets ? (
            <Spinner label="Loading..." />
          ) : (
            <div className="space-y-3">
              {itemsets.map((it, i) => (
                <div key={i} className="rounded-lg border border-black/[0.05] px-3 py-2.5">
                  <div className="text-xs text-ink font-medium mb-1">{it.items.join(" + ")}</div>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={it.support * 100 * 4} colorClass="bg-forest-light" height="h-1.5" />
                    <span className="text-[10px] text-muted w-10 text-right">{(it.support * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
