export default function StatsSection() {
  const stats = [
    { number: "500+", label: "Happy Students" },
    { number: "50+", label: "Verified Properties" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "24/7", label: "Support Available" },
  ]

  return (
    <div className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-6">
                <div className="text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">{stat.number}</div>
                <div className="text-white text-opacity-90 font-medium">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
