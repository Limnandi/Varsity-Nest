import AccommodationCard from "@/components/AccommodationCard"
import HeroSection from "@/components/HeroSection"
import TrustedBy from "@/components/TrustedBy"
import StatsSection from "@/components/StatsSection"
import { fetchFeaturedAccommodations } from "@/lib/repos/accommodations"
import Link from "next/link"

export default async function Home() {
  const featuredAccommodations = await fetchFeaturedAccommodations(9)

  return (
    <>
      <HeroSection />

      <StatsSection />

      {/* Featured Accommodations */}
      <div className="py-20 px-4 bg-gradient-to-b from-[#040945] to-[#02042b]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">Featured Accommodations</h2>
            <p className="text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed">
              Hand-picked premium properties for discerning students in Bloemfontein
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {featuredAccommodations.map((acc) => (
              <AccommodationCard
                key={acc.id}
                id={acc.id}
                title={acc.name}
                address={acc.address}
                rating={acc.rating ?? 0}
                reviewCount={acc.review_count ?? 0}
                price={Number(acc.price) || 0}
                isOpen={acc.is_open ?? true}
                image={(acc.images && acc.images[0]) || "/placeholder.jpg"}
                amenities={acc.amenities || []}
                distance={acc.distance || ""}
                verified={acc.is_verified ?? false}
                featured={acc.featured ?? false}
                availableRooms={acc.available_rooms ?? 0}
                totalRooms={acc.total_rooms ?? 0}
              />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/accommodations/accredited"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-[0.98]"
            >
              <span className="relative z-10">View All Accommodations</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
          </div>
        </div>
      </div>

      <TrustedBy />
    </>
  )
}
