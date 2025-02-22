"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

interface StatusScreenBrickProps {
  purchaseId: string // This will be your external_reference
}

export const StatusScreenBrick: React.FC<StatusScreenBrickProps> = ({ purchaseId }) => {
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPaymentId = async () => {
      try {
        const response = await fetch(`/api/status-compra/${purchaseId}`)
        const data = await response.json()

        if (response.ok && data.payment_id) {
          setPaymentId(data.payment_id)
        } else {
          setError("Erro ao buscar informações do pagamento")
        }
      } catch (error) {
        setError("Erro ao comunicar com o servidor")
      }
    }

    fetchPaymentId()
  }, [purchaseId])

  useEffect(() => {
    if (!paymentId) return

    // Load Mercado Pago SDK
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
          initialization: {
            paymentId: paymentId,
          },
          callbacks: {
            onReady: () => {
              console.log("Status Screen Brick ready")
            },
            onError: (error: any) => {
              console.error("Error loading Status Screen Brick:", error)
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
  }, [paymentId])

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
        {!paymentId ? (
          <div>Carregando informações do pagamento...</div>
        ) : (
          <div id="statusScreenBrick"></div>
        )}
      </CardContent>
    </Card>
  )
}