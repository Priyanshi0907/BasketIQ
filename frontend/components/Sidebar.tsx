"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ScanSearch,
  ThumbsUp,
  Share2,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/basket-analyzer", label: "Basket Analyzer", icon: ScanSearch },
  { href: "/recommendations", label: "Recommendations", icon: ThumbsUp },
  { href: "/association-rules", label: "Association Rules", icon: Share2 },
  { href: "/customer-insights", label: "Customer Insights", icon: Users },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[254px] shrink-0 h-screen sticky top-0 bg-cream flex flex-col relative overflow-hidden border-r border-black/[0.05]">
      {/* Logo */}
      <div className="px-6 pt-7 pb-6 flex items-center gap-3 relative z-10 shrink-0">
        <div className="w-10 h-10 rounded-full bg-clay-pale flex items-center justify-center text-xl shrink-0">
          🧺
        </div>
        <div>
          <div className="font-display text-lg leading-none text-ink">BasketIQ</div>
          <div className="text-[10.5px] text-muted mt-1 tracking-wide">
            Market Basket Intelligence
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 space-y-1 relative z-10 shrink-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-clay-pale text-ink font-medium"
                  : "text-ink/60 hover:bg-black/[0.03] hover:text-ink"
              }`}
            >
              <Icon size={17} strokeWidth={1.8} className={active ? "text-clay" : ""} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Spacer pushes illustration + card to the bottom, no scrolling */}
      <div className="flex-1 min-h-0 relative">
        {/* decorative organic blobs */}
        <div className="pointer-events-none absolute bottom-0 left-0 w-full h-[85%]">
          <div className="absolute bottom-0 left-[-40px] w-52 h-52 rounded-full bg-clay-pale/70" />
          <div className="absolute bottom-6 left-10 w-40 h-40 rounded-full bg-sage-pale/80" />
          <div className="absolute bottom-0 right-[-30px] w-36 h-36 rounded-full bg-cream-soft" />
        </div>

        {/* basket illustration */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 select-none pointer-events-none" aria-hidden="true">
          <svg width="150" height="120" viewBox="0 0 150 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* baguette */}
            <rect x="18" y="28" width="14" height="58" rx="7" transform="rotate(-18 25 57)" fill="#F3EEE1" stroke="#D8CFB8" strokeWidth="1.5" />
            {/* bottle */}
            <rect x="38" y="20" width="16" height="46" rx="4" fill="#A9B48C" />
            <rect x="43" y="10" width="6" height="14" rx="2" fill="#7C8A5E" />
            {/* basket body */}
            <path d="M20 62 L130 62 L118 108 Q75 118 32 108 Z" fill="#D08A5C" />
            <path d="M20 62 L130 62 L125 74 L25 74 Z" fill="#E8B692" />
            {/* basket weave lines */}
            <path d="M34 74 L28 108" stroke="#B06F42" strokeWidth="2" opacity="0.5" />
            <path d="M55 74 L52 112" stroke="#B06F42" strokeWidth="2" opacity="0.5" />
            <path d="M75 74 L75 116" stroke="#B06F42" strokeWidth="2" opacity="0.5" />
            <path d="M95 74 L98 112" stroke="#B06F42" strokeWidth="2" opacity="0.5" />
            <path d="M116 74 L122 108" stroke="#B06F42" strokeWidth="2" opacity="0.5" />
            {/* handle */}
            <path d="M55 62 Q75 30 95 62" stroke="#7C8A5E" strokeWidth="5" fill="none" strokeLinecap="round" />
            {/* apple */}
            <circle cx="100" cy="52" r="12" fill="#C97A56" />
            <path d="M100 41 Q104 37 108 39" stroke="#7C8A5E" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* leaf */}
            <path d="M62 46 Q70 36 80 44 Q72 50 62 46 Z" fill="#A9B48C" />
          </svg>
        </div>
      </div>

      {/* Info card */}
      <div className="relative z-10 mx-4 mb-6 rounded-2xl bg-cream-card/90 border border-black/[0.05] p-4 shrink-0">
        <div className="font-display text-[15px] text-ink leading-snug">
          Smart decisions.
          <br />
          Stronger baskets.
        </div>
        <p className="text-xs text-muted mt-1.5">AI + NLP for Smarter Retail</p>
        <Sparkles size={14} className="text-clay mt-2.5" />
      </div>
    </aside>
  );
}
