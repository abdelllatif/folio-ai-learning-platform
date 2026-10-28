from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle

from .models import ContactMessage, NewsletterSubscriber


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("name", "email", "topic", "organization", "message")

    def validate_message(self, value):
        if len(value.strip()) < 10:
            raise serializers.ValidationError("Décrivez votre demande en quelques mots de plus.")
        return value


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def contact(request):
    serializer = ContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = request.user if request.user.is_authenticated else None
    serializer.save(user=user)
    return Response({"detail": "Message envoyé. Nous répondons sous 48 h ouvrées."},
                    status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
@throttle_classes([AnonRateThrottle])
def newsletter(request):
    email = serializers.EmailField().run_validation(request.data.get("email"))
    NewsletterSubscriber.objects.update_or_create(email=email.lower(),
                                                  defaults={"is_active": True})
    return Response({"detail": "Inscription confirmée."}, status=status.HTTP_201_CREATED)
