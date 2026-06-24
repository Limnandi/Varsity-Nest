import type { Metadata } from "next"

export const SITE_NAME = "Varsity Nest"
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://varsitynest.space"
export const DEFAULT_OG_IMAGE = "/images/logo.png"
export const DEFAULT_OG_IMAGE_WIDTH = 1024
export const DEFAULT_OG_IMAGE_HEIGHT = 1024
export const FAVICON_PATH = "/favicon.ico"
export const DEFAULT_DESCRIPTION =
  "Varsity Nest simplifies off-campus living, connecting students with trusted agents and providers to find the best university and college accommodations in South Africa."
export const DEFAULT_KEYWORDS = [
  "student accommodation south africa",
  "off-campus housing",
  "varsity res",
  "student flats",
  "university housing",
  "varsity nest",
  "ufs",
  "cut",
  "bloemfontein",
]

type PageMetadataOptions = {
  title: string
  description?: string
  pathname: string
  image?: string
  noIndex?: boolean
  type?: "website" | "article"
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

function imageMimeType(path: string): string | undefined {
  const lower = path.toLowerCase()
  if (lower.endsWith(".png")) return "image/png"
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg"
  if (lower.endsWith(".webp")) return "image/webp"
  if (lower.endsWith(".ico")) return "image/x-icon"
  return undefined
}

export function buildOpenGraphImage(
  imagePath: string = DEFAULT_OG_IMAGE,
  options?: { alt?: string; width?: number; height?: number },
) {
  const isDefaultLogo =
    imagePath === DEFAULT_OG_IMAGE || imagePath.endsWith(DEFAULT_OG_IMAGE)

  return {
    url: absoluteUrl(imagePath),
    ...(isDefaultLogo || options?.width
      ? { width: options?.width ?? DEFAULT_OG_IMAGE_WIDTH }
      : {}),
    ...(isDefaultLogo || options?.height
      ? { height: options?.height ?? DEFAULT_OG_IMAGE_HEIGHT }
      : {}),
    alt: options?.alt ?? SITE_NAME,
    type: imageMimeType(imagePath),
  }
}

export function buildSiteIcons(): NonNullable<Metadata["icons"]> {
  return {
    icon: [{ url: absoluteUrl(FAVICON_PATH), sizes: "48x48", type: "image/x-icon" }],
    shortcut: [{ url: absoluteUrl(FAVICON_PATH) }],
    apple: [{ url: absoluteUrl(DEFAULT_OG_IMAGE), sizes: "180x180", type: "image/png" }],
  }
}

export function buildMicrosoftMeta(): NonNullable<Metadata["other"]> {
  return {
    "msapplication-TileColor": "#040945",
    "msapplication-TileImage": absoluteUrl(DEFAULT_OG_IMAGE),
  }
}

export function buildSiteVerification(): Metadata["verification"] | undefined {
  const bingVerification = process.env.BING_SITE_VERIFICATION?.trim()
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim()

  if (!bingVerification && !googleVerification) return undefined

  return {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification
      ? {
          other: {
            "msvalidate.01": bingVerification,
          },
        }
      : {}),
  }
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  pathname,
  image = DEFAULT_OG_IMAGE,
  noIndex = false,
  type = "website",
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(pathname)
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
  const ogImage = buildOpenGraphImage(image, { alt: SITE_NAME })

  return {
    title,
    description,
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_ZA",
      type,
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage.url],
    },
  }
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_OG_IMAGE),
    description: DEFAULT_DESCRIPTION,
    areaServed: {
      "@type": "Country",
      name: "South Africa",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      url: absoluteUrl("/contact"),
      availableLanguage: ["English"],
    },
  }
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    inLanguage: "en-ZA",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: absoluteUrl(DEFAULT_OG_IMAGE),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/accommodations?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

type AccommodationJsonLdInput = {
  id: string
  name: string
  description?: string | null
  address: string
  price: string | number
  images?: string[] | null
  rating?: number | null
  reviewCount?: number | null
  providerName?: string | null
}

export function buildAccommodationListingJsonLd(listing: AccommodationJsonLdInput) {
  const listingUrl = absoluteUrl(`/listing/${listing.id}`)
  const images = (listing.images ?? [])
    .filter(Boolean)
    .map((image) => absoluteUrl(String(image)))

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Apartment",
    name: listing.name,
    description: listing.description ?? undefined,
    url: listingUrl,
    image: images.length > 0 ? images : [absoluteUrl(DEFAULT_OG_IMAGE)],
    address: {
      "@type": "PostalAddress",
      streetAddress: listing.address,
      addressCountry: "ZA",
    },
    offers: {
      "@type": "Offer",
      price: Number(listing.price) || 0,
      priceCurrency: "ZAR",
      availability: "https://schema.org/InStock",
      url: listingUrl,
    },
  }

  if (listing.providerName) {
    jsonLd.provider = {
      "@type": "Organization",
      name: listing.providerName,
    }
  }

  if (listing.rating && listing.reviewCount && listing.reviewCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: listing.rating,
      reviewCount: listing.reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return jsonLd
}

export function buildBreadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}
