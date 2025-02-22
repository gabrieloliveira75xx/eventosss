import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME", "eventos_db")
MERCADO_PAGO_ACCESS_TOKEN = os.getenv("MERCADO_PAGO_ACCESS_TOKEN")
FRONTEND_URL = os.getenv("FRONTEND_URL")

# Pricing constants
CONVITE_UNITARIO_PRICE = 2500  # R$25.00 in cents
CONVITE_CASAL_PRICE = 4000  # R$40.00 in cents
MESA_PRICE = 2000  # R$20.00 in cents
ESTACIONAMENTO_PRICE = 2000  # R$20.00 in cents