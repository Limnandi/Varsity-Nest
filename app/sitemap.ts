import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-metadata"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes = [
    { path: "/", priority: 1, changeFrequency: "weekly" as const },
    { path: "/accommodations", priority: 0.9, changeFrequency: "daily" as const },
    { path: "/accommodations/accredited", priority: 0.8, changeFrequency: "daily" as const },
    { path: "/accommodations/provisionally-accredited", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/accommodations/non-accredited", priority: 0.7, changeFrequency: "daily" as const },
    { path: "/contact", priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/disclaimer", priority: 0.3, changeFrequency: "yearly" as const },
  ]

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))
}

