"use client"

import { Package, Smartphone, Monitor, Headphones, Gamepad2, Camera } from "lucide-react"
import type { Category } from "@/lib/supabase"

type CategoryBadgeProps = {
  category?: Category
  size?: "sm" | "md" | "lg"
  showIcon?: boolean
  className?: string
}

const iconMap = {
  Package,
  Smartphone,
  Monitor,
  Headphones,
  Gamepad2,
  Camera,
}

export function CategoryBadge({ category, size = "md", showIcon = true, className = "" }: CategoryBadgeProps) {
  if (!category) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 ${className}`}
      >
        {showIcon && <Package className="w-3 h-3" />}
        Uncategorized
      </span>
    )
  }

  const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Package

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }

  const iconSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-4 h-4",
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${category.color}20`,
        color: category.color,
        borderColor: `${category.color}40`,
        border: "1px solid",
      }}
    >
      {showIcon && <IconComponent className={iconSizes[size]} />}
      {category.name}
    </span>
  )
}
