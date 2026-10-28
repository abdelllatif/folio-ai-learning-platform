from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    class Plan(models.TextChoices):
        FREE = "free", "Gratuit"
        PRO = "pro", "Étudiant Pro"

    class Level(models.TextChoices):
        HIGH_SCHOOL = "lycee", "Lycée"
        BACHELOR = "licence", "Licence"
        MASTER = "master", "Master"
        DOCTORATE = "doctorat", "Doctorat"
        PREP = "prepa", "Classes préparatoires"
        PROFESSIONAL = "pro", "Formation professionnelle"
        OTHER = "autre", "Autre"

    class Language(models.TextChoices):
        FR = "fr", "Français"
        EN = "en", "English"
        AR = "ar", "العربية"

    email = models.EmailField("adresse e-mail", unique=True)
    first_name = models.CharField("prénom", max_length=80)
    last_name = models.CharField("nom", max_length=80, blank=True)
    school = models.CharField("établissement", max_length=160, blank=True)
    field_of_study = models.CharField("filière", max_length=160, blank=True)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BACHELOR)
    preferred_language = models.CharField(max_length=2, choices=Language.choices,
                                          default=Language.FR)
    daily_goal_minutes = models.PositiveSmallIntegerField(default=45)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    plan = models.CharField(max_length=10, choices=Plan.choices, default=Plan.FREE)
    onboarding_done = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        verbose_name = "étudiant"
        verbose_name_plural = "étudiants"

    def __str__(self):
        return self.email

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()
