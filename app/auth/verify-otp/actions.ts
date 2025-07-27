"use server"

import { verifyOTP } from "@/lib/otp"
import { redirect } from "next/navigation"

export async function verifyAccount(prevState: any, formData: FormData) {
  const email = formData.get("email") as string
  const otp = formData.get("otp") as string
  const userType = formData.get("userType") as "student" | "provider"

  if (!email || !otp) {
    return { success: false, error: "Email and OTP are required" }
  }

  const result = await verifyOTP(email, otp, "registration")
  if (!result.success) {
    return { success: false, error: result.error }
  }

  redirect(userType === "student" ? "/student/dashboard" : "/provider/dashboard")
}