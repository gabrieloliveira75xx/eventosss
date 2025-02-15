import axios from "axios"

const api = axios.create({
  baseURL: "https://eventos.grupoglk.com.br/api",
})

export default api

