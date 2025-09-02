"use server"

import { query } from "@/lib/database"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getSession } from "@/lib/stackauth"

const SETTINGS_KEY = "platform_settings"

const SettingsSchema = z.object({
  production_mode: z.boolean(),
  registration_enabled: z.boolean(),
  reviews_enabled: z.boolean(),
})

export type PlatformSettings = z.infer<typeof SettingsSchema>

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const res = await query`SELECT maintenance_mode, registration_enabled, payments_enabled FROM admin_settings WHERE id = 1`
    const row = res.rows?.[0]
    if (!row) {
      throw new Error("admin_settings not found. Please run the migration/seed script.")
    }
    const settings = SettingsSchema.parse({
      production_mode: !Boolean(row.maintenance_mode),
      registration_enabled: Boolean(row.registration_enabled),
      reviews_enabled: false,
    })
    return settings
  } catch (error) {
    console.error("Failed to fetch platform settings:", error)
    return {
      production_mode: true,
      registration_enabled: false,
      reviews_enabled: false,
    }
  }
}

export async function updateProductionMode(isProduction: boolean) {
  const session = await getSession()
  if (session?.role !== "admin") {
    return { success: false, message: "Unauthorized" }
  }

  try {
    const currentSettings = await getPlatformSettings()
    const newSettings = { ...currentSettings, production_mode: isProduction }

    await query`UPDATE admin_settings SET maintenance_mode = ${!isProduction} WHERE id = 1`
    revalidatePath("/admin/dashboard")
    return { success: true, message: `Production mode set to ${isProduction ? "ON" : "OFF"}.` }
  } catch (error) {
    console.error("Failed to update production mode:", error)
    return { success: false, message: "Failed to update settings." }
  }
}
