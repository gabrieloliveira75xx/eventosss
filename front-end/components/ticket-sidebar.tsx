"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Plus, Minus } from "lucide-react"
import { CompraIngressos } from "./compra-ingressos"

const TICKET_PRICE = 20.0
const SERVICE_FEE = 0.0

export function TicketSidebar() {
  const [quantity, setQuantity] = useState(0)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  const handleQuantityChange = (newQuantity: number) => {
    setQuantity(Math.max(0, newQuantity))
  }

  const subtotal = quantity * TICKET_PRICE
  const fees = quantity * SERVICE_FEE
  const total = subtotal + fees

  const handleReserveClick = () => {
    setShowPurchaseForm(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main ticket selection */}
      <Card className="bg-white p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-black">Ingresso Pista</h2>
          <span className="text-black font-semibold">R$ {TICKET_PRICE.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
          <span className="text-black font-medium">Quantidade</span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={quantity === 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{quantity}</span>
            <Button variant="outline" size="icon" onClick={() => handleQuantityChange(quantity + 1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Ticket summary */}
      {quantity > 0 && (
        <Card className="bg-white p-4 sm:p-6">
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-black font-medium">×{quantity}</span>
                  <span className="text-gray-600">Ingresso Pista</span>
                </div>
                <span className="text-black font-semibold">R$ {subtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Taxas de serviço</span>
                <span className="text-black">R$ {fees.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span className="text-black">Total</span>
                <span className="text-black text-lg">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            {showPurchaseForm ? (
              <CompraIngressos initialQuantity={quantity} />
            ) : (
              <Button className="w-full bg-black text-white hover:bg-black/90" onClick={handleReserveClick}>
                RESERVAR
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

