"""
Rule-based + fuzzy-matching NLP extractor.

Approach (fully offline, no external LLM calls required):
1. Normalize & tokenize the free-text basket description.
2. Strip stopwords/connector words ("I bought", "and", "some", ...).
3. Try exact n-gram (up to 3-word) alias matches against the product catalog first.
4. For anything left unmatched, fall back to fuzzy string matching (rapidfuzz)
   against the alias index to catch typos / plurals / phrasing variety.
5. Return matched products with a per-item confidence and an overall
   extraction confidence score.
"""
import re
from rapidfuzz import fuzz, process

from app.data.catalog import ALIAS_INDEX, PRODUCT_BY_ID, STOPWORDS

_WORD_RE = re.compile(r"[a-zA-Z']+")

_ALIAS_TO_ID = dict(ALIAS_INDEX)
_ALL_ALIASES = [a for a, _ in ALIAS_INDEX]


def _normalize(text: str) -> str:
    return text.lower().strip()


def _tokenize(text: str):
    return _WORD_RE.findall(text.lower())


tokenize = _tokenize


def _strip_plural(word: str) -> str:
    if word.endswith("ies") and len(word) > 4:
        return word[:-3] + "y"
    if word.endswith("es") and len(word) > 4:
        return word[:-2]
    if word.endswith("s") and not word.endswith("ss") and len(word) > 3:
        return word[:-1]
    return word


def extract_products(text: str):
    """Returns (matched_products: list[dict], extraction_confidence: float)"""
    normalized = _normalize(text)
    tokens = [t for t in _tokenize(normalized) if t not in STOPWORDS]

    matched = {}  # product_id -> confidence
    consumed_words = set()  # words already accounted for by a higher-confidence match

    # 1) exact multi-word alias scan directly on normalized text (handles "peanut butter" etc.)
    for alias, pid in ALIAS_INDEX:
        if " " in alias and alias in normalized:
            matched[pid] = max(matched.get(pid, 0), 0.99)
            consumed_words.update(alias.split())

    # 2) exact single-token match (with simple plural stripping)
    for tok in tokens:
        if tok in consumed_words:
            continue
        singular = _strip_plural(tok)
        for candidate in (tok, singular):
            if candidate in _ALIAS_TO_ID:
                pid = _ALIAS_TO_ID[candidate]
                matched[pid] = max(matched.get(pid, 0), 0.97)
                consumed_words.add(tok)
                break

    # 3) fuzzy fallback for remaining unmatched tokens (typos, odd phrasing).
    # Cutoff is intentionally strict (90+) and skips words already consumed by a
    # confident exact match, to avoid spurious matches like "paper" -> "pampers".
    unmatched_tokens = [
        t for t in tokens
        if t not in consumed_words
        and _strip_plural(t) not in _ALIAS_TO_ID
        and t not in _ALIAS_TO_ID
        and len(t) > 3
    ]
    for tok in unmatched_tokens:
        best = process.extractOne(tok, _ALL_ALIASES, scorer=fuzz.ratio, score_cutoff=90)
        if best:
            alias, score, _ = best
            pid = _ALIAS_TO_ID[alias]
            conf = round(score / 100, 2)
            matched[pid] = max(matched.get(pid, 0), conf)

    products = []
    for pid, conf in matched.items():
        p = PRODUCT_BY_ID[pid]
        products.append({
            "id": p["id"],
            "name": p["name"],
            "category": p["category"],
            "emoji": p["emoji"],
            "image_query": p["image_query"],
            "confidence": conf,
        })

    products.sort(key=lambda x: -x["confidence"])

    if not products:
        return [], 0.0

    overall_confidence = round(sum(p["confidence"] for p in products) / len(products), 2)
    return products, overall_confidence
