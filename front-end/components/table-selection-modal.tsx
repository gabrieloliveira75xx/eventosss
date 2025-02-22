"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Table {
  id: string
  available: boolean
}

interface TableSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onTableSelect: (tableId: string) => void
  selectedTable?: string
}

export function TableSelectionModal({ isOpen, onClose, onTableSelect, selectedTable }: TableSelectionModalProps) {
  const [tables, setTables] = useState<Table[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch available tables when modal opens
  const fetchTables = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/tables")
      if (!response.ok) throw new Error("Falha ao carregar as mesas disponíveis")
      const data = await response.json()
      setTables(data)
    } catch (err) {
      setError("Não foi possível carregar as mesas. Por favor, tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTableClick = (tableId: string, available: boolean) => {
    if (!available) return
    onTableSelect(tableId)
  }

  const TableButton = ({ id, available }: { id: string; available: boolean }) => (
    <button
      className={cn(
        "w-16 h-16 rounded-full border-2 flex items-center justify-center text-sm font-medium transition-colors",
        available ? "hover:bg-primary hover:text-primary-foreground cursor-pointer" : "opacity-50 cursor-not-allowed",
        selectedTable === id ? "bg-primary text-primary-foreground" : "bg-background",
        "border-border",
      )}
      disabled={!available}
      onClick={() => handleTableClick(id, available)}
    >
      {id.padStart(3, "0")}
    </button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Escolha sua Mesa</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">{error}</p>
            <Button onClick={fetchTables} className="mt-4">
              Tentar Novamente
            </Button>
          </div>
        ) : (
          <div className="p-8">
            <div className="w-full bg-muted p-4 text-center mb-8">PALCO</div>

            <div className="flex justify-between">
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">CAMAROTE</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 18 }, (_, i) => i + 1).map((num) => (
                    <TableButton
                      key={num}
                      id={num.toString()}
                      available={tables.find((t) => t.id === num.toString())?.available ?? false}
                    />
                  ))}
                </div>
              </div>

              <div className="text-center text-4xl font-bold self-center">PISTA</div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-4">CAMAROTE</h3>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 18 }, (_, i) => i + 19).map((num) => (
                    <TableButton
                      key={num}
                      id={num.toString()}
                      available={tables.find((t) => t.id === num.toString())?.available ?? false}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

