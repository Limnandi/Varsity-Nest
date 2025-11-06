/**
 * PayFast Status API Endpoint
 * 
 * Provides PayFast system status information for monitoring and user communication
 * Documentation: https://developers.payfast.co.za/documentation/#status-api
 */

import { NextRequest, NextResponse } from "next/server"
import { PayFastAPIClient } from "@/lib/payfast-api-client"
import { captureException } from "@/lib/logging/config"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "summary" // summary, status, components

    let result: any

    switch (type) {
      case "summary":
        result = await PayFastAPIClient.getStatusSummary()
        break
      case "status":
        result = await PayFastAPIClient.getStatus()
        break
      case "components":
        result = await PayFastAPIClient.getComponentStatuses()
        break
      default:
        return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    captureException(
      error instanceof Error ? error : new Error(String(error)),
      { component: 'payfast-status-api' }
    )
    
    return NextResponse.json(
      { error: 'Failed to get PayFast status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

