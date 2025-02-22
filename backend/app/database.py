from pymongo import MongoClient
import logging
from config import MONGO_URL, DATABASE_NAME

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    client: MongoClient = None
    db = None

db = Database()

def connect_to_mongo():
    """Connect to MongoDB."""
    try:
        db.client = MongoClient(MONGO_URL)
        db.db = db.client[DATABASE_NAME]
        
        # Testando a conexão
        db.client.admin.command('ping')  # Comando para verificar a conexão com o MongoDB
        
        logger.info("Connected to MongoDB!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

def close_mongo_connection():
    """Close the MongoDB connection."""
    if db.client:
        db.client.close()
        logger.info("MongoDB connection closed!")