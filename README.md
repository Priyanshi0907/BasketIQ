# BasketIQ — Market Basket Intelligence

BasketIQ is a full-stack NLP + machine learning web app that reads a shopping
basket described in **plain English**, extracts the products, classifies the
basket, and recommends what customers are likely to buy next — all backed by
real (if synthetic) transaction data and genuine model training, no
hard-coded demo responses.

> "I bought bread, butter, eggs and milk." → extracts 4 products, classifies
> the basket as **Breakfast & Bakery** (91%+ confidence), detects the intent
> **"Breakfast preparation"**, and recommends **Jam, Cheese, Cereal, Honey**
> based on mined association rules.

---

## ✨ Features / Pages

| Page | What it does |
|---|---|
| **Dashboard** | Store-wide stats, a live "Analyze your basket" widget, basket classification preview, top association rules, and basket insights. |
| **Basket Analyzer** ⭐ | The centerpiece. Enter a basket in natural language → (1) extracts products, (2) shows extraction confidence, (3) detects key terms & shopping intent, (4) classifies the basket into a category with a confidence breakdown, (5) surfaces top associated products, plus an AI-style insight summary. |
| **Recommendations** | Build a basket by hand and get "frequently bought together" suggestions ranked by support/confidence/lift. |
| **Association Rules** | Full Apriori-mined rule table (support, confidence, lift) with an adjustable minimum-lift filter, plus the underlying frequent itemsets. |
| **Customer Insights** | Product popularity rankings and the strongest co-occurring product pairs, mined from the transaction log. |
| **Analytics** | Basket-size distribution, weekly transaction patterns, lift-score distribution, and model accuracy metrics. |
| **Settings** | Dataset info, association-rule thresholds (support/confidence/lift), NLP fuzzy-match sensitivity, and recommendation count — persisted server-side. |

---

## 🧠 How the NLP / ML actually works

Everything below runs **fully offline** — no external LLM API calls, so
there's nothing to configure or pay for and no key to leak.

1. **Product extraction** (`backend/app/ml/extractor.py`)
   Tokenizes the input, strips stopwords/connector words ("I bought",
   "and", "some"...), matches multi-word and single-word product aliases
   exactly (with plural handling), then falls back to strict fuzzy string
   matching (`rapidfuzz`, ratio ≥ 90) for typos — while never re-matching
   words already consumed by a confident exact match, to avoid false
   positives like "paper" ~ "pampers".

2. **Basket classification** (`backend/app/ml/classifier.py`)
   Two scikit-learn pipelines (`TF-IDF` → `LogisticRegression`) are trained
   at process startup on ~3,000 synthetically generated but structurally
   realistic transactions (see below): one predicts a probability
   distribution over **product categories**, the other predicts the
   **shopping intent** (breakfast prep, party prep, cleaning restock, ...).
   Held-out accuracy for both is exposed live on the Analytics page.

3. **Association rule mining** (`backend/app/ml/association.py`)
   Runs the **Apriori algorithm** (`mlxtend`) over the transaction log to
   mine frequent itemsets and rules (support, confidence, lift), cached in
   memory at startup. The Basket Analyzer's "Top Associations" and the
   Recommendations page both query this rule table for the given basket.

4. **Synthetic transaction data** (`backend/app/data/generator.py`)
   Real retail data isn't available offline, so ~3,000 transactions are
   sampled from 8 "basket archetypes" (breakfast, party, cleaning, dinner,
   baby care, ...), each with a core item set and a pool of related items
   sampled probabilistically — producing genuine, explainable co-purchase
   structure instead of pure randomness, so the mined rules and trained
   classifiers reflect real patterns.

This design means the whole pipeline is transparent, reproducible from
source, and swappable — point `generate_transactions()` /
`app/data/catalog.py` at a real POS export and everything downstream (NLP,
classification, association rules, dashboards) keeps working unchanged.

---

## 🏗️ Architecture

```
basketiq/
├── backend/                  FastAPI service (Python 3.12)
│   ├── app/
│   │   ├── main.py           App entrypoint + CORS
│   │   ├── api/
│   │   │   ├── routes.py     All REST endpoints
│   │   │   └── schemas.py    Pydantic request/response models
│   │   ├── data/
│   │   │   ├── catalog.py    108-product catalog across 13 categories, intents
│   │   │   └── generator.py  Synthetic transaction generator
│   │   ├── ml/
│   │   │   ├── extractor.py  NLP product extraction
│   │   │   ├── classifier.py Category + intent classifiers (sklearn)
│   │   │   └── association.py Apriori rule mining (mlxtend)
│   │   └── core/
│   │       ├── analytics.py  Dashboard/analytics aggregation
│   │       └── settings_store.py  Persisted app settings (JSON)
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/                 Next.js 14 (App Router) + TypeScript + Tailwind
│   ├── app/
│   │   ├── dashboard/
│   │   ├── basket-analyzer/
│   │   ├── recommendations/
│   │   ├── association-rules/
│   │   ├── customer-insights/
│   │   ├── analytics/
│   │   └── settings/
│   ├── components/           Sidebar + shared UI primitives
│   ├── lib/api.ts             Typed API client
│   └── Dockerfile
│
├── docker-compose.yml         One-command local deployment
├── render.yaml                Render.com deploy config (backend)
└── frontend/vercel.json       Vercel deploy config (frontend)
```

