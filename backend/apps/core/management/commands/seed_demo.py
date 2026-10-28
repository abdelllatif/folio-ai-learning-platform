"""Create a demo student with a realistic library: ``python manage.py seed_demo``.

The sample course PDF is generated with reportlab (dev dependency) and analysed
synchronously, so the demo works right after ``migrate``.
"""
from datetime import timedelta
from io import BytesIO
import textwrap

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.documents.models import Subject
from apps.documents.services import process_document, upload_document
from apps.planner.models import Exam, StudyTask

EMAIL, PASSWORD = "demo@folio.ma", "Folio-Demo-2026"

COURSE = [
    ("Chapitre 1 — Le modèle relationnel", [
        "Une base de données est un ensemble structuré d'informations stockées de manière persistante.",
        "Le modèle relationnel organise les données sous forme de tables reliées entre elles.",
        "Une clé primaire est un attribut qui identifie de façon unique chaque ligne d'une table.",
        "Une clé étrangère est un attribut qui référence la clé primaire d'une autre table.",
    ]),
    ("Chapitre 2 — La normalisation", [
        "La normalisation est un processus qui réduit la redondance des données dans les tables.",
        "La première forme normale impose que chaque attribut contienne une valeur atomique.",
        "La deuxième forme normale exige que chaque attribut non clé dépende de toute la clé.",
        "La troisième forme normale interdit les dépendances transitives entre attributs non clés.",
    ]),
    ("Chapitre 3 — Le langage SQL", [
        "Le langage SQL permet d'interroger et de manipuler les données d'une base relationnelle.",
        "Une jointure combine les lignes de plusieurs tables à partir d'une condition commune.",
        "Une jointure sans condition produit le produit cartésien des deux tables.",
        "L'indexation accélère la recherche des lignes dans une table volumineuse.",
    ]),
    ("Chapitre 4 — Les transactions", [
        "Une transaction est une suite d'opérations exécutées comme une seule unité logique.",
        "L'atomicité garantit que toutes les opérations sont exécutées, ou aucune.",
        "La durabilité garantit que les modifications validées survivent à une panne.",
        "Les propriétés ACID garantissent la fiabilité des transactions dans un système de gestion.",
    ]),
]


def build_pdf() -> bytes:
    from reportlab.lib.pagesizes import A4
    from reportlab.pdfgen import canvas

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle("Introduction aux bases de données relationnelles")
    c.setAuthor("Folio — document de démonstration")
    for title, paragraphs in COURSE:
        y = 790
        c.setFont("Helvetica-Bold", 15)
        c.drawString(56, y, title)
        c.setFont("Helvetica", 11)
        y -= 32
        for para in paragraphs * 2:
            for line in textwrap.wrap(para, 88):
                c.drawString(56, y, line)
                y -= 16
            y -= 8
        c.showPage()
    c.save()
    return buf.getvalue()


class Command(BaseCommand):
    help = "Create the demo student account with sample data."

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(email=EMAIL, defaults={
            "first_name": "Salma", "last_name": "Bennani", "school": "Université Hassan II",
            "field_of_study": "Informatique", "level": "licence"})
        user.set_password(PASSWORD)
        user.save()
        if not created:
            self.stdout.write(self.style.WARNING("Demo user exists; password reset."))
            return

        bdd = Subject.objects.create(owner=user, name="Bases de données", color="#24408E")
        Subject.objects.create(owner=user, name="Réseaux", color="#2F9E74")
        try:
            pdf = SimpleUploadedFile("bases_de_donnees.pdf", build_pdf(), "application/pdf")
            document = upload_document(user, pdf, subject=bdd)
            process_document(document.pk)  # synchronous on purpose
            document.refresh_from_db()
            self.stdout.write(f"Sample document: {document.status} ({document.generated_by})")
        except ImportError:
            document = None
            self.stdout.write(self.style.WARNING("reportlab not installed: no sample document."))

        exam = Exam.objects.create(owner=user, title="Partiel de bases de données",
                                   date=timezone.localdate() + timedelta(days=10), subject=bdd)
        if document:
            exam.documents.add(document)
        for title, days, prio in [("Relire le chapitre sur la normalisation", 0, "normal"),
                                  ("Faire un quiz sur les transactions", 1, "high")]:
            StudyTask.objects.create(owner=user, title=title, priority=prio, exam=exam,
                                     due_date=timezone.localdate() + timedelta(days=days))
        self.stdout.write(self.style.SUCCESS(f"Demo ready: {EMAIL} / {PASSWORD}"))
