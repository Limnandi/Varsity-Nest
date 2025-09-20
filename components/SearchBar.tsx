"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import type { Accommodation } from "@/lib/types"

interface SearchBarProps {
  accommodations: Accommodation[]
  onFilter: (filtered: Accommodation[]) => void
}

export default function SearchBar({ accommodations, onFilter }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [suggestions, setSuggestions] = useState<Accommodation[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleSearch = (term: string) => {
    setSearchTerm(term)

    if (term.trim() === "") {
      setSuggestions([])
      setShowSuggestions(false)
      onFilter(accommodations)
      return
    }

    const filtered = accommodations.filter((acc) => acc.name.toLowerCase().includes(term.toLowerCase()))

    setSuggestions(filtered)
    setShowSuggestions(true)
    onFilter(filtered)
  }

  const selectSuggestion = (accommodation: Accommodation) => {
    setSearchTerm(accommodation.name)
    setShowSuggestions(false)
    onFilter([accommodation])
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search accommodations..."
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
              {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => selectSuggestion(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
            >
                  {suggestion.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
