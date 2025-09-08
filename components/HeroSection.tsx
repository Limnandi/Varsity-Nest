import Link from "next/link"
import { MapPin, Shield, Users } from "lucide-react"

export default function HeroSection() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-[#02042b] to-[#040945] px-4 font-sans text-white">
      <div className="max-w-6xl mx-auto text-center">
        {/* Main Hero Content */}
        <div className="mb-16">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 drop-shadow-2xl tracking-tight">
            Find Your Perfect
            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent mt-2">
              Student Home
            </span>
            <span className="block text-3xl md:text-5xl mt-4 text-blue-300 font-light">in Beautiful Bloemfontein</span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-300 drop-shadow-lg mb-12 max-w-4xl mx-auto leading-relaxed">
            Discover quality, verified off-campus accommodations in the heart of the Free State. Safe, comfortable, and
            close to UFS and CUT campuses.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
            <Link
              href="/accommodations/accredited"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-[1.02] hover:shadow-blue-500/40 active:scale-[0.98]"
            >
              <span className="relative z-10">Browse Accommodations</span>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Link>
            <Link
              href="/contact"
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-neutral-300 transition-all duration-300 ease-in-out border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 hover:text-white hover:border-white/30"
            >
              <span className="relative z-10">Get Help Finding</span>
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-green-500/50 bg-green-500/10 shadow-[0_0_20px_theme(colors.green.500/40%)] mb-6 group-hover:shadow-[0_0_30px_theme(colors.green.500/60%)] transition-all duration-300">
              <Shield className="h-8 w-8 text-green-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Verified Properties</h3>
            <p className="text-neutral-300 leading-relaxed">All accommodations are verified for safety and quality standards</p>
          </div>
          
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-6 group-hover:shadow-[0_0_30px_theme(colors.blue.500/60%)] transition-all duration-300">
              <MapPin className="h-8 w-8 text-blue-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Prime Locations</h3>
            <p className="text-neutral-300 leading-relaxed">Close to UFS and CUT campuses with easy transport access</p>
          </div>
          
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/50 bg-purple-500/10 shadow-[0_0_20px_theme(colors.purple.500/40%)] mb-6 group-hover:shadow-[0_0_30px_theme(colors.purple.500/60%)] transition-all duration-300">
              <Users className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Student Community</h3>
            <p className="text-neutral-300 leading-relaxed">Join a vibrant community of students in Bloemfontein</p>
          </div>
        </div>
      </div>
    </div>
  )
}
