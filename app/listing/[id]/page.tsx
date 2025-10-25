import ImageCarousel from "@/components/ImageCarousel"
import ReviewsSection from "@/components/ReviewsSection"
import RoomTypesSection from "@/components/RoomTypesSection"
import { fetchAccommodationByIdWithProvider } from "@/lib/repos/accommodations"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { notFound } from "next/navigation"
import { 
  MapPin, 
  Bath, 
  Wifi, 
  Car, 
  Bed, 
  Users, 
  Star, 
  Phone, 
  Mail, 
  Calendar,
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  Building,
  MessageSquare
} from "lucide-react"
import WishlistButton from "@/components/WishlistButton"

async function getListing(id: string) {
  try {
    const row = await fetchAccommodationByIdWithProvider(id)
    if (!row) return null
    return row
  } catch (error) {
    console.error("Failed to fetch listing:", error)
    return null
  }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const listing = await getListing(id)

  if (!listing) {
    notFound()
  }

  // Get current user for review deletion authorization and role checking
  const currentUser = await getCurrentUserFromStackAuth()
  const currentUserEmail = currentUser?.email
  const currentUserRole = currentUser?.role
  const isAuthenticated = !!currentUser

  const amenities = listing.amenities || []
  const isVerified = listing.is_verified || false
  const isFeatured = listing.featured || false
  const isOpen = listing.is_open !== false

  // Get accreditation status color
  const getAccreditationColor = (status: string) => {
    switch (status) {
      case 'accredited':
        return 'border-green-500/50 bg-green-500/10 text-green-300'
      case 'provisionally-accredited':
        return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-300'
      case 'non-accredited':
        return 'border-red-500/50 bg-red-500/10 text-red-300'
      default:
        return 'border-blue-500/50 bg-blue-500/10 text-blue-300'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header Section */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 mb-8 text-white shadow-2xl shadow-blue-500/20">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getAccreditationColor(listing.accreditation_status || 'accredited')}`}>
                  {listing.accreditation_status?.replace('-', ' ').toUpperCase() || 'ACCREDITED'}
                </span>
                {isVerified && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full border border-green-500/50 bg-green-500/10 text-green-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    VERIFIED
                  </span>
                )}
                {isFeatured && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-300 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    FEATURED
                  </span>
                )}
                {isOpen && (
                  <span className="px-3 py-1 text-xs font-medium rounded-full border border-green-500/50 bg-green-500/10 text-green-300 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    AVAILABLE
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight">
                {listing.name}
              </h1>
              
              <div className="flex items-center text-neutral-300 mb-4">
                <MapPin className="h-5 w-5 mr-2 text-blue-400" />
                <span className="text-lg">{listing.address}</span>
              </div>
              
              <p className="text-xl text-neutral-300 leading-relaxed mb-6">
                {listing.description}
              </p>
            </div>
            
            {/* Price Card */}
            <div className="lg:w-80">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-green-500/20">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-6 h-6 text-green-400 mr-2" />
                    <span className="text-4xl font-bold text-white">R{listing.price}</span>
                  </div>
                  <p className="text-neutral-300">per month</p>
                </div>
                
                <div className="space-y-4">
                  <a
                    href={`mailto:${listing.provider_email}?subject=Inquiry about ${listing.name}`}
                    className="group relative w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Contact Provider
                  </a>
                  
                  <a
                    href={`tel:${listing.provider_phone || ''}`}
                    className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 px-6 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Provider
                  </a>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-sm text-neutral-400 text-center">
                    Provider: <span className="text-white font-medium">{listing.provider_name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 mb-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Photo Gallery
          </h2>
          <ImageCarousel images={listing.images || []} />
        </div>

               <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                 {/* Main Content */}
                 <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Amenities Section */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-purple-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <Home className="w-6 h-6 text-purple-400" />
                Amenities & Features
              </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {amenities.map((amenity: string, index: number) => {
                  const getAmenityIcon = (amenity: string) => {
                    switch (amenity.toLowerCase()) {
                      case 'wifi':
                      case 'wi-fi':
                        return <Wifi className="h-5 w-5 text-blue-400" />
                      case 'parking':
                        return <Car className="h-5 w-5 text-green-400" />
                      case 'ensuite':
                      case 'bathroom':
                        return <Bath className="h-5 w-5 text-purple-400" />
                      case 'bed':
                      case 'bedroom':
                        return <Bed className="h-5 w-5 text-orange-400" />
                      default:
                        return <CheckCircle className="h-5 w-5 text-green-400" />
                    }
                  }
                  
                  return (
                    <div key={index} className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300">
                      {getAmenityIcon(amenity)}
                      <span className="ml-3 text-neutral-300 capitalize">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Property Details */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-orange-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                <Building className="w-6 h-6 text-orange-400" />
                Property Details
              </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <Bed className="h-6 w-6 text-blue-400 mr-4" />
                  <div>
                    <p className="text-sm text-neutral-400">Available Rooms</p>
                    <p className="text-xl font-semibold text-white">{listing.available_rooms || 0}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <Users className="h-6 w-6 text-green-400 mr-4" />
                  <div>
                    <p className="text-sm text-neutral-400">Total Rooms</p>
                    <p className="text-xl font-semibold text-white">{listing.total_rooms || 0}</p>
                  </div>
                </div>
                {listing.area && (
                  <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                    <MapPin className="h-6 w-6 text-purple-400 mr-4" />
                    <div>
                      <p className="text-sm text-neutral-400">Area</p>
                      <p className="text-xl font-semibold text-white">{listing.area}</p>
                    </div>
                  </div>
                )}
                {listing.distance && (
                  <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                    <Clock className="h-6 w-6 text-orange-400 mr-4" />
                    <div>
                      <p className="text-sm text-neutral-400">Distance to Campus</p>
                      <p className="text-xl font-semibold text-white">{listing.distance} km</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Room Types Section */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 lg:p-8 text-white shadow-2xl shadow-green-500/10 w-full max-w-full overflow-hidden">
              <RoomTypesSection accommodationId={id} />
            </div>

            {/* Reviews Section */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-purple-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3">
                <MessageSquare className="w-6 h-6 text-purple-400" />
                Reviews & Ratings
              </h2>
              
              <ReviewsSection 
                accommodationId={id} 
                currentUserEmail={currentUserEmail}
                currentUserRole={currentUserRole}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Information */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <Mail className="h-5 w-5 text-blue-400 mr-3" />
                  <div>
                    <p className="text-sm text-neutral-400">Email</p>
                    <p className="text-white font-medium">{listing.provider_email}</p>
                  </div>
                </div>
                {listing.provider_phone && (
                  <div className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                    <Phone className="h-5 w-5 text-green-400 mr-3" />
                    <div>
                      <p className="text-sm text-neutral-400">Phone</p>
                      <p className="text-white font-medium">{listing.provider_phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <Building className="h-5 w-5 text-purple-400 mr-3" />
                  <div>
                    <p className="text-sm text-neutral-400">Provider</p>
                    <p className="text-white font-medium">{listing.provider_name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-green-500/10">
              <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Viewing
                </button>
                <WishlistButton accommodationId={id} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
