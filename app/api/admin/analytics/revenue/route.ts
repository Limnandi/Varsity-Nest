import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    let days = 30
    switch (period) {
      case '7d':
        days = 7
        break
      case '30d':
        days = 30
        break
      case '90d':
        days = 90
        break
      case '1y':
        days = 365
        break
    }

    // Get revenue data for the specified period
    const revenueData = await query`
      SELECT 
        DATE_TRUNC('day', created_at) as date,
        COALESCE(SUM(amount), 0) as daily_revenue
      FROM payments 
      WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
        AND status = 'completed'
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date
    `

    // Generate labels for the period
    const labels: string[] = []
    const data: number[] = []
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
      
      // Find revenue for this date
      const dayRevenue = revenueData.rows.find(row => {
        const rowDate = new Date(row.date)
        return rowDate.toDateString() === date.toDateString()
      })
      
      data.push(Number(dayRevenue?.daily_revenue || 0))
    }

    const chartData = {
      labels,
      datasets: [{
        label: "Revenue (R)",
        data,
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
      }],
    }

    return NextResponse.json(chartData)
  } catch (error) {
    console.error("Revenue chart error:", error)
    return NextResponse.json(
      { error: "Failed to fetch revenue chart data" },
      { status: 500 }
    )
  }
}
