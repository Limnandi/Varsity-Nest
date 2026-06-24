"use client"

import dynamic from "next/dynamic"

const CookieBanner = dynamic(() => import("@/components/CookieBanner"), { ssr: false })
const ConsoleSecurityWarning = dynamic(() => import("@/components/ConsoleSecurityWarning"), { ssr: false })
const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((mod) => mod.Analytics),
  { ssr: false },
)
const SpeedInsights = dynamic(
  () => import("@vercel/speed-insights/next").then((mod) => mod.SpeedInsights),
  { ssr: false },
)

export default function PublicDeferredWidgets() {
  return (
    <>
      <ConsoleSecurityWarning />
      <CookieBanner />
      <Analytics />
      <SpeedInsights />
    </>
  )
}
