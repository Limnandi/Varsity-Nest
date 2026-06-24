import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Instagram, ArrowRight } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-[#040945] to-[#02042b] text-white border-t border-white/10 overflow-x-hidden w-full max-w-full relative">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 w-full overflow-x-hidden relative z-10">
        {/* Top Section - Brand & Description */}
        <div className="mb-12 sm:mb-16">
          <div className="flex flex-col items-center text-center mb-8 sm:mb-10">
            <div className="relative mb-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="relative">
                  <Image
                    src="/images/varsity-nest-logo.png"
                    alt="Varsity Nest Logo"
                    width={120}
                    height={72}
                    className="object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg blur-xl"></div>
                </div>
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent mb-3">
              Varsity Nest
            </h2>
            <p className="text-neutral-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-4">
              Your trusted partner in finding quality, verified student accommodation in Bloemfontein. Safe, comfortable, and close to campus.
            </p>
            <p className="text-sm sm:text-base text-neutral-400">
              Powered by{" "}
              <a 
                href="https://massiveoperations.co.za/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Massive Operations
              </a>
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-10 sm:mb-12">
          {/* Quick Links Card */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full mr-3"></span>
                Quick Links
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    href="/accommodations" 
                    className="group/link flex items-center justify-between text-sm sm:text-base text-neutral-300 hover:text-white transition-all duration-300 py-2 border-b border-white/5 hover:border-blue-500/30"
                  >
                    <span className="flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-blue-400 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" />
                      <span>Browse Accommodations</span>
                    </span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="group/link flex items-center justify-between text-sm sm:text-base text-neutral-300 hover:text-white transition-all duration-300 py-2 border-b border-white/5 hover:border-blue-500/30"
                  >
                    <span className="flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-purple-400 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" />
                      <span>Contact Us</span>
                    </span>
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/auth/register" 
                    className="group/link flex items-center justify-between text-sm sm:text-base text-neutral-300 hover:text-white transition-all duration-300 py-2"
                  >
                    <span className="flex items-center">
                      <ArrowRight className="w-4 h-4 mr-2 text-green-400 opacity-0 group-hover/link:opacity-100 group-hover/link:translate-x-1 transition-all" />
                      <span>List Your Property</span>
                    </span>
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Info Card */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-purple-400 to-blue-500 rounded-full mr-3"></span>
                Get In Touch
              </h3>
              <ul className="space-y-4 sm:space-y-5">
                <li>
                  <a 
                    href="tel:+27624079139" 
                    className="group/contact flex items-start space-x-4 text-sm sm:text-base text-neutral-300 hover:text-white transition-all duration-300"
                  >
                    <div className="p-2.5 sm:p-3 border border-white/20 bg-black/30 backdrop-blur-sm rounded-xl group-hover/contact:bg-blue-500/20 group-hover/contact:border-blue-500/50 transition-all duration-300 flex-shrink-0">
                      <Phone className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                    </div>
                    <span className="break-words pt-1">+27 62 407 9139</span>
                  </a>
                </li>
                <li>
                  <a 
                    href="mailto:support@varsitynest.space" 
                    className="group/contact flex items-start space-x-4 text-sm sm:text-base text-neutral-300 hover:text-white transition-all duration-300"
                  >
                    <div className="p-2.5 sm:p-3 border border-white/20 bg-black/30 backdrop-blur-sm rounded-xl group-hover/contact:bg-purple-500/20 group-hover/contact:border-purple-500/50 transition-all duration-300 flex-shrink-0">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                    </div>
                    <span className="break-words pt-1">support@varsitynest.space</span>
                  </a>
                </li>
                <li>
                  <div className="flex items-start space-x-4 text-sm sm:text-base text-neutral-300">
                    <div className="p-2.5 sm:p-3 border border-white/20 bg-black/30 backdrop-blur-sm rounded-xl flex-shrink-0">
                      <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                    </div>
                    <span className="break-words pt-1">
                      Bloemfontein, 9300
                      <br />
                      South Africa
                    </span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Social Media Card */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10 md:col-span-2 lg:col-span-1">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <h3 className="text-lg sm:text-xl font-bold mb-6 bg-gradient-to-r from-pink-400 to-blue-500 bg-clip-text text-transparent flex items-center">
                <span className="w-1 h-6 bg-gradient-to-b from-pink-400 to-blue-500 rounded-full mr-3"></span>
                Follow Us
              </h3>
              <p className="text-sm sm:text-base text-neutral-400 mb-6">
                Stay connected with us on social media for the latest updates and news.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="https://www.facebook.com/people/Massive-Operations/61573795036731/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group/social flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border border-white/20 bg-black/30 backdrop-blur-sm rounded-xl hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 hover:scale-110 hover:rotate-3"
                >
                  <Facebook className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 group-hover/social:text-blue-400 transition-colors" />
                </a>
                <a 
                  href="#" 
                  className="group/social flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 border border-white/20 bg-black/30 backdrop-blur-sm rounded-xl hover:bg-pink-500/20 hover:border-pink-500/50 transition-all duration-300 hover:scale-110 hover:rotate-3"
                >
                  <Instagram className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-400 group-hover/social:text-pink-400 transition-colors" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Legal Links & Copyright */}
        <div className="border-t border-white/10 pt-8 sm:pt-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 sm:gap-x-6 gap-y-3 min-w-0 w-full md:w-auto">
              <Link 
                href="/privacy" 
                className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors hover:underline whitespace-nowrap relative group/legal"
              >
                Privacy Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover/legal:w-full transition-all duration-300"></span>
              </Link>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <Link 
                href="/terms" 
                className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors hover:underline whitespace-nowrap relative group/legal"
              >
                Terms of Service
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover/legal:w-full transition-all duration-300"></span>
              </Link>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <Link 
                href="/cookies" 
                className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors hover:underline whitespace-nowrap relative group/legal"
              >
                Cookies Policy
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover/legal:w-full transition-all duration-300"></span>
              </Link>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <Link 
                href="/disclaimer" 
                className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors hover:underline whitespace-nowrap relative group/legal"
              >
                Disclaimer
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover/legal:w-full transition-all duration-300"></span>
              </Link>
              <span className="text-neutral-600 hidden sm:inline">•</span>
              <Link 
                href="/contact" 
                className="text-xs sm:text-sm text-neutral-400 hover:text-white transition-colors hover:underline whitespace-nowrap relative group/legal"
              >
                Support
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 group-hover/legal:w-full transition-all duration-300"></span>
              </Link>
            </div>

            {/* Copyright */}
            <p className="text-xs sm:text-sm text-neutral-400 text-center md:text-right">
              © 2025{" "}
              <a 
                href="https://massiveoperations.co.za/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
              >
                Massive Operations
              </a>
              . All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
