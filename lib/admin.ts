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
    await query(
      `UPDATE providers SET 
        is_verified = true,
        is_active = true
      WHERE id = $1`,
      [providerId]
    )
    return { success: true }
  } catch (error) {
    console.error("Failed to approve provider:", error)
    return { success: false, error: "Failed to approve provider" }
  }
}

export async function rejectProvider(providerId: string) {
  try {
    await query(
      `UPDATE providers SET 
        is_active = false,
        rejection_reason = 'Manual rejection by admin'
      WHERE id = $1`,
      [providerId]
    )
    return { success: true }
  } catch (error) {
    console.error("Failed to reject provider:", error)
    return { success: false, error: "Failed to reject provider" }
  }
}

export async function viewProviderDocuments(providerId: string) {
  try {
    const result = await query(
      `SELECT documents FROM providers WHERE id = $1`,
      [providerId]
    )
    return result.rows[0]?.documents || []
  } catch (error) {
    console.error("Failed to fetch provider documents:", error)
    return []
  }
}

export async function getDashboardStats() {
  try {
    const [currentStats, previousStats] = await Promise.all([
      query(`SELECT
        COUNT(*) as totalAccommodations,
        COUNT(DISTINCT provider_id) as totalProviders,
        SUM(price) as totalRevenue,
        SUM(view_count) as totalViews
      FROM accommodations`),
      query(`SELECT
        COUNT(*) as totalAccommodations,
        COUNT(DISTINCT provider_id) as totalProviders,
        SUM(price) as totalRevenue,
        SUM(view_count) as totalViews
      FROM accommodations
      WHERE created_at >= NOW() - INTERVAL '30 days'`)
    ])

    const current = currentStats.rows[0]
    const previous = previousStats.rows[0]

    return {
      totalAccommodations: current.totalAccommodations,
      totalProviders: current.totalProviders,
      totalRevenue: current.totalRevenue,
      totalViews: current.totalViews,
      accommodationsChange: calculateChange(current.totalAccommodations, previous.totalAccommodations),
      providersChange: calculateChange(current.totalProviders, previous.totalProviders),
      revenueChange: calculateChange(current.totalRevenue, previous.totalRevenue),
      viewsChange: calculateChange(current.totalViews, previous.totalViews)
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
    const result = await query(
      `SELECT id, activity_type as type, message, created_at as time
       FROM admin_activities
       ORDER BY created_at DESC
       LIMIT 5`
    )
    return (result.rows as Activity[]).map(row => ({
      ...row,
      time: formatTimeAgo(row.time)
    }))
  } catch (error) {
    console.error("Failed to get recent activity:", error)
    return []
  }
}

export async function getPendingApprovals() {
  try {
    const result = await query(
      `SELECT
        p.id,
        CASE
          WHEN p.registration_status = 'pending' THEN 'provider'
          WHEN a.verification_status = 'pending' THEN 'accommodation'
        END as type,
        COALESCE(a.title, p.business_name) as title,
        COALESCE(p.business_name, 'New Registration') as provider,
        'pending' as status
       FROM providers p
       LEFT JOIN accommodations a ON a.provider_id = p.id
       WHERE p.registration_status = 'pending' OR a.verification_status = 'pending'`
    )
    return result.rows
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