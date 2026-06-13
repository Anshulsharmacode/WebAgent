from django.shortcuts import render
from .serializers import RegisterSerializer
from .service import UserService
from rest_framework.views import APIView


# Create your views here.
class RegisterView(APIView):
    
    def post(self, request):
        
        serializers= RegisterSerializer(data=request.data)
        
        serializers.is_valid(raise_exception=True)
        
        user = UserService.create_user(
            serializers.validated_data
        )
        
        return({
        "message": "User created"
        })