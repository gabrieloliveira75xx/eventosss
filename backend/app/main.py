from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from bson import ObjectId
import os
from dotenv import load_dotenv
load_dotenv()  # Carrega o arquivo .env
import mercadopago
import logging
import re
import database
from pydantic import BaseModel, Field
from fastapi.responses import RedirectResponse
from typing import List, Optional
from datetime import datetime

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup():
    logger.info("Application startup.")
    database.connect_to_mongo()  # Conecta ao MongoDB


# Database Configuration
MONGO_URL = os.getenv("MONGO_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")  # Carregar a variável DATABASE_NAME do .env
client = MongoClient(MONGO_URL)
db = client[DATABASE_NAME]

# Mercado Pago Configuration
mp = mercadopago.SDK(os.getenv("MERCADO_PAGO_ACCESS_TOKEN"))
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Pydantic Models
class TableBase(BaseModel):
    number: str
    type: str = "regular"  # regular or camarote
    status: str = "available"  # available, reserved, occupied
    location: str
    capacity: int

class TableReservation(BaseModel):
    table_id: str
    purchase_id: str

class PurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str = Field(..., pattern=r"^\d{2}\s\d{4,5}-\d{4}$")
    conviteType: str
    mesa: bool = False
    estacionamento: bool = False

class InitiatePurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str
    conviteType: str
    mesa: bool
    estacionamento: bool
    amount: float
    vendedor_code: Optional[str] = None

# Database Functions
def get_db():
    return db

# Table Management Endpoints
@app.get("/api/tables")
async def get_tables(db=Depends(get_db)):
    """Get all tables with their current status"""
    try:
        tables = list(db.tables.find({}, {"_id": {"$toString": "$_id"}}))
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Error fetching tables: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching tables")

@app.get("/api/tables/available")
async def get_available_tables(type: Optional[str] = None, db=Depends(get_db)):
    """Get available tables, optionally filtered by type"""
    try:
        query = {"status": "available"}
        if type:
            query["type"] = type

        tables = list(db.tables.find(query, {"_id": {"$toString": "$_id"}}))
        return {"tables": tables}
    except Exception as e:
        logger.error(f"Error fetching available tables: {str(e)}")
        raise HTTPException(status_code=500, detail="Error fetching available tables")

