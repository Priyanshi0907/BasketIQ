import pytest
from app.ml.extractor import extract_products, tokenize


def test_tokenize_basic():
    tokens = tokenize("I bought bread, milk, and 2 eggs!")
    assert "bread" in tokens
    assert "milk" in tokens
    assert "eggs" in tokens


def test_extract_products_direct_match():
    products, confidence = extract_products("Buying bread and milk for breakfast")
    prod_ids = [p["id"] for p in products]
    assert "bread" in prod_ids
    assert "milk" in prod_ids
    assert confidence > 0.6


def test_extract_products_fuzzy_and_aliases():
    # Misspelled "biskit" or "choclates"
    products, confidence = extract_products("Need some choclates and biskits")
    prod_ids = [p["id"] for p in products]
    assert len(prod_ids) > 0


def test_extract_products_empty():
    products, confidence = extract_products("")
    assert products == []
    assert confidence == 0.0
