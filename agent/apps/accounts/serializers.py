from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import User

class RegisterSerializer(serializers.ModelSerializer):
    
    password = serializers.CharField(write_only = True, min_length = 6)
    
    class Meta:
        model = User
        
        fields = [
            "username",
            "email",
            "password"
        ]

    def validate_password(self, value):
        validate_password(value)
        return value


class ApiKeyModelSerializer(serializers.ModelSerializer):
    api_key = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    model_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = User
        fields = ["api_key", "model_name"]

