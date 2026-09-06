"""
Run this locally whenever catalog.py or generator.py's ARCHETYPES change,
to regenerate the committed cache files that let the app start up fast.

Usage (from backend/):
    python scripts/build_cache.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

CACHE_FILES = [
    "app/data/_transactions_cache.pkl",
    "app/ml/_association_cache.pkl",
    "app/ml/_models_cache.pkl",
]

if __name__ == "__main__":
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for rel in CACHE_FILES:
        p = os.path.join(root, rel)
        if os.path.exists(p):
            os.remove(p)
            print(f"Removed stale cache: {rel}")

    print("Rebuilding transactions cache...")
    import app.data.generator  # noqa: F401  (writes _transactions_cache.pkl)

    print("Rebuilding association-rules cache...")
    import app.ml.association  # noqa: F401  (writes _association_cache.pkl)

    print("Rebuilding trained-models cache...")
    import app.ml.classifier  # noqa: F401  (writes _models_cache.pkl)

    print("\nDone. New cache files:")
    for rel in CACHE_FILES:
        p = os.path.join(root, rel)
        size_kb = os.path.getsize(p) / 1024
        print(f"  {rel}  ({size_kb:.1f} KB)")
    print("\nCommit these .pkl files to git so deploys start up fast.")
