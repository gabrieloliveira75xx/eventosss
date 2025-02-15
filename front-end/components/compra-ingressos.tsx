"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"
import { useRouter } from "next/navigation"

interface FormData {
  nome: string
  sobrenome: string
  telefone: string
  quantidade: number
}

interface CompraIngressosProps {
  initialQuantity?: number
}

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function CompraIngressos({ initialQuantity = 1 }: CompraIngressosProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    quantidade: initialQuantity,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isMercadoPagoReady, setIsMercadoPagoReady] = useState(false)
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(0)
  const router = useRouter()
  const mpRef = useRef<any>(null)
  const brickRef = useRef<any>(null)
  const brickContainerRef = useRef<HTMLDivElement>(null)

  const initializeMercadoPago = useCallback(() => {
    if (typeof window === "undefined" || !window.MercadoPago) return

    mpRef.current = new window.MercadoPago("APP_USR-860220d0-6203-46d7-830a-eb7155cfbe6e", {
      locale: "pt-BR",
    })
    setIsMercadoPagoReady(true)
  }, [])

  const createBrick = useCallback(() => {
    if (!mpRef.current || !brickContainerRef.current || brickRef.current) return

    const bricksBuilder = mpRef.current.bricks()

    brickRef.current = bricksBuilder.create("payment", brickContainerRef.current.id, {
      initialization: {
        amount: paymentAmount,
      },
      customization: {
        paymentMethods: {
          creditCard: "all",
          debitCard: "all",
          ticket: "all",
          bankTransfer: "all",
          atm: "all",
        },
      },
      callbacks: {
        onReady: () => {
          console.log("Brick pronto")
        },
        onSubmit: async (cardFormData: any) => {
          setIsLoading(true)
          setError(null)

          try {
            const response = await api.post("/finalizar-pagamento", {
              ...formData,
              ...cardFormData,
              transaction_amount: paymentAmount,
              description: `Ingresso para ${formData.nome} ${formData.sobrenome}`,
            })

            const result = response.data

            if (result.url_mercado_pago) {
              window.location.href = result.url_mercado_pago
            } else {
              throw new Error("Não foi possível obter o link de pagamento")
            }
          } catch (error: any) {
            console.error("Erro ao finalizar pagamento:", error)
            setError(
              error.response?.data?.message || "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.",
            )
          } finally {
            setIsLoading(false)
          }
        },
        onError: (error: any) => {
          console.error("Erro no Brick:", error)
          setError(error.message || "Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.")
        },
      },
    })
  }, [formData, paymentAmount])

  useEffect(() => {
    if (document.getElementById("mercado-pago-script")) {
      initializeMercadoPago()
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    script.id = "mercado-pago-script"
    script.onload = initializeMercadoPago
    document.body.appendChild(script)

    return () => {
      const scriptElement = document.getElementById("mercado-pago-script")
      if (scriptElement) {
        document.body.removeChild(scriptElement)
      }
    }
  }, [initializeMercadoPago])

  useEffect(() => {
    if (isMercadoPagoReady && showPaymentSection) {
      createBrick()
    }
  }, [isMercadoPagoReady, showPaymentSection, createBrick])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantidade" ? Math.max(1, Number(value)) : value,
    }))
  }

  const handleGoToPayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/iniciar-compra", formData)
      const { amount } = response.data
      setPaymentAmount(amount)
      setShowPaymentSection(true)
    } catch (error: any) {
      console.error("Erro ao iniciar compra:", error)
      setError(error.response?.data?.message || "Ocorreu um erro ao iniciar a compra. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const isFormValid = formData.nome && formData.sobrenome && formData.telefone && formData.quantidade > 0

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Compre seu ingresso</h2>
      <form className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome</Label>
          <Input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            placeholder="Nome"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sobrenome">Sobrenome</Label>
          <Input
            type="text"
            id="sobrenome"
            name="sobrenome"
            value={formData.sobrenome}
            onChange={handleInputChange}
            placeholder="Sobrenome"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            type="tel"
            id="telefone"
            name="telefone"
            value={formData.telefone}
            onChange={handleInputChange}
            placeholder="Telefone"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input
            type="number"
            id="quantidade"
            name="quantidade"
            value={formData.quantidade}
            onChange={handleInputChange}
            placeholder="Quantidade"
            required
            min={1}
          />
        </div>
      </form>
      {!showPaymentSection && (
        <Button type="button" className="w-full" disabled={isLoading || !isFormValid} onClick={handleGoToPayment}>
          {isLoading ? "Processando..." : "Ir para seção de pagamento"}
        </Button>
      )}
      {error && <p className="text-red-500">{error}</p>}
      {showPaymentSection && <div id="paymentBrick_container" ref={brickContainerRef}></div>}
    </div>
  )
}

