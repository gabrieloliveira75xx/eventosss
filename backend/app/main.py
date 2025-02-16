from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import mercadopago
import logging

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection (PyMongo)
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)  # Conexão síncrona
db = client.eventos_db

# Mercado Pago configuration
mp = mercadopago.SDK(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))

# Função para obter a conexão com o banco de dados
def get_db():
    return db

class PurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str = Field(..., pattern=r"^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$")  # Aceita formatos com ou sem o DDD
    conviteType: str
    mesa: bool = False  # O campo mesa é agora opcional
    estacionamento: bool = False  # O campo estacionamento é agora opcional

class PaymentRequest(BaseModel):
    purchase_id: str
    payment_data: dict

@app.post("/api/iniciar-compra")
async def iniciar_compra(purchase: PurchaseRequest, db=Depends(get_db)):
    try:
        # Calculate total amount
        total_amount = 25 if purchase.conviteType == "unitario" else 40
        if purchase.mesa:
            total_amount += 20
        if purchase.estacionamento:
            total_amount += 20

        # Create purchase document
        purchase_doc = purchase.dict()
        purchase_doc["total_amount"] = total_amount
        purchase_doc["status"] = "pending"

        result = db.purchases.insert_one(purchase_doc)  # Operação síncrona
        purchase_id = str(result.inserted_id)

        # Create Mercado Pago preference
        preference_data = {
            "items": [
                {
                    "title": f"Convite {'unitário' if purchase.conviteType == 'unitario' else 'casal'}",
                    "quantity": 1,
                    "currency_id": "BRL",
                    "unit_price": total_amount
                }
            ],
            "payer": {
                "name": purchase.nome,
                "surname": purchase.sobrenome,
                "email": "example@example.com",  # Sem autenticação de usuário
                "phone": {
                    "area_code": purchase.telefone[:2],  # Extrai o DDD
                    "number": purchase.telefone[-8:]  # Extrai o número sem DDD
                }
            },
            "payment_methods": {
                "excluded_payment_types": [{"id": "ticket"}]
            },
            "back_urls": {
                "success": f"{os.getenv('FRONTEND_URL')}/api/pagamento-sucesso",
                "failure": f"{os.getenv('FRONTEND_URL')}/api/pagamento-falha",
                "pending": f"{os.getenv('FRONTEND_URL')}/api/pagamento-pendente"
            },
            "auto_return": "approved",
            "external_reference": purchase_id
        }

        preference_result = mp.preference().create(preference_data)
        preference = preference_result["response"]

        # Update purchase with preference ID
        db.purchases.update_one(
            {"_id": ObjectId(purchase_id)},
            {"$set": {"preference_id": preference["id"]}}
        )  # Operação síncrona

        return {
            "purchase_id": purchase_id,
            "amount": total_amount,
            "preference_id": preference["id"]
        }
    except Exception as e:
        logger.error(f"Error in iniciar_compra: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/finalizar-pagamento")
async def finalizar_pagamento(payment: PaymentRequest, db=Depends(get_db)):
    try:
        # Retrieve purchase details
        purchase = db.purchases.find_one({"_id": ObjectId(payment.purchase_id)})  # Operação síncrona
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Process payment using Mercado Pago SDK
        payment_data = payment.payment_data
        payment_data["transaction_amount"] = purchase["total_amount"]
        payment_data["description"] = f"Convite {'unitário' if purchase['conviteType'] == 'unitario' else 'casal'}"

        payment_response = mp.payment().create(payment_data)

        if payment_response["status"] == 201:
            payment_result = payment_response["response"]
            
            # Update purchase status
            db.purchases.update_one(
                {"_id": ObjectId(payment.purchase_id)},
                {"$set": {
                    "status": payment_result["status"],
                    "payment_id": payment_result["id"],
                    "payment_details": payment_result
                }}
            )  # Operação síncrona

            return {"status": "success", "payment_id": payment_result["id"]}
        else:
            raise HTTPException(status_code=400, detail="Payment processing failed")

    except Exception as e:
        logger.error(f"Error in finalizar_pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/status-compra/{purchase_id}")
async def status_compra(purchase_id: str, db=Depends(get_db)):
    try:
        purchase = db.purchases.find_one({"_id": ObjectId(purchase_id)})  # Operação síncrona
        if not purchase:
            raise HTTPException(status_code=404, detail="Purchase not found")

        return {"status": purchase["status"]}
    except Exception as e:
        logger.error(f"Error in status_compra: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/webhook")
async def webhook(request: Request, db=Depends(get_db)):
    try:
        body = await request.json()
        if body["type"] == "payment":
            payment_id = body["data"]["id"]
            payment_info = mp.payment().get(payment_id)
            
            if payment_info["status"] == 200:
                payment_data = payment_info["response"]
                external_reference = payment_data["external_reference"]
                status = payment_data["status"]

                db.purchases.update_one(
                    {"_id": ObjectId(external_reference)},
                    {"$set": {
                        "status": status,
                        "payment_id": payment_id,
                        "payment_details": payment_data
                    }}
                )  # Operação síncrona

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error in webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
