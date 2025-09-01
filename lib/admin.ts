// Throw error if used in client-side code
if (typeof window !== 'undefined') {
  throw new Error(
    'Admin operations cannot be performed in client-side code. ' +
    'This module should only be imported in server components, API routes, or server actions.'
  )
}

import { postgrest } from "./postgrest"

export async function approveProvider(providerId: string) {
  try {
    await postgrest.put('providers', { is_verified: true, is_active: true }, { id: providerId as any })
    return { success: true }
  } catch (error) {
    console.error("Failed to approve provider:", error)
    return { success: false, error: "Failed to approve provider" }
  }
}

export async function rejectProvider(providerId: string) {
  try {
    await postgrest.put('providers', { is_active: false, rejection_reason: 'Manual rejection by admin' }, { id: providerId as any })
    return { success: true }
  } catch (error) {
    console.error("Failed to reject provider:", error)
    return { success: false, error: "Failed to reject provider" }
  }
}

export async function viewProviderDocuments(providerId: string) {
  try {
    const row = await postgrest.single<any>('providers', { id: providerId as any }, { select: 'documents' })
    return row?.documents || []
  } catch (error) {
    console.error("Failed to fetch provider documents:", error)
    return []
  }
}

export async function getDashboardStats() {
  try {
    const [totalAccommodations, totalProviders, totalViews, totalRevenue, totalAccommodations30, totalProviders30, totalViews30, totalRevenue30] = await Promise.all([
      postgrest.count('accommodations'),
      postgrest.count('accommodations', { provider_id: 'is.not.null' }),
      (async () => {
        const rows = await postgrest.get<any>('accommodations', { select: 'view_count', limit: 1000 })
        return rows.reduce((sum: number, r: any) => sum + (Number(r.view_count) || 0), 0)
      })(),
      0,
      postgrest.count('accommodations', { created_at: `gte.${new Date(Date.now() - 30*24*60*60*1000).toISOString()}` }),
      postgrest.count('accommodations', { provider_id: 'is.not.null', created_at: `gte.${new Date(Date.now() - 30*24*60*60*1000).toISOString()}` }),
      (async () => {
        const rows = await postgrest.get<any>('accommodations', { select: 'view_count', filter: { created_at: `gte.${new Date(Date.now() - 30*24*60*60*1000).toISOString()}` }, limit: 1000 })
        return rows.reduce((sum: number, r: any) => sum + (Number(r.view_count) || 0), 0)
      })(),
      0
    ])

    return {
      totalAccommodations,
      totalProviders,
      totalRevenue,
      totalViews,
      accommodationsChange: calculateChange(totalAccommodations, totalAccommodations30),
      providersChange: calculateChange(totalProviders, totalProviders30),
      revenueChange: calculateChange(totalRevenue, totalRevenue30),
      viewsChange: calculateChange(totalViews, totalViews30)
    }
  } catch (error) {
    console.error("Failed to get dashboard stats:", error)
    return {
      totalAccommodations: 0,
      totalProviders: 0,
      totalRevenue: 0,
      totalViews: 0,
      accommodationsChange: 0,
      providersChange: 0,
      revenueChange: 0,
      viewsChange: 0
    }
  }
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function getTopAccommodations() {
  try {
    // Implementation would fetch real top accommodations from database
    return []
  } catch (error) {
    console.error("Failed to get top accommodations:", error)
    return []
  }
}

interface Activity {
  id: number
  type: string
  message: string
  time: string
}

interface PendingApproval {
  id: string
  type: 'provider' | 'accommodation'
  title: string
  provider: string
  status: 'pending'
}

export async function getRecentActivity(): Promise<Activity[]> {
  try {
    const rows = await postgrest.get<Activity>('admin_activities', { select: 'id,activity_type,message,created_at', order: 'created_at.desc', limit: 5 })
    return rows.map((row: any) => ({ id: row.id, type: row.activity_type, message: row.message, time: formatTimeAgo(row.created_at) }))
  } catch (error) {
    console.error("Failed to get recent activity:", error)
    return []
  }
}

export async function getPendingApprovals() {
  try {
    // Simplified: fetch pending providers only (no join) due to PostgREST limitations without views
    const rows = await postgrest.get<any>('providers', { select: 'id,business_name,registration_status', filter: { registration_status: 'eq.pending' }, limit: 100 })
    return rows.map((r: any) => ({ id: r.id, type: 'provider', title: r.business_name, provider: r.business_name, status: 'pending' as const }))
  } catch (error) {
    console.error("Failed to get pending approvals:", error)
    return []
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  return `${Math.floor(diffInSeconds / 86400)} days ago`
}