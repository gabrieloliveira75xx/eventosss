"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initiatePurchase, createCreditCardPayment, createDebitCardPayment, createPixPayment, selectTable, fetchTables } from "@/lib/api"
import { useMercadoPago } from "@/hooks/useMercadoPago"
import { logError } from "@/lib/logger"
import { useSearchParams } from "next/navigation"
import { StatusScreenBrick } from "./status-screen-brick"
import { TableSelectionModal } from "./table-selection-modal"

interface FormData {
  name: string
  sobrenome: string
  telefone: string
  email: string
  conviteType: "unitario" | "casal"
  mesa: boolean
  estacionamento: boolean
}

interface CompraIngressosProps {
  initialConviteType?: "unitario" | "casal"
  mesa: boolean
  estacionamento: boolean
  total: number
}

export function CompraIngressos({
  initialConviteType = "unitario",
  mesa,
  estacionamento,
  total,
}: CompraIngressosProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    email: "",
    conviteType: initialConviteType,
    mesa,
    estacionamento,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [errorDetails, setErrorDetails] = useState<string | null>(null)
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [showStatusScreen, setShowStatusScreen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState(total)
  const brickContainerRef = useRef<HTMLDivElement>(null)
  const [purchaseId, setPurchaseId] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const [isTableModalOpen, setIsTableModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [availableTables, setAvailableTables] = useState<any[]>([])

  const { isLoaded, initializeBrick, mp } = useMercadoPago("TEST-b8b8ec68-c42f-4b50-8ecf-691cd87f35b5")

  useEffect(() => {
    const payment_id = searchParams.get("payment_id")
    if (payment_id && isLoaded) {
      setPaymentId(payment_id)
      setShowStatusScreen(true)
    }
  }, [searchParams, isLoaded])

  useEffect(() => {
    if (isLoaded && showPaymentSection && brickContainerRef.current) {
      initializeBrick("paymentBrick_container", {
        initialization: { amount: paymentAmount },
        customization: {
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            atm: "all",
            bankTransfer: "all",
            maxInstallments: 12,
          },
        },
        callbacks: {
          onReady: () => {
            console.log("Payment Brick ready")
            setIsLoading(false)
          },
          onSubmit: handlePaymentSubmit,
          onError: (error: any) => {
            console.error("Payment Brick error:", error)
            logError("Erro do Payment Brick", error)
            setError("Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.")
            setErrorDetails(JSON.stringify(error, null, 2))
          },
          onBinChange: (bin: string) => {
            console.log("BIN alterado:", bin)
          },
          onCardTokenReceived: (token: any) => {
            console.log("Token do cartão recebido:", token)
          },
        },
      })
    }
  }, [isLoaded, showPaymentSection, paymentAmount, initializeBrick])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "telefone") {
      const formattedValue = formatPhone(value)
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else if (name === "nome" || name === "sobrenome") {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      const lettersOnly = capitalizedValue.replace(/[^a-zA-Z]/g, "")
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }))
    } else if (name === "email") {
      const emailValue = value.toLowerCase()
      setFormData((prev) => ({ ...prev, [name]: emailValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const formatPhone = (value: string) => {
    const phone = value.replace(/\D/g, "")

    if (phone.length <= 2) {
      return phone
    }
    if (phone.length <= 6) {
      return `${phone.slice(0, 2)} ${phone.slice(2)}`
    }
    return `${phone.slice(0, 2)} ${phone.slice(2, 7)}-${phone.slice(7, 11)}`
  }

  const handleGoToPayment = async () => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    try {
      console.log("Iniciando compra:", { ...formData, amount: paymentAmount })
      const { purchase_id, amount } = await initiatePurchase({ ...formData, amount: paymentAmount })
      console.log("Compra iniciada:", { purchase_id, amount })

      if (!purchase_id) {
        throw new Error("ID da compra não retornado pelo servidor.")
      }

      setPaymentAmount(amount)
      setPurchaseId(purchase_id)
      setShowPaymentSection(true)
    } catch (error: any) {
      console.error("Erro ao iniciar a compra:", error)
      logError("Erro ao Iniciar Compra", { error, formData, paymentAmount })
      setError(error.response?.data?.message || "Ocorreu um erro ao iniciar a compra. Por favor, tente novamente.")
      setErrorDetails(JSON.stringify(error, null, 2))
    } finally {
      setIsLoading(false)
    }
  }
  const handlePaymentSubmit = async (cardFormData: any) => {
    setIsLoading(true)
    setError(null)
    setErrorDetails(null)
    try {
      if (!purchaseId) {
        throw new Error("Compra não iniciada corretamente.")
      }
  
      if (!cardFormData || Object.keys(cardFormData).length === 0) {
        throw new Error("Dados do cartão não fornecidos.")
      }
  
      console.log("Dados do cartão recebidos:", cardFormData)
  
      // Criação do paymentData, agora com segurança de 'payer'
      const paymentData: any = {
        ...formData,
        transaction_amount: paymentAmount,
        description: `Convite para ${formData.nome} ${formData.sobrenome}`,
        purchase_id: purchaseId,
        payment_method_id: cardFormData.payment_method_id,
        installments: cardFormData.installments,
        token: cardFormData.token,
        email: cardFormData.payer?.email || "gabrieloliveira80xx@gmail.com", // Garantir email vazio caso 'payer' não exista
      }
  
      // Verificação de 'payer' antes de adicionar ao 'paymentData'
      if (cardFormData.payer) {
        console.log("Payer encontrado:", cardFormData.payer)  // Exibir para verificar os dados do 'payer'
        paymentData.payer = {
          first_name: formData.nome,        // Adiciona o nome do pagador
          last_name: formData.sobrenome,    // Adiciona o sobrenome do pagador
          email: cardFormData.payer.email,  // Email do pagador
          identification: {
            type: cardFormData.payer.identification.type,
            number: cardFormData.payer.identification.number,
          },
        }
      } else {
        console.warn("Dados de 'payer' não encontrados. Verifique os dados de entrada.")
      }
  
      console.log("Iniciando pagamento:", paymentData)
  
      const result = await createCreditCardPayment(paymentData)
      console.log("Resposta do createPayment:", result)
  
      if (!result.payment_id) {
        throw new Error("Payment ID não retornado pelo servidor.")
      }
  
      setPaymentId(result.payment_id)
      setShowPaymentSection(false)
      setShowStatusScreen(true)
    } catch (error: any) {
      console.error("Erro ao finalizar o pagamento:", error)
      let errorMessage = "O pagamento não foi aprovado. Por favor, tente novamente."
      let errorDetails = null
  
      if (error.message.startsWith("Validation error:")) {
        errorMessage = "Erro de validação nos dados do pagamento:"
        errorDetails = error.message.substring("Validation error:".length).trim()
      } else if (error.response) {
        console.error("Resposta de erro:", error.response.data)
        errorMessage = error.response.data.message || errorMessage
        errorDetails = JSON.stringify(error.response.data, null, 2)
      }
  
      logError("Erro de Pagamento", {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
        formData,
        cardFormData,
        purchaseId,
        paymentAmount,
      })
      setError(errorMessage)
      setErrorDetails(errorDetails)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleTableSelect = async (tableId: string) => {
    setSelectedTable(tableId)
    setIsTableModalOpen(false)

    if (purchaseId) {
      try {
        await selectTable(tableId, purchaseId)
        // Optionally, update the UI to reflect the selected table
      } catch (error) {
        console.error("Error selecting table:", error)
        setError("Erro ao selecionar mesa. Por favor, tente novamente.")
      }
    }
  }

  const isFormValid = formData.nome && formData.sobrenome && formData.telefone && formData.email

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {!showStatusScreen ? (
        <>
          <h2 className="text-2xl font-bold">Compre seu convite</h2>
          <form className="space-y-4">
            <InputField label="Nome" name="nome" value={formData.nome} onChange={handleInputChange} />
            <InputField label="Sobrenome" name="sobrenome" value={formData.sobrenome} onChange={handleInputChange} />
            <InputField
              label="Telefone"
              name="telefone"
              value={formData.telefone}
              onChange={handleInputChange}
              type="tel"
            />
            <InputField label="Email" name="email" value={formData.email} onChange={handleInputChange} type="email" />
          </form>
          {formData.mesa && (
            <Button onClick={() => setIsTableModalOpen(true)} className="w-full">
              {selectedTable ? `Mesa selecionada: ${selectedTable}` : "Escolher Mesa"}
            </Button>
          )}
          <div className="text-xl font-semibold">Total: R${paymentAmount.toFixed(2)}</div>
          {!showPaymentSection && (
            <Button type="button" className="w-full" disabled={isLoading || !isFormValid} onClick={handleGoToPayment}>
              {isLoading ? "Processando..." : "Ir para seção de pagamento"}
            </Button>
          )}
          {showPaymentSection && (
            <div id="paymentBrick_container" key="paymentBrick_container" ref={brickContainerRef}></div>
          )}
          <TableSelectionModal
            isOpen={isTableModalOpen}
            onClose={() => setIsTableModalOpen(false)}
            onTableSelect={handleTableSelect}
            selectedTable={selectedTable}
          />
        </>
      ) : (
        <StatusScreenBrick paymentId={paymentId!} />
      )}

      {error && (
        <div className="text-red-500">
          <p>{error}</p>
          {errorDetails && (
            <details>
              <summary>Detalhes do erro</summary>
              <pre className="text-xs mt-2 bg-gray-100 p-2 rounded">{errorDetails}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}

const InputField = ({ label, name, value, onChange, type = "text" }) => (
  <div className="space-y-2">
    <Label htmlFor={name}>{label}</Label>
    <Input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      required
      maxLength={name === "nome" || name === "sobrenome" ? 50 : undefined}
    />
  </div>
)
