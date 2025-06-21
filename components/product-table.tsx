"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import {
  getProducts,
  getCategories,
  addProduct,
  updateProduct,
  deleteProduct,
  validateProductName,
  validatePrice,
  validateQuantity,
  isLowStock,
} from "@/lib/supabase"
import type { Product, Category } from "@/lib/supabase"
import { LowStockAlert } from "./low-stock-alert"
import { CategoryBadge } from "./category-badge"
import { CategoryManager } from "./category-manager"
import { Edit, Trash2, Plus, Search, Package, AlertCircle, CheckCircle, Filter, X, ChevronDown } from "lucide-react"

type ProductTableProps = {
  onDataChange?: () => void
}

export function ProductTable({ onDataChange }: ProductTableProps) {
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [formData, setFormData] = useState({
    nama_produk: "",
    harga_satuan: "",
    quantity: "",
    category_id: "",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [showAllLowStock, setShowAllLowStock] = useState(false)

  const fetchProducts = async () => {
    setLoading(true)
    setError("")

    try {
      const result = await getProducts()
      if (result.success) {
        setProducts(result.data || [])
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to load products")
      console.error("Products error:", err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const result = await getCategories()
      if (result.success) {
        setCategories(result.data || [])
      }
    } catch (err) {
      console.error("Categories error:", err)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    const nameError = validateProductName(formData.nama_produk)
    if (nameError) errors.nama_produk = nameError

    const price = Number.parseInt(formData.harga_satuan)
    const priceError = validatePrice(price)
    if (priceError) errors.harga_satuan = priceError

    const quantity = Number.parseInt(formData.quantity)
    const quantityError = validateQuantity(quantity)
    if (quantityError) errors.quantity = quantityError

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.nama_produk.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === null || product.category_id === selectedCategory
    const matchesLowStock = !showLowStockOnly || isLowStock(product.quantity)

    return matchesSearch && matchesCategory && matchesLowStock
  })

  const lowStockProducts = products.filter((product) => isLowStock(product.quantity))

  const showSuccess = (message: string) => {
    setSuccess(message)
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleAdd = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const productData = {
        nama_produk: formData.nama_produk.trim(),
        harga_satuan: Number.parseInt(formData.harga_satuan),
        quantity: Number.parseInt(formData.quantity),
        category_id: formData.category_id ? Number.parseInt(formData.category_id) : undefined,
      }

      const result = await addProduct(productData)
      if (result.success) {
        await fetchProducts()
        setFormData({ nama_produk: "", harga_satuan: "", quantity: "", category_id: "" })
        setFormErrors({})
        setIsAddDialogOpen(false)
        showSuccess("Product added successfully!")
        if (onDataChange) onDataChange()
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to add product")
      console.error("Add product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      nama_produk: product.nama_produk,
      harga_satuan: product.harga_satuan.toString(),
      quantity: product.quantity.toString(),
      category_id: product.category_id?.toString() || "",
    })
    setFormErrors({})
    setIsEditDialogOpen(true)
  }

  const handleUpdate = async () => {
    if (!validateForm() || !editingProduct) return

    setLoading(true)
    try {
      const productData = {
        nama_produk: formData.nama_produk.trim(),
        harga_satuan: Number.parseInt(formData.harga_satuan),
        quantity: Number.parseInt(formData.quantity),
        category_id: formData.category_id ? Number.parseInt(formData.category_id) : undefined,
      }

      const result = await updateProduct(editingProduct.id, productData)
      if (result.success) {
        await fetchProducts()
        setEditingProduct(null)
        setFormData({ nama_produk: "", harga_satuan: "", quantity: "", category_id: "" })
        setFormErrors({})
        setIsEditDialogOpen(false)
        showSuccess("Product updated successfully!")
        if (onDataChange) onDataChange()
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to update product")
      console.error("Update product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return

    setLoading(true)
    try {
      const result = await deleteProduct(id)
      if (result.success) {
        await fetchProducts()
        showSuccess("Product deleted successfully!")
        if (onDataChange) onDataChange()
      } else {
        setError(result.error || "")
      }
    } catch (err) {
      setError("Failed to delete product")
      console.error("Delete product error:", err)
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingProduct(null)
    setFormData({ nama_produk: "", harga_satuan: "", quantity: "", category_id: "" })
    setFormErrors({})
    setError("")
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory(null)
    setShowLowStockOnly(false)
  }

  if (loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {lowStockProducts.length > 0 && user?.role === "admin" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              Low Stock Items
            </h3>
            <button
              onClick={() => setShowAllLowStock(!showAllLowStock)}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              {showAllLowStock ? "Show Less" : `Show All (${lowStockProducts.length})`}
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {(showAllLowStock ? lowStockProducts : lowStockProducts.slice(0, 3)).map((product) => (
              <LowStockAlert
                key={product.id}
                productName={product.nama_produk}
                quantity={product.quantity}
                compact={false}
              />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-3">
              <div className="relative flex-grow md:flex-grow-0">
                <select
                  value={selectedCategory === null ? "" : selectedCategory.toString()}
                  onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                  className="appearance-none w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  showLowStockOnly
                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800"
                    : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                <Filter className="w-4 h-4" />
                Low Stock
              </button>
            </div>
            {user?.role === "admin" && (
              <button
                onClick={() => {
                  setIsAddDialogOpen(true)
                  setFormErrors({})
                }}
                className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            )}
          </div>
          {(searchTerm || selectedCategory !== null || showLowStockOnly) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {filteredProducts.length} results
              </span>
              <button onClick={clearFilters} className="text-xs flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <X className="w-3 h-3"/>
                Clear filters
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Product Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-right">
                  Price
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Quantity
                </th>
                <th scope="col" className="px-6 py-3 text-center">
                  Status
                </th>
                {user?.role === "admin" && (
                  <th scope="col" className="px-6 py-3 text-right">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr
                    key={product.id}
                    className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {product.nama_produk}
                    </th>
                    <td className="px-6 py-4">
                      <CategoryBadge category={categories.find((cat) => cat.id === product.category_id)} />
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(product.harga_satuan)}</td>
                    <td className="px-6 py-4 text-center">{product.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      {isLowStock(product.quantity) ? (
                        <LowStockAlert quantity={product.quantity} productName={product.nama_produk} compact />
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                          In Stock
                        </span>
                      )}
                    </td>
                    {user?.role === "admin" && (
                      <td className="px-6 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.nama_produk)}
                          className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={user?.role === "admin" ? 6 : 5} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                      <h3 className="text-lg font-semibold">No Products Found</h3>
                      <p className="text-sm">
                        {products.length === 0 ? "There are no products in the inventory." : "No products match your current filters."}
                      </p>
                      {user?.role === "admin" && products.length === 0 && (
                        <button
                           onClick={() => {
                            setIsAddDialogOpen(true)
                            setFormErrors({})
                          }}
                           className="mt-2 bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md"
                        >
                           <Plus className="w-4 h-4" />
                           Add First Product
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(isAddDialogOpen || isEditDialogOpen) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {isEditDialogOpen ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.nama_produk}
                  onChange={(e) => setFormData({ ...formData, nama_produk: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.nama_produk ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="e.g., Apple Macbook Pro 16"
                />
                {formErrors.nama_produk && <p className="text-red-500 text-xs mt-1">{formErrors.nama_produk}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Price (IDR)
                  </label>
                  <input
                    type="number"
                    value={formData.harga_satuan}
                    onChange={(e) => setFormData({ ...formData, harga_satuan: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.harga_satuan ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="e.g., 25000000"
                  />
                  {formErrors.harga_satuan && <p className="text-red-500 text-xs mt-1">{formErrors.harga_satuan}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.quantity ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                    placeholder="e.g., 100"
                  />
                  {formErrors.quantity && <p className="text-red-500 text-xs mt-1">{formErrors.quantity}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Category
                </label>
                <div className="flex gap-2">
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="appearance-none flex-grow w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2.5 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-colors"
                  >
                    <option value="">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-300">
                     <ChevronDown className="w-4 h-4" />
                  </div>
                  <CategoryManager onCategoryAdded={async () => await fetchCategories()} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                disabled={loading}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={isEditDialogOpen ? handleUpdate : handleAdd}
                disabled={loading}
                className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 shadow-md"
              >
                {loading
                  ? isEditDialogOpen
                    ? "Updating..."
                    : "Adding..."
                  : isEditDialogOpen
                  ? "Save Changes"
                  : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed bottom-5 right-5 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg animate-fade-in-up">
          <CheckCircle className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}
    </div>
  )
}
