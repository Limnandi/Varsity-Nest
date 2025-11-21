import { revalidateTag } from "next/cache"
import { FEATURED_ACCOMMODATIONS_CACHE_TAG } from "@/lib/repos/accommodations"
import { OptimizedAccommodationRepository } from "@/lib/database-optimized"

export async function invalidateAccommodationsCache() {
  await OptimizedAccommodationRepository.invalidateCache()

  try {
    await revalidateTag(FEATURED_ACCOMMODATIONS_CACHE_TAG)
  } catch (error) {
    console.warn("Failed to revalidate featured accommodations tag:", error)
  }
}


