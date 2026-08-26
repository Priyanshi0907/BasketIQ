import json
import os

_SETTINGS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "settings.json")

_DEFAULTS = {
    "dataset": "Synthetic Retail Transactions v2 (6,000 baskets, Indian-market catalog)",
    "min_support": 0.02,
    "min_confidence": 0.2,
    "min_lift": 1.05,
    "fuzzy_match_threshold": 82,
    "recommendation_count": 4,
    "theme": "earthy",
    "model_version": "basketiq-nlp-v1.0",
}


def _load():
    if os.path.exists(_SETTINGS_PATH):
        try:
            with open(_SETTINGS_PATH, "r") as f:
                data = json.load(f)
                merged = {**_DEFAULTS, **data}
                return merged
        except Exception:
            return dict(_DEFAULTS)
    return dict(_DEFAULTS)


def _save(data):
    with open(_SETTINGS_PATH, "w") as f:
        json.dump(data, f, indent=2)


def get_settings():
    return _load()


def update_settings(patch: dict):
    data = _load()
    for k, v in patch.items():
        if k in _DEFAULTS and v is not None:
            data[k] = v
    _save(data)
    return data
