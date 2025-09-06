// Throw error if used in client-side code
if (typeof window !== 'undefined') {
  throw new Error(
    'Admin operations cannot be performed in client-side code. ' +
    'This module should only be imported in server components, API routes, or server actions.'
  )
}

import { query } from "./database"

export async function approveProvider(providerId: string) {
  try {
    await query`UPDATE providers SET is_verified = true, is_active = true WHERE id = ${providerId}`
    return { success: true }
  } catch (error) {
    console.error("Failed to approve provider:", error)
    return { success: false, error: "Failed to approve provider" }
  }
}

export async function rejectProvider(providerId: string) {
  try {
    await query`UPDATE providers SET is_active = false, rejection_reason = 'Manual rejection by admin' WHERE id = ${providerId}`
    return { success: true }
  } catch (error) {
    console.error("Failed to reject provider:", error)
    return { success: false, error: "Failed to reject provider" }
  }
}

export async function viewProviderDocuments(providerId: string) {
  try {
    const res = await query`SELECT documents FROM providers WHERE id = ${providerId} LIMIT 1`
    return res.rows?.[0]?.documents || []
  } catch (error) {
    console.error("Failed to fetch provider documents:", error)
    return []
  }
}

export async function getPendingProviders() {
  try {
    const allProviders = await getAllProviders()
    return allProviders.filter((provider: any) => 
      (provider.status === 'pending' && provider.isActive === false) ||
      (provider.status === 'pending' && provider.isVerified === false) ||
      provider.status === 'rejected'
    )
  } catch (error) {
    console.error("Failed to fetch pending providers:", error)
    return []
  }
}

export async function getAllProviders() {
  try {
    const res = await query`
      SELECT p.id, p.business_name, p.contact_person, p.contact_email, p.contact_phone, 
             p.address, p.registration_status, p.created_at, p.is_active, p.is_verified, p.documents,
             u.first_name, u.last_name, u.email
      FROM providers p
      JOIN users u ON p.user_id = u.id
      WHERE u.role = 'provider'
      ORDER BY p.created_at DESC
    `
    return res.rows.map((row: any) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      email: row.contact_email,
      companyName: row.business_name,
      submittedAt: row.created_at,
      status: row.registration_status || 'pending',
      phone: row.contact_phone,
      address: row.address,
      isActive: row.is_active,
      isVerified: row.is_verified,
      documents: row.documents || []
    }))
  } catch (error) {
    console.error("Failed to fetch all providers:", error)
    return []
  }
}

export async function getCurrentProviders() {
  try {
    const allProviders = await getAllProviders()
    return allProviders.filter((provider: any) => 
      provider.status === 'approved' || 
      (provider.status === 'pending' && provider.isActive === true) ||
      (provider.status === 'pending' && provider.isVerified === true)
    )
  } catch (error) {
    console.error("Failed to fetch current providers:", error)
    return []
  }
}

export async function deleteProvider(providerId: string) {
  try {
    // First get the user_id to delete the user as well
    const providerRes = await query`SELECT user_id FROM providers WHERE id = ${providerId}`
    if (providerRes.rows.length === 0) {
      return { success: false, error: "Provider not found" }
    }
    
    const userId = providerRes.rows[0].user_id
    
    // Delete provider and user (cascade should handle this, but being explicit)
    await query`DELETE FROM providers WHERE id = ${providerId}`
    await query`DELETE FROM users WHERE id = ${userId}`
    
    return { success: true }
  } catch (error) {
    console.error("Failed to delete provider:", error)
    return { success: false, error: "Failed to delete provider" }
  }
}

export async function getDashboardStats() {
  try {
    const [totalAccommodations, totalProviders, totalRevenue, totalViews, totalAccommodations30, totalProviders30, totalRevenue30, totalViews30] = await Promise.all([
      (async () => Number.parseInt((await query`SELECT COUNT(*) AS c FROM accommodations`).rows[0].c))(),
      (async () => Number.parseInt((await query`SELECT COUNT(DISTINCT provider_id) AS c FROM accommodations WHERE provider_id IS NOT NULL`).rows[0].c))(),
      Promise.resolve(0),
      (async () => Number.parseInt((await query`SELECT COALESCE(SUM(view_count), 0) AS c FROM accommodations`).rows[0].c))(),
      (async () => Number.parseInt((await query`SELECT COUNT(*) AS c FROM accommodations WHERE created_at >= ${new Date(Date.now() - 30*24*60*60*1000).toISOString()}`).rows[0].c))(),
      (async () => Number.parseInt((await query`SELECT COUNT(DISTINCT provider_id) AS c FROM accommodations WHERE provider_id IS NOT NULL AND created_at >= ${new Date(Date.now() - 30*24*60*60*1000).toISOString()}`).rows[0].c))(),
      Promise.resolve(0),
      (async () => Number.parseInt((await query`SELECT COALESCE(SUM(view_count), 0) AS c FROM accommodations WHERE created_at >= ${new Date(Date.now() - 30*24*60*60*1000).toISOString()}`).rows[0].c))()
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
    const res = await query`SELECT id, activity_type, message, created_at FROM admin_activities ORDER BY created_at DESC LIMIT 5`
    return res.rows.map((row: any) => ({ id: row.id, type: row.activity_type, message: row.message, time: formatTimeAgo(row.created_at) }))
  } catch (error) {
    console.error("Failed to get recent activity:", error)
    return []
  }
}

export async function getPendingApprovals() {
  try {
    const res = await query`SELECT id, business_name, registration_status FROM providers WHERE registration_status = 'pending' LIMIT 100`
    return res.rows.map((r: any) => ({ id: r.id, type: 'provider', title: r.business_name, provider: r.business_name, status: 'pending' as const }))
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