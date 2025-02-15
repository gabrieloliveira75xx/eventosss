import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")
MERCADO_PAGO_ACCESS_TOKEN = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")

TICKET_PRICE = 20  # Price per ticket in the smallest currency unit (e.g., cents)   