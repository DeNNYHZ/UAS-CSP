"use client"

import { useState, useEffect } from "react"
import { getStockMovements, getProducts } from "@/lib/supabase"
import type { StockMovement, Product } from "@/lib/supabase"
import { TrendingUp, TrendingDown, RotateCcw, Package, Filter, X } from "lucide-react"

export function StockMovementHistory() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null)
  const [selectedMovementType, setSelectedMovementType] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchMovements = async (productId?: number) => {
    setLoading(true)
    try {
      const result = await getStockMovements(productId, 200)
      if (result.success) {
        setMovements(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to load stock movements")
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const result = await getProducts()
      if (result.success) {
        setProducts(result.data)
      }
    } catch (err) {
      console.error("Failed to load products:", err)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchMovements()
  }, [])

  const filteredMovements = movements.filter((movement) => {
    const matchesProduct = selectedProduct === null || movement.product_id === selectedProduct
    const matchesType = selectedMovementType === "" || movement.movement_type === selectedMovementType
    return matchesProduct && matchesType
  })

  const clearFilters = () => {
    setSelectedProduct(null)
    setSelectedMovementType("")
    fetchMovements()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case "IN":
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
      case "OUT":
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
      case "ADJUSTMENT":
        return <RotateCcw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      default:
        return <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
    }
  }

  const getMovementColor = (type: string) => {
    switch (type) {
      case "IN":
        return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
      case "OUT":
        return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800"
      case "ADJUSTMENT":
        return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      default:
        return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-800"
    }
  }

  if (loading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading stock movements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Stock Movement History</h2>
          </div>
          <button
            onClick={() => {
              fetchProducts();
              fetchMovements();
            }}
            disabled={loading}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <svg className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582M20 20v-5h-.581M5.635 19.364A9 9 0 104.582 9.582" /></svg>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
          </div>

          <select
            value={selectedProduct || ""}
            onChange={(e) => {
              const productId = e.target.value ? Number.parseInt(e.target.value) : null
              setSelectedProduct(productId)
              fetchMovements(productId)
            }}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.nama_produk}
              </option>
            ))}
          </select>

          <select
            value={selectedMovementType}
            onChange={(e) => setSelectedMovementType(e.target.value)}
            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="IN">Stock In</option>
            <option value="OUT">Stock Out</option>
            <option value="ADJUSTMENT">Adjustment</option>
          </select>

          {(selectedProduct || selectedMovementType) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-4 rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {selectedProduct || selectedMovementType
                ? "No movements found matching your filters"
                : "No stock movements recorded"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMovements.map((movement) => (
              <div key={movement.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">{getMovementIcon(movement.movement_type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {movement.product?.nama_produk || `Product ID: ${movement.product_id}`}
                        </h3>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getMovementColor(movement.movement_type)}`}
                        >
                          {movement.movement_type === "IN" && "Stock In"}
                          {movement.movement_type === "OUT" && "Stock Out"}
                          {movement.movement_type === "ADJUSTMENT" && "Adjustment"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Quantity Change:</span>
                          <span
                            className={`ml-1 font-semibold ${
                              movement.quantity_change > 0
                                ? "text-green-600 dark:text-green-400"
                                : movement.quantity_change < 0
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {movement.quantity_change > 0 ? "+" : ""}
                            {movement.quantity_change}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Before:</span>
                          <span className="ml-1">{movement.quantity_before}</span>
                        </div>
                        <div>
                          <span className="font-medium">After:</span>
                          <span className="ml-1">{movement.quantity_after}</span>
                        </div>
                      </div>

                      {movement.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          <span className="font-medium">Reason:</span> {movement.reason}
                        </p>
                      )}

                      {movement.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-medium">Notes:</span> {movement.notes}
                        </p>
                      )}

                      {movement.reference_number && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                          Ref: {movement.reference_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(movement.created_at)}</p>
                    {movement.user && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        by {movement.user.full_name || movement.user.username}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
