import { NextResponse } from "next/server"
import { approveProvider, rejectProvider, viewProviderDocuments, getDashboardStats, getTopAccommodations } from "@/lib/admin"

export async function GET() {
  try {
    const [stats, accommodations] = await Promise.all([
      getDashboardStats(),
      getTopAccommodations()
    ])
    return NextResponse.json({ stats, accommodations })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const { action, providerId } = await request.json()

  try {
    let result
    if (action === 'approve') {
      result = await approveProvider(providerId)
    } else if (action === 'reject') {
      result = await rejectProvider(providerId)
    } else if (action === 'view-documents') {
      const documents = await viewProviderDocuments(providerId)
      return NextResponse.json({ documents })
    } else {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Action failed" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process provider action" },
      { status: 500 }
    )
  }
}