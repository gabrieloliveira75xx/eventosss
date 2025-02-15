"use client"

import { useState, useEffect, useRef } from "react"

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function useMercadoPago(publicKey: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const mpRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window === "undefined") return // Check if we're on the client side

    if (isLoaded || document.getElementById("mercado-pago-script")) return

    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.async = true
    script.id = "mercado-pago-script"
    script.onload = () => {
      if (window.MercadoPago) {
        mpRef.current = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        })
        setIsLoaded(true)
      } else {
        console.error("Falha ao carregar o MercadoPago.")
      }
    }
    document.body.appendChild(script)

    return () => {
      // Cleanup function to remove the script when the component unmounts
      const scriptElement = document.getElementById("mercado-pago-script")
      if (scriptElement) {
        document.body.removeChild(scriptElement)
      }
    }
  }, [isLoaded, publicKey])

  const initializeBrick = (containerId: string, options: any) => {
    if (!isLoaded || !mpRef.current) return

    const bricksBuilder = mpRef.current.bricks()
    bricksBuilder.create("payment", containerId, options)
  }

  return { isLoaded, mpRef, initializeBrick }
}

