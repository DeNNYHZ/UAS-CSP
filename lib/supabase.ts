import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isSupabaseConfigured =
  supabaseUrl && supabaseAnonKey && supabaseUrl.includes("supabase.co") && supabaseAnonKey.startsWith("eyJ")

if (!isSupabaseConfigured) {
  throw new Error("Supabase is not properly configured. Please check your environment variables.")
}

export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

export type User = {
  id: string
  username: string
  email?: string
  full_name?: string
  phone?: string
  role: "user" | "admin"
  is_locked?: boolean
  failed_login_attempts?: number
  locked_until?: string
  last_login?: string
  last_activity?: string
}

export type Category = {
  id: number
  name: string
  description?: string
  color: string
  icon: string
}

export type Product = {
  id: number
  nama_produk: string
  harga_satuan: number
  quantity: number
  category_id?: number
  category?: Category
}

export type LoginHistory = {
  id: number
  user_id: string
  username: string
  ip_address?: string
  user_agent?: string
  success: boolean
  failure_reason?: string
  created_at?: string
}

export type UserActivityLog = {
  id: number
  user_id: string
  username: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: any
  ip_address?: string
  user_agent?: string
  created_at?: string
}

export type StockMovement = {
  id: number
  product_id: number
  user_id?: string
  movement_type: "IN" | "OUT" | "ADJUSTMENT"
  quantity_change: number
  quantity_before: number
  quantity_after: number
  reason?: string
  created_at?: string
  product?: Product
  user?: User
}

export const SESSION_TIMEOUT = 5 * 60 * 1000
export const MAX_LOGIN_ATTEMPTS = 3
export const LOCKOUT_DURATION = 15 * 60 * 1000

export const validateUsername = (username: string): string | null => {
  const trimmed = username.trim()
  if (!trimmed) return "Username is required"
  if (trimmed.length < 3) return "Username must be at least 3 characters"
  if (trimmed.length > 50) return "Username must be less than 50 characters"
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) return "Username can only contain letters, numbers, and underscores"
  return null
}

export const validatePassword = (password: string): string | null => {
  if (!password) return "Password is required"
  if (password.length < 6) return "Password must be at least 6 characters"
  if (password.length > 255) return "Password is too long"
  return null
}

export const validateEmail = (email: string): string | null => {
  const trimmed = email.trim()
  if (!trimmed) return "Email is required"
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmed)) return "Please enter a valid email address"
  return null
}

export const validateFullName = (name: string): string | null => {
  const trimmed = name.trim()
  if (!trimmed) return "Full name is required"
  if (trimmed.length < 2) return "Full name must be at least 2 characters"
  if (trimmed.length > 255) return "Full name is too long"
  return null
}

export const validateProductName = (name: string): string | null => {
  const trimmed = name.trim()
  if (!trimmed) return "Product name is required"
  if (trimmed.length < 3) return "Product name must be at least 3 characters"
  if (trimmed.length > 255) return "Product name is too long"
  return null
}

export const validatePrice = (price: number): string | null => {
  if (!price || price <= 0) return "Price must be greater than 0"
  if (price > 999999999) return "Price is too high"
  return null
}

export const validateQuantity = (quantity: number): string | null => {
  if (quantity < 0) return "Quantity cannot be negative"
  if (quantity > 999999) return "Quantity is too high"
  return null
}

export const validateCategoryName = (name: string): string | null => {
  const trimmed = name.trim()
  if (!trimmed) return "Category name is required"
  if (trimmed.length < 2) return "Category name must be at least 2 characters"
  if (trimmed.length > 100) return "Category name is too long"
  return null
}

const getClientInfo = () => {
  return {
    ip_address: null,
    user_agent: typeof window !== "undefined" ? window.navigator.userAgent : null,
  }
}

export const logUserActivity = async (
  userId: string,
  username: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: any,
) => {
  try {
    const clientInfo = getClientInfo()

    const { error } = await supabase.from("user_activity_log").insert([
      {
        user_id: userId,
        username,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        details,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
      },
    ])

    if (error) {
      console.error("Failed to log user activity:", error)
    }
  } catch (error) {
    console.error("Error logging user activity:", error)
  }
}

export const logLoginAttempt = async (username: string, success: boolean, userId?: string, failureReason?: string) => {
  try {
    const clientInfo = getClientInfo()

    const { error } = await supabase.from("login_history").insert([
      {
        user_id: userId,
        username,
        success,
        failure_reason: failureReason,
        ip_address: clientInfo.ip_address,
        user_agent: clientInfo.user_agent,
      },
    ])

    if (error) {
      console.error("Failed to log login attempt:", error)
    }
  } catch (error) {
    console.error("Error logging login attempt:", error)
  }
}

