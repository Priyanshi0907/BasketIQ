import pytest
from app.ml.classifier import MODELS


def test_classify_breakfast():
    res = MODELS.classify(["bread", "butter", "eggs", "milk"])
    assert res["primary_category"] is not None
    assert res["primary_confidence"] > 0
    assert "top_categories" in res
    assert res["intent"] is not None


def test_classify_empty_basket():
    res = MODELS.classify([])
    assert res["primary_category"] is None
    assert res["primary_confidence"] == 0.0
    assert res["intent"] is None
