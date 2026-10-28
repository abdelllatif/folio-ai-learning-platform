import pytest
from rest_framework.test import APIClient

pytestmark = pytest.mark.django_db


def test_public_contact_and_newsletter():
    client = APIClient()
    res = client.post("/api/v1/support/contact/", {
        "name": "Mme Benali", "email": "direction@lycee.ma", "topic": "school",
        "organization": "Lycée Al Khansaa", "message": "Nous souhaitons équiper 3 classes."},
        format="json")
    assert res.status_code == 201
    assert client.post("/api/v1/support/newsletter/", {"email": "A@b.ma"},
                       format="json").status_code == 201
    assert client.post("/api/v1/support/newsletter/", {"email": "pas-un-email"},
                       format="json").status_code == 400
