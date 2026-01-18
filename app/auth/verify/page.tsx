"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Loader2, ArrowRight, Home } from "lucide-react"
import Link from "next/link"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const verifyEmail = async () => {
      const code = searchParams?.get('code')
      const token = searchParams?.get('token')
      const userId = searchParams?.get('userId')
      const redirectTo = searchParams?.get('redirect_to')

      if (!code) {
        setStatus('error')
        setMessage('Invalid verification link. Please try again.')
        return
      }

      try {
        const response = await fetch('/api/auth/verify-email-native', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, token, userId })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          setStatus('success')
          setMessage('Email verified successfully!')
          
          // Redirect to email-verified page after a short delay
          setTimeout(() => {
            const redirectUrl = redirectTo 
              ? `/auth/email-verified?redirect_to=${encodeURIComponent(redirectTo)}`
              : '/auth/email-verified'
            router.push(redirectUrl)
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed. Please try again.')
        }
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('Verification failed. Please try again.')
      }
    }

    verifyEmail()
  }, [searchParams, router])

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-400" />
      case 'error':
        return <XCircle className="w-16 h-16 text-red-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)]'
      case 'success':
        return 'border-green-500/50 bg-green-500/10 shadow-[0_0_20px_theme(colors.green.500/40%)]'
      case 'error':
        return 'border-red-500/50 bg-red-500/10 shadow-[0_0_20px_theme(colors.red.500/40%)]'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4">
      <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/20 p-8 text-white w-full max-w-md">
        {/* Home Button */}
        <Link 
          href="/" 
          className="absolute top-4 left-4 group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-110 hover:shadow-blue-500/20"
        >
          <Home className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
        </Link>

        <div className="text-center">
          <div className={`mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
            {status === 'loading' && 'Verifying Email...'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h1>
          
          <p className="text-neutral-300 text-lg mb-8">
            {message}
          </p>

          {status === 'success' && (
            <div className="flex items-center justify-center space-x-2 text-green-300 text-sm mb-6">
              <CheckCircle className="w-4 h-4" />
              <span>Redirecting to dashboard...</span>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <Link href="/auth/check-email">
                <button className="group relative w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                  <span className="relative z-10 flex items-center">
                    Try Again
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </span>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>
              </Link>
              
              <Link href="/auth/login">
                <button className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 px-6 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                  <span className="relative z-10">Back to Sign In</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
