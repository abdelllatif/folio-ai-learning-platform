from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .services import usage_summary

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    usage = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id", "email", "first_name", "last_name", "full_name", "school",
            "field_of_study", "level", "preferred_language", "daily_goal_minutes",
            "avatar", "plan", "onboarding_done", "date_joined", "usage",
        )
        read_only_fields = ("id", "email", "plan", "date_joined")

    def get_usage(self, obj):
        return usage_summary(obj)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    accept_terms = serializers.BooleanField(write_only=True)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "school",
                  "field_of_study", "level", "accept_terms")

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cet e-mail.")
        return value

    def validate_accept_terms(self, value):
        if not value:
            raise serializers.ValidationError("Vous devez accepter les conditions d'utilisation.")
        return value

    def validate(self, attrs):
        validate_password(attrs["password"], User(email=attrs.get("email"),
                                                  first_name=attrs.get("first_name", "")))
        return attrs

    def create(self, validated_data):
        validated_data.pop("accept_terms")
        password = validated_data.pop("password")
        return User.objects.create_user(password=password, **validated_data)


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Mot de passe actuel incorrect.")
        return value

    def validate_new_password(self, value):
        validate_password(value, self.context["request"].user)
        return value


class FolioTokenSerializer(TokenObtainPairSerializer):
    """Return the user profile alongside the token pair to save a round trip."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data