export const checkUserLockStatus = async (username: string) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("is_locked, locked_until, failed_login_attempts")
      .eq("username", username.trim())
      .single()

    if (error) {
      return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS }
    }

    const now = new Date()
    const lockedUntil = data.locked_until ? new Date(data.locked_until) : null

    if (data.is_locked && lockedUntil && now > lockedUntil) {
      await supabase
        .from("users")
        .update({
          is_locked: false,
          locked_until: null,
          failed_login_attempts: 0,
        })
        .eq("username", username.trim())
      return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS }
    }

    const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - (data.failed_login_attempts || 0))

    return {
      isLocked: data.is_locked || false,
      remainingAttempts,
      lockedUntil: data.locked_until,
    }
  } catch (error) {
    console.error("Error checking user lock status:", error)
    return { isLocked: false, remainingAttempts: MAX_LOGIN_ATTEMPTS }
  }
}

export const updateFailedLoginAttempts = async (username: string, increment = true) => {
  try {
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("failed_login_attempts")
      .eq("username", username.trim())
      .single()

    if (fetchError) {
      console.error("Error fetching user for login attempts:", fetchError)
      return
    }

    const currentAttempts = user.failed_login_attempts || 0
    const newAttempts = increment ? currentAttempts + 1 : 0

    const updateData: any = {
      failed_login_attempts: newAttempts,
    }

    if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.is_locked = true
      updateData.locked_until = new Date(Date.now() + LOCKOUT_DURATION).toISOString()
    }

    const { error } = await supabase.from("users").update(updateData).eq("username", username.trim())

    if (error) {
      console.error("Error updating failed login attempts:", error)
    }
  } catch (error) {
    console.error("Error in updateFailedLoginAttempts:", error)
  }
}

export const updateUserActivity = async (userId: string) => {
  try {
    const { error } = await supabase.from("users").update({ last_activity: new Date().toISOString() }).eq("id", userId)

    if (error) {
      console.error("Error updating user activity:", error)
    }
  } catch (error) {
    console.error("Error in updateUserActivity:", error)
  }
}

export const signInUser = async (username: string, password: string) => {
  try {
    const usernameError = validateUsername(username)
    if (usernameError) {
      return { success: false, error: usernameError }
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      return { success: false, error: passwordError }
    }

    const lockStatus = await checkUserLockStatus(username)
    if (lockStatus.isLocked) {
      await logLoginAttempt(username, false, undefined, "Account locked")
      return {
        success: false,
        error: "Account is temporarily locked due to multiple failed login attempts. Please try again later.",
      }
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, username, email, full_name, phone, role, is_locked, password")
      .eq("username", username.trim())
      .single()

    if (userError || !user) {
      await logLoginAttempt(username, false, undefined, "User not found")
      return { success: false, error: "User not found" }
    }

    if (user.password !== password) {
      await logLoginAttempt(username, false, user.id, "Invalid credentials")
      await updateFailedLoginAttempts(username, true)

      const updatedLockStatus = await checkUserLockStatus(username)
      if (updatedLockStatus.remainingAttempts > 0) {
        return {
          success: false,
          error: `Invalid password. ${updatedLockStatus.remainingAttempts} attempt(s) remaining before account lockout.`,
          remainingAttempts: updatedLockStatus.remainingAttempts,
        }
      } else {
        return {
          success: false,
          error: "Account has been locked due to multiple failed login attempts. Please try again in 15 minutes.",
        }
      }
    }

    if (user.is_locked) {
      await logLoginAttempt(username, false, user.id, "Account locked")
      return {
        success: false,
        error: "Account is locked. Please contact admin or try again later.",
      }
    }

    const userSession: User = {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role as "user" | "admin",
      is_locked: user.is_locked,
    }

    await updateFailedLoginAttempts(username, false)
    await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      })
      .eq("id", user.id)

    await logLoginAttempt(username, true, user.id)
    await logUserActivity(user.id, user.username, "LOGIN", "AUTH", user.id)

    return { success: true, user: userSession }
  } catch (error) {
    console.error("Sign in error:", error)
    return { success: false, error: "Authentication service unavailable" }
  }
}

export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("id, username, email, full_name, phone, role, last_login, is_locked")
      .order("id", { ascending: false })
    if (error) {
      console.error("Get users error:", error)
      return { success: false, error: "Failed to load users" }
    }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get users error:", error)
    return { success: false, error: "Failed to load users" }
  }
}

