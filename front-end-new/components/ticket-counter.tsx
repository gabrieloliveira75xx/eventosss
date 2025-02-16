"use client"

import { Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TicketCounterProps {
  count: number
  onIncrement: () => void
  onDecrement: () => void
  size?: "sm" | "md"
}

export function TicketCounter({ count, onIncrement, onDecrement, size = "md" }: TicketCounterProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full ${size === "sm" ? "h-6 w-6" : "h-8 w-8"}`}
        onClick={onDecrement}
        disabled={count === 0}
      >
        <Minus className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </Button>
      <span className={`w-4 text-center ${size === "sm" ? "text-sm" : ""}`}>{count}</span>
      <Button
        variant="outline"
        size="icon"
        className={`rounded-full ${size === "sm" ? "h-6 w-6" : "h-8 w-8"}`}
        onClick={onIncrement}
      >
        <Plus className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
      </Button>
    </div>
  )
}