@app.post("/api/tables/{table_id}/reserve")
async def reserve_table(table_id: str, reservation: TableReservation, db=Depends(get_db)):
    """Reserve a specific table"""
    try:
        # Convert string ID to ObjectId
        table_obj_id = ObjectId(table_id)
        
        # Check if table exists and is available
        table = db.tables.find_one({"_id": table_obj_id})
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        if table["status"] != "available":
            raise HTTPException(status_code=400, detail="Table is not available")

        # Create reservation
        reservation_doc = {
            "table_id": table_id,
            "purchase_id": reservation.purchase_id,
            "status": "reserved",
            "created_at": datetime.utcnow()
        }
        
        # Update table status and create reservation atomically
        async with await client.start_session() as session:
            async with session.start_transaction():
                # Update table status
                result = await db.tables.update_one(
                    {"_id": table_obj_id, "status": "available"},
                    {"$set": {"status": "reserved"}},
                    session=session
                )
                
                if result.modified_count == 0:
                    raise HTTPException(status_code=400, detail="Table is no longer available")
                
                # Create reservation
                await db.reservations.insert_one(reservation_doc, session=session)

        return {"message": "Table reserved successfully"}
    except Exception as e:
        logger.error(f"Error reserving table: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Purchase and Payment Endpoints
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
            "external_reference": str(new_id),  # Use the ObjectId as the external_reference
            "created_at": datetime.utcnow()
        })

        # Add vendor information if available
        if purchase.vendedor_code:
            purchase_doc["vendedor_code"] = purchase.vendedor_code

        result = db.purchases.insert_one(purchase_doc)
        purchase_id = str(result.inserted_id)

        logger.info(f"Purchase initiated successfully, ID: {purchase_id}, External Reference: {purchase_doc['external_reference']}, Total: {purchase.amount} BRL")

        return {
            "purchase_id": purchase_id,
            "amount": purchase.amount,
            "external_reference": purchase_doc["external_reference"]
        }
    except Exception as e:
        logger.error(f"Error in iniciar_compra: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Mercado Pago Webhook
@app.post("/api/criar-pagamento-cartao-credito")
async def criar_pagamento_cartao_credito(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Initiating credit card payment for {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        # Validate required fields
        required_fields = ["payment_method_id", "token", "transaction_amount", "payer", "statement_descriptor", "external_reference"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")

        # Create credit card payment
        payment_result = mp.payment().create(payment_data)

        if payment_result["status"] == 201:
            payment_response = payment_result["response"]
            payment_id = payment_response["id"]
            
            # Update payment details in database
            db.purchases.update_one(
                {"external_reference": payment_data["external_reference"]},
                {"$set": {
                    "payment_id": payment_id,
                    "status": payment_response["status"],
                    "payment_details": payment_response,
                    "payment_method": "credit_card",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.info(f"Credit card payment created successfully. ID: {payment_id}")
            
            return {
                "payment_id": payment_id,
                "status": payment_response["status"]
            }
        else:
            logger.error(f"Error creating credit card payment: {payment_result}")
            raise HTTPException(status_code=500, detail="Error creating credit card payment")

    except Exception as e:
        logger.error(f"Error in criar_pagamento_cartao_credito: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mercado Pago Webhook
@app.post("/api/criar-pagamento-cartao-debito")
async def criar_pagamento_cartao_debito(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Initiating debit card payment for {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        # Validate required fields
        required_fields = ["payment_method_id", "token", "transaction_amount", "payer", "statement_descriptor", "external_reference"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Set payment method as debit card
        payment_data['payment_method_id'] = 'debit_card'
        
        payment_result = mp.payment().create(payment_data)
        logger.info(f"Debit card payment creation response: {payment_result}")
        
        if payment_result["status"] == 201:
            payment_response = payment_result["response"]
            payment_id = payment_response["id"]
            
            # Update payment details in database
            db.purchases.update_one(
                {"external_reference": payment_data["external_reference"]},
                {"$set": {
                    "payment_id": payment_id,
                    "status": payment_response["status"],
                    "payment_details": payment_response,
                    "payment_method": "debit_card",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            logger.info(f"Debit card payment created successfully. ID: {payment_id}")
            
            return {
                "payment_id": payment_id,
                "status": payment_response["status"]
            }
        else:
            logger.error(f"Error creating debit card payment: {payment_result}")
            raise HTTPException(status_code=500, detail="Error creating debit card payment")
    
    except Exception as e:
        logger.error(f"Error in criar_pagamento_cartao_debito: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Mercado Pago Webhook
@app.post("/api/criar-pagamento-pix")
async def criar_pagamento_pix(payment_data: dict, db=Depends(get_db)):
    logger.info(f"Initiating PIX payment for {payment_data['payer'].get('first_name', '')} {payment_data['payer'].get('last_name', '')}")
    try:
        if not payment_data.get("external_reference"):
            raise HTTPException(status_code=400, detail="external_reference is required for PIX")
        
        required_fields = ["payment_method_id", "transaction_amount", "payer", "external_reference", "notification_url"]
        for field in required_fields:
            if field not in payment_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        payment_data['payment_method_id'] = 'pix'
        
        payment_result = mp.payment().create(payment_data)
        logger.info(f"PIX payment creation response: {payment_result}")
        
        if payment_result["status"] == 201:
            payment_response = payment_result["response"]
            payment_id = payment_response["id"]
            
            # Store payment details in database
            db.purchases.update_one(
                {"external_reference": payment_data["external_reference"]},
                {"$set": {
                    "payment_id": payment_id,
                    "status": payment_response["status"],
                    "payment_details": payment_response,
                    "payment_method": "pix",
                    "updated_at": datetime.utcnow()
                }}
            )
            
            return {
                "payment_id": payment_id,
                "status": payment_response["status"],
                "qr_code_base64": payment_response["point_of_interaction"]["transaction_data"]["qr_code_base64"]
            }
        else:
            logger.error(f"Error creating PIX payment: {payment_result}")
            raise HTTPException(status_code=500, detail="Error creating PIX payment")
    
    except Exception as e:
        logger.error(f"Error in criar_pagamento_pix: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Mercado Pago Webhook
@app.get("/api/status-compra/{external_reference}")
async def status_compra(external_reference: str, db=Depends(get_db)):
    try:
        logger.info(f"Checking status for external_reference: {external_reference}")
        
        # First, try to find the purchase by external_reference
        purchase = db.purchases.find_one({"external_reference": external_reference})
        
        # If not found, try to find by _id
        if not purchase:
            try:
                purchase = db.purchases.find_one({"_id": ObjectId(external_reference)})
            except:
                pass

        if not purchase:
            logger.error(f"Purchase not found for external_reference: {external_reference}")
            raise HTTPException(status_code=404, detail="Purchase not found")

        # Get payment_id from purchase document
        payment_id = purchase.get("payment_id")
        
        if not payment_id:
            # If payment_id not in database, try to find it from Mercado Pago
            logger.info(f"Payment ID not found in database, searching in Mercado Pago...")
            payment_info = mp.payment().search({"external_reference": external_reference})
            
            logger.info(f"Mercado Pago search response: {payment_info}")
            
            if payment_info["status"] == 200 and payment_info["response"]["results"]:
                payment = payment_info["response"]["results"][0]
                payment_id = payment["id"]
                
                # Update database with payment information
                db.purchases.update_one(
                    {"external_reference": external_reference},
                    {"$set": {
                        "payment_id": payment_id,
                        "status": payment["status"],
                        "payment_details": payment,
                        "updated_at": datetime.utcnow()
                    }}
                )
                
                logger.info(f"Updated database with payment_id: {payment_id}")
            else:
                # Try to get payment directly if we have the ID from creation response
                try:
                    last_payment = db.purchases.find_one(
                        {"external_reference": external_reference},
                        {"payment_details": 1}
                    )
                    
                    if last_payment and "payment_details" in last_payment:
                        payment_id = last_payment["payment_details"].get("id")
                        if payment_id:
                            logger.info(f"Found payment_id from stored payment details: {payment_id}")
                except Exception as e:
                    logger.error(f"Error getting payment from stored details: {str(e)}")

                if not payment_id:
                    logger.error("Payment ID not found in Mercado Pago or stored details")
                    raise HTTPException(status_code=404, detail="Payment ID not found")

        logger.info(f"Returning payment_id: {payment_id}")
        return {"payment_id": str(payment_id)}

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"Error in status_compra: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Vendor Sales Endpoints
@app.post("/api/registrar-venda")
async def registrar_venda(request: Request, db=Depends(get_db)):
    try:
        payload = await request.json()
        vendedor_code = payload.get("vendedor_code")
        payment_info = payload.get("payment_info")

        if not vendedor_code or not payment_info:
            raise HTTPException(status_code=400, detail="Missing required fields")

        # Record the sale
        sale = {
            "vendedor_code": vendedor_code,
            "payment_id": payment_info["id"],
            "purchase_id": payment_info["external_reference"],
            "amount": payment_info["transaction_amount"],
            "status": payment_info["status"],
            "created_at": datetime.utcnow()
        }

        # Insert sale record
        await db.vendor_sales.insert_one(sale)

        # Update vendor statistics
        await db.vendors.update_one(
            {"code": vendedor_code},
            {
                "$inc": {
                    "total_sales": 1,
                    "total_amount": payment_info["transaction_amount"]
                },
                "$set": {"last_sale_at": datetime.utcnow()}
            },
            upsert=True
        )

        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error registering sale: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Mercado Pago Webhook
@app.post("/api/webhook")
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
                    # Update purchase status
                    db.purchases.update_one(
                        {"external_reference": external_reference},
                        {"$set": {
                            "status": status,
                            "payment_id": payment_id,
                            "payment_details": payment_data,
                            "updated_at": datetime.utcnow()
                        }}
                    )

                    # If payment approved and has vendor code, update vendor sales
                    if status == "approved":
                        purchase = db.purchases.find_one({"external_reference": external_reference})
                        if purchase and purchase.get("vendedor_code"):
                            await registrar_venda(Request(scope={"type": "http"}), db)

        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Error processing Mercado Pago webhook: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")



# Run the server# Initialize database before starting server
if __name__ == "__main__":
    import uvicorn
    database.connect_to_mongo()  # Conectar ao MongoDB
    uvicorn.run(app, host="0.0.0.0", port=5000)