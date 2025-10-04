import { NextRequest, NextResponse } from "next/server"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { query } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }
    
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: "Access denied. Provider role required." },
        { status: 403 }
      )
    }

    // Fetch provider settings
    const settingsResult = await query`
      SELECT settings
      FROM providers
      WHERE user_id = ${user.id}
      LIMIT 1
    `

    if (settingsResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Provider profile not found" },
        { status: 404 }
      )
    }

    const providerSettings = settingsResult.rows[0].settings || {}

    // Return default settings merged with saved settings
    const defaultSettings = {
      autoApproveBookings: false,
      allowInstantBooking: true,
      requireDeposit: true,
      depositPercentage: 20,
      emailNotifications: true,
      smsNotifications: false,
      bookingAlerts: true,
      paymentAlerts: true,
      maintenanceAlerts: true,
      showContactInfo: true,
      allowDirectContact: true,
      showAvailability: true,
      autoRenewal: true,
      billingReminders: true,
      invoiceEmail: user.email,
      twoFactorAuth: false,
      sessionTimeout: 30,
      loginAlerts: true
    }

    const settings = { ...defaultSettings, ...providerSettings }

    return NextResponse.json({ settings })

  } catch (error) {
    console.error("Provider settings fetch error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Try secure JWT session first
    let user = await getCurrentUserFromRequest(request)
    
    // Fallback to StackAuth if no JWT session
    if (!user) {
      user = await getCurrentUserFromStackAuth()
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }
    
    if (!user.isActive) {
      return NextResponse.json(
        { error: "Account deactivated" },
        { status: 403 }
      )
    }
    
    if (user.role !== 'provider') {
      return NextResponse.json(
        { error: "Access denied. Provider role required." },
        { status: 403 }
      )
    }

    const { settings } = await request.json()

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      )
    }

    // Validate settings
    const validSettings = {
      autoApproveBookings: Boolean(settings.autoApproveBookings),
      allowInstantBooking: Boolean(settings.allowInstantBooking),
      requireDeposit: Boolean(settings.requireDeposit),
      depositPercentage: Math.max(0, Math.min(100, Number(settings.depositPercentage) || 20)),
      emailNotifications: Boolean(settings.emailNotifications),
      smsNotifications: Boolean(settings.smsNotifications),
      bookingAlerts: Boolean(settings.bookingAlerts),
      paymentAlerts: Boolean(settings.paymentAlerts),
      maintenanceAlerts: Boolean(settings.maintenanceAlerts),
      showContactInfo: Boolean(settings.showContactInfo),
      allowDirectContact: Boolean(settings.allowDirectContact),
      showAvailability: Boolean(settings.showAvailability),
      autoRenewal: Boolean(settings.autoRenewal),
      billingReminders: Boolean(settings.billingReminders),
      invoiceEmail: String(settings.invoiceEmail || user.email),
      twoFactorAuth: Boolean(settings.twoFactorAuth),
      sessionTimeout: Math.max(5, Math.min(480, Number(settings.sessionTimeout) || 30)),
      loginAlerts: Boolean(settings.loginAlerts)
    }

    // Update provider settings
    await query`
      UPDATE providers
      SET settings = ${JSON.stringify(validSettings)}, updated_at = NOW()
      WHERE user_id = ${user.id}
    `

    return NextResponse.json({ 
      success: true, 
      message: "Settings updated successfully",
      settings: validSettings
    })

  } catch (error) {
    console.error("Provider settings update error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update settings" },
      { status: 500 }
    )
  }
}
