"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useMercadoPago } from "@/hooks/useMercadoPago"
import { logError } from "@/lib/logger"
import { useSearchParams } from "next/navigation"
import { StatusScreenBrick } from "./status-screen-brick"
import { TableSelectionModal } from "./table-selection-modal"
import {
  iniciarCompra,
  criarPagamentoCartaoCredito,
  criarPagamentoCartaoDebito,
  criarPagamentoPix,
  /// importar dpsselectTable,
} from "@/lib/api"

interface FormData {
  nome: string
  sobrenome: string
  telefone: string
  conviteType: "unitario" | "casal" | "camarote"
  mesa: boolean
  estacionamento: boolean
  vendedorCode?: string // Adicionado vendedorCode ao FormData
}

interface CompraIngressosProps {
  initialConviteType?: "unitario" | "casal" | "camarote"
  mesa: boolean
  estacionamento: boolean
  total: number
  vendedorCode?: string // Adicionado vendedorCode às props
}

export function CompraIngressos({
  initialConviteType = "unitario",
  mesa,
  estacionamento,
  total,
  vendedorCode, // Recebendo vendedorCode das props
}: CompraIngressosProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    conviteType: initialConviteType,
    mesa,
    estacionamento,
    vendedorCode, // Inicializando vendedorCode no estado
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
  const [showPaymentForm, setShowPaymentForm] = useState(true)

  const { isLoaded, initializeBrick, mp } = useMercadoPago("TEST-b8b8ec68-c42f-4b50-8ecf-691cd87f35b5")

  useEffect(() => {
    const external_reference = searchParams.get("external_reference")
    if (external_reference) {
      setPurchaseId(external_reference)
      setShowStatusScreen(true)
    }
  }, [searchParams])

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
            pix: "all", // Garante que PIX está disponível
            maxInstallments: 12,
          },
        },
        callbacks: {
          onReady: () => {
            console.log("Payment Brick pronto")
            setIsLoading(false)
          },
          onSubmit: async (paymentData: any) => {
            console.log("Dados do pagamento:", paymentData)

            const paymentMethod = paymentData.formData.payment_method_id

            // Passar o payment_id para cada pagamento
            const externalReference = paymentId || paymentData.formData.external_reference || "Referência externa"

            if (paymentMethod === "pix") {
              return createPixPayment(paymentData)
            } else if (paymentMethod === "debit_card") {
              return createDebitCardPayment(paymentData)
            } else {
              return createCreditCardPayment(paymentData)
            }
          },
          onError: (error: any) => {
            console.error("Erro no Payment Brick:", error)
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
  }, [isLoaded, showPaymentSection, paymentAmount, initializeBrick, paymentId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "telefone") {
      const formattedValue = formatPhone(value)
      setFormData((prev) => ({ ...prev, [name]: formattedValue }))
    } else if (name === "nome" || name === "sobrenome") {
      const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      const lettersOnly = capitalizedValue.replace(/[^a-zA-Z]/g, "")
      setFormData((prev) => ({ ...prev, [name]: lettersOnly }))
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
    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    try {
      console.log("Iniciando compra:", { ...formData, amount: paymentAmount });
      const { purchase_id, amount } = await iniciarCompra({
        ...formData,
        amount: paymentAmount,
        vendedor_code: formData.vendedorCode, // Garantir que o vendedor_code seja passado
      });
      console.log("Compra iniciada:", { purchase_id, amount });
  
      if (!purchase_id) {
        throw new Error("ID da compra não retornado pelo servidor.");
      }
  
      setPaymentAmount(amount);
      setPurchaseId(purchase_id);
      setShowPaymentSection(true);
    } catch (error: any) {
      console.error("Erro ao iniciar a compra:", error);
      logError("Erro ao Iniciar Compra", { error, formData, paymentAmount });
      setError(error.response?.data?.message || "Ocorreu um erro ao iniciar a compra. Por favor, tente novamente.");
      setErrorDetails(JSON.stringify(error, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Função para criar pagamento via cartão de crédito
  const createCreditCardPayment = async (paymentData: { formData: any }) => {
    try {
      const adjustedPaymentData = {
        payment_method_id: paymentData.formData.payment_method_id,
        token: paymentData.formData.token,
        transaction_amount: paymentData.formData.transaction_amount,
        external_reference: purchaseId || "", // Garantir que seja uma string
        installments: paymentData.formData.installments,
        statement_descriptor: paymentData.formData.statement_descriptor || "Compra Evento",
        payer: {
          email: paymentData.formData.payer.email,
          identification: paymentData.formData.payer.identification,
          first_name: paymentData.formData.payer.first_name || "",
          last_name: paymentData.formData.payer.last_name || "",
        },
        vendedor_code: formData.vendedorCode, // Passando vendedorCode
      }

      const data = await criarPagamentoCartaoCredito(adjustedPaymentData)
      if (data.status === "approved" || data.status === "in_process") {
        setShowStatusScreen(true)
      }
      return data
    } catch (error) {
      console.error("Erro ao criar pagamento com cartão de crédito:", error)
      throw new Error("Erro ao processar pagamento")
    }
  }

  // Função para criar pagamento via cartão de débito
  const createDebitCardPayment = async (paymentData: { formData: any }) => {
    try {
      const adjustedPaymentData = {
        payment_method_id: "debit_card",
        token: paymentData.formData.token,
        transaction_amount: paymentData.formData.transaction_amount,
        external_reference: purchaseId || "", // Garantir que seja uma string
        installments: paymentData.formData.installments,
        statement_descriptor: paymentData.formData.statement_descriptor || "Compra Evento",
        payer: {
          email: paymentData.formData.payer.email,
          identification: paymentData.formData.payer.identification,
          first_name: paymentData.formData.payer.first_name || "",
          last_name: paymentData.formData.payer.last_name || "",
        },
        vendedor_code: formData.vendedorCode, // Passando vendedorCode
      }

      const data = await criarPagamentoCartaoDebito(adjustedPaymentData)
      if (data.status === "approved" || data.status === "in_process") {
        setShowStatusScreen(true)
      }
      return data
    } catch (error) {
      console.error("Erro ao criar pagamento com cartão de débito:", error)
      throw new Error("Erro ao processar pagamento")
    }
  }

  // Função para criar pagamento via PIX
  const createPixPayment = async (paymentData: { formData: any }) => {
    try {
      const adjustedPaymentData = {
        payment_method_id: "pix",
        transaction_amount: paymentData.formData.transaction_amount,
        external_reference: purchaseId || "",
        notification_url: "https://eventos.grupoglk.com.br/status",
        payer: {
          email: paymentData.formData.payer.email,
          identification: paymentData.formData.payer.identification,
          first_name: paymentData.formData.payer.first_name || "",
          last_name: paymentData.formData.payer.last_name || "",
        },
        vendedor_code: formData.vendedorCode, // Passando vendedorCode
      }

      const data = await criarPagamentoPix(adjustedPaymentData)
      if (data.status === "pending") {
        setShowStatusScreen(true)
      }
      return data
    } catch (error) {
      console.error("Erro ao criar pagamento via PIX:", error)
      setError("Erro ao processar pagamento PIX. Por favor, tente novamente.")
      throw error
    }
  }

  const handleTableSelect = async (tableId: string) => {
    setSelectedTable(tableId)
    setIsTableModalOpen(false)

    if (purchaseId) {
      try {
        await selectTable(tableId, purchaseId)
      } catch (error) {
        console.error("Error selecting table:", error)
        setError("Erro ao selecionar mesa. Por favor, tente novamente.")
      }
    }
  }

  const isFormValid = formData.nome && formData.sobrenome && formData.telefone.length >= 13

  useEffect(() => {
    if (paymentId) {
      setShowStatusScreen(true)
    }
  }, [paymentId])

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {!showStatusScreen && showPaymentForm && (
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
            selectedTable={selectedTable || undefined}
          />
        </>
      )}

      {error && (
        <div className="text-red-500">
          <p>{error}</p>
          {errorDetails && (
            <details>
              <summary>Detalhes do erro</summary>
              <pre className="text-xs mt-2 bg-gray-100 p2 rounded">{errorDetails}</pre>
            </details>
          )}
        </div>
      )}
      {showStatusScreen && purchaseId && <StatusScreenBrick purchaseId={purchaseId} amount={paymentAmount} />}
    </div>
  )
}

const InputField = ({ label, name, value, onChange, type = "text" }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
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