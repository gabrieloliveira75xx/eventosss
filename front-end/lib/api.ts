import axios from "axios"

const api = axios.create({
  baseURL: "https://eventos.grupoglk.com.br/api",
})

// Função para iniciar a compra
export const initiatePurchase = async (purchaseData: any) => {
  try {
    const response = await api.post("/iniciar-compra", purchaseData)
    return response.data
  } catch (error) {
    console.error("Error initiating purchase:", error)
    throw error
  }
}

// Funções para criação de pagamento

// Pagamento via cartão de crédito
export const createCreditCardPayment = async (paymentData: any, purchaseId: string) => {
  try {
    const response = await api.post("/criar-pagamento-cartao-credito", {
      ...paymentData,
      external_reference: purchaseId,
    })
    return response.data
  } catch (error) {
    console.error("Erro ao criar pagamento com cartão de crédito:", error)
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Erro ao criar pagamento com cartão de crédito")
    }
    throw error
  }
}

// Pagamento via cartão de débito
export const createDebitCardPayment = async (paymentData: any, purchaseId: string) => {
  try {
    const response = await api.post("/criar-pagamento-cartao-debito", {
      ...paymentData,
      external_reference: purchaseId,
    })
    return response.data
  } catch (error) {
    console.error("Erro ao criar pagamento com cartão de débito:", error)
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Erro ao criar pagamento com cartão de débito")
    }
    throw error
  }
}

  // Pagamento via PIX
  export const createPixPayment = async (paymentData: any, purchaseId: string) => {
    try {
      const response = await api.post("/criar-pagamento-pix", {
        ...paymentData,
        external_reference: purchaseId,
      })
      return response.data
    } catch (error) {
      console.error("Erro ao criar pagamento com PIX:", error)
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || "Erro ao criar pagamento com PIX")
      }
      throw error
    }
  }

// Função para verificar o status da compra
export const checkPurchaseStatus = async (purchaseId: string) => {
  try {
    const response = await api.get(`/status-compra/${purchaseId}`)
    return response.data
  } catch (error) {
    console.error("Error checking purchase status:", error)
    throw error
  }
}

// Novas funções para seleção de mesas

export const fetchTables = async () => {
  try {
    const response = await api.get("/tables")
    return response.data
  } catch (error) {
    console.error("Error fetching tables:", error)
    throw error
  }
}

export const selectTable = async (tableId: string, purchaseId: string) => {
  try {
    const response = await api.post("/select-table", { tableId, purchaseId })
    return response.data
  } catch (error) {
    console.error("Error selecting table:", error)
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || "Erro ao selecionar mesa")
    }
    throw error
  }
}
