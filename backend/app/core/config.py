"""Application configuration and settings."""
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # App
    APP_ENV: str = "dev"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # MongoDB
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB: str = "kosmixspaces"
    
    # JWT
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    JWT_ACCESS_TTL_MIN: int = 60
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str
    CLOUDINARY_API_KEY: str
    CLOUDINARY_API_SECRET: str
    CLOUDINARY_FOLDER: str = "kosmixspaces"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000"
    
    # Admin (for MVP - single admin user)
    ADMIN_EMAIL: str = "admin@kosmix.com"
    ADMIN_PASSWORD_HASH: str  # bcrypt hash
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
