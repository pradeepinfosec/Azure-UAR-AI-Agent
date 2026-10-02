from pymongo import MongoClient
from app.core.config import settings
import logging

try:
    client = MongoClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    # verify connection
    client.server_info()
    db = client.get_database() # Uses default db from URI
except Exception as e:
    logging.warning(f"Could not connect to MongoDB: {e}")
    db = None

# Triggers uvicorn reload
