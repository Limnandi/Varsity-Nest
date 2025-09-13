"use client"

import { useEffect, useState } from "react"

const organizations = [
  { name: "University of the Free State", logo: "/images/ufs-logo.png" },
  { name: "Central University of Technology", logo: "/images/cut-logo.png" },
  { name: "Free State Department of Education", logo: "/images/fs-education-logo.png" },
  { name: "Bloemfontein Student Union", logo: "/images/bsu-logo.png" },
  { name: "South African Student Housing Association", logo: "/images/sasha-logo.png" },
  { name: "Free State Accommodation Board", logo: "/images/fsab-logo.png" },
  { name: "UFS Student Representative Council", logo: "/images/src-logo.png" },
  { name: "CUT Student Council", logo: "/images/cut-council-logo.png" },
]

export default function TrustedBy() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % organizations.length)
    }, 3000) // Change every 3 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="py-20 px-4 bg-gradient-to-b from-[#040945] to-[#02042b]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight">Trusted by</h2>
          <p className="text-xl text-neutral-300 drop-shadow-lg mb-8 max-w-3xl mx-auto leading-relaxed">
            Leading institutions and organizations in Bloemfontein
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex animate-scroll">
            {/* First set of logos */}
            {organizations.map((org, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 w-48 h-24 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mx-auto mb-2 flex items-center justify-center border border-white/20">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                    </div>
                    <p className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                      {org.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* Duplicate set for seamless loop */}
            {organizations.map((org, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 mx-8 flex items-center justify-center"
              >
                <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 w-48 h-24 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full mx-auto mb-2 flex items-center justify-center border border-white/20">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full"></div>
                    </div>
                    <p className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                      {org.name}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
