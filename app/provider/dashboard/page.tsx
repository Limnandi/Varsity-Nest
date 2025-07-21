"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { getCurrentUser, type ServiceProvider } from "@/lib/auth"
import { accommodations } from "@/lib/data"
import { Building, DollarSign, Eye, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"

export default function ProviderDashboard() {
  const [user, setUser] = useState<ServiceProvider | null>(null)

  useEffect(() => {
    const currentUser = getCurrentUser() as ServiceProvider
    setUser(currentUser)
  }, [])

  if (!user) return null

  const userAccommodations = accommodations.filter((acc) => user.accommodations.includes(acc.id.toString()))

  const totalViews = userAccommodations.reduce((sum, acc) => sum + acc.reviewCount * 10, 0)
  const totalBookings = userAccommodations.reduce((sum, acc) => sum + Math.floor(acc.reviewCount / 2), 0)

  const stats = [
    {
      title: "Total Accommodations",
      value: userAccommodations.length,
      icon: Building,
      color: "bg-blue-500",
      change: "+2 this month",
    },
    {
      title: "Monthly Revenue",
      value: `R${user.billingInfo.monthlyFee.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      change: "Next payment: Jan 1",
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: "bg-purple-500",
      change: "+15% this week",
    },
    {
      title: "Bookings",
      value: totalBookings,
      icon: TrendingUp,
      color: "bg-orange-500",
      change: "+3 this week",
    },
  ]

  return (
    <AuthGuard requiredRole="provider">
      <DashboardLayout userRole="provider">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Welcome back, {user.name}!</h1>
            <p className="text-blue-100">Manage your accommodations and track your performance</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
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
                <Plus className="w-8 h-8 text-blue-600 mr-3" />
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

          {/* Recent Accommodations */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Your Accommodations</h2>
              <Link href="/provider/accommodations" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {userAccommodations.slice(0, 3).map((accommodation) => (
                <div key={accommodation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{accommodation.title}</h3>
                      <p className="text-sm text-gray-600">{accommodation.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R{accommodation.price.toLocaleString()}/month</p>
                    <p className="text-sm text-gray-500">
                      {accommodation.availableRooms}/{accommodation.totalRooms} available
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Billing Status */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Billing Status</h2>
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Account in Good Standing</p>
                  <p className="text-sm text-gray-600">Next payment due: {user.billingInfo.nextPayment}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">R{user.billingInfo.monthlyFee}</p>
                <p className="text-sm text-gray-600">Monthly fee</p>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
