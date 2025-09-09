import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Get revenue data
    const revenueData = await query`
      SELECT 
        COALESCE(SUM(amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
          AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN amount ELSE 0 END), 0) as last_month
      FROM payments 
      WHERE status = 'completed'
    `

    // Get accommodations data
    const accommodationsData = await query`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN is_active = false THEN 1 END) as pending
      FROM accommodations
    `

    // Get providers data
    const providersData = await query`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as new_this_month
      FROM providers
    `

    // Get bookings data
    const bookingsData = await query`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as this_month,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
          AND created_at < DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as last_month
      FROM bookings
    `

    // Get views data (simulated - you might have a views table)
    const viewsData = await query`
      SELECT 
        COALESCE(SUM(view_count), 0) as total,
        COALESCE(SUM(CASE WHEN updated_at >= DATE_TRUNC('month', CURRENT_DATE) THEN view_count ELSE 0 END), 0) as this_month,
        COALESCE(SUM(CASE WHEN updated_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') 
          AND updated_at < DATE_TRUNC('month', CURRENT_DATE) THEN view_count ELSE 0 END), 0) as last_month
      FROM accommodations
    `

    const revenue = revenueData.rows[0] || { total_revenue: 0, this_month: 0, last_month: 0 }
    const accommodations = accommodationsData.rows[0] || { total: 0, active: 0, pending: 0 }
    const providers = providersData.rows[0] || { total: 0, active: 0, new_this_month: 0 }
    const bookings = bookingsData.rows[0] || { total: 0, this_month: 0, last_month: 0 }
    const views = viewsData.rows[0] || { total: 0, this_month: 0, last_month: 0 }

    // Calculate growth percentages
    const revenueGrowth = revenue.last_month > 0 
      ? ((revenue.this_month - revenue.last_month) / revenue.last_month) * 100 
      : 0

    const accommodationsGrowth = accommodations.total > 0 ? 5 : 0 // Simulated growth
    const providersGrowth = providers.total > 0 ? 8 : 0 // Simulated growth
    const bookingsGrowth = bookings.last_month > 0 
      ? ((bookings.this_month - bookings.last_month) / bookings.last_month) * 100 
      : 0
    const viewsGrowth = views.last_month > 0 
      ? ((views.this_month - views.last_month) / views.last_month) * 100 
      : 0

    const analyticsData = {
      revenue: {
        total: Number(revenue.total_revenue) || 0,
        thisMonth: Number(revenue.this_month) || 0,
        lastMonth: Number(revenue.last_month) || 0,
        growth: Number(revenueGrowth.toFixed(1)) || 0,
      },
      accommodations: {
        total: Number(accommodations.total) || 0,
        active: Number(accommodations.active) || 0,
        pending: Number(accommodations.pending) || 0,
        growth: Number(accommodationsGrowth) || 0,
      },
      providers: {
        total: Number(providers.total) || 0,
        active: Number(providers.active) || 0,
        newThisMonth: Number(providers.new_this_month) || 0,
        growth: Number(providersGrowth) || 0,
      },
      bookings: {
        total: Number(bookings.total) || 0,
        thisMonth: Number(bookings.this_month) || 0,
        lastMonth: Number(bookings.last_month) || 0,
        growth: Number(bookingsGrowth.toFixed(1)) || 0,
      },
      views: {
        total: Number(views.total) || 0,
        thisMonth: Number(views.this_month) || 0,
        lastMonth: Number(views.last_month) || 0,
        growth: Number(viewsGrowth.toFixed(1)) || 0,
      },
    }

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics overview error:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
}
