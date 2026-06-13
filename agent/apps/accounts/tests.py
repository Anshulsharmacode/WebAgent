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

    def test_llm_build_requires_authentication(self):
        response = self.client.post(
            "/llm/build/",
            {"prompt": "Build a portfolio"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch("apps.llm.views.WebsiteAgentService")
    def test_authenticated_user_can_call_llm_build(self, service_class):
        user = get_user_model().objects.create_user(
            username="ansh",
            email="ansh@example.com",
            password="StrongPass123!",
        )
        service_class.return_value.create_and_run_website.return_value = {
            "site_url": "http://localhost:5174",
            "project_dir": "/tmp/demo",
        }
        self.client.force_authenticate(user=user)

        response = self.client.post(
            "/llm/build/",
            {"prompt": "Build a portfolio"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["site_url"], "http://localhost:5174")
