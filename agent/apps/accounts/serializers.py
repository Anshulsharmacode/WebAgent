from rest_framework import serializers
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