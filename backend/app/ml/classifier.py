"""
Basket classification models.

Two lightweight scikit-learn pipelines are trained at process startup on the
synthetic transaction corpus (see app.data.generator):

  1. Category classifier — TF-IDF(product names) -> Logistic Regression,
     predicting a probability distribution over the 10 catalog categories
     ("Top Matched Categories" panel).
  2. Intent classifier — same features -> predicts the shopping *intent*
     archetype (breakfast prep, party prep, ...) used for the
     "Intent Detected" panel.

Training on ~3000 synthetic-but-structured transactions takes well under a
second, so we simply retrain in-process on import/startup rather than
shipping a pickled model file — keeping the whole pipeline transparent and
reproducible from source.
"""
from collections import Counter

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.pipeline import Pipeline

from app.data.catalog import PRODUCT_BY_ID, INTENTS
from app.data.generator import TRANSACTIONS


def _basket_text(item_ids):
    # Repeat category tokens too, so the vectorizer picks up category-level signal
    words = []
    for pid in item_ids:
        p = PRODUCT_BY_ID.get(pid)
        if not p:
            continue
        words.append(p["name"].lower().replace(" ", "_"))
        words.append(p["category"].lower().replace(" ", "_").replace("&", "and"))
    return " ".join(words)


def _dominant_category(item_ids):
    counts = Counter(PRODUCT_BY_ID[pid]["category"] for pid in item_ids if pid in PRODUCT_BY_ID)
    if not counts:
        return None
    return counts.most_common(1)[0][0]


def _build_pipeline():
    return Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=1)),
        ("clf", LogisticRegression(max_iter=1000, C=4.0)),
    ])


class BasketModels:
    def __init__(self):
        docs = [_basket_text(t["items"]) for t in TRANSACTIONS]
        cat_labels = [_dominant_category(t["items"]) for t in TRANSACTIONS]
        intent_labels = [t["archetype"] for t in TRANSACTIONS]

        # --- category model ---
        Xtr, Xte, ytr, yte = train_test_split(docs, cat_labels, test_size=0.2, random_state=42)
        self.category_pipeline = _build_pipeline()
        self.category_pipeline.fit(Xtr, ytr)
        self.category_accuracy = round(
            accuracy_score(yte, self.category_pipeline.predict(Xte)), 4
        )

        # --- intent model ---
        Xtr2, Xte2, ytr2, yte2 = train_test_split(docs, intent_labels, test_size=0.2, random_state=42)
        self.intent_pipeline = _build_pipeline()
        self.intent_pipeline.fit(Xtr2, ytr2)
        self.intent_accuracy = round(
            accuracy_score(yte2, self.intent_pipeline.predict(Xte2)), 4
        )

        self.intent_lookup = {i["name"]: i for i in INTENTS}
        self.n_train = len(docs)

    def classify(self, item_ids):
        if not item_ids:
            return {
                "top_categories": [],
                "primary_category": None,
                "primary_confidence": 0.0,
                "intent": None,
                "intent_confidence": 0.0,
                "intent_description": None,
            }

        text = _basket_text(item_ids)

        cat_probs = self.category_pipeline.predict_proba([text])[0]
        cat_classes = self.category_pipeline.classes_
        cat_ranked = sorted(zip(cat_classes, cat_probs), key=lambda x: -x[1])
        top_categories = [{"category": c, "confidence": round(float(p), 4)} for c, p in cat_ranked[:3]]
        primary_category, primary_confidence = top_categories[0]["category"], top_categories[0]["confidence"]

        intent_probs = self.intent_pipeline.predict_proba([text])[0]
        intent_classes = self.intent_pipeline.classes_
        intent_ranked = sorted(zip(intent_classes, intent_probs), key=lambda x: -x[1])
        intent_name, intent_conf = intent_ranked[0][0], round(float(intent_ranked[0][1]), 4)
        intent_meta = self.intent_lookup.get(intent_name, {})

        return {
            "top_categories": top_categories,
            "primary_category": primary_category,
            "primary_confidence": primary_confidence,
            "intent": intent_name,
            "intent_confidence": intent_conf,
            "intent_description": intent_meta.get("description", ""),
        }


# Trained lazily on first use (not at import time) and cached after that,
# so the app can boot and bind its port immediately even on slow/CPU-limited
# hosts. The first request that needs classification pays the training cost;
# every request after that reuses the cached instance.
_MODELS_INSTANCE = None


def get_models() -> "BasketModels":
    global _MODELS_INSTANCE
    if _MODELS_INSTANCE is None:
        _MODELS_INSTANCE = BasketModels()
    return _MODELS_INSTANCE


def __getattr__(name: str):
    if name == "MODELS":
        return get_models()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")