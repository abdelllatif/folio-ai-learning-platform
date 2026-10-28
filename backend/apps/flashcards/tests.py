import pytest

pytestmark = pytest.mark.django_db


def test_generate_review_cycle(api, ready_document):
    deck = api.post("/api/v1/decks/generate/", {"document": ready_document.pk, "count": 6},
                    format="json")
    assert deck.status_code == 201, deck.data
    assert deck.data["card_count"] >= 1 and deck.data["due_count"] == deck.data["card_count"]

    due = api.get("/api/v1/cards/due/", {"deck": deck.data["id"]}).data
    card = due[0]
    reviewed = api.post(f"/api/v1/cards/{card['id']}/review/", {"grade": 2}, format="json").data
    assert reviewed["interval_days"] == 1 and reviewed["repetitions"] == 1

    remaining = api.get("/api/v1/cards/due/", {"deck": deck.data["id"]}).data
    assert len(remaining) == len(due) - 1


def test_manual_deck_and_card(api):
    deck = api.post("/api/v1/decks/", {"title": "Vocabulaire SQL"}, format="json")
    assert deck.status_code == 201 and deck.data["card_count"] == 0
    card = api.post("/api/v1/cards/", {"deck": deck.data["id"], "front": "SELECT",
                                       "back": "Lit des lignes"}, format="json")
    assert card.status_code == 201


def test_cannot_add_card_to_foreign_deck(api, other_user):
    from apps.flashcards.models import Deck

    foreign = Deck.objects.create(owner=other_user, title="Privé")
    res = api.post("/api/v1/cards/", {"deck": foreign.pk, "front": "a", "back": "b"},
                   format="json")
    assert res.status_code == 400
