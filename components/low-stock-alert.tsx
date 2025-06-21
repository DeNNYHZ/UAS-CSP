"use client"

import { AlertTriangle, Package, X } from "lucide-react"
import { useState } from "react"

type LowStockAlertProps = {
  quantity: number
  threshold?: number
  productName: string
  onDismiss?: () => void
  compact?: boolean
}

export function LowStockAlert({
  quantity,
  threshold = 10,
  productName,
  onDismiss,
  compact = false,
}: LowStockAlertProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed || quantity >= threshold) return null

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) onDismiss()
  }

  const getAlertLevel = () => {
    if (quantity === 0) return "critical"
    if (quantity <= 3) return "high"
    if (quantity <= 5) return "medium"
    return "low"
  }

  const alertLevel = getAlertLevel()

  const alertStyles = {
    critical: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    high: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200",
    medium:
      "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
    low: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
  }

  const iconStyles = {
    critical: "text-red-600 dark:text-red-400",
    high: "text-orange-600 dark:text-orange-400",
    medium: "text-yellow-600 dark:text-yellow-400",
    low: "text-amber-600 dark:text-amber-400",
  }

  const getMessage = () => {
    if (quantity === 0) return "Out of stock!"
    if (quantity <= 3) return "Critical low stock"
    if (quantity <= 5) return "Low stock warning"
    return "Stock running low"
  }

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${alertStyles[alertLevel]}`}
      >
        <AlertTriangle className={`w-3 h-3 ${iconStyles[alertLevel]}`} />
        <span>{quantity === 0 ? "Out of stock" : `${quantity} left`}</span>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-3 ${alertStyles[alertLevel]} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0">
            {quantity === 0 ? (
              <Package className={`w-4 h-4 ${iconStyles[alertLevel]}`} />
            ) : (
              <AlertTriangle className={`w-4 h-4 ${iconStyles[alertLevel]}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{getMessage()}</p>
            <p className="text-xs mt-1 opacity-90">
              {quantity === 0
                ? `${productName} is out of stock and needs immediate restocking.`
                : `${productName} has only ${quantity} unit${quantity === 1 ? "" : "s"} remaining.`}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
