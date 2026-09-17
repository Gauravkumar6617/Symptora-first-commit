import redis
from app.repositories.userRepositories import UserRepository
from app.core.redis import redis_client

class UserService:
    def __init__(self, user_repository: UserRepository):
        self.user_repository = user_repository
        self.redis_client = redis_client
    
    def create_user(self, user_data):
        # Create a new user using the repository
        existing_user = self.user_repository.check_user_exists(user_data.email, user_data.number)
#check by repo function if user with email or number already exists
        if(existing_user):
            raise ValueError("User with this email or number already exists.")
        
        new_user = self.user_repository.create_user(user_data)
        
        # Cache the user data in Redis
        self.redis_client.set(f"user:{new_user.id}", new_user.json())
        
        return new_user