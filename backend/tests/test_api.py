import pytest


def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_api_examples(client):
    res = client.get("/api/examples")
    assert res.status_code == 200
    assert "Weekend breakfast" in res.json()


def test_api_products(client):
    res = client.get("/api/products")
    assert res.status_code == 200
    data = res.json()
    assert "products" in data
    assert "categories" in data
    assert len(data["products"]) > 0


def test_api_analyze(client):
    res = client.post("/api/analyze", json={"text": "I bought bread, eggs and butter."})
    assert res.status_code == 200
    data = res.json()
    assert "extracted_products" in data
    assert "classification" in data
    assert "top_associations" in data
    assert "ai_insight" in data


def test_api_analyze_empty_error(client):
    res = client.post("/api/analyze", json={"text": ""})
    assert res.status_code == 400


def test_api_dashboard(client):
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "total_transactions" in data
    assert "top_products" in data


def test_api_analytics(client):
    res = client.get("/api/analytics")
    assert res.status_code == 200
    data = res.json()
    assert "basket_size_distribution" in data


def test_api_rules(client):
    res = client.get("/api/rules?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "rules" in data
    assert "total" in data


def test_api_recommendations(client):
    res = client.get("/api/recommendations?items=bread,butter")
    assert res.status_code == 200
    data = res.json()
    assert "recommendations" in data


def test_api_settings(client):
    res = client.get("/api/settings")
    assert res.status_code == 200
    data = res.json()
    assert "fuzzy_match_threshold" in data


def test_api_history_and_persistence(client, auth_headers):
    # Analyze a basket
    res = client.post(
        "/api/analyze",
        json={"text": "Buying tea and sugar for evening"},
        headers=auth_headers
    )
    assert res.status_code == 200

    # Retrieve history
    hist_res = client.get("/api/history", headers=auth_headers)
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert len(history) >= 1
    item_id = history[0]["id"]

    # Delete history item
    del_res = client.delete(f"/api/history/{item_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"
