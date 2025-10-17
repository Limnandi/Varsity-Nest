"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import Link from "next/link"

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const verifyEmail = async () => {
      const code = searchParams.get('code')
      const userId = searchParams.get('userId')
      const token = searchParams.get('token')

      // Handle custom verification token (fallback method)
      if (token === 'stack-auth-verification' && userId) {
        try {
          // Update database to mark email as verified
          const response = await fetch('/api/auth/verify-custom-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
          })

          const data = await response.json()

          if (response.ok && data.success) {
            setStatus('success')
            setMessage('Email verified successfully! You can now sign in.')
            
            // Redirect to login page after 3 seconds
            setTimeout(() => {
              router.push('/auth/login?verified=true')
            }, 3000)
          } else {
            setStatus('error')
            setMessage(data.message || 'Failed to verify email')
          }
        } catch (error) {
          setStatus('error')
          setMessage('An error occurred while verifying your email')
        }
        return
      }

      // Handle Stack Auth verification code
      if (!code) {
        setStatus('error')
        setMessage('No verification code provided')
        return
      }

      try {
        // Call Stack Auth's verify endpoint
        const response = await fetch('/api/auth/verify-stack-code', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, userId })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
          setMessage('Email verified successfully! You can now sign in.')
          
          // Redirect to login page after 3 seconds
          setTimeout(() => {
            router.push('/auth/login?verified=true')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.message || 'Failed to verify email')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred while verifying your email')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] px-4 py-8 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-center">
          
          {status === 'loading' && (
            <>
              <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl w-fit mx-auto mb-4">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verifying Email</h1>
              <p className="text-neutral-300">Please wait while we verify your email address...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="p-4 border border-green-500/50 bg-green-500/10 rounded-xl w-fit mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Email Verified!</h1>
              <p className="text-green-300 mb-4">{message}</p>
              <p className="text-neutral-400 text-sm">Redirecting to login page...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="p-4 border border-red-500/50 bg-red-500/10 rounded-xl w-fit mx-auto mb-4">
                <XCircle className="w-12 h-12 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Verification Failed</h1>
              <p className="text-red-300 mb-6">{message}</p>
              <div className="space-y-3">
                <Link
                  href="/auth/login"
                  className="inline-block w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  Back to Login
                </Link>
                <Link
                  href="/auth/check-email"
                  className="inline-block w-full border border-white/20 text-white py-3 px-6 rounded-xl font-semibold hover:bg-white/5 transition-all duration-300"
                >
                  Resend Verification
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
