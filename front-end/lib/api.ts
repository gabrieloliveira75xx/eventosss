import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
})

export const createPayment = async (paymentData: any) => {
  try {
    const response = await api.post("/criar-pagamento", paymentData)
    return response.data
  } catch (error) {
    console.error("Error creating payment:", error)
    throw error
  }
}

