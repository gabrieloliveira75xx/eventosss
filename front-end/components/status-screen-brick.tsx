"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface StatusScreenBrickProps {
  purchaseId: string
}

export const StatusScreenBrick: React.FC<StatusScreenBrickProps> = ({ purchaseId }) => {
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [qrCodeData, setQrCodeData] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  console.log(qrCodeData)

  useEffect(() => {
    if (purchaseId) {
      const fetchPaymentStatus = async () => {
        try {
          const response = await fetch(`/api/status-compra/${purchaseId}`)
          const data = await response.json()

          if (response.ok) {
            setPaymentStatus(data.status)
            setQrCodeData(data.qr_code_base64) // Recebe o QR Code se for PIX

            // Se o pagamento estiver pendente, continuar verificando
            if (data.status === "pending" || data.status === "in_process") {
              setTimeout(fetchPaymentStatus, 5000) // Tenta novamente após 5 segundos
            }
          } else {
            setError("Erro ao consultar status. Tente novamente.")
          }
        } catch (error) {
          setError("Erro ao comunicar com o servidor.")
        }
      }

      fetchPaymentStatus()
    }
  }, [purchaseId])

  return (
    <Card>
      <CardContent>
        <h2>Status do Pagamento</h2>
        {paymentStatus ? (
          <>
            <p>
              Status da compra: <strong>{paymentStatus}</strong>
            </p>
            {qrCodeData && (
              <div>
                <h3>Escaneie o QR Code para finalizar o pagamento:</h3>
                <img src={`data:image/jpg;base64,${qrCodeData}`} alt="QR Code" />
              </div>
            )}

 {!qrCodeData && (<p>Gerando QR-Code</p>)} 
            {paymentStatus === "approved" && <p style={{ color: "green" }}>Pagamento aprovado! 🎉</p>}
            {paymentStatus === "rejected" && <p style={{ color: "red" }}>Pagamento recusado. Tente novamente.</p>}
          </>
        ) : (
          <p>Buscando status...</p>
        )}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {error && <Button onClick={() => window.location.reload()}>Tentar novamente</Button>}
      </CardContent>
    </Card>
  )
}

