from fastapi import APIRouter, HTTPException
from app.models import TicketPurchase, PaymentFinalization
from app.database import db
from app.config import TICKET_PRICE, MERCADO_PAGO_ACCESS_TOKEN
import mercadopago
from bson import ObjectId
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/iniciar-compra")
async def iniciar_compra(purchase: TicketPurchase):
    # Calculate total amount
    purchase.total_amount = purchase.quantidade * TICKET_PRICE

    # Create Mercado Pago preference
    sdk = mercadopago.SDK(MERCADO_PAGO_ACCESS_TOKEN)
    preference_data = {
        "items": [
            {
                "title": f"Ingresso para {purchase.nome} {purchase.sobrenome}",
                "quantity": purchase.quantidade,
                "currency_id": "BRL",
                "unit_price": TICKET_PRICE / 100  # Convert cents to BRL
            }
        ],
        "payer": {
            "name": purchase.nome,
            "surname": purchase.sobrenome,
            "phone": {"number": purchase.telefone}
        }
    }
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]

    # Save purchase information to database (síncrono)
    purchase.mercado_pago_preference_id = preference["id"]
    result = db.db.purchases.insert_one(purchase.dict())  # Removido o await
    purchase_id = str(result.inserted_id)

    return {
        "purchase_id": purchase_id,
        "amount": purchase.total_amount,
        "preference_id": preference["id"]
    }

@router.post("/finalizar-pagamento")
async def finalizar_pagamento(payment: PaymentFinalization):
    logger.info(f"Received payment data: {payment.dict()}")

    try:
        # Verify payment status with Mercado Pago
        sdk = mercadopago.SDK(MERCADO_PAGO_ACCESS_TOKEN)
        
        if payment.payment_id:
            payment_info = sdk.payment().get(payment.payment_id)
        elif payment.preference_id:
            # If payment_id is not available, try to get the payment by preference_id
            payments = sdk.payment().search({"preference_id": payment.preference_id})
            if payments["response"]["results"]:
                payment_info = payments["response"]["results"][0]
            else:
                raise HTTPException(status_code=404, detail="Payment not found")
        else:
            raise HTTPException(status_code=400, detail="Missing payment_id or preference_id")

        if payment_info["status"] != 200:
            raise HTTPException(status_code=400, detail="Invalid payment information")

        payment_data = payment_info["response"]
        
        # Update purchase status in database (síncrono)
        update_result = db.db.purchases.update_one(
            {"mercado_pago_preference_id": payment_data["preference_id"]},
            {"$set": {"payment_status": payment_data["status"]}}
        )  # Removido o await

        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Purchase not found")

        return {"status": "success", "payment_status": payment_data["status"]}

    except Exception as e:
        logger.error(f"Error in finalizar_pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/purchase/{purchase_id}")
async def get_purchase(purchase_id: str):
    # Busca síncrona no MongoDB
    purchase = db.db.purchases.find_one({"_id": ObjectId(purchase_id)})  # Removido o await
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    purchase["_id"] = str(purchase["_id"])  # Convert ObjectId to string
    return purchase