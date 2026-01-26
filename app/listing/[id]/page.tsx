import ImageCarousel from "@/components/ImageCarousel"
import ReviewsSection from "@/components/ReviewsSection"
import RoomTypesSection from "@/components/RoomTypesSection"
import ContactAgent from "@/components/ContactAgent"
import ShareSection from "@/components/ShareSection"
import ListingQuickActions from "@/components/ListingQuickActions"
import { fetchAccommodationByIdWithProvider } from "@/lib/repos/accommodations"
import { getCurrentUserFromStackAuth } from "@/lib/auth-server"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { env } from "@/lib/env"
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
  Shield,
  CheckCircle,
  Clock,
  DollarSign,
  Home,
  Building,
  MessageSquare
} from "lucide-react"

async function getListing(id: string, userRole?: string, userId?: string) {
  try {
    const row = await fetchAccommodationByIdWithProvider(id, userRole, userId)
    if (!row) return null
    return row
  } catch (error) {
    console.error("Failed to fetch listing:", error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params
    const listing = await getListing(id)

    if (!listing || !listing.name) {
      return {
        title: "Property Not Found | Varsity Nest",
        description: "The property you are looking for could not be found.",
      }
    }

    const baseUrl = env.APP_URL || 'https://varsitynest.space'
    const listingUrl = `${baseUrl}/listing/${id}`
    
    // Get the first image or use a default placeholder
    const images = Array.isArray(listing.images) ? listing.images : []
    let imageUrl = images.length > 0 && images[0] ? String(images[0]) : `${baseUrl}/placeholder.jpg`
    
    // Ensure image URL is absolute (Cloudinary URLs are already absolute, but handle relative URLs too)
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`
    }

    // Create a clean description (truncate if too long)
    const listingName = String(listing.name || 'Property')
    const listingAddress = String(listing.address || '')
    const listingPrice = listing.price ? String(listing.price) : '0'
    const listingDescription = listing.description ? String(listing.description) : ''
    
    const description = listingDescription 
      ? listingDescription.substring(0, 200).replace(/\n/g, ' ').trim() + (listingDescription.length > 200 ? '...' : '')
      : `Check out ${listingName} - ${listingAddress}. R${listingPrice} per month.`

    const title = `${listingName} | Varsity Nest`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: listingUrl,
        siteName: "Varsity Nest",
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: listingName,
          },
        ],
        locale: "en_US",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: listingUrl,
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: "Property | Varsity Nest",
      description: "View property details on Varsity Nest",
    }
  }
}

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  // Get current user first to check permissions
  const currentUser = await getCurrentUserFromStackAuth()
  const currentUserEmail = currentUser?.email
  const currentUserRole = currentUser?.role
  const isAuthenticated = !!currentUser
  
  // Fetch listing with user context for permission checks
  const listing = await getListing(id, currentUserRole, currentUser?.id)

  if (!listing) {
    notFound()
  }

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
    <div className="min-h-screen bg-gradient-to-b from-[#02042b] to-[#040945] pt-20 pb-20 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 w-full">
        {/* Header Section */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 mb-8 text-white shadow-2xl shadow-blue-500/20 overflow-hidden">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
                <span className={`px-2 sm:px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap ${getAccreditationColor(listing.accreditation_status || 'accredited')}`}>
                  {listing.accreditation_status?.replace('-', ' ').toUpperCase() || 'ACCREDITED'}
                </span>
                {isVerified && (
                  <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full border border-green-500/50 bg-green-500/10 text-green-300 flex items-center gap-1 whitespace-nowrap">
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    VERIFIED
                  </span>
                )}
                {isFeatured && (
                  <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-300 flex items-center gap-1 whitespace-nowrap">
                    <Star className="w-3 h-3 flex-shrink-0" />
                    FEATURED
                  </span>
                )}
                {isOpen && (
                  <span className="px-2 sm:px-3 py-1 text-xs font-medium rounded-full border border-green-500/50 bg-green-500/10 text-green-300 flex items-center gap-1 whitespace-nowrap">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    AVAILABLE
                  </span>
                )}
              </div>
              
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent drop-shadow-2xl tracking-tight break-words">
                {listing.name}
              </h1>
              
              <div className="flex items-start text-neutral-300 mb-4">
                <MapPin className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-base sm:text-lg break-words">{listing.address}</span>
              </div>
              
              <p className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed mb-6 break-words">
                {listing.description}
              </p>
            </div>
            
            {/* Price Card */}
            <div className="lg:w-80 w-full">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-green-500/20 overflow-hidden">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-400 mr-2 flex-shrink-0" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-white break-words">R{listing.price}</span>
                  </div>
                  <p className="text-neutral-300 text-sm sm:text-base">per month</p>
                </div>
                
                <div className="space-y-4">
                  <a
                    href={`mailto:${listing.provider_email}?subject=Inquiry about ${encodeURIComponent(listing.name)}`}
                    className="group relative w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl font-semibold text-base sm:text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center break-words"
                  >
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2 flex-shrink-0" />
                    <span className="break-words">Contact Provider</span>
                  </a>
                  
                  <a
                    href={`tel:${listing.provider_phone || ''}`}
                    className="group relative w-full border border-white/20 bg-black/20 backdrop-blur-xl text-white py-3 px-4 sm:px-6 rounded-xl font-medium hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] flex items-center justify-center break-words"
                  >
                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="break-words">Call Provider</span>
                  </a>
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/10">
                  <p className="text-xs sm:text-sm text-neutral-400 text-center break-words">
                    Provider: <span className="text-white font-medium break-words">{listing.provider_name}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Image Gallery */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 mb-8 text-white shadow-2xl shadow-blue-500/10 overflow-hidden">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">
            Photo Gallery
          </h2>
          <ImageCarousel images={listing.images || []} />
        </div>

               <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                 {/* Main Content */}
                 <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Amenities Section */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-purple-500/10 overflow-hidden">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3 break-words">
                <Home className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                <span className="break-words">Amenities & Features</span>
              </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {amenities.map((amenity: string, index: number) => {
                  const getAmenityIcon = (amenity: string) => {
                    switch (amenity.toLowerCase()) {
                      case 'wifi':
                      case 'wi-fi':
                        return <Wifi className="h-5 w-5 text-blue-400 flex-shrink-0" />
                      case 'parking':
                        return <Car className="h-5 w-5 text-green-400 flex-shrink-0" />
                      case 'ensuite':
                      case 'bathroom':
                        return <Bath className="h-5 w-5 text-purple-400 flex-shrink-0" />
                      case 'bed':
                      case 'bedroom':
                        return <Bed className="h-5 w-5 text-orange-400 flex-shrink-0" />
                      default:
                        return <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    }
                  }
                  
                  return (
                    <div key={index} className="flex items-center p-3 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 min-w-0">
                      {getAmenityIcon(amenity)}
                      <span className="ml-3 text-neutral-300 capitalize break-words">{amenity}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Property Details */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-orange-500/10 overflow-hidden">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-3 break-words">
                <Building className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400 flex-shrink-0" />
                <span className="break-words">Property Details</span>
              </h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl min-w-0">
                  <Bed className="h-5 w-5 sm:h-6 sm:w-6 text-blue-400 mr-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-neutral-400 break-words">Available Rooms</p>
                    <p className="text-lg sm:text-xl font-semibold text-white break-words">{listing.available_rooms || 0}</p>
                  </div>
                </div>
                <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl min-w-0">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-400 mr-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm text-neutral-400 break-words">Total Rooms</p>
                    <p className="text-lg sm:text-xl font-semibold text-white break-words">{listing.total_rooms || 0}</p>
                  </div>
                </div>
                {listing.area && (
                  <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl min-w-0">
                    <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-purple-400 mr-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-neutral-400 break-words">Area</p>
                      <p className="text-lg sm:text-xl font-semibold text-white break-words">{listing.area}</p>
                    </div>
                  </div>
                )}
                {listing.distance && (
                  <div className="flex items-center p-4 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl min-w-0">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-400 mr-4 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm text-neutral-400 break-words">Distance to Campus</p>
                      <p className="text-lg sm:text-xl font-semibold text-white break-words">{listing.distance} km</p>
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
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-purple-500/10 overflow-hidden">
              <h2 className="text-xl sm:text-2xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent flex items-center gap-3 break-words">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0" />
                <span className="break-words">Reviews & Ratings</span>
              </h2>
              
              <ReviewsSection 
                accommodationId={id} 
                accommodationName={listing.name}
                accommodationImage={(listing.images && listing.images[0]) || "/placeholder.jpg"}
                currentUserEmail={currentUserEmail}
                currentUserRole={currentUserRole}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Share Section */}
            <ShareSection
              accommodationId={id}
              accommodationName={listing.name}
            />

            {/* Contact Agent */}
            <ContactAgent
              accommodationId={id}
              accommodationName={listing.name}
              providerPhone={listing.providerPhone || listing.provider_phone}
              providerEmail={listing.providerEmail || listing.provider_email}
              currentUserRole={currentUserRole}
              isAuthenticated={isAuthenticated}
            />

            {/* Quick Actions */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-green-500/10 overflow-hidden">
              <h3 className="text-lg sm:text-xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent break-words">
                Quick Actions
              </h3>
              <ListingQuickActions
                accommodationId={id}
                accommodationName={listing.name}
                currentUserRole={currentUserRole || undefined}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
