from pydantic_settings import SettingsConfigDict,BaseSettings
from pydantic import PostgresDsn ,RedisDsn
from functools import lru_cache
class Settting(BaseSettings):
#APP CONFIG
    APP_NAME                      : str = "Symptora"
    #tagline======Know when it matters. Act before it's late
    VERSION                       : int = 1
#STORAGE& CACHING
    DATABASE_URL                  : PostgresDsn  #for checking postgress url is valid or not 
    REDIS_URL                     : RedisDsn      # for checking redis_url is valid or not 

#SECURITY
    JWT_SECRET                    : str
    JWT_ALGORITHM                 : str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES   : int = 30
    REFRESH_TOKEN_EXPIRE_DAYS     : int = 7

    model_config=SettingsConfigDict(
        env_file=".env.dev",
        extra="ignore"
    )
    # medplum integration fields below it
    #medplum integration
    MEDPLUM_BASE_URL              : str
    MEDPLUM_CLIENT_ID             : str
    MEDPLUM_CLIENT_SECRET         : str
    MEDPLUM_PROJECT_ID            : str

    #otp
    OTP_EXPIRY_SECOND             : 300
    OTP_COOLDOWN_TIME             : 30
    OTP_MAX_ATTEMPT               : 5

@lru_cache      # to add cache for env as after reloading it shoudl load from env 
def get_Setting() -> Settting:
    return Settting()

settings = get_Setting()


