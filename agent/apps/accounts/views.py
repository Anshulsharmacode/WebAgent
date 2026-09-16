from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .serializers import ApiKeyModelSerializer, RegisterSerializer
from .service import UserService


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        serializer.is_valid(raise_exception=True)

        user = UserService.create_user(
            serializer.validated_data
        )

        return Response(
            {
                "message": "User created",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class ApiKeyModelView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "api_key": request.user.api_key,
                "model_name": request.user.model_name,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ApiKeyModelSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = UserService.update_api_key_model(
            request.user, serializer.validated_data
        )

        return Response(
            {
                "message": "API key and model name updated successfully",
                "user": {
                    "id": user.id,
                    "api_key": user.api_key,
                    "model_name": user.model_name,
                },
            },
            status=status.HTTP_200_OK,
        )

