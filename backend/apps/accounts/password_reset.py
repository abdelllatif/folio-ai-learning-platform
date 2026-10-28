"""Forgot-password flow using Django's signed, single-use tokens.

1. POST /auth/password/reset/          {email}                → e-mail with a link
2. POST /auth/password/reset/confirm/  {uid, token, password} → new password set
The response to step 1 is identical whether the account exists or not.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

User = get_user_model()
GENERIC_REPLY = {"detail": "Si un compte existe pour cette adresse, un e-mail vient d'être envoyé."}


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def request_reset(request):
    email = serializers.EmailField().run_validation(request.data.get("email"))
    user = User.objects.filter(email=email.lower(), is_active=True).first()
    if user:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)
        link = f"{settings.FRONTEND_URL}/reinitialiser?uid={uid}&token={token}"
        send_mail(
            subject="Folio — réinitialiser votre mot de passe",
            message=(f"Bonjour {user.first_name},\n\nPour choisir un nouveau mot de passe, "
                     f"ouvrez ce lien (valable 3 jours) :\n{link}\n\nSi vous n'êtes pas à "
                     "l'origine de cette demande, ignorez cet e-mail.\n\nL'équipe Folio"),
            from_email=settings.DEFAULT_FROM_EMAIL, recipient_list=[user.email],
            fail_silently=True,
        )
    return Response(GENERIC_REPLY)


class ResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(min_length=8)

    def validate(self, attrs):
        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(attrs["uid"])))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            user = None
        if not user or not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError("Lien invalide ou expiré. Refaites une demande.")
        validate_password(attrs["password"], user)
        attrs["user"] = user
        return attrs


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def confirm_reset(request):
    serializer = ResetConfirmSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.validated_data["user"]
    user.set_password(serializer.validated_data["password"])
    user.save(update_fields=["password"])
    return Response({"detail": "Mot de passe modifié. Vous pouvez vous connecter."},
                    status=status.HTTP_200_OK)
