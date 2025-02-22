"use client"

import { createContext, useContext, useState } from "react"

type VendedorContextType = {
  vendedor: string | null
  setVendedor: (codigo: string) => void
}

const VendedorContext = createContext<VendedorContextType | undefined>(undefined)

export function VendedorProvider({ children }: { children: React.ReactNode }) {
  const [vendedor, setVendedorState] = useState<string | null>(null)

  const setVendedor = (codigo: string) => {
    setVendedorState(codigo)
  }

  return (
    <VendedorContext.Provider value={{ vendedor, setVendedor }}>
      {children}
    </VendedorContext.Provider>
  )
}

export function useVendedor() {
  const context = useContext(VendedorContext)
  if (!context) {
    throw new Error("useVendedor deve ser usado dentro de um VendedorProvider")
  }
  return context
}
