from pydantic import BaseModel
from typing import Optional

class TicketPurchase(BaseModel):
    nome: str
    sobrenome: str
    telefone: str
    quantidade: int
    total_amount: Optional[int] = None
    payment_status: Optional[str] = "pending"
    mercado_pago_preference_id: Optional[str] = None

class PaymentFinalization(BaseModel):
    purchase_id: Optional[str] = None
    payment_id: Optional[str] = None
    status: Optional[str] = None
    external_reference: Optional[str] = None
    preference_id: Optional[str] = None
    merchant_order_id: Optional[str] = None