"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const COOKIE_NAME = "varsitynest:cookies_consent"
const COOKIE_MAX_AGE_DAYS = 365

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

export default function CookieBanner() {
  const [accepted, setAccepted] = useState<boolean | null>(null)

  useEffect(() => {
    const value = getCookie(COOKIE_NAME)
    setAccepted(value === "accepted")
  }, [])

  if (accepted) return null

  // If still loading (null), don't flash; but show banner when loaded and not accepted
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie usage notification"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-3xl w-full px-4"
    >
      <div className="bg-black/80 border border-white/10 text-white rounded-2xl p-4 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-sm text-neutral-200 leading-relaxed">
            We use cookies to improve your experience, analyze site usage, and provide personalized features. By continuing to use Varsity Nest you agree to our cookie policy.
            <div className="mt-2 sm:mt-0 sm:inline-block sm:ml-2">
              <Link href="/cookies" className="text-blue-400 hover:text-blue-300 underline">
                Learn more
              </Link>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center space-x-2">
            <button
              onClick={() => {
                setCookie(COOKIE_NAME, "accepted", COOKIE_MAX_AGE_DAYS)
                setAccepted(true)
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-500 to-blue-500 text-white font-medium hover:opacity-95 transition"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
