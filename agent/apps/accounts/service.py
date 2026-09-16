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

    @staticmethod
    def update_api_key_model(user, validated_data):
        if 'api_key' in validated_data:
            user.api_key = validated_data['api_key']
        if 'model_name' in validated_data:
            user.model_name = validated_data['model_name']
        user.save()
        return user

        