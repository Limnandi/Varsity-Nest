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
    // Implementation would fetch real stats from database
    return {
      totalAccommodations: 42,
      totalProviders: 15,
      totalRevenue: 12500,
      totalViews: 3842
    }
  } catch (error) {
    console.error("Failed to get dashboard stats:", error)
    return {
      totalAccommodations: 0,
      totalProviders: 0,
      totalRevenue: 0,
      totalViews: 0
    }
  }
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