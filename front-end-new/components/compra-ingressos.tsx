"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/axios"

interface FormData {
  nome: string
  sobrenome: string
  telefone: string
  conviteType: "unitario" | "casal"
  mesa: boolean
  estacionamento: boolean
  total: number
}

interface CompraIngressosProps {
  conviteType: "unitario" | "casal"
  mesa: boolean
  estacionamento: boolean
  total: number
}

export function CompraIngressos({ conviteType, mesa, estacionamento, total }: CompraIngressosProps) {
  const [formData, setFormData] = useState<FormData>({
    nome: "",
    sobrenome: "",
    telefone: "",
    conviteType,
    mesa,
    estacionamento,
    total,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCompra = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post("/iniciar-compra", formData)
      const { init_point } = response.data
      if (init_point) {
        window.location.href = init_point
      } else {
        throw new Error("Não foi possível obter o link de pagamento")
      }
    } catch (error) {
      console.error("Erro ao criar pagamento:", error)
      setError("Ocorreu um erro ao processar o pagamento. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleCompra} className="space-y-4">
      <h2 className="text-lg font-bold">Finalize sua compra</h2>
      <div className="space-y-2">
        <Label htmlFor="nome">Nome</Label>
        <Input
          type="text"
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          placeholder="Nome"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="sobrenome">Sobrenome</Label>
        <Input
          type="text"
          id="sobrenome"
          name="sobrenome"
          value={formData.sobrenome}
          onChange={handleInputChange}
          placeholder="Sobrenome"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          type="tel"
          id="telefone"
          name="telefone"
          value={formData.telefone}
          onChange={handleInputChange}
          placeholder="Telefone"
          required
        />
      </div>
      <div className="space-y-2">
        <p className="font-medium">Resumo da compra:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>{conviteType === "unitario" ? "Convite Unitário" : "Convite Casal (2 convites)"}</li>
          {mesa && <li>Mesa</li>}
          {estacionamento && <li>Estacionamento</li>}
        </ul>
        <p className="font-bold">Total: R$ {total.toFixed(2)}</p>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Processando..." : "Finalizar Compra"}
      </Button>
    </form>
  )
}

