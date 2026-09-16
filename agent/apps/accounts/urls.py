from django.urls import path
from .views import ApiKeyModelView, RegisterView
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [

    path(
        'signup/',
        RegisterView.as_view(),
        name='signup',
    ),

    path(
        'signin/',
        TokenObtainPairView.as_view(),
        name='signin',
    ),

    path(
        'refresh/',
        TokenRefreshView.as_view(),
        name='refresh',
    ),

    path(
        'api-key/',
        ApiKeyModelView.as_view(),
        name='api_key_model',
    ),
]

