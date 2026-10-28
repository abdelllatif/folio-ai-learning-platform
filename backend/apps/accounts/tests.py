import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db

PAYLOAD = {
    "email": "Salma@Example.com", "password": "Cours-2026!", "first_name": "Salma",
    "level": "licence", "accept_terms": True,
}


def test_register_returns_tokens_and_lowercases_email():
    res = APIClient().post("/api/v1/auth/register/", PAYLOAD, format="json")
    assert res.status_code == 201
    assert res.data["user"]["email"] == "salma@example.com"
    assert res.data["access"] and res.data["refresh"]


def test_register_requires_terms():
    res = APIClient().post("/api/v1/auth/register/", {**PAYLOAD, "accept_terms": False},
                           format="json")
    assert res.status_code == 400
    assert res.data["error"]["code"] == "validation_error"


def test_login_then_me():
    client = APIClient()
    client.post("/api/v1/auth/register/", PAYLOAD, format="json")
    res = client.post("/api/v1/auth/login/",
                      {"email": "salma@example.com", "password": PAYLOAD["password"]},
                      format="json")
    assert res.status_code == 200
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")
    me = client.get("/api/v1/auth/me/")
    assert me.data["first_name"] == "Salma"
    assert me.data["usage"]["documents_used"] == 0


def test_me_requires_auth():
    assert APIClient().get("/api/v1/auth/me/").status_code == 401
