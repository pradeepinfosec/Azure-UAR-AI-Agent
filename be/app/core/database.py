import logging
from pymongo import MongoClient
from app.core.config import settings

logger = logging.getLogger(__name__)

class DatabaseManager:
    _client: MongoClient = None

    @classmethod
    def get_client(cls) -> MongoClient:
        if cls._client is None:
            try:
                cls._client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=2000)
                logger.info("Connected to MongoDB successfully.")
            except Exception as e:
                logger.warning(f"Failed to connect to MongoDB: {e}. Running in memory fallback mode.")
                cls._client = None
        return cls._client

    @classmethod
    def get_db(cls):
        client = cls.get_client()
        if client:
            return client.get_default_database()
        return None
