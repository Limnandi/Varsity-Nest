"use server"

import { query } from "../../lib/database"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getSession } from "@/lib/session"

const SETTINGS_KEY = "platform_settings"

const SettingsSchema = z.object({
  production_mode: z.boolean(),
  registration_enabled: z.boolean(),
  reviews_enabled: z.boolean(),
})

export type PlatformSettings = z.infer<typeof SettingsSchema>

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const data = await query`
      SELECT value FROM admin_settings WHERE key = ${SETTINGS_KEY}
    `
    if (data.length === 0) {
      throw new Error("Platform settings not found. Please run the seed script.")
    }
    const settings = SettingsSchema.parse(data[0].value)
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

    await query`
      UPDATE admin_settings
      SET value = ${JSON.stringify(newSettings)}::jsonb
      WHERE key = ${SETTINGS_KEY}
    `
    revalidatePath("/admin/dashboard")
    return { success: true, message: `Production mode set to ${isProduction ? "ON" : "OFF"}.` }
  } catch (error) {
    console.error("Failed to update production mode:", error)
    return { success: false, message: "Failed to update settings." }
  }
}
