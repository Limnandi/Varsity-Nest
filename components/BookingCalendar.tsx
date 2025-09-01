"use client"

import { useState } from "react"
import { Calendar, Clock, Users } from "lucide-react"
import { formatZar } from "@/lib/utils"

interface BookingCalendarProps {
  accommodationId: number
  price: number
}

export default function BookingCalendar({ accommodationId, price }: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState("")
  const [duration, setDuration] = useState("12") // months
  const [occupants, setOccupants] = useState("1")

  const calculateTotal = () => {
    return Number.parseInt(duration) * price
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
      <h3 className="text-xl font-bold mb-4">Book Your Stay</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Move-in Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 month</option>
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Number of Occupants</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={occupants}
              onChange={(e) => setOccupants(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">1 person</option>
              <option value="2">2 people</option>
              <option value="3">3 people</option>
              <option value="4">4 people</option>
            </select>
          </div>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <span>Monthly rent</span>
            <span>{formatZar(price)}</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span>Duration</span>
            <span>{duration} months</span>
          </div>
          <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
            <span>Total</span>
            <span className="text-green-600">{formatZar(calculateTotal())}</span>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 transform hover:scale-105 shadow-md font-semibold">
          Request Booking
        </button>

        <p className="text-xs text-gray-500 text-center">You won't be charged yet. This is just a booking request.</p>
      </div>
    </div>
  )
}
