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
    OTP_EXPIRY_SECONDS            : int = 300
    OTP_COOLDOWN_SECONDS          : int = 30
    OTP_MAX_ATTEMPTS              : int = 5

    # Email delivery
    SMTP_HOST                     : str = "smtp.gmail.com"
    SMTP_PORT                     : int = 587
    SMTP_USER                     : str = ""
    SMTP_PASSWORD                 : str = ""
    FROM_EMAIL                    : str = ""
    SMTP_USE_TLS                  : bool = True

    # cloudflare R2
    R2_ACCOUNT_ID: str
    R2_BUCKET: str
    R2_ACCESS_KEY_ID: str
    R2_SECRET_ACCESS_KEY: str
    R2_PRESIGNED_EXPIRY_SECONDS: int = 3600
    MAX_AVATAR_SIZE_MB: int = 5

    ##google alender
    GOOGLE_CLIENT_ID: str
    GOOGLE_CLIENT_SECRET: str
    GOOGLE_REFRESH_TOKEN: str

@lru_cache      # to add cache for env as after reloading it shoudl load from env 
def get_Setting() -> Settting:
    return Settting()

settings = get_Setting()

