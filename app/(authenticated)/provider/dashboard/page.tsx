"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { Building, Users, Settings, DollarSign } from "lucide-react"
import { formatZar } from "@/lib/utils"

export default function ProviderDashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalAccommodations: 0,
    activeBookings: 0,
    totalRevenue: 0,
    averageRating: 0,
    averageReviewRating: 0,
    pendingReviews: 0,
    upcomingMaintenance: 0,
    totalReviews: 0,
    pendingBookings: 0
  })
  const [billingInfo, setBillingInfo] = useState<{
    monthlyFee: number
    subscriptionStatus: string
    nextPaymentDate: string
  } | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        // Get current user from secure session API
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          // Fetch stats and billing info in parallel
          const [statsResponse, billingResponse] = await Promise.all([
            fetch('/api/provider/stats', { credentials: 'include' }),
            fetch('/api/provider/billing', { credentials: 'include' }).catch(() => null)
          ])
          
          if (statsResponse.ok) {
            const data = await statsResponse.json()
            setStats(data.stats || {
              totalAccommodations: 0,
              activeBookings: 0,
              totalRevenue: 0,
              averageRating: 0,
              averageReviewRating: 0,
              pendingReviews: 0,
              upcomingMaintenance: 0,
              totalReviews: 0,
              pendingBookings: 0
            })
          } else {
            console.error('Failed to fetch provider stats:', statsResponse.statusText)
            setStats({
              totalAccommodations: 0,
              activeBookings: 0,
              totalRevenue: 0,
              averageRating: 0,
              averageReviewRating: 0,
              pendingReviews: 0,
              upcomingMaintenance: 0,
              totalReviews: 0,
              pendingBookings: 0
            })
          }

          // Fetch billing info if available
          if (billingResponse && billingResponse.ok) {
            const billingData = await billingResponse.json()
            if (billingData.provider?.billingInfo) {
              setBillingInfo({
                monthlyFee: billingData.provider.billingInfo.monthlyFee || 0,
                subscriptionStatus: billingData.provider.billingInfo.subscriptionStatus || 'inactive',
                nextPaymentDate: billingData.provider.billingInfo.nextPaymentDate || new Date().toISOString()
              })
            }
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
      change: `${stats.totalAccommodations} properties`,
    },
    {
      title: "Average Rating",
      value: stats.averageReviewRating > 0 ? `${stats.averageReviewRating.toFixed(1)} stars` : "No ratings",
      icon: Users,
      color: "bg-purple-500",
      change: `${stats.totalReviews || 0} reviews`,
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout userRole="provider">
        <div className="space-y-8 p-6">
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-gray-700 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-gray-700 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-48 bg-gray-700 rounded-2xl"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout userRole="provider">
      <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 overflow-x-hidden">
        {/* Welcome Section */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/20">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Welcome back!</h1>
          <p className="text-neutral-300 text-base sm:text-lg break-words">Manage your accommodations and track your performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {statsData.map((stat, index) => (
            <div key={index} className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center justify-between min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-neutral-400 mb-2 break-words">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-bold text-white mb-1 break-words">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-neutral-500 break-words">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-2 sm:p-3 rounded-xl shadow-lg flex-shrink-0 ml-2`}>
                  <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Link
              href="/provider/accommodations/new"
              className="group flex items-center p-4 sm:p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20 min-w-0"
            >
              <div className="p-3 sm:p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl mr-3 sm:mr-4 group-hover:bg-blue-500/20 transition-all duration-300 flex-shrink-0">
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base sm:text-lg group-hover:text-blue-300 transition-colors break-words">Add New Accommodation</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors text-sm sm:text-base break-words">List a new property</p>
              </div>
            </Link>

            <Link
              href="/provider/billing"
              className="group flex items-center p-4 sm:p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-green-500/20 min-w-0"
            >
              <div className="p-3 sm:p-4 border border-green-500/50 bg-green-500/10 rounded-xl mr-3 sm:mr-4 group-hover:bg-green-500/20 transition-all duration-300 flex-shrink-0">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base sm:text-lg group-hover:text-green-300 transition-colors break-words">View Billing</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors text-sm sm:text-base break-words">Manage payments</p>
              </div>
            </Link>

            <Link
              href="/provider/accommodations"
              className="group flex items-center p-4 sm:p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20 min-w-0"
            >
              <div className="p-3 sm:p-4 border border-purple-500/50 bg-purple-500/10 rounded-xl mr-3 sm:mr-4 group-hover:bg-purple-500/20 transition-all duration-300 flex-shrink-0">
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base sm:text-lg group-hover:text-purple-300 transition-colors break-words">Manage Properties</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors text-sm sm:text-base break-words">Edit your listings</p>
              </div>
            </Link>

            <Link
              href="/provider/settings"
              className="group flex items-center p-4 sm:p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/20 min-w-0"
            >
              <div className="p-3 sm:p-4 border border-orange-500/50 bg-orange-500/10 rounded-xl mr-3 sm:mr-4 group-hover:bg-orange-500/20 transition-all duration-300 flex-shrink-0">
                <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-base sm:text-lg group-hover:text-orange-300 transition-colors break-words">Settings</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors text-sm sm:text-base break-words">Manage your preferences</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Billing Status */}
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Billing Status</h2>
          {billingInfo ? (
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border backdrop-blur-xl rounded-xl ${
              billingInfo.subscriptionStatus === 'active' 
                ? 'border-green-500/50 bg-green-500/10' 
                : billingInfo.subscriptionStatus === 'trial'
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-orange-500/50 bg-orange-500/10'
            }`}>
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className={`w-4 h-4 rounded-full shadow-lg flex-shrink-0 ${
                  billingInfo.subscriptionStatus === 'active' 
                    ? 'bg-green-400 shadow-green-500/50' 
                    : billingInfo.subscriptionStatus === 'trial'
                    ? 'bg-blue-400 shadow-blue-500/50'
                    : 'bg-orange-400 shadow-orange-500/50'
                }`}></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-base sm:text-lg break-words">
                    {billingInfo.subscriptionStatus === 'active' ? 'Account Active' :
                     billingInfo.subscriptionStatus === 'trial' ? 'Trial Period' :
                     'Subscription Inactive'}
                  </p>
                  <p className="text-neutral-400 text-sm sm:text-base break-words">
                    Next payment: {new Date(billingInfo.nextPaymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto">
                <p className="font-bold text-white text-lg sm:text-xl break-words">
                  {formatZar(billingInfo.monthlyFee, true)}
                </p>
                <p className="text-neutral-400 text-sm sm:text-base break-words">Monthly fee</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl">
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50 flex-shrink-0"></div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white text-base sm:text-lg break-words">No Active Subscription</p>
                  <p className="text-neutral-400 text-sm sm:text-base break-words">
                    Complete your first payment to activate
                  </p>
                </div>
              </div>
              <Link
                href="/provider/billing/payment"
                className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105 text-sm sm:text-base text-center w-full sm:w-auto break-words"
              >
                Setup Payment
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
