"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DashboardLayout from "@/components/DashboardLayout"
import { Building, Users, TrendingUp, DollarSign, Settings } from "lucide-react"
import { formatZar } from "@/lib/utils"

export default function AgentDashboard() {
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
        const response = await fetch('/api/auth/session')
        
        if (response.ok) {
          const [statsResponse, billingResponse] = await Promise.all([
            fetch('/api/agent/stats', { credentials: 'include' }),
            fetch('/api/agent/billing', { credentials: 'include' }).catch(() => null)
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
            console.error('Failed to fetch agent stats:', statsResponse.statusText)
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

          if (billingResponse && billingResponse.ok) {
            const billingData = await billingResponse.json()
            if (billingData.agent?.billingInfo) {
              setBillingInfo({
                monthlyFee: billingData.agent.billingInfo.monthlyFee || 0,
                subscriptionStatus: billingData.agent.billingInfo.subscriptionStatus || 'inactive',
                nextPaymentDate: billingData.agent.billingInfo.nextPaymentDate || new Date().toISOString()
              })
            }
          }
        } else {
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
      title: "Monthly Revenue",
      value: formatZar(stats.totalRevenue, true),
      icon: DollarSign,
      color: "bg-green-500",
      change: billingInfo 
        ? `Next payment: ${new Date(billingInfo.nextPaymentDate).toLocaleDateString()}`
        : "No subscription active",
    },
    {
      title: "Average Rating",
      value: stats.averageReviewRating > 0 ? `${stats.averageReviewRating.toFixed(1)} stars` : "No ratings",
      icon: Users,
      color: "bg-purple-500",
      change: `${stats.totalReviews || 0} reviews`,
    },
    {
      title: "Active Bookings",
      value: stats.activeBookings,
      icon: TrendingUp,
      color: "bg-orange-500",
      change: `${stats.pendingBookings || 0} pending`,
    },
  ]

  if (isLoading) {
    return (
      <DashboardLayout userRole="agent">
        <div className="space-y-8 p-6">
          <div className="animate-pulse space-y-8">
            <div className="h-24 bg-gray-700 rounded-2xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
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
    <DashboardLayout userRole="agent">
      <div className="space-y-8 p-6">
        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Welcome back!</h1>
          <p className="text-neutral-300 text-lg">Manage your accommodations and track your performance</p>
        </div>

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

        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/agent/accommodations"
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

            <Link
              href="/agent/billing"
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
              href="/agent/settings"
              className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/20"
            >
              <div className="p-4 border border-orange-500/50 bg-orange-500/10 rounded-xl mr-4 group-hover:bg-orange-500/20 transition-all duration-300">
                <Settings className="w-8 h-8 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-lg group-hover:text-orange-300 transition-colors">Settings</h3>
                <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Manage your preferences</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
          <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Billing Status</h2>
          {billingInfo ? (
            <div className={`flex items-center justify-between p-6 border backdrop-blur-xl rounded-xl ${
              billingInfo.subscriptionStatus === 'active' 
                ? 'border-green-500/50 bg-green-500/10' 
                : billingInfo.subscriptionStatus === 'trial'
                ? 'border-blue-500/50 bg-blue-500/10'
                : 'border-orange-500/50 bg-orange-500/10'
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`w-4 h-4 rounded-full shadow-lg ${
                  billingInfo.subscriptionStatus === 'active' 
                    ? 'bg-green-400 shadow-green-500/50' 
                    : billingInfo.subscriptionStatus === 'trial'
                    ? 'bg-blue-400 shadow-blue-500/50'
                    : 'bg-orange-400 shadow-orange-500/50'
                }`}></div>
                <div>
                  <p className="font-semibold text-white text-lg">
                    {billingInfo.subscriptionStatus === 'active' ? 'Account Active' :
                     billingInfo.subscriptionStatus === 'trial' ? 'Trial Period' :
                     'Subscription Inactive'}
                  </p>
                  <p className="text-neutral-400">
                    Next payment: {new Date(billingInfo.nextPaymentDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-white text-xl">
                  {formatZar(billingInfo.monthlyFee, true)}
                </p>
                <p className="text-neutral-400">Monthly fee</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between p-6 border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="w-4 h-4 bg-blue-400 rounded-full shadow-lg shadow-blue-500/50"></div>
                <div>
                  <p className="font-semibold text-white text-lg">No Active Subscription</p>
                  <p className="text-neutral-400">
                    Complete your first payment to activate
                  </p>
                </div>
              </div>
              <Link
                href="/agent/billing/payment"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-105"
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

