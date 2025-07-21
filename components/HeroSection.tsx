import Link from "next/link"
import { MapPin, Shield, Users } from "lucide-react"

export default function HeroSection() {
  return (
    <div className="relative pt-40 pb-20 px-4">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Hero Content */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Student Home
            </span>
            <span className="block text-3xl md:text-4xl mt-2 text-blue-300">in Beautiful Bloemfontein</span>
          </h1>
          <p className="text-xl md:text-2xl text-white drop-shadow-lg mb-8 max-w-4xl mx-auto">
            Discover quality, verified off-campus accommodations in the heart of the Free State. Safe, comfortable, and
            close to UFS and CUT campuses.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/accommodations/accredited"
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-lg text-lg font-semibold"
            >
              Browse Accommodations
            </Link>
            <Link
              href="/contact"
              className="bg-white bg-opacity-20 backdrop-blur-sm text-white border-2 border-white border-opacity-30 px-8 py-4 rounded-xl hover:bg-opacity-30 transition-all duration-200 text-lg font-semibold"
            >
              Get Help Finding
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-white border border-white border-opacity-20">
            <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
            <h3 className="text-xl font-semibold mb-2">Verified Properties</h3>
            <p className="text-white text-opacity-90">All accommodations are verified for safety and quality</p>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-white border border-white border-opacity-20">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">Prime Locations</h3>
            <p className="text-white text-opacity-90">Close to UFS and CUT campuses with easy transport</p>
          </div>
          <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-xl p-6 text-white border border-white border-opacity-20">
            <Users className="w-12 h-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-xl font-semibold mb-2">Student Community</h3>
            <p className="text-white text-opacity-90">Join a vibrant community of students</p>
          </div>
        </div>
      </div>
    </div>
  )
}
