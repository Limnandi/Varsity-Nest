"use client"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { useState, useEffect } from "react"
import { getDashboardStats, getTopAccommodations } from "@/lib/admin"
import { Building, Users, DollarSign, TrendingUp, Eye, Plus, AlertTriangle } from "lucide-react"

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalAccommodations: number
    totalProviders: number
    totalRevenue: number
    totalViews: number
  }>({
    totalAccommodations: 0,
    totalProviders: 0,
    totalRevenue: 0,
    totalViews: 0
  })
  const [topAccommodations, setTopAccommodations] = useState<Array<{
    id: number
    title: string
    address: string
    price: number
    reviewCount: number
  }>>([])

  useEffect(() => {
    const fetchData = async () => {
      const [dashboardStats, accommodations] = await Promise.all([
        getDashboardStats(),
        getTopAccommodations()
      ])
      setStats(dashboardStats)
      setTopAccommodations(accommodations)
    }
    fetchData()
  }, [])

  const statsData = [
    {
      title: "Total Accommodations",
      value: stats.totalAccommodations,
      icon: Building,
      color: "bg-blue-500",
      change: "+0% from last month", // Will update with real change data
    },
    {
      title: "Active Providers",
      value: stats.totalProviders,
      icon: Users,
      color: "bg-green-500",
      change: "+0 new this month", // Will update with real change data
    },
    {
      title: "Monthly Revenue",
      value: `R${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-purple-500",
      change: "+0% from last month", // Will update with real change data
    },
    {
      title: "Total Views",
      value: stats.totalViews.toLocaleString(),
      icon: Eye,
      color: "bg-orange-500",
      change: "+0% this week", // Will update with real change data
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "new_accommodation",
      message: 'New accommodation "Campus View Apartments" added',
      time: "2 hours ago",
    },
    { id: 2, type: "new_provider", message: 'New provider "Smith Properties" registered', time: "4 hours ago" },
    { id: 3, type: "payment", message: "Payment received from John Doe Properties", time: "6 hours ago" },
    { id: 4, type: "review", message: "New review posted for Sunny Side Residence", time: "8 hours ago" },
  ]

  const pendingApprovals = [
    { id: 1, type: "accommodation", title: "Green Valley Lodge", provider: "ABC Properties", status: "pending" },
    { id: 2, type: "provider", title: "XYZ Student Housing", provider: "New Registration", status: "pending" },
  ]

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-blue-100">Monitor and manage the Varsity-Nest platform</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors text-left">
                <Plus className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Add Accommodation</h3>
                  <p className="text-sm text-gray-600">Create new listing</p>
                </div>
              </button>

              <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left">
                <Users className="w-8 h-8 text-green-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Manage Providers</h3>
                  <p className="text-sm text-gray-600">View all providers</p>
                </div>
              </button>

              <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left">
                <TrendingUp className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">View Analytics</h3>
                  <p className="text-sm text-gray-600">Platform insights</p>
                </div>
              </button>

              <button className="flex items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors text-left">
                <AlertTriangle className="w-8 h-8 text-orange-600 mr-3" />
                <div>
                  <h3 className="font-medium text-gray-900">Pending Reviews</h3>
                  <p className="text-sm text-gray-600">Approve listings</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.provider}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                        Approve
                      </button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Accommodations */}
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Top Performing Accommodations</h2>
            <div className="space-y-4">
              {topAccommodations.map((accommodation) => (
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
                    <p className="text-sm text-gray-500">{accommodation.reviewCount} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
