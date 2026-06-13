from .models import User

class UserService:
    @staticmethod
    def create_user(validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email = validated_data['email'],
            password=validated_data['password']
        )
        return  user
        