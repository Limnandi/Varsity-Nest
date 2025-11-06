import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#040945] to-[#02042b] text-white border-t border-white/10 overflow-x-hidden w-full max-w-full">
      <div className="max-w-7xl mx-auto px-6 py-16 w-full overflow-x-hidden">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Logo and Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-8">
              <div className="relative">
                <Image
                  src="/images/varsity-nest-logo.png"
                  alt="Varsity Nest Logo"
                  width={100}
                  height={60}
                  className="object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-sm"></div>
              </div>
              <div>
                <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Varsity Nest</div>
                <div className="text-neutral-400">Powered by <a href="https://massiveoperations.site/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Massive Operations</a></div>
              </div>
            </div>
            <p className="text-neutral-300 mb-8 max-w-md leading-relaxed text-lg">
              Your trusted partner in finding quality, verified student accommodation in Bloemfontein. Safe,
              comfortable, and close to campus.
            </p>
            <div className="flex space-x-6">
              <a href="https://www.facebook.com/people/Massive-Operations/61573795036731/" target="_blank" rel="noopener noreferrer" className="group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                <Facebook className="w-6 h-6 text-neutral-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a href="#" className="group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                <Twitter className="w-6 h-6 text-neutral-400 group-hover:text-blue-400 transition-colors" />
              </a>
              <a href="#" className="group p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-110">
                <Instagram className="w-6 h-6 text-neutral-400 group-hover:text-pink-400 transition-colors" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link href="/accommodations" className="group flex items-center text-neutral-300 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mr-3 group-hover:bg-blue-300 transition-colors"></div>
                  Accredited Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/accommodations"
                  className="group flex items-center text-neutral-300 hover:text-white transition-all duration-300 hover:translate-x-2"
                >
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mr-3 group-hover:bg-yellow-300 transition-colors"></div>
                  Provisionally Accredited
                </Link>
              </li>
              <li>
                <Link
                  href="/accommodations"
                  className="group flex items-center text-neutral-300 hover:text-white transition-all duration-300 hover:translate-x-2"
                >
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3 group-hover:bg-gray-300 transition-colors"></div>
                  Budget Options
                </Link>
              </li>
              <li>
                <Link href="/contact" className="group flex items-center text-neutral-300 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mr-3 group-hover:bg-purple-300 transition-colors"></div>
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="group flex items-center text-neutral-300 hover:text-white transition-all duration-300 hover:translate-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3 group-hover:bg-green-300 transition-colors"></div>
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Contact Info</h3>
            <ul className="space-y-6">
              <li className="flex items-center space-x-4 group">
                <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl group-hover:bg-white/10 transition-all duration-300">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <span className="text-neutral-300 group-hover:text-white transition-colors">+27 62 407 9139</span>
              </li>
              <li className="flex items-center space-x-4 group">
                <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl group-hover:bg-white/10 transition-all duration-300">
                  <Mail className="w-5 h-5 text-purple-400" />
                </div>
                <a
                  href="mailto:support@varsitynest.space"
                  className="text-neutral-300 hover:text-white transition-colors"
                >
                  support@varsitynest.space
                </a>
              </li>
              <li className="flex items-start space-x-4 group">
                <div className="p-3 border border-white/20 bg-black/20 backdrop-blur-xl rounded-xl group-hover:bg-white/10 transition-all duration-300 mt-1">
                  <MapPin className="w-5 h-5 text-green-400" />
                </div>
                <span className="text-neutral-300 group-hover:text-white transition-colors">
                  Bloemfontein, 9300
                  <br />
                  South Africa
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-neutral-400 text-sm">© 2025 <a href="https://massiveoperations.site/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Massive Operations</a>. All rights reserved.</p>
          <div className="flex space-x-8 mt-4 md:mt-0">
            <Link href="/privacy" className="text-neutral-400 hover:text-white text-sm transition-colors hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-neutral-400 hover:text-white text-sm transition-colors hover:underline">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-neutral-400 hover:text-white text-sm transition-colors hover:underline">
              Cookies Policy
            </Link>
            <Link href="/disclaimer" className="text-neutral-400 hover:text-white text-sm transition-colors hover:underline">
              Disclaimer
            </Link>
            <Link href="/contact" className="text-neutral-400 hover:text-white text-sm transition-colors hover:underline">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
