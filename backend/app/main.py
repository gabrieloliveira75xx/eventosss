from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
import mercadopago
import logging
import re
from pydantic import BaseModel, Field
import httpx
from fastapi.responses import RedirectResponse
load_dotenv()
app = FastAPI()
# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client.eventos_db
mp = mercadopago.SDK(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://eventos.grupoglk.com.br")
import logging
import os
import re
from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from pymongo import MongoClient
import mercadopago
from bson.objectid import ObjectId

# Inicialização do FastAPI e do Mercado Pago SDK
app = FastAPI()
mp = mercadopago.SDK(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
MONGO_URL = os.getenv("MONGO_URL")
client = MongoClient(MONGO_URL)
db = client.eventos_db
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://eventos.grupoglk.com.br")

# Função para pegar o banco de dados
def get_db():
    return db

# Model de compra
class PurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str = Field(..., pattern=r"^\d{2}\s\d{4,5}-\d{4}$")
    conviteType: str
    mesa: bool = False
    estacionamento: bool = False

# Model de iniciação de compra
class InitiatePurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str
    conviteType: str
    mesa: bool
    estacionamento: bool
    amount: float

# Função para calcular o total
def calculate_total_amount(convite_type: str, mesa: bool, estacionamento: bool) -> int:
    total = 2500 if convite_type == "unitario" else 4000
    if mesa:
        total += 2000
    if estacionamento:
        total += 2000
    return total

# Supondo que você tenha um endpoint para criar a compra
@app.post("/api/iniciar-compra")
async def iniciar_compra(purchase: InitiatePurchaseRequest, db=Depends(get_db)):
    try:
        # Generate a new ObjectId for the purchase
        new_id = ObjectId()
        
        purchase_doc = purchase.dict()
        purchase_doc.update({
            "_id": new_id,
            "total_amount": int(purchase.amount * 100),  # Convert to cents
            "status": "pending",
            "telefone": re.sub(r'\D', '', purchase.telefone),
            "external_reference": str(new_id)  # Use the ObjectId as the external_reference
        })

        result = db.purchases.insert_one(purchase_doc)
        purchase_id = str(result.inserted_id)

        logger.info(f"Compra iniciada com sucesso, ID: {purchase_id}, External Reference: {purchase_doc['external_reference']}, Total: {purchase.amount} BRL")

        return {
            "purchase_id": purchase_id,
            "amount": purchase.amount,
            "external_reference": purchase_doc["external_reference"]
        }
    except Exception as e:
        logger.error(f"Error in iniciar_compra: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")





@app.post("/api/criar-pagamento-cartao-credito")
async def criar_pagamento_cartao_credito(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Iniciando criação de pagamento com cartão de crédito para {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        # Se external_reference não estiver presente, tenta usar purchase_id
        if not payment_data.get("external_reference") and payment_data.get("purchase_id"):
            payment_data["external_reference"] = str(payment_data["purchase_id"])
            logger.info(f"external_reference definido a partir de purchase_id: {payment_data['external_reference']}")
        
        # Verifica se todos os campos obrigatórios estão presentes
        required_fields = ["payment_method_id", "token", "transaction_amount", "payer", "statement_descriptor", "external_reference"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Faltando campo obrigatório: {field}")

        # Criação do pagamento com cartão de crédito
        payment_result = mp.payment().create(payment_data)
        logger.info(f"Resposta da criação do pagamento com cartão de crédito: {payment_result}")

        if payment_result["status"] == 201:
            payment_id = payment_result["response"]["id"]
            return {
                "payment_id": payment_id,
                "status": payment_result["response"]["status"]
            }
        else:
            logger.error(f"Erro ao criar pagamento com cartão de crédito: {payment_result}")
            raise HTTPException(status_code=500, detail="Erro ao criar pagamento com cartão de crédito")

    except Exception as e:
        logger.error(f"Erro no criar_pagamento_cartao_credito: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Endpoint para criar pagamento via cartão de débito
@app.post("/api/criar-pagamento-cartao-debito")
async def criar_pagamento_cartao_debito(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Iniciando criação de pagamento com cartão de débito para {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        # Se external_reference não estiver presente, tenta usar purchase_id
        if not payment_data.get("external_reference") and payment_data.get("purchase_id"):
            payment_data["external_reference"] = str(payment_data["purchase_id"])
            logger.info(f"external_reference definido a partir de purchase_id: {payment_data['external_reference']}")
        
        # Campos obrigatórios para débito (incluindo external_reference)
        required_fields = ["payment_method_id", "token", "transaction_amount", "payer", "statement_descriptor", "external_reference"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Faltando campo obrigatório: {field}")
        
        # Define o método de pagamento como débito
        payment_data['payment_method_id'] = 'debit_card'
        
        payment_result = mp.payment().create(payment_data)
        logger.info(f"Resposta da criação do pagamento com cartão de débito: {payment_result}")
        
        if payment_result["status"] == 201:
            payment_id = payment_result["response"]["id"]
            return {"payment_id": payment_id, "status": payment_result["response"]["status"]}
        else:
            logger.error(f"Erro ao criar pagamento com cartão de débito: {payment_result}")
            raise HTTPException(status_code=500, detail="Erro ao criar pagamento com cartão de débito")
    
    except Exception as e:
        logger.error(f"Erro no criar_pagamento_cartao_debito: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Endpoint para criar pagamento via PIX
@app.post("/api/criar-pagamento-pix")
async def criar_pagamento_pix(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Iniciando criação de pagamento via PIX para {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        # Para PIX, external_reference é obrigatório; se não estiver presente, tenta usar purchase_id
        if not payment_data.get("external_reference"):
            if payment_data.get("purchase_id"):
                payment_data["external_reference"] = str(payment_data["purchase_id"])
                logger.info(f"external_reference definido a partir de purchase_id: {payment_data['external_reference']}")
            else:
                raise HTTPException(status_code=400, detail="external_reference é obrigatório para PIX")
        
        # Campos obrigatórios para PIX
        required_fields = ["payment_method_id", "transaction_amount", "payer", "external_reference", "notification_url"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Faltando campo obrigatório: {field}")
        
        # Define o método de pagamento como PIX
        payment_data['payment_method_id'] = 'pix'
        
        payment_result = mp.payment().create(payment_data)
        logger.info(f"Resposta da criação do pagamento via PIX: {payment_result}")
        
        if payment_result["status"] == 201:
            payment_id = payment_result["response"]["id"]
            return {"payment_id": payment_id, "status": payment_result["response"]["status"]}
        else:
            logger.error(f"Erro ao criar pagamento via PIX: {payment_result}")
            raise HTTPException(status_code=500, detail="Erro ao criar pagamento via PIX")
    
    except Exception as e:
        logger.error(f"Erro no criar_pagamento_pix: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@app.get("/api/status-compra/{external_reference}")
async def status_compra(external_reference: str, db=Depends(get_db)):
    try:
        # First, try to find the purchase by external_reference
        purchase = db.purchases.find_one({"external_reference": external_reference})
        
        # If not found, try to find by _id (in case external_reference is actually the ObjectId)
        if not purchase:
            try:
                purchase = db.purchases.find_one({"_id": ObjectId(external_reference)})
            except:
                pass

        if not purchase:
            logger.error(f"Purchase not found for external_reference: {external_reference}")
            raise HTTPException(status_code=404, detail="Compra não encontrada")
        
        # Log the found purchase
        logger.info(f"Found purchase: {purchase}")

        # Here, you can fetch the status from Mercado Pago with the external_reference
        payment_info = mp.payment().search({"external_reference": external_reference})

        if payment_info["status"] == 200 and payment_info["response"]["results"]:
            latest_payment = payment_info["response"]["results"][0]
            status = latest_payment.get("status", "undefined")
            qr_code = None

            # Check if the payment is via PIX and include the QR Code
            if latest_payment.get("point_of_interaction"):
                qr_code = latest_payment["point_of_interaction"].get("transaction_data", {}).get("qr_code")
            
            # Update the database with the status and QR code (if it exists)
            db.purchases.update_one(
                {"external_reference": external_reference},
                {"$set": {
                    "status": status,
                    "payment_id": latest_payment["id"],
                    "payment_details": latest_payment,
                    "qr_code": qr_code
                }}
            )

            logger.info(f"Updated purchase status: {status}, QR code: {'Present' if qr_code else 'Not present'}")
            return {"status": status, "qr_code": qr_code}
        else:
            logger.info(f"No payment info found, returning purchase status from database: {purchase['status']}")
            return {"status": purchase["status"], "qr_code": None}  # Return the purchase status from the database

    except Exception as e:
        logger.error(f"Error in status_compra: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Endpoint para webhook do Mercado Pago
@app.post("/api")
async def mercadopago_webhook(request: Request, db=Depends(get_db)):
    try:
        payload = await request.json()
        logger.info(f"Received Mercado Pago webhook: {payload}")

        if payload.get("type") == "payment":
            payment_id = payload["data"]["id"]
            payment_info = mp.payment().get(payment_id)

            if payment_info["status"] == 200:
                payment_data = payment_info["response"]
                external_reference = payment_data.get("external_reference")
                status = payment_data["status"]

                if external_reference:
                    update_result = db.purchases.update_one(
                        {"external_reference": external_reference},
                        {"$set": {
                            "status": status,
                            "payment_id": payment_id,
                            "payment_details": payment_data
                        }}
                    )
                    if update_result.modified_count > 0:
                        logger.info(f"Updated purchase status: External Reference {external_reference}, Status: {status}")
                    else:
                        logger.warning(f"No purchase found for External Reference: {external_reference}")
                else:
                    logger.warning(f"External reference not found for payment ID: {payment_id}")
            else:
                logger.error(f"Error fetching payment info: {payment_info}")

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Mercado Pago webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# Rodar o servidor uvicorn main:app --host 0.0.0.0 --port 5000
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
