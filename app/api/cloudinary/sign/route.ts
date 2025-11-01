import { NextRequest, NextResponse } from "next/server"
import { env } from "@/lib/env"
import { getCurrentUserFromRequest, getCurrentUserFromStackAuth } from "@/lib/auth-server"
import crypto from "crypto"

function generateSignature(params: Record<string, string | number>) {
  const filtered: Record<string, string | number> = {}
  // Cloudinary requires params sorted alphabetically and joined as key=value&...
  Object.keys(params)
    .sort()
    .forEach((key) => {
      const value = params[key]
      if (value !== undefined && value !== null && value !== "") {
        filtered[key] = value
      }
    })
  const toSign = Object.entries(filtered)
    .map(([k, v]) => `${k}=${v}`)
    .join("&")
  return crypto.createHash("sha1").update(`${toSign}${env.CLOUDINARY_API_SECRET}`).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate (provider role required)
    let user = await getCurrentUserFromRequest(request)
    if (!user) user = await getCurrentUserFromStackAuth()
    if (!user || user.role !== "provider") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { folder = "varsity-nest/accommodations" } = await request.json().catch(() => ({}))
    const timestamp = Math.floor(Date.now() / 1000)

    // Minimal set of signed params; add more if needed (e.g., eager transformations)
    const paramsToSign: Record<string, string | number> = {
      folder,
      timestamp,
    }

    const signature = generateSignature(paramsToSign)

    return NextResponse.json({
      cloudName: env.CLOUDINARY_CLOUD_NAME,
      apiKey: env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to sign upload" }, { status: 500 })
  }
}


