import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount)
}

// Deterministic ZAR formatter (avoids SSR/CSR locale differences)
export function formatZar(amount: number, withCents: boolean = false): string {
  const formatted = new Intl.NumberFormat("en-US", {
    useGrouping: true,
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  }).format(amount)
  return `R${formatted}`
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj)
}

export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return new Intl.DateTimeFormat("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + "..."
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^(\+27|0)[0-9]{9}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  if (cleaned.startsWith("27")) {
    return `+${cleaned}`
  }
  if (cleaned.startsWith("0")) {
    return `+27${cleaned.substring(1)}`
  }
  return phone
}

export function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const timeDifference = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDifference / (1000 * 3600 * 24))
}

export function isDateInRange(date: Date, startDate: Date, endDate: Date): boolean {
  return date >= startDate && date <= endDate
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2)
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export function removeHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "")
}

export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export function getRandomColor(): string {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "active":
    case "confirmed":
    case "paid":
    case "completed":
      return "text-green-600 bg-green-100"
    case "pending":
    case "processing":
      return "text-yellow-600 bg-yellow-100"
    case "inactive":
    case "cancelled":
    case "failed":
      return "text-red-600 bg-red-100"
    case "draft":
    case "unpaid":
      return "text-gray-600 bg-gray-100"
    default:
      return "text-gray-600 bg-gray-100"
  }
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const params: Record<string, string | string[]> = {}

  for (const [key, value] of Array.from(searchParams.entries())) {
    if (params[key]) {
      if (Array.isArray(params[key])) {
        ;(params[key] as string[]).push(value)
      } else {
        params[key] = [params[key] as string, value]
      }
    } else {
      params[key] = value
    }
  }

  return params
}

export function buildSearchParams(params: Record<string, string | string[] | undefined>): string {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v))
      } else {
        searchParams.set(key, value)
      }
    }
  })

  return searchParams.toString()
}
