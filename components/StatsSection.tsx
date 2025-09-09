import { Users, Home, Star, Headphones } from "lucide-react"

export default function StatsSection() {
  const stats = [
    { number: "500+", label: "Happy Students", icon: Users },
    { number: "50+", label: "Verified Properties", icon: Home },
    { number: "98%", label: "Satisfaction Rate", icon: Star },
    { number: "24/7", label: "Support Available", icon: Headphones },
  ]

  return (
    <div className="py-20 px-4 bg-gradient-to-b from-[#02042b] to-[#040945]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">Trusted by Students</h2>
          <p className="text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed">Numbers that speak for our commitment to quality</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="group text-center">
              <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.05]">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-6 group-hover:shadow-[0_0_30px_theme(colors.blue.500/60%)] transition-all duration-300">
                  <stat.icon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-2xl bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">{stat.number}</div>
                <div className="text-neutral-300 font-medium text-lg">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
