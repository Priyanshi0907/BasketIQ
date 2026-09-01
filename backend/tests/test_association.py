import pytest
from app.ml.association import (
    top_associations_for,
    rules_as_records,
    frequent_itemsets_as_records,
    get_rules_df,
)


def test_rules_df_populated():
    rules_df = get_rules_df()
    assert not rules_df.empty
    assert "antecedents" in rules_df.columns
    assert "consequents" in rules_df.columns
    assert "lift" in rules_df.columns



def test_top_associations_for_tea():
    recs = top_associations_for(["tea", "milk"], n=3)
    assert isinstance(recs, list)
    assert len(recs) > 0
    assert "name" in recs[0]
    assert "lift" in recs[0]


def test_rules_as_records():
    records = rules_as_records(limit=10, min_lift=1.0)
    assert isinstance(records, list)
    assert len(records) <= 10
    if len(records) > 0:
        assert "antecedents" in records[0]
        assert "consequents" in records[0]
        assert records[0]["lift"] >= 1.0


def test_frequent_itemsets_as_records():
    itemsets = frequent_itemsets_as_records(limit=10)
    assert isinstance(itemsets, list)
    assert len(itemsets) <= 10
