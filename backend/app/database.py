from pymongo import MongoClient
from config import MONGO_URL, DATABASE_NAME

class Database:
    client: MongoClient = None
    db = None

db = Database()

def connect_to_mongo():
    db.client = MongoClient(MONGO_URL)
    db.db = db.client[DATABASE_NAME]
    print("Connected to MongoDB!")

def close_mongo_connection():
    if db.client:
        db.client.close()
        print("MongoDB connection closed!")