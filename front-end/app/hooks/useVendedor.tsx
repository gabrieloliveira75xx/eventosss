"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface VendedorContextType {
  vendedor: string | null
  setVendedor: (code: string) => void
  clearVendedor: () => void
}

const VendedorContext = createContext<VendedorContextType | undefined>(undefined)

export function VendedorProvider({ children }: { children: ReactNode }) {
  const [vendedor, setVendedorState] = useState<string | null>(() => {
    // Verifica se estamos no navegador e se há um código de vendedor armazenado
    if (typeof window !== "undefined") {
      return localStorage.getItem("vendedor_code")
    }
    return null
  })

  const setVendedor = (code: string) => {
    setVendedorState(code)
    localStorage.setItem("vendedor_code", code)
  }

  const clearVendedor = () => {
    setVendedorState(null)
    localStorage.removeItem("vendedor_code")
  }

  // Efeito para sincronizar o código do vendedor entre abas/janelas
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "vendedor_code") {
        setVendedorState(e.newValue)
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  return (
    <VendedorContext.Provider value={{ vendedor, setVendedor, clearVendedor }}>{children}</VendedorContext.Provider>
  )
}

export function useVendedor() {
  const context = useContext(VendedorContext)
  if (context === undefined) {
    throw new Error("useVendedor must be used within a VendedorProvider")
  }
  return context
}