**Stack:** FastAPI · scikit-learn · mlxtend (Apriori) · rapidfuzz · pandas ·
Next.js 14 · TypeScript · Tailwind CSS · Recharts · lucide-react

---

## 🚀 Local development

### Backend

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API is now live at `http://localhost:8000` (interactive docs at
`/docs`). Model training and rule mining happen automatically at startup —
first request may take a second or two while the process boots.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local     # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

Visit `http://localhost:3000` — it redirects to `/dashboard`.

---

## 🐳 Run everything with Docker

```bash
docker compose up --build
```

- Backend → `http://localhost:8000`
- Frontend → `http://localhost:3000`

---

## ☁️ Deploying

**Backend (Render, Railway, Fly.io, or any container host):**
- `render.yaml` is included — connect the repo on Render and it will pick up
  the config automatically (root dir `backend`, build `pip install -r
  requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`).
- Alternatively build the included `backend/Dockerfile` on any container
  platform.

**Frontend (Vercel — recommended for Next.js):**
- Import the repo into Vercel, set the project root to `frontend`.
- Add an environment variable `NEXT_PUBLIC_API_URL` pointing at your
  deployed backend URL (e.g. `https://basketiq-backend.onrender.com`).
- Vercel auto-detects Next.js and deploys on push.

**Same-host alternative:** use `docker-compose.yml` on a single VM/VPS —
both services come up together, with the frontend build already wired to
talk to the backend container.

---

## 📡 API reference (selected)

| Method | Path | Description |
|---|---|---|
| POST | `/api/analyze` | `{ "text": "..." }` → extraction, classification, associations, AI insight |
| GET | `/api/dashboard` | Store-wide summary stats |
| GET | `/api/analytics` | Basket-size / weekday / lift distributions + model accuracy |
| GET | `/api/rules?limit=&min_lift=` | Mined association rules |
| GET | `/api/itemsets?limit=` | Frequent itemsets |
| GET | `/api/recommendations?items=id1,id2` | Rule-based "frequently bought together" |
| GET | `/api/customer-insights` | Product popularity + co-occurrence |
| GET/PATCH | `/api/settings` | Read/update app settings |
| GET | `/api/products` | Full product catalog |
| GET | `/api/examples` | Example basket strings for the "Try examples" chips |

Full interactive documentation is available at `/docs` (Swagger UI) once the
backend is running.

---

## 🖼️ Product photography

Every product card shows a **real photo**, not an emoji or generated icon.
Photos are fetched client-side (in the visitor's browser, at render time)
from [LoremFlickr](https://loremflickr.com) — a free, keyless, keyword-based
photo service backed by real Creative-Commons-licensed Flickr photos (the
same provider [Faker.js ships as an official demo image source](https://fakerjs.dev/api/image.html)).

- Each product's `image_query` tag(s) (e.g. `bread,sliced`) build a URL like
  `https://loremflickr.com/300/300/bread,sliced?lock=42400`.
- The `lock` value is a stable hash of the product's id, so the **same
  product always shows the same photo** across page loads and visits.
- If a specific lookup ever fails to load, `components/ProductImage.tsx`
  falls back to a soft, on-brand emoji tile instead of a broken image — so
  the UI never looks broken, even if a particular keyword briefly misses.

No API key, no image files bundled into the repo, and nothing to configure —
this keeps the project lightweight and avoids redistributing anyone else's
photos as static assets. Swap in your own product photography by pointing
`ProductImage`/`productImageUrl()` at your CDN instead.

---

## 📝 Notes on the dataset

The transaction log is **synthetic** (see `app/data/generator.py`),
seeded for reproducibility. It's built to be behaviorally realistic (core
items + probabilistic related items per shopping archetype) so that the
mined association rules and trained classifiers reflect genuine,
explainable patterns rather than random noise — but it is not real sales
data. Swap in a real POS export by replacing `TRANSACTIONS` with your own
list of `{id, date, items: [product_id, ...]}` records and adjusting
`app/data/catalog.py` to match your product list.
