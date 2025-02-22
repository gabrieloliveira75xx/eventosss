"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { CompraIngressos } from "./compra-ingressos"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"
import { TableSelectionModal } from "@/components/table-selection-modal"

const CONVITE_UNITARIO_PRICE = 25.0
const CONVITE_CASAL_PRICE = 40.0
const CONVITE_CAMAROTE_PRICE = 200.0
const MESA_PRICE = 20.0
const ESTACIONAMENTO_PRICE = 20.0

type ConviteType = "unitario" | "casal" | "camarote"

export function TicketSidebar() {
  const [conviteType, setConviteType] = useState<ConviteType | null>(null)
  const [mesa, setMesa] = useState(false)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [estacionamento, setEstacionamento] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)

  const handleConviteTypeChange = (value: ConviteType) => {
    console.log("Convite selecionado:", value)
    setConviteType(value)
    if (value === "camarote") {
      setMesa(true)
    } else {
      setMesa(false)
      setSelectedTable(null)
    }
  }

  // useEffect(() => {
  //   if (conviteType === "camarote") {
  //     setMesa(true)
  //   } else {
  //     setSelectedTable(null)
  //   }
  // }, [conviteType])

  const handleTableSelect = (tableId: string) => {
    setSelectedTable(tableId)
    setShowTableModal(false)
  }

  const handleReserveClick = () => {
    if ((mesa || conviteType === "camarote") && !selectedTable) {
      setShowTableModal(true)
      return
    }
    setShowPurchaseForm(true)
  }

  const basePrice =
    conviteType === "unitario"
      ? CONVITE_UNITARIO_PRICE
      : conviteType === "casal"
        ? CONVITE_CASAL_PRICE
        : conviteType === "camarote"
          ? CONVITE_CAMAROTE_PRICE
          : 0
  const additionalPrice =
    (mesa && conviteType !== "camarote" ? MESA_PRICE : 0) + (estacionamento ? ESTACIONAMENTO_PRICE : 0)
  const total = basePrice + additionalPrice

  const PurchaseSummary = () => (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold text-black">Resumo da compra</h3>
      <div className="flex justify-between">
        <span>
          {conviteType === "unitario"
            ? "Convite Unitário"
            : conviteType === "casal"
              ? "Convite Casal"
              : "Convite Camarote"}
        </span>
        <span>R$ {basePrice.toFixed(2)}</span>
      </div>
      {mesa && conviteType !== "camarote" && (
        <div className="flex justify-between">
          <span>Mesa</span>
          <span>R$ {MESA_PRICE.toFixed(2)}</span>
        </div>
      )}
      {estacionamento && (
        <div className="flex justify-between">
          <span>Estacionamento</span>
          <span>R$ {ESTACIONAMENTO_PRICE.toFixed(2)}</span>
        </div>
      )}
      <div className="border-t pt-2 font-semibold">
        <div className="flex justify-between">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  const TicketOption = ({ value, label, price, description }) => (
    <div className="flex items-center justify-between space-x-1 pl-1 pr-2 py-2 rounded hover:bg-gray-100">
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={value}
          name="conviteType"
          value={value}
          checked={conviteType === value}
          onChange={() => handleConviteTypeChange(value)}
          className="sr-only"
          disabled={showPurchaseForm}
        />
        <label htmlFor={value} className="flex items-center space-x-1.5 cursor-pointer">
          <div
            className={`aspect-square h-4 w-4 rounded-full border border-primary flex items-center justify-center ${
              conviteType === value ? "bg-primary" : ""
            }`}
          >
            {conviteType === value && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span>{label}</span>
        </label>
        <TooltipProvider delayDuration={100} skipDelayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="p-2 -m-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={(e) => {
                  // Previne que o radio button seja acionado quando clicar no tooltip
                  e.stopPropagation()
                }}
              >
                <Info className="h-4 w-4 text-gray-500" />
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={5} className="p-3">
              <p className="max-w-xs text-sm">{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <span className="font-semibold">R$ {price.toFixed(2)}</span>
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card className="bg-white p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-black mb-4">Selecione seu Convite</h2>
        <div className="space-y-2">
          <TicketOption
            value="unitario"
            label="Convite Unitário"
            price={CONVITE_UNITARIO_PRICE}
            description={
              <>
                <strong>Contém 01 Convite individual</strong> para uma pessoa. Não incluso mesa ou estacionamento, mas
                esses itens podem ser adicionados, caso ainda estejam disponíveis.
              </>
            }
          />
          <TicketOption
            value="casal"
            label="Convite Casal"
            price={CONVITE_CASAL_PRICE}
            description={
              <>
                <strong>Contém 02 Convites individuais</strong> para duas pessoas. Não incluso mesa ou estacionamento,
                mas esses itens podem ser adicionados, caso ainda estejam disponíveis.
              </>
            }
          />
          <TicketOption
            value="camarote"
            label="Convite Camarote"
            price={CONVITE_CAMAROTE_PRICE}
            description={
              <>
                <strong>Contém 04 Convites</strong> individuais para quatro pessoas,{" "}
                <strong>incluso mesa exclusiva para o camarote</strong>. Não incluso estacionamento, mas esse item pode
                ser adicionado, caso ainda esteja disponível.
              </>
            }
          />
        </div>
      </Card>

      {conviteType && (
        <Card className="bg-white p-4 sm:p-6">
          <h2 className="text-lg font-bold text-black mb-4">Opções Adicionais</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mesa"
                  checked={mesa}
                  onCheckedChange={(checked) => setMesa(checked as boolean)}
                  disabled={conviteType === "camarote" || showPurchaseForm}
                />
                <Label htmlFor="mesa">Mesa</Label>
                {conviteType === "camarote" && (
                  <TooltipProvider delayDuration={100} skipDelayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          className="p-2 -m-2 hover:bg-gray-100 rounded-full transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-4 w-4 text-gray-500" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={5} className="p-3">
                        <p>Convite Camarote inclui Mesa, com localização exclusiva para este tipo de convite.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <span className="font-semibold">
                {conviteType === "camarote" ? "Incluso" : `R$ ${MESA_PRICE.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between space-x-2 p-2 rounded hover:bg-gray-100">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="estacionamento"
                  checked={estacionamento}
                  onCheckedChange={(checked) => setEstacionamento(checked as boolean)}
                  disabled={showPurchaseForm}
                />
                <Label htmlFor="estacionamento">Estacionamento</Label>
              </div>
              <span className="font-semibold">R$ {ESTACIONAMENTO_PRICE.toFixed(2)}</span>
            </div>
          </div>
        </Card>
      )}

      {conviteType && (
        <Card className="bg-white p-4 sm:p-6">
          <div className="space-y-4">
            <PurchaseSummary />

            {showPurchaseForm ? (
              <CompraIngressos
                conviteType={conviteType}
                mesa={mesa}
                estacionamento={estacionamento}
                total={total}
                selectedTable={selectedTable}
              />
            ) : (
              <>
                {(mesa || conviteType === "camarote") && (
                  <div className="mb-4">
                    <Button
                      onClick={() => setShowTableModal(true)}
                      variant="outline"
                      className="w-full mb-2"
                      disabled={showPurchaseForm}
                    >
                      {selectedTable ? `Mesa ${selectedTable} selecionada - Alterar` : "ESCOLHER MESA"}
                    </Button>
                    {!selectedTable && (
                      <p className="text-sm text-red-500">É necessário escolher uma mesa antes de prosseguir</p>
                    )}
                  </div>
                )}
                <Button
                  className="w-full bg-black text-white hover:bg-black/90"
                  onClick={handleReserveClick}
                  disabled={(mesa || conviteType === "camarote") && !selectedTable}
                >
                  IR PARA SELEÇÃO DE PAGAMENTO
                </Button>
              </>
            )}
          </div>
        </Card>
      )}

      <TableSelectionModal
        isOpen={showTableModal}
        onClose={() => setShowTableModal(false)}
        onTableSelect={handleTableSelect}
        selectedTable={selectedTable ?? undefined}
      />
    </div>
  )
}

