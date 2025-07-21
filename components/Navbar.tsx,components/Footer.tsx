const Navbar = () => {
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto py-4 px-6 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <img src="/images/varsity-nest-logo.png" alt="Varsity Nest Logo" className="h-8 mr-2" />
          <span className="font-semibold text-xl">Varsity Nest</span>
        </a>
        <div className="space-x-4">
          <a href="/" className="text-gray-700 hover:text-gray-900">
            Home
          </a>
          <a href="/about" className="text-gray-700 hover:text-gray-900">
            About
          </a>
          <a href="/listings" className="text-gray-700 hover:text-gray-900">
            Listings
          </a>
          <a href="/contact" className="text-gray-700 hover:text-gray-900">
            Contact
          </a>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-8 mt-12">
      <div className="container mx-auto px-6 text-center">
        <div className="flex items-center justify-center mb-4">
          <img src="/images/varsity-nest-logo.png" alt="Varsity Nest Logo" className="h-8 mr-2" />
          <span className="font-semibold text-xl">Varsity Nest</span>
        </div>
        <p className="text-gray-600">&copy; {new Date().getFullYear()} Varsity Nest. All rights reserved.</p>
        <p className="text-gray-600">Contact us at: info@varsitynest.com</p>
      </div>
    </footer>
  )
}

export default Footer;