export const addUser = async (userData: {
  username: string
  password: string
  email: string
  full_name: string
  phone?: string
  role: "user" | "admin"
}) => {
  try {
    const usernameError = validateUsername(userData.username)
    if (usernameError) return { success: false, error: usernameError }

    const passwordError = validatePassword(userData.password)
    if (passwordError) return { success: false, error: passwordError }

    const emailError = validateEmail(userData.email)
    if (emailError) return { success: false, error: emailError }

    const nameError = validateFullName(userData.full_name)
    if (nameError) return { success: false, error: nameError }

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          username: userData.username.trim(),
          password: userData.password,
          email: userData.email.trim(),
          full_name: userData.full_name.trim(),
          phone: userData.phone?.trim() || null,
          role: userData.role,
        },
      ])
      .select()

    if (error) {
      console.error("Add user error:", error)
      if (error.code === "23505") {
        return { success: false, error: "Username or email already exists" }
      }
      return { success: false, error: "Failed to add user" }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Add user error:", error)
    return { success: false, error: "Failed to add user" }
  }
}

export const updateUser = async (
  userId: string,
  userData: {
    email?: string
    full_name?: string
    phone?: string
    role?: "user" | "admin"
  },
) => {
  try {
    const updateData: any = {}

    if (userData.email) {
      const emailError = validateEmail(userData.email)
      if (emailError) return { success: false, error: emailError }
      updateData.email = userData.email.trim()
    }

    if (userData.full_name) {
      const nameError = validateFullName(userData.full_name)
      if (nameError) return { success: false, error: nameError }
      updateData.full_name = userData.full_name.trim()
    }

    if (userData.phone !== undefined) {
      updateData.phone = userData.phone?.trim() || null
    }

    if (userData.role) {
      updateData.role = userData.role
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("id", userId).select()

    if (error) {
      console.error("Update user error:", error)
      return { success: false, error: "Failed to update user" }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Failed to update user" }
  }
}

export const deleteUser = async (userId: string) => {
  try {
    const { error } = await supabase.from("users").delete().eq("id", userId)

    if (error) {
      console.error("Delete user error:", error)
      return { success: false, error: "Failed to delete user" }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete user error:", error)
    return { success: false, error: "Failed to delete user" }
  }
}

export const getUserActivityLogs = async (userId?: string, limit = 50) => {
  try {
    let query = supabase.from("user_activity_log").select("*").order("created_at", { ascending: false }).limit(limit)
    if (userId) {
      query = query.eq("user_id", userId)
    }
    const { data, error } = await query
    if (error) {
      console.error("Get activity logs error:", error)
      return { success: false, error: "Failed to load activity logs" }
    }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get activity logs error:", error)
    return { success: false, error: "Failed to load activity logs" }
  }
}

export const getLoginHistory = async (userId?: string, limit = 50) => {
  try {
    let query = supabase.from("login_history").select("*").order("created_at", { ascending: false }).limit(limit)
    if (userId) {
      query = query.eq("user_id", userId)
    }
    const { data, error } = await query
    if (error) {
      console.error("Get login history error:", error)
      return { success: false, error: "Failed to load login history" }
    }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get login history error:", error)
    return { success: false, error: "Failed to load login history" }
  }
}

export const getStockMovements = async (productId?: number, limit = 100) => {
  try {
    let query = supabase
      .from("stock_movements")
      .select(`*, product:products(id, nama_produk), user:users(id, username, full_name)`)
      .order("created_at", { ascending: false })
    if (productId) {
      query = query.eq("product_id", productId)
    }
    const { data, error } = await query
    if (error) {
      console.error("Get stock movements error:", error)
      return { success: false, error: "Failed to load stock movements" }
    }
    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get stock movements error:", error)
    return { success: false, error: "Failed to load stock movements" }
  }
}

export const logStockMovement = async (
  productId: number,
  userId: string,
  movementType: "IN" | "OUT" | "ADJUSTMENT",
  quantityChange: number,
  quantityBefore: number,
  quantityAfter: number,
  reason?: string,
  notes?: string,
) => {
  try {
    const referenceNumber = `${movementType}-${productId}-${Date.now()}`

    const { error } = await supabase.from("stock_movements").insert([
      {
        product_id: productId,
        user_id: userId,
        movement_type: movementType,
        quantity_change: quantityChange,
        quantity_before: quantityBefore,
        quantity_after: quantityAfter,
        reason: reason || `Stock ${movementType.toLowerCase()}`,
        reference_number: referenceNumber,
        notes,
      },
    ])

    if (error) {
      console.error("Log stock movement error:", error)
      return { success: false, error: "Failed to log stock movement" }
    }

    return { success: true }
  } catch (error) {
    console.error("Log stock movement error:", error)
    return { success: false, error: "Failed to log stock movement" }
  }
}

export const getCategories = async () => {
  try {
    const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true })

    if (error) {
      console.error("Get categories error:", error)
      return { success: false, error: "Failed to load categories" }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get categories error:", error)
    return { success: false, error: "Failed to load categories" }
  }
}

export const addCategory = async (category: Omit<Category, "id" | "created_at" | "updated_at">) => {
  try {
    const nameError = validateCategoryName(category.name)
    if (nameError) {
      return { success: false, error: nameError }
    }

    const { data, error } = await supabase
      .from("categories")
      .insert([
        {
          name: category.name.trim(),
          description: category.description?.trim() || null,
          color: category.color,
          icon: category.icon,
        },
      ])
      .select()

    if (error) {
      console.error("Add category error:", error)
      if (error.code === "23505") {
        return { success: false, error: "Category name already exists" }
      }
      return { success: false, error: "Failed to add category" }
    }

    return { success: true, data: data[0] }
  } catch (error) {
    console.error("Add category error:", error)
    return { success: false, error: "Failed to add category" }
  }
}

export const getProducts = async () => {
  try {
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        category:categories(*)
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Get products error:", error)
      return { success: false, error: "Failed to load products" }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("Get products error:", error)
    return { success: false, error: "Failed to load products" }
  }
}

export const addProduct = async (
  product: Omit<Product, "id" | "created_at" | "updated_at" | "category">,
  userId?: string,
) => {
  try {
    const nameError = validateProductName(product.nama_produk)
    if (nameError) {
      return { success: false, error: nameError }
    }

    const priceError = validatePrice(product.harga_satuan)
    if (priceError) {
      return { success: false, error: priceError }
    }

    const quantityError = validateQuantity(product.quantity)
    if (quantityError) {
      return { success: false, error: quantityError }
    }

    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          nama_produk: product.nama_produk.trim(),
          harga_satuan: product.harga_satuan,
          quantity: product.quantity,
          category_id: product.category_id || null,
        },
      ])
      .select(`
        *,
        category:categories(*)
      `)

    if (error) {
      console.error("Add product error:", error)
      return { success: false, error: "Failed to add product" }
    }

    const newProduct = data[0]

    if (userId && newProduct.quantity > 0) {
      await logStockMovement(
        newProduct.id,
        userId,
        "IN",
        newProduct.quantity,
        0,
        newProduct.quantity,
        "Initial stock",
        `Product created with initial stock of ${newProduct.quantity} units`,
      )
    }

    return { success: true, data: newProduct }
  } catch (error) {
    console.error("Add product error:", error)
    return { success: false, error: "Failed to add product" }
  }
}

