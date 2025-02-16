"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import api from "@/lib/axios"
import { useRouter } from "next/navigation"

interface FormData {
  nome: string
  sobrenome: string
  telefone: string
  conviteType: "unitario" | "casal"
  mesa: boolean
  estacionamento: boolean
}

interface CompraIngressosProps {
  initialConviteType?: "unitario" | "casal"
}

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function CompraIngressos({ initialConviteType = "unitario" }: CompraIngressosProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    conviteType: initialConviteType,
    mesa: false,
    estacionamento: false,
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
              description: `Convite para ${formData.nome} ${formData.sobrenome}`,
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
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleConviteTypeChange = (value: "unitario" | "casal") => {
    setFormData((prev) => ({ ...prev, conviteType: value }))
  }

  const handleCheckboxChange = (name: "mesa" | "estacionamento") => {
    setFormData((prev) => ({ ...prev, [name]: !prev[name] }))
  }

  const calculateTotal = () => {
    let total = formData.conviteType === "unitario" ? 25 : 40
    if (formData.mesa) total += 20
    if (formData.estacionamento) total += 20
    return total
  }

  const handleGoToPayment = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/iniciar-compra", {
        ...formData,
        amount: calculateTotal(),
      })
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

  const isFormValid = formData.nome && formData.sobrenome && formData.telefone

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold">Compre seu convite</h2>
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
          <Label>Tipo de Convite</Label>
          <RadioGroup
            value={formData.conviteType}
            onValueChange={handleConviteTypeChange}
            className="flex flex-col space-y-1"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="unitario" id="unitario" />
              <Label htmlFor="unitario">Convite unitário - R$25,00</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="casal" id="casal" />
              <Label htmlFor="casal">Convite casal (2 convites) - R$40,00</Label>
            </div>
          </RadioGroup>
        </div>
        <div className="space-y-2">
          <Label>Opções adicionais</Label>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="mesa" checked={formData.mesa} onCheckedChange={() => handleCheckboxChange("mesa")} />
              <Label htmlFor="mesa">Mesa - R$20,00</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="estacionamento"
                checked={formData.estacionamento}
                onCheckedChange={() => handleCheckboxChange("estacionamento")}
              />
              <Label htmlFor="estacionamento">Estacionamento - R$20,00</Label>
            </div>
          </div>
        </div>
      </form>
      <div className="text-xl font-semibold">Total: R${calculateTotal().toFixed(2)}</div>
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

