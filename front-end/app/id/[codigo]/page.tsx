"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useVendedor } from "@/app/hooks/useVendedor"
import EventPage from "@/app/page"

export default function VendedorPage({ params }: { params: { codigo: string } }) {
  const { setVendedor } = useVendedor()
  const router = useRouter()

  useEffect(() => {
    if (params.codigo) {
      // Define o vendedor diretamente sem validação
      setVendedor(params.codigo)
    } else {
      // Redireciona para a página inicial se não houver código
      router.push("/")
    }
  }, [params.codigo, setVendedor, router])

  return <EventPage />
}