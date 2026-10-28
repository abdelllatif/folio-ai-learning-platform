import pytest

COURSE = """Introduction aux bases de données

Une base de données est un ensemble structuré d'informations stockées de manière persistante.
Le modèle relationnel organise les données sous forme de tables reliées entre elles.
Une clé primaire est un attribut qui identifie de façon unique chaque ligne d'une table.
Une clé étrangère est un attribut qui référence la clé primaire d'une autre table.

La normalisation est un processus qui réduit la redondance des données dans les tables.
La première forme normale impose que chaque attribut contienne une valeur atomique.
Le langage SQL permet d'interroger et de manipuler les données d'une base relationnelle.
Une transaction est une suite d'opérations exécutées comme une seule unité logique.
Les propriétés ACID garantissent la fiabilité des transactions dans un système de gestion.
L'indexation accélère la recherche des lignes dans une table volumineuse.
Une jointure combine les lignes de plusieurs tables à partir d'une condition commune.
"""


class OfflineLLM:
    model_name = "offline"

    def is_available(self):
        return False

    def generate(self, *a, **k):
        raise AssertionError("must not be called")

    def chat(self, *a, **k):
        raise AssertionError("must not be called")


class ScriptedLLM:
    """Returns canned responses in order — lets us test the LLM code paths."""

    model_name = "scripted"

    def __init__(self, *responses):
        self.responses = list(responses)
        self.calls = []

    def is_available(self):
        return True

    def generate(self, prompt, **kw):
        self.calls.append(prompt)
        return self.responses.pop(0)

    def chat(self, messages, **kw):
        self.calls.append(messages)
        return self.responses.pop(0)


@pytest.fixture
def course_text():
    return COURSE
