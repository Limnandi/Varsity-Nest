"use client"
import ImageCarousel from "@/components/ImageCarousel"
import { fetchAccommodationByIdWithProvider } from "@/lib/repos/accommodations"
import { notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MapPin, Bath, Wifi, Car } from "lucide-react"

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

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id)

  if (!listing) {
    notFound()
  }

  const amenities = listing.amenities || []

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <Card className="overflow-hidden">
          <ImageCarousel images={listing.images || []} />
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                <Badge variant="secondary" className="mb-2">
                  {listing.type || "Student Accommodation"}
                </Badge>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{listing.name}</h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{listing.address}</span>
                </div>
                <p className="text-lg text-muted-foreground mb-6">{listing.description}</p>

                <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Amenities</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {amenities.includes("wifi") && (
                    <div className="flex items-center">
                      <Wifi className="h-5 w-5 mr-2 text-primary" /> Wi-Fi
                    </div>
                  )}
                  {amenities.includes("parking") && (
                    <div className="flex items-center">
                      <Car className="h-5 w-5 mr-2 text-primary" /> Parking
                    </div>
                  )}
                  {amenities.includes("ensuite") && (
                    <div className="flex items-center">
                      <Bath className="h-5 w-5 mr-2 text-primary" /> Ensuite
                    </div>
                  )}
                  {/* Add more amenities as needed */}
                </div>
              </div>

              <div className="md:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-2xl">R{listing.price} / month</CardTitle>
                    <CardDescription>Contact provider for availability</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={`mailto:${listing.provider_email}?subject=Inquiry about ${listing.name}`}
                      className="w-full"
                    >
                      <Button className="w-full">Contact Provider</Button>
                    </a>
                    <p className="text-xs text-center text-muted-foreground mt-4">Provider: {listing.provider_name}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