export const updateProduct = async (
  id: number,
  product: Omit<Product, "id" | "created_at" | "updated_at" | "category">,
  userId?: string,
) => {
  try {
    const { data: currentProduct } = await supabase.from("products").select("quantity").eq("id", id).single()

    const nameError = validateProductName(product.nama_produk)
    if (nameError) {
      return { success: false, error: nameError }
    }

    const priceError = validatePrice(product.harga_satuan)
    if (priceError) {
      return { success: false, error: priceError }
    }

    const quantityError = validateQuantity(product.quantity)
    if (quantityError) {
      return { success: false, error: quantityError }
    }

    const { data, error } = await supabase
      .from("products")
      .update({
        nama_produk: product.nama_produk.trim(),
        harga_satuan: product.harga_satuan,
        quantity: product.quantity,
        category_id: product.category_id || null,
      })
      .eq("id", id)
      .select(`
        *,
        category:categories(*)
      `)

    if (error) {
      console.error("Update product error:", error)
      return { success: false, error: "Failed to update product" }
    }

    const updatedProduct = data[0]

    if (userId && currentProduct && currentProduct.quantity !== updatedProduct.quantity) {
      const quantityChange = updatedProduct.quantity - currentProduct.quantity
      const movementType = quantityChange > 0 ? "IN" : quantityChange < 0 ? "OUT" : "ADJUSTMENT"

      await logStockMovement(
        updatedProduct.id,
        userId,
        movementType,
        quantityChange,
        currentProduct.quantity,
        updatedProduct.quantity,
        "Product update",
        `Stock updated from ${currentProduct.quantity} to ${updatedProduct.quantity} units`,
      )
    }

    return { success: true, data: updatedProduct }
  } catch (error) {
    console.error("Update product error:", error)
    return { success: false, error: "Failed to update product" }
  }
}

export const deleteProduct = async (id: number) => {
  try {
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (error) {
      console.error("Delete product error:", error)
      return { success: false, error: "Failed to delete product" }
    }

    return { success: true }
  } catch (error) {
    console.error("Delete product error:", error)
    return { success: false, error: "Failed to delete product" }
  }
}

export const isLowStock = (quantity: number, threshold = 10): boolean => {
  return quantity < threshold
}

export const getLowStockProducts = (products: Product[], threshold = 10): Product[] => {
  return products.filter((product) => isLowStock(product.quantity, threshold))
}

export const getSupabaseStatus = () => ({
  configured: isSupabaseConfigured,
  url: supabaseUrl,
  hasClient: !!supabase,
})

