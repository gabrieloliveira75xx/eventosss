from pydantic import BaseModel, Field
from typing import Optional

class PurchaseRequest(BaseModel):
    nome: str
    sobrenome: str
    telefone: str = Field(..., pattern=r"^$$?\d{2}$$?\s?\d{4,5}-?\d{4}$")
    conviteType: str
    mesa: bool = False
    estacionamento: bool = False

class Purchase(BaseModel):
    nome: str
    sobrenome: str
    telefone: str
    conviteType: str
    mesa: bool
    estacionamento: bool
    total_amount: int
    status: str = "pending"
    preference_id: Optional[str] = None
    payment_id: Optional[str] = None
    payment_details: Optional[dict] = None

class PaymentWebhook(BaseModel):
    type: str
    data: dict

class StatusResponse(BaseModel):
    status: str