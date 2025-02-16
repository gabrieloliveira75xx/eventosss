import axios from "axios"

const api = axios.create({
  baseURL: "/api", // Adjust base URL as needed
})

export default api

