import Image from "next/image"
import Link from "next/link"
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-gray-900 bg-opacity-95 backdrop-blur-sm text-white border-t border-gray-700">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-4 mb-6">
              <Image
                src="/images/varsity-nest-logo.png"
                alt="Varsity Nest Logo"
                width={100}
                height={60}
                className="object-contain"
              />
              <div>
                <div className="text-xl font-bold">Varsity Nest</div>
                <div className="text-gray-400">Powered by Massive Operations</div>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-md">
              Your trusted partner in finding quality, verified student accommodation in Bloemfontein. Safe,
              comfortable, and close to campus.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/accommodations/accredited" className="text-gray-300 hover:text-white transition-colors">
                  Accredited Properties
                </Link>
              </li>
              <li>
                <Link
                  href="/accommodations/provisionally-accredited"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Provisionally Accredited
                </Link>
              </li>
              <li>
                <Link
                  href="/accommodations/non-accredited"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Budget Options
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/auth/register" className="text-gray-300 hover:text-white transition-colors">
                  List Your Property
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-300">+27 51 123 4567</span>
              </li>
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a
                  href="mailto:info@massiveoperations.co.za"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  info@massiveoperations.co.za
                </a>
              </li>
              <li className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                <span className="text-gray-300">
                  123 Business Street
                  <br />
                  Bloemfontein, 9300
                  <br />
                  South Africa
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">© 2025 Massive Operations. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            <Link href="/support" className="text-gray-400 hover:text-white text-sm transition-colors">
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
