from pymongo import MongoClient
from app.config import MONGODB_URL, DATABASE_NAME

class Database:
    client: MongoClient = None
    db = None

db = Database()

def connect_to_mongo():
    """
    Conecta ao banco de dados MongoDB.
    """
    db.client = MongoClient(MONGODB_URL)
    db.db = db.client[DATABASE_NAME]
    print("Conectado ao MongoDB!")

def close_mongo_connection():
    """
    Fecha a conexão com o banco de dados MongoDB.
    """
    if db.client:
        db.client.close()
        print("Conexão com o MongoDB fechada!")