import type { Metadata } from "next"
import { createPageMetadata } from "@/lib/site-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Browse Student Accommodations",
  description:
    "Search and compare verified student accommodation listings across South Africa. Filter by price, accreditation, amenities, and location.",
  pathname: "/accommodations",
})

export default function AccommodationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
