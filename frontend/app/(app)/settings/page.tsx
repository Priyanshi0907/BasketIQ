"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon, Database, SlidersHorizontal, Save, Check } from "lucide-react";
import { getSettings, updateSettings, SettingsResponse } from "@/lib/api";
import { Card, PageHeader, Spinner } from "@/components/ui";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch((e) => setError(String(e)));
  }, []);

  async function save() {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await updateSettings(settings);
      setSettings(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="p-10 text-sm text-red-600">
        Couldn&apos;t reach the BasketIQ API — make sure the backend is running. ({error})
      </div>
    );
  }
  if (!settings) {
    return (
      <div className="p-10">
        <Spinner label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-[1000px]">
      <PageHeader
        title="Settings"
        subtitle="Dataset, model and app preferences for BasketIQ."
        right={
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 bg-clay hover:bg-clay/90 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-full transition-colors"
          >
            {saved ? <Check size={15} /> : <Save size={15} />}
            {saving ? "Saving..." : saved ? "Saved" : "Save changes"}
          </button>
        }
      />

      <div className="space-y-5">
        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <Database size={16} />
            </span>
            Dataset & Model
          </div>
          <div className="grid grid-cols-2 gap-5">
            <Field label="Dataset">
              <input
                value={settings.dataset}
                onChange={(e) => setSettings({ ...settings, dataset: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Model version">
              <input
                value={settings.model_version}
                onChange={(e) => setSettings({ ...settings, model_version: e.target.value })}
                className="input"
              />
            </Field>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <SlidersHorizontal size={16} />
            </span>
            Association-rule thresholds
          </div>
          <div className="grid grid-cols-3 gap-5">
            <SliderField
              label="Minimum support"
              value={settings.min_support}
              min={0.01}
              max={0.2}
              step={0.01}
              onChange={(v) => setSettings({ ...settings, min_support: v })}
            />
            <SliderField
              label="Minimum confidence"
              value={settings.min_confidence}
              min={0.1}
              max={0.9}
              step={0.05}
              onChange={(v) => setSettings({ ...settings, min_confidence: v })}
            />
            <SliderField
              label="Minimum lift"
              value={settings.min_lift}
              min={1.0}
              max={3.0}
              step={0.05}
              onChange={(v) => setSettings({ ...settings, min_lift: v })}
            />
          </div>
          <p className="text-xs text-muted mt-4">
            These thresholds are stored server-side and will apply the next time the rule-mining pipeline runs.
          </p>
        </Card>

        <Card>
          <div className="flex items-center gap-2.5 text-ink font-display text-lg mb-4">
            <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center">
              <SettingsIcon size={16} />
            </span>
            App preferences
          </div>
          <div className="grid grid-cols-2 gap-5">
            <SliderField
              label="NLP fuzzy-match threshold"
              value={settings.fuzzy_match_threshold}
              min={60}
              max={100}
              step={1}
              onChange={(v) => setSettings({ ...settings, fuzzy_match_threshold: v })}
              suffix=""
            />
            <SliderField
              label="Recommendations per basket"
              value={settings.recommendation_count}
              min={2}
              max={8}
              step={1}
              onChange={(v) => setSettings({ ...settings, recommendation_count: v })}
              suffix=""
            />
          </div>
        </Card>
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 0.75rem;
          padding: 0.6rem 0.9rem;
          font-size: 0.875rem;
          background: rgba(243, 238, 225, 0.4);
        }
        .input:focus {
          outline: none;
          box-shadow: 0 0 0 2px rgba(208, 138, 92, 0.3);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix = "",
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-muted">{label}</span>
        <span className="text-ink font-medium">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-clay"
      />
    </div>
  );
}
