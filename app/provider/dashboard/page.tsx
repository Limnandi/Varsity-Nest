"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "@/lib/stackauth"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { Building, Users, Star, TrendingUp, Calendar, DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { formatZar } from "@/lib/utils"

export default function ProviderDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAccommodations: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    pendingReviews: 0,
    upcomingMaintenance: 0
  })

  useEffect(() => {
    const load = async () => {
      try {
        // Get current user from secure session API
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          const userSession = await response.json()
          const user = {
            id: userSession.userId,
            email: userSession.email,
            firstName: userSession.firstName,
            lastName: userSession.lastName,
            role: userSession.role,
            phone: userSession.phone,
            studentNumber: userSession.studentNumber,
            institution: userSession.institution,
            isActive: userSession.isActive,
            emailVerified: userSession.emailVerified,
            createdAt: new Date(userSession.createdAt),
            updatedAt: new Date(userSession.updatedAt),
            university: userSession.university,
            yearOfStudy: userSession.yearOfStudy,
            course: userSession.course,
            emergencyContactName: userSession.emergencyContactName,
            emergencyContactPhone: userSession.emergencyContactPhone,
          }
          
          try {
            // Fetch stats from server-side API
            const statsResponse = await fetch(`/api/provider/stats?providerId=${user.id}`)
            
            if (statsResponse.ok) {
              const data = await statsResponse.json()
              setStats(data.stats)
            } else {
              console.error('Failed to fetch provider stats:', statsResponse.statusText)
              // Set default stats on error
              setStats({
                totalAccommodations: 0,
                activeBookings: 0,
                totalRevenue: 0,
                averageRating: 0,
                pendingReviews: 0,
                upcomingMaintenance: 0
              })
            }
          } catch (error) {
            console.error('Error fetching provider stats:', error)
            // Set default stats on error
            setStats({
              totalAccommodations: 0,
              activeBookings: 0,
              totalRevenue: 0,
              averageRating: 0,
              pendingReviews: 0,
              upcomingMaintenance: 0
            })
          }
        } else {
          // No valid session, redirect to login
          window.location.href = '/auth/login'
          return
        }
      } catch (error) {
        console.error('Error loading user:', error)
        window.location.href = '/auth/login'
        return
      } finally {
        setIsLoading(false)
      }
    }
    load()
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
      value: formatZar(stats.totalRevenue, true),
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
      <div className="space-y-8 p-6">
        {/* Welcome Section */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Welcome back!</h1>
          <p className="text-neutral-300 text-lg">Manage your accommodations and track your performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-400 mb-2">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-neutral-500">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-xl shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/provider/accommodations/new"
              className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20"
            >
              <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl mr-4 group-hover:bg-blue-500/20 transition-all duration-300">
                <Building className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">Add New Accommodation</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">List a new property</p>
              </div>
            </Link>

            <Link
              href="/provider/billing"
              className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-green-500/20"
            >
              <div className="p-4 border border-green-500/50 bg-green-500/10 rounded-xl mr-4 group-hover:bg-green-500/20 transition-all duration-300">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg group-hover:text-green-300 transition-colors">View Billing</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Manage payments</p>
              </div>
            </Link>

            <Link
              href="/provider/accommodations"
              className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20"
            >
              <div className="p-4 border border-purple-500/50 bg-purple-500/10 rounded-xl mr-4 group-hover:bg-purple-500/20 transition-all duration-300">
                <Building className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors">Manage Properties</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Edit your listings</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Billing Status */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Billing Status</h2>
          <div className="flex items-center justify-between p-6 border border-green-500/50 bg-green-500/10 backdrop-blur-xl rounded-xl">
            <div className="flex items-center space-x-4">
              <div className="w-4 h-4 bg-green-400 rounded-full shadow-lg shadow-green-500/50"></div>
              <div>
                <p className="font-semibold text-white text-lg">Account in Good Standing</p>
                <p className="text-neutral-400">
                  Loading payment info...
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-white text-xl">
                R0
              </p>
              <p className="text-neutral-400">Monthly fee</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
