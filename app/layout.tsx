import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import JsonLd from "@/components/json-ld"
import {
  buildMicrosoftMeta,
  buildOpenGraphImage,
  buildOrganizationJsonLd,
  buildSiteIcons,
  buildSiteVerification,
  buildWebSiteJsonLd,
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  FAVICON_PATH,
  absoluteUrl,
  SITE_NAME,
  SITE_URL,
} from "@/lib/site-metadata"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

const siteVerification = buildSiteVerification()
const defaultOgImage = buildOpenGraphImage()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Find & List Student Housing & Accommodation`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Real Estate",
  alternates: {
    canonical: `${SITE_URL}/`,
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: `${SITE_NAME} | Find & List Student Housing & Accommodation`,
    description: DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/`,
    siteName: SITE_NAME,
    locale: "en_ZA",
    type: "website",
    images: [defaultOgImage],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Find & List Student Housing & Accommodation`,
    description: DEFAULT_DESCRIPTION,
    images: [defaultOgImage.url],
  },
  icons: buildSiteIcons(),
  other: buildMicrosoftMeta(),
  ...(siteVerification ? { verification: siteVerification } : {}),
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040945",
}

const rootStructuredData = [buildOrganizationJsonLd(), buildWebSiteJsonLd()]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en-ZA" suppressHydrationWarning className="overflow-x-hidden w-full max-w-full">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href={absoluteUrl(FAVICON_PATH)} type="image/x-icon" sizes="48x48" />
        <link rel="shortcut icon" href={absoluteUrl(FAVICON_PATH)} type="image/x-icon" />
        <link
          rel="apple-touch-icon"
          href={absoluteUrl(DEFAULT_OG_IMAGE)}
          sizes="180x180"
          type="image/png"
        />
      </head>
      <body className={`${inter.className} overflow-x-hidden w-full max-w-full`}>
        <JsonLd data={rootStructuredData} />
        {children}
      </body>
    </html>
  )
}
