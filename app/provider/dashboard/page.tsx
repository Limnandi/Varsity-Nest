"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { Building, Users, Star, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react"

export default function ProviderDashboard() {
  const [stats, setStats] = useState({
    totalAccommodations: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingReviews: 0,
    upcomingMaintenance: 0
  })

  useEffect(() => {
    // TODO: Fetch real data from StackAuth/API
    setStats({
      totalAccommodations: 3,
      activeBookings: 12,
      totalRevenue: 4500,
      averageRating: 4.8,
      pendingReviews: 2,
      upcomingMaintenance: 1
    })
  }, [])

  const statsData = [
    {
      title: "Total Accommodations",
      value: stats.totalAccommodations,
      icon: Building,
      color: "bg-blue-500",
      change: "+0 this month", // Will update with real change data
    },
    {
      title: "Monthly Revenue",
      value: `R${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "Next payment: loading", // Will update with real data
    },
    {
      title: "Total Views",
      value: stats.totalAccommodations, // Placeholder, will be updated
      icon: Users,
      color: "bg-purple-500",
      change: "+0% this week", // Will update with real change data
    },
    {
      title: "Bookings",
      value: stats.activeBookings,
      icon: TrendingUp,
      color: "bg-orange-500",
      change: "+0 this week", // Will update with real change data
    },
  ]

  return (
    <DashboardLayout userRole="provider">
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <h1 className="text-2xl font-bold mb-2">Welcome back, {/* user.name */}!</h1>
          <p className="text-blue-100">Manage your accommodations and track your performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/provider/accommodations/new"
              className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Building className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Add New Accommodation</h3>
                <p className="text-sm text-gray-600">List a new property</p>
              </div>
            </Link>

            <Link
              href="/provider/billing"
              className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <DollarSign className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">View Billing</h3>
                <p className="text-sm text-gray-600">Manage payments</p>
              </div>
            </Link>

            <Link
              href="/provider/accommodations"
              className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Building className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <h3 className="font-medium text-gray-900">Manage Properties</h3>
                <p className="text-sm text-gray-600">Edit your listings</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Accommodations section will be added back with live data implementation */}

        {/* Billing Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h2 className="text-lg font-semibold mb-4">Billing Status</h2>
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="font-medium text-gray-900">Account in Good Standing</p>
                <p className="text-sm text-gray-600">
                  {/* user.billingInfo ? `Next payment due: ${user.billingInfo.nextPayment}` : "Loading payment info..." */}
                  Loading payment info...
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900">
                R{/* user.billingInfo?.monthlyFee ?? "0" */}0
              </p>
              <p className="text-sm text-gray-600">Monthly fee</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
