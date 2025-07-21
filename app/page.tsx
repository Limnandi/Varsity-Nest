import AccommodationCard from "@/components/AccommodationCard"
import HeroSection from "@/components/HeroSection"
import TestimonialsSection from "@/components/TestimonialsSection"
import StatsSection from "@/components/StatsSection"
import { accommodations } from "@/lib/data"
import Link from "next/link"

export default function Home() {
  const featuredAccommodations = accommodations.filter((acc) => acc.featured)

  return (
    <>
      <HeroSection />

      <StatsSection />

      {/* Featured Accommodations */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Featured Accommodations</h2>
            <p className="text-xl text-white drop-shadow-lg mb-8">
              Hand-picked premium properties for discerning students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {featuredAccommodations.map((accommodation) => (
              <AccommodationCard key={accommodation.id} {...accommodation} />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/accommodations/accredited"
              className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
            >
              View All Accommodations
            </Link>
          </div>
        </div>
      </div>

      <TestimonialsSection />
    </>
  )
}
