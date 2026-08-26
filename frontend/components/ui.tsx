"use client";

import { ReactNode } from "react";
import HeaderControls from "@/components/HeaderControls";

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 mb-6">
      <div>
        <h1 className="font-display text-3xl text-ink">{title}</h1>
        {subtitle && <p className="text-muted text-sm mt-1.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 shrink-0">{right !== undefined ? right : <HeaderControls />}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function CardTitle({
  icon,
  children,
  right,
}: {
  icon?: ReactNode;
  children: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5 text-ink font-display text-lg">
        {icon && (
          <span className="w-8 h-8 rounded-lg bg-sage-pale text-forest flex items-center justify-center shrink-0">
            {icon}
          </span>
        )}
        {children}
      </div>
      {right}
    </div>
  );
}

export function ProgressBar({
  value,
  colorClass = "bg-clay",
  trackClass = "bg-black/[0.06]",
  height = "h-2",
}: {
  value: number; // 0-100
  colorClass?: string;
  trackClass?: string;
  height?: string;
}) {
  return (
    <div className={`w-full ${height} rounded-full ${trackClass} overflow-hidden`}>
      <div
        className={`${height} rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Pill({
  children,
  tone = "clay",
  className = "",
}: {
  children: ReactNode;
  tone?: "clay" | "sage" | "muted";
  className?: string;
}) {
  const tones: Record<string, string> = {
    clay: "bg-clay-pale text-clay",
    sage: "bg-sage-pale text-forest",
    muted: "bg-black/[0.05] text-muted",
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function EmptyState({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 text-muted">
      <div className="w-12 h-12 rounded-full bg-sage-pale flex items-center justify-center text-forest mb-3">
        {icon}
      </div>
      <div className="font-medium text-ink">{title}</div>
      {subtitle && <div className="text-sm mt-1 max-w-xs">{subtitle}</div>}
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 text-muted text-sm py-10 justify-center">
      <span className="w-4 h-4 rounded-full border-2 border-clay border-t-transparent animate-spin" />
      {label || "Loading..."}
    </div>
  );
}
