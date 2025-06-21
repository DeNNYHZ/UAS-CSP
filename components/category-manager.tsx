"use client"

import { useState, useEffect } from "react"
import { getCategories, addCategory, validateCategoryName } from "@/lib/supabase"
import type { Category } from "@/lib/supabase"
import { Plus, Package, Smartphone, Monitor, Headphones, Gamepad2, Camera, X } from "lucide-react"

type CategoryManagerProps = {
  onCategoryAdded?: (category: Category) => void
}

const iconOptions = [
  { name: "Package", icon: Package },
  { name: "Smartphone", icon: Smartphone },
  { name: "Monitor", icon: Monitor },
  { name: "Headphones", icon: Headphones },
  { name: "Gamepad2", icon: Gamepad2 },
  { name: "Camera", icon: Camera },
]

const colorOptions = [
  "#3B82F6",
  "#8B5CF6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#6B7280",
  "#14B8A6",
]

export function CategoryManager({ onCategoryAdded }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6B7280",
    icon: "Package",
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const result = await getCategories()
      if (result.success) { 
        setCategories(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to load categories")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    const nameError = validateCategoryName(formData.name)
    if (nameError) errors.name = nameError

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = async () => {
    if (!validateForm()) return

    setLoading(true)
    try {
      const result = await addCategory({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        icon: formData.icon,
      })

      if (result.success) {
        await fetchCategories()
        setFormData({ name: "", description: "", color: "#6B7280", icon: "Package" })
        setFormErrors({})
        setIsAddDialogOpen(false)
        if (onCategoryAdded) onCategoryAdded(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError("Failed to add category")
    } finally {
      setLoading(false)
    }
  }

  const closeModal = () => {
    setIsAddDialogOpen(false)
    setFormData({ name: "", description: "", color: "#6B7280", icon: "Package" })
    setFormErrors({})
    setError("")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Categories</h3>
        <button
          onClick={() => setIsAddDialogOpen(true)}
          className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const IconComponent = iconOptions.find((opt) => opt.name === category.icon)?.icon || Package
          return (
            <span
              key={category.id}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${category.color}20`,
                color: category.color,
                borderColor: `${category.color}40`,
                border: "1px solid",
              }}
            >
              <IconComponent className="w-3 h-3" />
              {category.name}
            </span>
          )
        })}
      </div>

      {isAddDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md max-h-[90vh] overflow-y-auto animate-scale-in shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add New Category</h3>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${formErrors.name ? "border-red-300 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`}
                  placeholder="Enter category name"
                />
                {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100 focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Enter category description"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                <div className="grid grid-cols-3 gap-2">
                  {iconOptions.map((option) => (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon: option.name })}
                      className={`p-3 border rounded-lg flex items-center justify-center transition-colors ${
                        formData.icon === option.name
                          ? "border-gray-900 dark:border-gray-100 bg-gray-100 dark:bg-gray-700"
                          : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      <option.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? "border-gray-900 dark:border-gray-100 scale-110"
                          : "border-gray-300 dark:border-gray-600 hover:scale-105"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
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
                onClick={handleAdd}
                disabled={loading}
                className="bg-gray-800 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-900 dark:hover:bg-gray-200 transition-all duration-200 active:scale-[0.98] flex-1 py-3 px-4 rounded-xl font-semibold text-sm disabled:opacity-50 shadow-md"
              >
                {loading ? "Adding..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
