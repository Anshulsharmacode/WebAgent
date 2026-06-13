from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):

    email = models.EmailField(unique=True)

    is_verified = models.BooleanField(default=False)

    api_key = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )

    USERNAME_FIELD = 'email'

    REQUIRED_FIELDS = ['username'] #this is for login field ansh@gmail.com , will ansh user name

    def __str__(self):
        return self.email