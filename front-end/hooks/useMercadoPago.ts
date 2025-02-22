"use client"

import { useEffect, useState, useCallback } from "react"

declare global {
  interface Window {
    MercadoPago: any
  }
}

export function useMercadoPago(publicKey: string) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [mp, setMp] = useState<any>(null)

  useEffect(() => {
    const script = document.createElement("script")
    script.src = "https://sdk.mercadopago.com/js/v2"
    script.type = "text/javascript"
    script.onload = () => {
      const mp = new window.MercadoPago(publicKey)
      setMp(mp)
      setIsLoaded(true)
    }
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [publicKey])

  const initializeBrick = useCallback(
    (containerId: string, options: any) => {
      if (!mp) return

      const maxRetries = 5
      const retryInterval = 1000 // 1 second

      const attemptInitialization = (attempt = 0) => {
        try {
          const container = document.getElementById(containerId)
          if (!container) {
            throw new Error(`Container ${containerId} not found`)
          }
          return mp.bricks().create("payment", containerId, options)
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error)
          if (attempt < maxRetries) {
            setTimeout(() => attemptInitialization(attempt + 1), retryInterval)
          } else {
            console.error(`Failed to initialize brick after ${maxRetries} attempts`)
            throw error
          }
        }
      }

      return attemptInitialization()
    },
    [mp],
  )

  const initializeStatusScreen = useCallback(
    (containerId: string, options: any) => {
      if (!mp) return

      const maxRetries = 5
      const retryInterval = 1000 // 1 second

      const attemptInitialization = (attempt = 0) => {
        try {
          const container = document.getElementById(containerId)
          if (!container) {
            throw new Error(`Container ${containerId} not found`)
          }
          return mp.bricks().create("statusScreen", containerId, options)
        } catch (error) {
          console.error(`Attempt ${attempt + 1} failed:`, error)
          if (attempt < maxRetries) {
            setTimeout(() => attemptInitialization(attempt + 1), retryInterval)
          } else {
            console.error(`Failed to initialize status screen after ${maxRetries} attempts`)
            throw error
          }
        }
      }

      return attemptInitialization()
    },
    [mp],
  )

  return { isLoaded, mp, initializeBrick, initializeStatusScreen }
}

