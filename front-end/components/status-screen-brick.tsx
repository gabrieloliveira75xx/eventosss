"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { useVendedor } from "../app/hooks/useVendedor"

interface StatusScreenBrickProps {
  purchaseId: string // ID da compra (usado para buscar o status do pagamento)
  amount: number
}

export const StatusScreenBrick: React.FC<StatusScreenBrickProps> = ({ purchaseId, amount }) => {
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { vendedor } = useVendedor() // Obtendo o código do vendedor

  useEffect(() => {
    const fetchPaymentStatus = async () => {
      try {
        const response = await fetch(`/api/status-compra/${purchaseId}`)
        const data = await response.json()

        if (response.ok && data.payment_id) {
          setPaymentId(data.payment_id)
          setStatus(data.status) // Salva o status do pagamento
        } else {
          setError("Erro ao buscar informações do pagamento")
        }
      } catch (error) {
        setError("Erro ao comunicar com o servidor")
      }
    }

    fetchPaymentStatus()
  }, [purchaseId])

  useEffect(() => {
    if (!paymentId) return

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.type = "text/javascript"
    document.body.appendChild(script)

    script.onload = () => {
      const mp = new window.MercadoPago(process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY!, {
        locale: "pt-BR",
      })

      const bricksBuilder = mp.bricks()

      const renderStatusScreenBrick = async () => {
        const settings = {
          initialization: { paymentId },
          callbacks: {
            onReady: async () => {
              console.log("Status Screen Brick pronto")

              // Register the sale if payment was successful and we have a vendor code
              if (status === "approved" && vendedor) {
                try {
                  await registerSale(vendedor, {
                    id: paymentId,
                    external_reference: purchaseId,
                    status,
                    transaction_amount: amount,
                  })
                  console.log("Venda registrada com sucesso!")
                } catch (error) {
                  console.error("Erro ao registrar venda:", error)
                }
              }
            },
            onError: (error: any) => {
              console.error("Erro ao carregar Status Screen Brick:", error)
              setError("Erro ao carregar status do pagamento")
            },
          },
        }

        await bricksBuilder.create("statusScreen", "statusScreenBrick", settings)
      }

      renderStatusScreenBrick()
    }

    return () => {
      document.body.removeChild(script)
    }
  }, [paymentId, status, vendedor, purchaseId, amount])

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        {!paymentId ? <div>Carregando informações do pagamento...</div> : <div id="statusScreenBrick"></div>}
      </CardContent>
    </Card>
  )
}

async function registerSale(
  vendedor: string,
  saleData: {
    id: string
    external_reference: string
    status: string
    transaction_amount: number
  },
) {
  try {
    await fetch("/api/registrar-venda", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vendedor, ...saleData }),
    })
  } catch (error) {
    console.error("Erro ao registrar venda:", error)
    throw error // Re-throw para o chamador lidar com o erro
  }
}

