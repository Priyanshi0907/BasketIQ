"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Activity, Cpu } from "lucide-react";
import { getAnalytics, AnalyticsResponse } from "@/lib/api";
import { Card, PageHeader, Spinner } from "@/components/ui";

const COLORS = ["#D08A5C", "#7C8A5E", "#4B5740", "#E8B692", "#A9B48C", "#2C3323", "#8A8574"];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAnalytics().then(setData).catch((e) => setError(String(e)));
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
        <Spinner label="Loading analytics..." />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1400px]">
      <PageHeader
        title="Analytics"
        subtitle="Transaction patterns, basket-size distribution and model performance."
      />

      <div className="grid grid-cols-4 gap-5 mb-6">
        <MetricCard icon={<Cpu size={16} />} label="Category classifier accuracy" value={`${Math.round(data.category_model_accuracy * 100)}%`} />
        <MetricCard icon={<Cpu size={16} />} label="Intent classifier accuracy" value={`${Math.round(data.intent_model_accuracy * 100)}%`} />
        <MetricCard icon={<Activity size={16} />} label="Frequent itemsets mined" value={data.frequent_itemsets_count.toLocaleString()} />
        <MetricCard icon={<Activity size={16} />} label="Association rules mined" value={data.rules_count.toLocaleString()} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-5">
        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <BarChart3 size={16} />
            </span>
            Basket-size distribution
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.basket_size_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="size" tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #eee" }} />
                <Bar dataKey="count" fill="#D08A5C" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Activity size={16} />
            </span>
            Weekly transaction pattern
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekday_pattern}>
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #eee" }} />
                <Bar dataKey="count" fill="#7C8A5E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
          <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
            <PieIcon size={16} />
          </span>
          Lift-score distribution across mined rules
        </div>
        <div className="grid grid-cols-[1fr_260px] gap-6 items-center">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.lift_distribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#00000010" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="bucket" type="category" tick={{ fontSize: 11, fill: "#8A8574" }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #eee" }} />
                <Bar dataKey="count" fill="#D08A5C" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.lift_distribution}
                  dataKey="count"
                  nameKey="bucket"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.lift_distribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 10, border: "1px solid #eee" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-clay-pale text-clay flex items-center justify-center shrink-0">{icon}</div>
      <div>
        <div className="text-2xl font-display text-ink leading-none">{value}</div>
        <div className="text-xs text-muted mt-1.5">{label}</div>
      </div>
    </Card>
  );
}
