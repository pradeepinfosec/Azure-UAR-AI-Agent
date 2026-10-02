import os
try:
    from pydantic_settings import BaseSettings
except ImportError:
    from pydantic import BaseModel as BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Azure UAR AI Agent"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    _mongo_uri_env = os.getenv("MONGO_URI", "mongodb://localhost:27017/azure_uar_db")
    MONGO_URI: str = _mongo_uri_env + ("&directConnection=true" if "?" in _mongo_uri_env else "?directConnection=true")

    class Config:
        case_sensitive = True

settings = Settings()
