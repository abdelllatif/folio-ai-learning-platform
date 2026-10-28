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


def test_password_reset_flow(mailoutbox):
    import re

    client = APIClient()
    client.post("/api/v1/auth/register/", PAYLOAD, format="json")
    res = client.post("/api/v1/auth/password/reset/", {"email": "salma@example.com"},
                      format="json")
    assert res.status_code == 200 and len(mailoutbox) == 1
    uid, token = re.search(r"uid=([^&]+)&token=(\S+)", mailoutbox[0].body).groups()
    bad = client.post("/api/v1/auth/password/reset/confirm/",
                      {"uid": uid, "token": "nope", "password": "Nouveau-2026!"}, format="json")
    assert bad.status_code == 400
    ok = client.post("/api/v1/auth/password/reset/confirm/",
                     {"uid": uid, "token": token, "password": "Nouveau-2026!"}, format="json")
    assert ok.status_code == 200
    login = client.post("/api/v1/auth/login/",
                        {"email": "salma@example.com", "password": "Nouveau-2026!"},
                        format="json")
    assert login.status_code == 200
    # unknown e-mail gets the same answer and no mail
    client.post("/api/v1/auth/password/reset/", {"email": "nobody@x.ma"}, format="json")
    assert len(mailoutbox) == 1


def test_me_requires_auth():
    assert APIClient().get("/api/v1/auth/me/").status_code == 401
