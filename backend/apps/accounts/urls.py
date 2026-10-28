from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import password_reset, views

urlpatterns = [
    path("password/reset/", password_reset.request_reset, name="password-reset"),
    path("password/reset/confirm/", password_reset.confirm_reset, name="password-reset-confirm"),
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("me/", views.MeView.as_view(), name="me"),
    path("me/password/", views.ChangePasswordView.as_view(), name="change-password"),
    path("me/plan/", views.UpgradePlanView.as_view(), name="change-plan"),
]
