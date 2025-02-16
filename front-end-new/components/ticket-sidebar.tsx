"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CompraIngressos } from "./compra-ingressos"

const CONVITE_UNITARIO_PRICE = 25.0
const CONVITE_CASAL_PRICE = 40.0
const MESA_PRICE = 20.0
const ESTACIONAMENTO_PRICE = 20.0

type ConviteType = "unitario" | "casal"

export function TicketSidebar() {
  const [conviteType, setConviteType] = useState<ConviteType | null>(null)
  const [mesa, setMesa] = useState(false)
  const [estacionamento, setEstacionamento] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  const basePrice =
    conviteType === "unitario" ? CONVITE_UNITARIO_PRICE : conviteType === "casal" ? CONVITE_CASAL_PRICE : 0
  const additionalPrice = (mesa ? MESA_PRICE : 0) + (estacionamento ? ESTACIONAMENTO_PRICE : 0)
  const total = basePrice + additionalPrice

  const handleReserveClick = () => {
    setShowPurchaseForm(true)
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Selecione seu Convite</h2>
        <RadioGroup onValueChange={(value) => setConviteType(value as ConviteType)} className="space-y-2">
          <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unitario" id="unitario" />
              <Label htmlFor="unitario">Convite Unitário</Label>
            </div>
            <span className="font-semibold">R$ {CONVITE_UNITARIO_PRICE.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="casal" id="casal" />
              <Label htmlFor="casal">Convite Casal (2 convites)</Label>
            </div>
            <span className="font-semibold">R$ {CONVITE_CASAL_PRICE.toFixed(2)}</span>
          </div>
        </RadioGroup>
      </Card>

      {conviteType && (
        <Card className="bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-black mb-4">Opções Adicionais</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
              <div className="flex items-center space-x-2">
                <Checkbox id="mesa" checked={mesa} onCheckedChange={(checked) => setMesa(checked as boolean)} />
                <Label htmlFor="mesa">Mesa</Label>
              </div>
              <span className="font-semibold">R$ {MESA_PRICE.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estacionamento"
                  checked={estacionamento}
                  onCheckedChange={(checked) => setEstacionamento(checked as boolean)}
                />
                <Label htmlFor="estacionamento">Estacionamento</Label>
              </div>
              <span className="font-semibold">R$ {ESTACIONAMENTO_PRICE.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {conviteType && (
        <Card className="bg-white p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between font-medium">
              <span className="text-black">Total</span>
              <span className="text-black text-lg">R$ {total.toFixed(2)}</span>
            </div>

            {showPurchaseForm ? (
              <CompraIngressos conviteType={conviteType} mesa={mesa} estacionamento={estacionamento} total={total} />
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

