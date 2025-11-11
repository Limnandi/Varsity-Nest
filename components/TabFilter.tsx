"use client"

import { useState } from "react"
import type { Accommodation } from "@/lib/types"

interface TabFilterProps {
  accommodations: Accommodation[]
  onFilter: (filtered: Accommodation[]) => void
}

export default function TabFilter({ accommodations, onFilter }: TabFilterProps) {
  const [activeTab, setActiveTab] = useState<"All" | "Universitas" | "Brandwag" | "Willows">("All")

  const tabs = ["All", "Universitas", "Brandwag", "Willows"] as const

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)

    let filtered = accommodations
    if (tab !== "All") {
      filtered = accommodations.filter((acc) => acc.area === tab)
    }

    // Sort by price descending
    filtered = filtered.sort((a, b) => b.price - a.price)

    onFilter(filtered)
  }

  return (
    <div className="flex flex-wrap gap-1 sm:gap-1 bg-black/20 border border-white/10 p-1 rounded-lg backdrop-blur-sm w-full sm:w-auto">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabChange(tab)}
          className={`px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md transition-all duration-300 text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
            activeTab === tab 
              ? "bg-white/20 text-white shadow-lg border border-white/20" 
              : "text-neutral-300 hover:text-white hover:bg-white/10"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
