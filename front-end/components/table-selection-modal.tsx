"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TableSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onTableSelect: (tableId: string) => void
  selectedTable?: string
  conviteType?: "unitario" | "casal" | "camarote"
}

export function TableSelectionModal({
  isOpen,
  onClose,
  onTableSelect,
  selectedTable,
  conviteType = "unitario",
}: TableSelectionModalProps) {
  const [hoveredTable, setHoveredTable] = useState<string | null>(null)
  const [scale, setScale] = useState(0.8) // Iniciando com zoom mais afastado

  const isTableAvailable = (tableId: string) => {
    const numId = Number(tableId)
    // Mesas 037-048 são pré-reservadas
    if (numId >= 37 && numId <= 48) return false

    // Se for convite camarote, só pode selecionar mesas do camarote
    if (conviteType === "camarote") {
      return (numId >= 1 && numId <= 33) || (numId >= 4 && numId <= 36)
    }

    // Se não for camarote, não pode selecionar mesas do camarote
    if ((numId >= 1 && numId <= 33) || (numId >= 4 && numId <= 36)) return false

    return true
  }

  const getTableStatus = (tableId: string) => {
    const numId = Number(tableId)
    if (numId >= 37 && numId <= 48) return "reserved"

    const isCamaroteTable = (numId >= 1 && numId <= 33) || (numId >= 4 && numId <= 36)
    if (isCamaroteTable) {
      return conviteType === "camarote" ? "available" : "vip"
    }

    return "available"
  }

  const renderTable = (tableId: string) => {
    const id = tableId.padStart(3, "0")
    const status = getTableStatus(id)
    const isAvailable = isTableAvailable(id)

    return (
      <button
        key={id}
        className={cn(
          "w-12 h-12 rounded-full border flex items-center justify-center text-sm transition-colors",
          status === "reserved" && "bg-gray-200 border-gray-300 text-gray-500 cursor-not-allowed",
          status === "vip" && "bg-purple-100 border-purple-300 text-purple-500 cursor-not-allowed",
          status === "available" && "border-black hover:bg-primary/10 cursor-pointer",
          selectedTable === id && "bg-primary border-primary text-white hover:bg-primary",
          hoveredTable === id && isAvailable && "bg-primary/20",
        )}
        onClick={() => isAvailable && onTableSelect(id)}
        onMouseEnter={() => setHoveredTable(id)}
        onMouseLeave={() => setHoveredTable(null)}
        disabled={!isAvailable}
        title={!isAvailable ? (status === "reserved" ? "Mesa reservada" : "Mesa exclusiva para camarote") : ""}
      >
        {id}
      </button>
    )
  }

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.2, 0.5))

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-[95vw] h-[90vh] max-h-[90vh]">
        <div className="relative h-full overflow-auto">
          <div className="absolute top-0 right-4 flex gap-2 z-10">
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="min-w-[1000px] p-8 transform-gpu"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: "top center",
              transition: "transform 0.2s ease",
            }}
          >
            {/* Stage */}
            <div className="w-[600px] h-20 border mx-auto mb-12 flex items-center justify-center">
              <span className="text-3xl font-normal">PALCO</span>
            </div>

            <div className="relative max-w-[900px] mx-auto">
              <div className="flex justify-between mb-8">
                {/* Left VIP Section */}
                <div>
                  <div className="text-2xl mb-4 text-center">CAMAROTE</div>
                  <div className="border p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 33 }, (_, i) => renderTable((i + 1).toString()))}
                    </div>
                  </div>
                </div>

                {/* Right VIP Section */}
                <div>
                  <div className="text-2xl mb-4 text-center">CAMAROTE</div>
                  <div className="border p-4">
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 33 }, (_, i) => renderTable((i + 4).toString()))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Area with PISTA text */}
              <div className="text-5xl font-normal text-center mb-8">PISTA</div>

              {/* Regular Tables */}
              <div className="space-y-12">
                {/* First Row - 037-048 */}
                <div className="flex justify-between">
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }, (_, i) => renderTable((i + 37).toString()))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 6 }, (_, i) => renderTable((i + 43).toString()))}
                  </div>
                </div>

                {/* Main Grid - 049-144 */}
                <div className="grid grid-cols-12 gap-3">
                  {Array.from({ length: 96 }, (_, i) => renderTable((i + 49).toString()))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center border-t pt-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border border-black" />
            <span className="text-sm">Disponível</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300" />
            <span className="text-sm">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-purple-100 border border-purple-300" />
            <span className="text-sm">Camarote</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

