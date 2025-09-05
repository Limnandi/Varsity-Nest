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
    <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabChange(tab)}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === tab ? "bg-white text-blue-600 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}
