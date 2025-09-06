import { NextRequest, NextResponse } from "next/server"
import { approveProvider, rejectProvider, viewProviderDocuments, getDashboardStats, getTopAccommodations, getPendingProviders, getCurrentProviders, deleteProvider } from "@/lib/admin"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'pending') {
      const providers = await getPendingProviders()
      return NextResponse.json({ providers })
    } else if (type === 'current') {
      const providers = await getCurrentProviders()
      return NextResponse.json({ providers })
    } else {
      // Default: return dashboard stats
      const [stats, accommodations] = await Promise.all([
        getDashboardStats(),
        getTopAccommodations()
      ])
      return NextResponse.json({ stats, accommodations })
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch data" },
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
    } else if (action === 'delete') {
      result = await deleteProvider(providerId)
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