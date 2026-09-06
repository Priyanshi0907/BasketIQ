"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  ExternalLink,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { getProducts, getDashboard, getRules, getHistory, Product } from "@/lib/api";
import { useAuthUser } from "@/lib/auth";
import ProductImage from "@/components/ProductImage";

interface NotificationItem {
  id: string;
  title: string;
  time: string;
  unread: boolean;
  type: "alert" | "insight" | "system";
  link?: string;
}

const QUICK_ACTIONS = [
  { title: "Analyze Basket in Natural Language", href: "/basket-analyzer", icon: "🌿" },
  { title: "Explore Product Recommendations", href: "/recommendations", icon: "🛍️" },
  { title: "View Mined Association Rules", href: "/association-rules", icon: "📊" },
  { title: "Customer Basket Insights", href: "/customer-insights", icon: "👥" },
  { title: "Configure Dataset & Support Thresholds", href: "/settings", icon: "⚙️" },
];

export default function HeaderControls() {
  const router = useRouter();
  const { user, logout } = useAuthUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const fetchLiveNotifications = async () => {
    setIsRefreshing(true);
    try {
      const [prodsRes, dashRes, rulesRes, histRes] = await Promise.allSettled([
        getProducts(),
        getDashboard(),
        getRules(5),
        getHistory(3),
      ]);

      const prodsList = prodsRes.status === "fulfilled" ? prodsRes.value.products || [] : [];
      if (prodsList.length > 0) setProducts(prodsList);

      const dash = dashRes.status === "fulfilled" ? dashRes.value : null;
      const rulesData = rulesRes.status === "fulfilled" ? rulesRes.value : null;
      const historyItems = histRes.status === "fulfilled" && Array.isArray(histRes.value) ? histRes.value : [];

      const totalProds = prodsList.length || (dash ? dash.unique_products : 783);
      const totalRules = dash?.total_rules_mined || rulesData?.total || 57773;
      const totalTxns = dash?.total_transactions ? Number(dash.total_transactions).toLocaleString() : "10,000";

      const dynamicList: NotificationItem[] = [];

      // 1. Most recent user analysis if available
      if (historyItems.length > 0) {
        const latest = historyItems[0];
        const snippet = latest.input_text.length > 38 ? latest.input_text.slice(0, 38) + "..." : latest.input_text;
        const cat = latest.primary_category || "General";
        const conf = Math.round((latest.primary_confidence || 0.9) * 100);
        dynamicList.push({
          id: `hist-${latest.id}`,
          title: `Recent Analysis: "${snippet}" classified into ${cat} (${conf}% match).`,
          time: "Recent",
          unread: true,
          type: "insight",
          link: "/basket-analyzer",
        });
      }

      // 2. High lift association rule alert from actual mined rules
      if (rulesData && rulesData.rules && rulesData.rules.length > 0) {
        const topRule = rulesData.rules[0];
        const ant = topRule.antecedents.join(" + ");
        const cons = topRule.consequents.join(" + ");
        const liftVal = typeof topRule.lift === "number" ? topRule.lift.toFixed(1) : "3.5";
        const confVal = Math.round((topRule.confidence || 0.8) * 100);
        dynamicList.push({
          id: "rule-top-lift",
          title: `High lift rule: ${ant} ➔ ${cons} (Lift: ${liftVal}x, Conf: ${confVal}%).`,
          time: "Live Engine",
          unread: true,
          type: "alert",
          link: "/association-rules",
        });
      }

      // 3. Store-wide association rules & catalog summary
      dynamicList.push({
        id: "sys-rules-summary",
        title: `${Number(totalRules).toLocaleString()} association rules mined across ${totalProds} catalog products.`,
        time: "Real-time",
        unread: false,
        type: "system",
        link: "/association-rules",
      });

      // 4. Top trending product from actual transaction metrics
      if (dash && dash.top_products && dash.top_products.length > 0) {
        const topP = dash.top_products[0];
        dynamicList.push({
          id: "top-product-insight",
          title: `Trending item: "${topP.name}" is leading in ${topP.category} baskets (${topP.count} purchases).`,
          time: "Active trend",
          unread: false,
          type: "insight",
          link: "/dashboard",
        });
      }

      // 5. Total market transactions processed
      dynamicList.push({
        id: "sys-txns-count",
        title: `Market basket intelligence: ${totalTxns} synthetic transactions analyzed in ML pipeline.`,
        time: "Pipeline synced",
        unread: false,
        type: "system",
        link: "/analytics",
      });

      setNotifications(dynamicList);
    } catch {
      // Fallback in case of network issue
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
    const interval = setInterval(fetchLiveNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setNotifOpen(false);
        setProfileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto focus search input when modal opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery("");
    }
  }, [searchOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const filteredProducts = searchQuery.trim()
    ? products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.aliases?.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        .slice(0, 8)
    : [];

  const filteredActions = QUICK_ACTIONS.filter(
    (a) =>
      !searchQuery.trim() ||
      a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex items-center gap-3 shrink-0 relative">
      {/* 1. Interactive Search / Command Bar */}
      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="flex items-center gap-2 bg-cream-card hover:bg-cream-soft border border-black/[0.08] hover:border-clay/40 rounded-full px-4 py-2.5 w-64 text-muted text-sm transition-all text-left shadow-sm group"
      >
        <Search size={15} className="text-muted group-hover:text-clay transition-colors" />
        <span className="flex-1 text-ink/70 group-hover:text-ink text-xs">Search anything...</span>
        <kbd className="text-[10px] bg-black/[0.05] border border-black/[0.06] text-muted px-1.5 py-0.5 rounded font-mono">
          ⌘K
        </kbd>
      </button>

      {/* 2. Notification Bell Dropdown */}
      <div className="relative" ref={notifRef}>
        <button
          type="button"
          onClick={() => {
            setNotifOpen((prev) => !prev);
            setProfileOpen(false);
          }}
          className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
            notifOpen
              ? "bg-clay text-white shadow-md"
              : "bg-clay-pale text-clay hover:bg-clay hover:text-white"
          }`}
          title="Notifications & Market Alerts"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-cream" />
          )}
        </button>

        {notifOpen && (
          <div className="absolute right-0 top-12 w-84 sm:w-96 bg-cream-card border border-black/[0.08] rounded-2xl shadow-xl z-40 p-4 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] mb-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-semibold text-ink">Notifications</span>
                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[10px] font-medium px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
                {unreadCount > 0 && (
                  <span className="bg-clay text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLiveNotifications()}
                  disabled={isRefreshing}
                  className="text-muted hover:text-clay p-1 rounded-md transition-colors"
                  title="Refresh live stream"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin text-clay" : ""} />
                </button>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-clay hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted">
                  <div className="animate-spin w-4 h-4 border-2 border-clay border-t-transparent rounded-full mx-auto mb-2" />
                  Connecting to live market stream...
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.link) {
                        router.push(item.link);
                        setNotifOpen(false);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      item.unread
                        ? "bg-white border-clay/30 shadow-sm hover:border-clay"
                        : "bg-cream-soft/40 border-black/[0.04] opacity-80 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5">
                        {item.type === "alert" ? "⚡" : item.type === "insight" ? "💡" : "⚙️"}
                      </span>
                      <div className="flex-1">
                        <div className="text-ink font-medium leading-snug">{item.title}</div>
                        <div className="text-[10px] text-muted mt-1">{item.time}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. User Profile Dropdown */}
      <div className="relative" ref={profileRef}>
        <button
          type="button"
          onClick={() => {
            setProfileOpen((prev) => !prev);
            setNotifOpen(false);
          }}
          className="flex items-center gap-2 bg-cream-card hover:bg-cream-soft border border-black/[0.08] hover:border-clay/40 rounded-full pl-1 pr-3 py-1 transition-all shadow-sm"
        >
          <div className="w-8 h-8 rounded-full bg-forest text-cream flex items-center justify-center text-xs font-semibold shadow-inner">
            {user.initial}
          </div>
          <span className="text-xs font-medium text-ink hidden sm:inline max-w-[110px] truncate">
            {user.name}
          </span>
          <ChevronDown
            size={14}
            className={`text-muted transition-transform duration-200 ${
              profileOpen ? "rotate-180 text-clay" : ""
            }`}
          />
        </button>

        {profileOpen && (
          <div className="absolute right-0 top-12 w-64 bg-cream-card border border-black/[0.08] rounded-2xl shadow-xl z-40 p-3 animate-fade-in">
            <div className="p-2.5 bg-cream-soft/80 rounded-xl mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-forest text-cream flex items-center justify-center text-sm font-semibold">
                {user.initial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-ink truncate">{user.name}</div>
                <div className="text-[11px] text-muted truncate">{user.email}</div>
              </div>
            </div>

            <div className="space-y-1 text-xs text-ink font-medium">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/[0.04] transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle size={14} className="text-muted" /> Help & Documentation
                </span>
                <ExternalLink size={12} className="text-muted" />
              </a>
            </div>

            <div className="pt-2 mt-2 border-t border-black/[0.06]">
              <button
                onClick={() => {
                  logout();
                  setProfileOpen(false);
                  router.push("/login");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors text-xs text-left font-medium"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Global Spotlight Command Palette (⌘K) Modal */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start justify-center pt-24 px-4 animate-fade-in"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="bg-cream-card border border-black/[0.08] rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden animate-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/[0.06] bg-white">
              <Search size={18} className="text-clay" />
              <input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, categories, actions or rules... (e.g. 'muffin', 'tea', 'rules')"
                className="w-full text-sm text-ink bg-transparent focus:outline-none placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-muted hover:text-ink text-xs px-1.5 py-0.5 rounded"
                >
                  Clear
                </button>
              )}
              <kbd className="text-[10px] bg-black/[0.05] border border-black/[0.06] text-muted px-1.5 py-0.5 rounded font-mono">
                ESC
              </kbd>
            </div>

            {/* Results Section */}
            <div className="max-h-96 overflow-y-auto p-3 space-y-4 scrollbar-thin">
              {/* Product Matches */}
              {filteredProducts.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-1.5">
                    Products ({filteredProducts.length})
                  </div>
                  <div className="space-y-1">
                    {filteredProducts.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          router.push(`/recommendations`);
                          setSearchOpen(false);
                        }}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cream-soft cursor-pointer transition-colors border border-transparent hover:border-black/[0.05]"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 shrink-0">
                            <ProductImage
                              id={p.id}
                              imageQuery={p.image_query}
                              emoji={p.emoji}
                              alt={p.name}
                              size={48}
                              rounded="rounded-md"
                              className="w-7 h-7"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-medium text-ink">{p.name}</div>
                            <div className="text-[10px] text-muted">{p.category}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-clay">₹{p.avg_price}</span>
                          <ArrowRight size={12} className="text-muted" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Navigation Actions */}
              <div>
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider px-2 mb-1.5">
                  Quick Actions & Pages
                </div>
                <div className="space-y-1">
                  {filteredActions.map((action) => (
                    <div
                      key={action.href}
                      onClick={() => {
                        router.push(action.href);
                        setSearchOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-clay-pale/50 cursor-pointer transition-colors border border-transparent hover:border-clay/20"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{action.icon}</span>
                        <span className="text-xs font-medium text-ink">{action.title}</span>
                      </div>
                      <ArrowRight size={12} className="text-clay" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 bg-cream-soft/60 border-t border-black/[0.04] text-[11px] text-muted flex items-center justify-between">
              <span>ProTip: Press ⌘K anywhere to search</span>
              <span>BasketIQ Market Intelligence</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
