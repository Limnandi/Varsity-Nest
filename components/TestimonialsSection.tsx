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
    <div className="py-20 px-4 bg-gradient-to-b from-[#040945] to-[#02042b]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">What Students Say</h2>
          <p className="text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed">Real experiences from real students in Bloemfontein</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <Quote className="w-8 h-8 text-blue-400 mb-6 group-hover:text-blue-300 transition-colors duration-300" />

              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < testimonial.rating ? "text-yellow-400 fill-current drop-shadow-lg" : "text-gray-400"}`}
                  />
                ))}
              </div>

              <p className="text-neutral-300 leading-relaxed mb-6 italic text-lg">&quot;{testimonial.text}&quot;</p>

              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mr-4 flex items-center justify-center border border-white/20 shadow-lg">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                </div>
                <div>
                  <p className="font-semibold text-lg">{testimonial.name}</p>
                  <p className="text-sm text-neutral-400">{testimonial.university}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
