import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    id: 1,
    name: "Sarah Johnson",
    university: "UFS Student",
    rating: 5,
    text: "Found the perfect place through this platform! The verification process gave me confidence, and the location is perfect for campus life.",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 2,
    name: "Michael Chen",
    university: "CUT Student",
    rating: 5,
    text: "Amazing service and great accommodations. The search filters made it so easy to find exactly what I was looking for.",
    image: "/placeholder.svg?height=60&width=60",
  },
  {
    id: 3,
    name: "Priya Patel",
    university: "UFS Student",
    rating: 4,
    text: "Love the community aspect and the quality of properties. Highly recommend for any student looking for off-campus housing.",
    image: "/placeholder.svg?height=60&width=60",
  },
]

export default function TestimonialsSection() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">What Students Say</h2>
          <p className="text-xl text-white drop-shadow-lg">Real experiences from real students</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-white">
              <Quote className="w-8 h-8 text-blue-400 mb-4" />

              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? "text-yellow-400 fill-current" : "text-gray-400"}`}
                  />
                ))}
              </div>

              <p className="text-white text-opacity-90 mb-6 italic">"{testimonial.text}"</p>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded-full mr-3"></div>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-white text-opacity-70">{testimonial.university}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
