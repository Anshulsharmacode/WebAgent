from unittest.mock import patch

from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase


class AuthTests(APITestCase):
    def test_signup_creates_user_with_hashed_password(self):
        response = self.client.post(
            "/api/v1/users/signup/",
            {
                "username": "ansh",
                "email": "ansh@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["message"], "User created")
        self.assertNotIn("password", response.data["user"])

        user = get_user_model().objects.get(email="ansh@example.com")
        self.assertTrue(user.check_password("StrongPass123!"))

    def test_signin_returns_jwt_pair_for_email_login(self):
        get_user_model().objects.create_user(
            username="ansh",
            email="ansh@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            "/api/v1/users/signin/",
            {"email": "ansh@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_duplicate_email_is_rejected(self):
        get_user_model().objects.create_user(
            username="ansh",
            email="ansh@example.com",
            password="StrongPass123!",
        )

        response = self.client.post(
            "/api/v1/users/signup/",
            {
                "username": "ansh2",
                "email": "ansh@example.com",
                "password": "StrongPass123!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)



    def test_api_key_route_requires_authentication(self):
        response = self.client.post(
            "/api/v1/users/api-key/",
            {"api_key": "secret-key", "model_name": "gemini-2.5-flash"},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_authenticated_user_can_update_and_get_api_key_and_model_name(self):
        user = get_user_model().objects.create_user(
            username="ansh",
            email="ansh@example.com",
            password="StrongPass123!",
        )
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/api/v1/users/api-key/",
            {"api_key": "my-secret-api-key", "model_name": "gemini-2.5-flash"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["user"]["api_key"], "my-secret-api-key")
        self.assertEqual(response.data["user"]["model_name"], "gemini-2.5-flash")

        user.refresh_from_db()
        self.assertEqual(user.api_key, "my-secret-api-key")
        self.assertEqual(user.model_name, "gemini-2.5-flash")

        get_response = self.client.get("/api/v1/users/api-key/")
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["api_key"], "my-secret-api-key")
        self.assertEqual(get_response.data["model_name"], "gemini-2.5-flash")





