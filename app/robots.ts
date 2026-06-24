import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site-metadata"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/agent/",
          "/provider/",
          "/student/",
          "/api/",
          "/auth/",
          "/handler/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}

