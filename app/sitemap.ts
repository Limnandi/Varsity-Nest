import type { MetadataRoute } from "next"

const BASE_URL = "https://varsitynest.space"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Keep this list tight and high-signal; adding lots of low-value URLs can hurt crawl quality.
  const routes = [
    "/",
    "/accommodations",
    "/contact",
    "/privacy",
    "/terms",
    "/cookies",
    "/disclaimer",
  ]

  return routes.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: now,
    changeFrequency: route === "/" ? "weekly" : "monthly",
    priority: route === "/" ? 1 : 0.6,
  }))
}

