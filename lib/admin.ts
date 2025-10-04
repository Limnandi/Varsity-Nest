// Throw error if used in client-side code
if (typeof window !== 'undefined') {
  throw new Error(
    'Admin operations cannot be performed in client-side code. ' +
    'This module should only be imported in server components, API routes, or server actions.'
  )
}

import { secureDb } from "./database-secure"
import { eq, desc, count, sum, sql } from "drizzle-orm"
import * as schema from "./schema"

export async function approveProvider(providerId: string) {
  try {
    await secureDb.db
      .update(schema.providers)
      .set({ 
        isVerified: true, 
        isActive: true,
        registrationStatus: 'approved',
        updatedAt: new Date()
      })
      .where(eq(schema.providers.id, providerId))
    
    return { success: true }
  } catch (error) {
    console.error("Failed to approve provider:", error)
    return { success: false, error: "Failed to approve provider" }
  }
}

export async function rejectProvider(providerId: string) {
  try {
    await secureDb.db
      .update(schema.providers)
      .set({ 
        isActive: false, 
        rejectionReason: 'Manual rejection by admin',
        registrationStatus: 'rejected',
        updatedAt: new Date()
      })
      .where(eq(schema.providers.id, providerId))
    
    return { success: true }
  } catch (error) {
    console.error("Failed to reject provider:", error)
    return { success: false, error: "Failed to reject provider" }
  }
}

export async function viewProviderDocuments(providerId: string) {
  try {
    const [provider] = await secureDb.db
      .select({ documents: schema.providers.documents })
      .from(schema.providers)
      .where(eq(schema.providers.id, providerId))
      .limit(1)
    
    return provider?.documents || []
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
    const providers = await secureDb.db
      .select({
        id: schema.providers.id,
        businessName: schema.providers.businessName,
        contactPerson: schema.providers.contactPerson,
        contactEmail: schema.providers.contactEmail,
        contactPhone: schema.providers.contactPhone,
        address: schema.providers.address,
        registrationStatus: schema.providers.registrationStatus,
        createdAt: schema.providers.createdAt,
        isActive: schema.providers.isActive,
        isVerified: schema.providers.isVerified,
        documents: schema.providers.documents,
        firstName: schema.users.firstName,
        lastName: schema.users.lastName,
        email: schema.users.email
      })
      .from(schema.providers)
      .innerJoin(schema.users, eq(schema.providers.userId, schema.users.id))
      .where(eq(schema.users.role, 'provider'))
      .orderBy(desc(schema.providers.createdAt))
    
    return providers.map((row: any) => ({
      id: row.id,
      name: `${row.firstName} ${row.lastName}`,
      email: row.contactEmail,
      companyName: row.businessName,
      submittedAt: row.createdAt,
      status: row.registrationStatus || 'pending',
      phone: row.contactPhone,
      address: row.address,
      isActive: row.isActive,
      isVerified: row.isVerified,
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
    // Use transaction to ensure atomicity
    return await secureDb.withTransaction(async (tx) => {
      // First get the user_id to delete the user as well
      const [provider] = await tx.db
        .select({ userId: schema.providers.userId })
        .from(schema.providers)
        .where(eq(schema.providers.id, providerId))
        .limit(1)
      
      if (!provider) {
        return { success: false, error: "Provider not found" }
      }
      
      // Delete provider and user (cascade should handle this, but being explicit)
      await tx.db.delete(schema.providers).where(eq(schema.providers.id, providerId))
      await tx.db.delete(schema.users).where(eq(schema.users.id, provider.userId))
      
      return { success: true }
    })
  } catch (error) {
    console.error("Failed to delete provider:", error)
    return { success: false, error: "Failed to delete provider" }
  }
}

export async function getDashboardStats() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const [totalStats, recentStats] = await Promise.all([
      // Total stats
      secureDb.db
        .select({
          totalAccommodations: count(schema.accommodations.id),
          totalProviders: count(schema.providers.id),
          totalViews: sum(schema.accommodations.viewCount)
        })
        .from(schema.accommodations)
        .leftJoin(schema.providers, eq(schema.accommodations.providerId, schema.providers.id)),
      
      // Recent stats (last 30 days)
      secureDb.db
        .select({
          totalAccommodations: count(schema.accommodations.id),
          totalProviders: count(schema.providers.id),
          totalViews: sum(schema.accommodations.viewCount)
        })
        .from(schema.accommodations)
        .leftJoin(schema.providers, eq(schema.accommodations.providerId, schema.providers.id))
        .where(sql`${schema.accommodations.createdAt} >= ${thirtyDaysAgo}`)
    ])

    const totalAccommodations = Number(totalStats[0]?.totalAccommodations || 0)
    const totalProviders = Number(totalStats[0]?.totalProviders || 0)
    const totalViews = Number(totalStats[0]?.totalViews || 0)
    const totalAccommodations30 = Number(recentStats[0]?.totalAccommodations || 0)
    const totalProviders30 = Number(recentStats[0]?.totalProviders || 0)
    const totalViews30 = Number(recentStats[0]?.totalViews || 0)

    return {
      totalAccommodations,
      totalProviders,
      totalRevenue: 0, // TODO: Implement revenue calculation
      totalViews,
      accommodationsChange: calculateChange(totalAccommodations, totalAccommodations30),
      providersChange: calculateChange(totalProviders, totalProviders30),
      revenueChange: 0, // TODO: Implement revenue change calculation
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

export async function getRecentActivity(): Promise<Activity[]> {
  try {
    const activities = await secureDb.db
      .select({
        id: schema.adminActivities.id,
        activityType: schema.adminActivities.activityType,
        message: schema.adminActivities.message,
        createdAt: schema.adminActivities.createdAt
      })
      .from(schema.adminActivities)
      .orderBy(desc(schema.adminActivities.createdAt))
      .limit(5)
    
    return activities.map((row: any) => ({ 
      id: row.id, 
      type: row.activityType, 
      message: row.message, 
      time: formatTimeAgo(row.createdAt.toISOString()) 
    }))
  } catch (error) {
    console.error("Failed to get recent activity:", error)
    return []
  }
}

export async function getPendingApprovals() {
  try {
    const providers = await secureDb.db
      .select({
        id: schema.providers.id,
        businessName: schema.providers.businessName,
        registrationStatus: schema.providers.registrationStatus
      })
      .from(schema.providers)
      .where(eq(schema.providers.registrationStatus, 'pending'))
      .limit(100)
    
    return providers.map((r: any) => ({ 
      id: r.id, 
      type: 'provider' as const, 
      title: r.businessName, 
      provider: r.businessName, 
      status: 'pending' as const 
    }))
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