import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Get top performing accommodations by revenue
    const topAccommodations = await query`
      SELECT 
        a.id,
        a.name,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(p.id) as booking_count
      FROM accommodations a
      LEFT JOIN bookings b ON a.id = b.accommodation_id
      LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
      WHERE a.is_active = true
      GROUP BY a.id, a.name
      HAVING COALESCE(SUM(p.amount), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 5
    `

    // Get top performing providers by revenue
    const topProviders = await query`
      SELECT 
        pr.id,
        CONCAT(pr.contact_person, ' (', pr.business_name, ')') as name,
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COUNT(DISTINCT a.id) as accommodation_count
      FROM providers pr
      LEFT JOIN accommodations a ON pr.id = a.provider_id
      LEFT JOIN bookings b ON a.id = b.accommodation_id
      LEFT JOIN payments p ON b.id = p.booking_id AND p.status = 'completed'
      WHERE pr.is_active = true
      GROUP BY pr.id, pr.contact_person, pr.business_name
      HAVING COALESCE(SUM(p.amount), 0) > 0
      ORDER BY total_revenue DESC
      LIMIT 5
    `

    const performers = []

    // Add top accommodations
    topAccommodations.rows.forEach((row, index) => {
      performers.push({
        id: `accommodation-${row.id}`,
        name: row.name,
        value: Number(row.total_revenue) || 0,
        change: Math.floor(Math.random() * 20) + 5, // Simulated growth
        type: "accommodation" as const,
      })
    })

    // Add top providers
    topProviders.rows.forEach((row, index) => {
      performers.push({
        id: `provider-${row.id}`,
        name: row.name,
        value: Number(row.total_revenue) || 0,
        change: Math.floor(Math.random() * 15) + 3, // Simulated growth
        type: "provider" as const,
      })
    })

    // Sort by value and take top 5
    performers.sort((a, b) => b.value - a.value)
    const topPerformers = performers.slice(0, 5)

    return NextResponse.json({ performers: topPerformers })
  } catch (error) {
    console.error("Top performers error:", error)
    return NextResponse.json(
      { error: "Failed to fetch top performers data" },
      { status: 500 }
    )
  }
}
