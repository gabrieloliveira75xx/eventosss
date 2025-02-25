from fastapi import APIRouter, HTTPException
from app.models import TicketPurchase, PaymentFinalization
from app.database import db
from app.config import TICKET_PRICE, MERCADO_PAGO_ACCESS_TOKEN
import mercadopago
from bson import ObjectId
import logging
import httpx  # Adicionando httpx para integração com o Mercado Libre

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/api/iniciar-compra")
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

    # Save purchase information to database
    purchase.mercado_pago_preference_id = preference["id"]
    result = await db.db.purchases.insert_one(purchase.dict())
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
        
        # Update purchase status in database
        update_result = await db.db.purchases.update_one(
            {"mercado_pago_preference_id": payment_data["preference_id"]},
            {"$set": {"payment_status": payment_data["status"]}}
        )

        if update_result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Purchase not found")

        return {"status": "success", "payment_status": payment_data["status"]}

    except Exception as e:
        logger.error(f"Error in finalizar_pagamento: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/purchase/{purchase_id}")
async def get_purchase(purchase_id: str):
    purchase = await db.db.purchases.find_one({"_id": ObjectId(purchase_id)})
    if purchase is None:
        raise HTTPException(status_code=404, detail="Purchase not found")
    purchase["_id"] = str(purchase["_id"])  # Convert ObjectId to string
    return purchase

# Novo endpoint para buscar as informações de tracking do Mercado Libre
@router.get("/api/mercadolibre-tracks")
async def get_mercadolibre_tracks():
    try:
        # Realiza a requisição para a API do Mercado Livre
        url = "https://api.mercadolibre.com/tracks"  # A URL da API do Mercado Libre
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            if response.status_code == 200:
                return response.json()  # Retorna a resposta da API do Mercado Libre
            else:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch data from Mercado Libre")
    except Exception as e:
        logger.error(f"Error fetching Mercado Libre tracks: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")
