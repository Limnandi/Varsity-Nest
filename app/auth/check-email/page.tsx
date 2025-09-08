"use client"

import { useState, useEffect } from "react"
import { useStackApp, useUser } from "@stackframe/stack"
import { Mail, RefreshCw, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CheckEmailPage() {
  const app = useStackApp()
  const user = useUser()
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendError, setResendError] = useState<string | null>(null)

  // Check if user is already verified
  useEffect(() => {
    if (user?.primaryEmailVerified) {
      // Redirect to appropriate dashboard based on role
      // Note: We'll get the role from our database via the redirect page
      const redirectUrl = "/auth/redirect"
      window.location.href = redirectUrl
    }
  }, [user])

  const handleResendVerification = async () => {
    if (!user) return

    setIsResending(true)
    setResendError(null)
    setResendSuccess(false)

    try {
      // Get user's contact channels
      const contactChannels = await user.listContactChannels()
      const emailChannel = contactChannels.find(
        channel => channel.type === 'email' && channel.value === user.primaryEmail
      )

      if (emailChannel) {
        await emailChannel.sendVerificationEmail()
        setResendSuccess(true)
      } else {
        setResendError("Email channel not found. Please contact support.")
      }
    } catch (error: any) {
      console.error("Failed to resend verification email:", error)
      setResendError(error.message || "Failed to resend verification email. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Access Required</CardTitle>
            <CardDescription>Please sign in to access this page.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/login">
              <Button className="w-full">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-purple-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Check Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to <strong>{user.primaryEmail}</strong>
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center text-sm text-gray-600">
            <p>Click the link in your email to verify your account and complete your registration.</p>
            <p className="mt-2">The link will expire in 24 hours.</p>
          </div>

          {resendSuccess && (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700 text-sm">Verification email sent successfully!</span>
            </div>
          )}

          {resendError && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <span className="text-red-700 text-sm">{resendError}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleResendVerification}
              disabled={isResending}
              variant="outline"
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Resend Verification Email
                </>
              )}
            </Button>

            <Link href="/auth/login">
              <Button variant="ghost" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sign In
              </Button>
            </Link>
          </div>

          <div className="text-center text-xs text-gray-500">
            <p>Didn't receive the email? Check your spam folder or contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
