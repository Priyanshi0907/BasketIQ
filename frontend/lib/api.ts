export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("basketiq_token");
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem("basketiq_token", token);
    } else {
      localStorage.removeItem("basketiq_token");
    }
  } catch {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token && !headers["Authorization"]) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `API ${path} failed (${res.status})`;
    try {
      const errorJson = await res.json();
      if (errorJson && errorJson.detail) {
        errorDetail = typeof errorJson.detail === "string" ? errorJson.detail : JSON.stringify(errorJson.detail);
      }
    } catch {
      try {
        const body = await res.text();
        if (body) errorDetail = `${errorDetail}: ${body}`;
      } catch {}
    }
    throw new Error(errorDetail);
  }
  return res.json() as Promise<T>;
}

// ---- Types ----
export interface UserProfile {
  id?: number;
  name: string;
  email: string;
  initial: string;
  role?: string;
  isNewUser?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
    initial: string;
    created_at: string;
  };
}

export interface ExtractedProduct {
  id: string;
  name: string;
  category: string;
  emoji: string;
  image_query: string;
  confidence: number;
}

export interface CategoryConfidence {
  category: string;
  confidence: number;
}

export interface Classification {
  top_categories: CategoryConfidence[];
  primary_category: string | null;
  primary_confidence: number;
  intent: string | null;
  intent_confidence: number;
  intent_description: string | null;
}

export interface Association {
  id: string;
  name: string;
  emoji?: string;
  image_query?: string;
  support: number;
  confidence: number;
  lift: number;
}

export interface AnalyzeResponse {
  input_text: string;
  extracted_products: ExtractedProduct[];
  extraction_confidence: number;
  classification: Classification;
  top_associations: Association[];
  ai_insight: { headline: string; reasons: string[] };
}

export interface AnalysisHistoryItem {
  id: number;
  input_text: string;
  extracted_products: ExtractedProduct[];
  primary_category: string | null;
  primary_confidence: number;
  intent: string | null;
  intent_confidence: number;
  ai_headline: string | null;
  created_at: string;
}

export interface DashboardResponse {
  total_transactions: number;
  avg_basket_size: number;
  unique_products: number;
  total_rules_mined: number;
  top_products: { id: string; name: string; emoji: string; image_query: string; category: string; count: number }[];
  category_breakdown: { category: string; count: number }[];
  intent_breakdown: { intent: string; count: number }[];
  trend: { date: string; transactions: number }[];
  category_model_accuracy: number;
  intent_model_accuracy: number;
  avg_lift: number;
  top_categories_count: number;
}

export interface RuleRecord {
  antecedents: string[];
  consequents: string[];
  support: number;
  confidence: number;
  lift: number;
}

export interface AnalyticsResponse {
  basket_size_distribution: { size: number; count: number }[];
  lift_distribution: { bucket: string; count: number }[];
  weekday_pattern: { day: string; count: number }[];
  frequent_itemsets_count: number;
  rules_count: number;
  category_model_accuracy: number;
  intent_model_accuracy: number;
  training_transactions: number;
}

export interface SettingsResponse {
  dataset: string;
  min_support: number;
  min_confidence: number;
  min_lift: number;
  fuzzy_match_threshold: number;
  recommendation_count: number;
  theme: string;
  model_version: string;
}

export interface CustomerInsightsResponse {
  top_popular: { id: string; name: string; emoji: string; image_query: string; category: string; purchases: number }[];
  top_co_occurring: { a: string; b: string; count: number; a_image_query: string; b_image_query: string }[];
  dataset_note: { transactions: number; products: number; dataset_name: string };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  emoji: string;
  image_query: string;
  aliases: string[];
  avg_price: number;
}

// ---- Auth API calls ----
export const loginApi = (email: string, password: string) =>
  request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const registerApi = (name: string, email: string, password: string) =>
  request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const socialLoginApi = (provider: string, email: string, name?: string) =>
  request<AuthResponse>("/api/auth/social-login", {
    method: "POST",
    body: JSON.stringify({ provider, email, name }),
  });

export const getMeApi = () => request<UserProfile>("/api/auth/me");

export const updateProfileApi = (patch: { name?: string; password?: string }) =>
  request<UserProfile>("/api/auth/me", {
    method: "PUT",
    body: JSON.stringify(patch),
  });

// ---- General API calls ----
export const analyzeBasket = (text: string) =>
  request<AnalyzeResponse>("/api/analyze", { method: "POST", body: JSON.stringify({ text }) });

export const getHistory = (limit = 20) =>
  request<AnalysisHistoryItem[]>(`/api/history?limit=${limit}`);

export const deleteHistoryItem = (id: number) =>
  request<{ status: string; id: number }>(`/api/history/${id}`, { method: "DELETE" });

export const createTransactionApi = (items: string[], archetype?: string) =>
  request<{ status: string; transaction_id: string; total_amount: number; items_count: number }>(
    "/api/transactions",
    {
      method: "POST",
      body: JSON.stringify({ items, archetype }),
    }
  );

export const getExamples = () => request<Record<string, string>>("/api/examples");

export const getDashboard = () => request<DashboardResponse>("/api/dashboard");

export const getAnalytics = () => request<AnalyticsResponse>("/api/analytics");

export const getRules = (limit = 50) => request<{ rules: RuleRecord[]; total: number }>(`/api/rules?limit=${limit}`);

export const getItemsets = (limit = 50) => request<{ itemsets: { items: string[]; support: number }[] }>(`/api/itemsets?limit=${limit}`);

export const getRecommendations = (items?: string[]) => {
  const q = items && items.length ? `?items=${items.join(",")}` : "";
  return request<{ basis_items: string[]; recommendations: Association[] }>(`/api/recommendations${q}`);
};

export const getCustomerInsights = () => request<CustomerInsightsResponse>("/api/customer-insights");

export const getProducts = () => request<{ products: Product[]; categories: string[] }>("/api/products");

export const getSettings = () => request<SettingsResponse>("/api/settings");

export const updateSettings = (patch: Partial<SettingsResponse>) =>
  request<SettingsResponse>("/api/settings", { method: "PATCH", body: JSON.stringify(patch) });
