"use client"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { DocumentViewer } from "@/components/DocumentViewer"
import { useState, useEffect } from "react"
import { Building, Users, DollarSign, TrendingUp, Eye, Plus, AlertTriangle } from "lucide-react"
import { formatZar } from "@/lib/utils"

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalAccommodations: number
    totalProviders: number
    totalRevenue: number
    totalViews: number
    accommodationsChange: number
    providersChange: number
    revenueChange: number
    viewsChange: number
  }>({
    totalAccommodations: 0,
    totalProviders: 0,
    totalRevenue: 0,
    totalViews: 0,
    accommodationsChange: 0,
    providersChange: 0,
    revenueChange: 0,
    viewsChange: 0
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
      try {
        const [statsRes, activityRes, approvalsRes] = await Promise.all([
          fetch('/api/admin/providers'),
          fetch('/api/admin/providers?type=activity'),
          fetch('/api/admin/providers?type=approvals')
        ])
        
        if (!statsRes.ok || !activityRes.ok || !approvalsRes.ok) throw new Error('Failed to fetch data')
        
        const { stats, accommodations } = await statsRes.json()
        const { activities } = await activityRes.json()
        const { approvals } = await approvalsRes.json()
        
        setStats(stats)
        setTopAccommodations(accommodations)
        setRecentActivity(activities)
        setPendingApprovals(approvals)
      } catch (error) {
        console.error('Dashboard data fetch error:', error)
      }
    }
    fetchData()
  }, [])

  const statsData = [
    {
      title: "Total Accommodations",
      value: stats?.totalAccommodations || 0,
      icon: Building,
      color: "bg-blue-500",
      change: `${stats?.accommodationsChange >= 0 ? '+' : ''}${stats?.accommodationsChange || 0}% from last month`,
    },
    {
      title: "Active Providers",
      value: stats.totalProviders || 0,
      icon: Users,
      color: "bg-green-500",
      change: `${(stats.providersChange || 0) >= 0 ? '+' : ''}${stats.providersChange || 0}% this month`,
    },
    {
      title: "Monthly Revenue",
      value: formatZar(stats.totalRevenue || 0, true),
      icon: DollarSign,
      color: "bg-purple-500",
      change: `${(stats.revenueChange || 0) >= 0 ? '+' : ''}${stats.revenueChange || 0}% from last month`,
    },
    {
      title: "Total Views",
      value: (stats.totalViews || 0).toLocaleString(),
      icon: Eye,
      color: "bg-orange-500",
      change: `${(stats.viewsChange || 0) >= 0 ? '+' : ''}${stats.viewsChange || 0}% this week`,
    },
  ]


  const [recentActivity, setRecentActivity] = useState<Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>>([])

  const [pendingApprovals, setPendingApprovals] = useState<Array<{
    id: string
    type: string
    title: string
    provider: string
    status: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionMessage, setActionMessage] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [currentDocuments, setCurrentDocuments] = useState<Array<{
    url: string
    name: string
    type: string
  }>>([])

  const handleViewDocuments = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'view-documents',
          providerId: id
        })
      })
      if (!response.ok) throw new Error('Failed to load documents')
      const { documents } = await response.json()
      setCurrentDocuments(documents)
      setDocumentModalOpen(true)
    } catch (error) {
      setActionMessage({type: 'error', message: 'Failed to load documents'})
    } finally {
      setIsLoading(false)
    }
  }


  const handleApprove = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          providerId: id
        })
      })
      if (!response.ok) throw new Error('Approval failed')
      setPendingApprovals(pendingApprovals.filter(item => item.id !== id))
      setActionMessage({type: 'success', message: 'Provider approved successfully'})
    } catch (error) {
      setActionMessage({type: 'error', message: 'Approval failed'})
    } finally {
      setIsLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          providerId: id
        })
      })
      if (!response.ok) throw new Error('Rejection failed')
      setPendingApprovals(pendingApprovals.filter(item => item.id !== id))
      setActionMessage({type: 'success', message: 'Provider rejected'})
    } catch (error) {
      setActionMessage({type: 'error', message: 'Rejection failed'})
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DocumentViewer
        documents={currentDocuments}
        isOpen={documentModalOpen}
        onClose={() => setDocumentModalOpen(false)}
      />
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
        <div className="space-y-8 p-6">
          {/* Welcome Section */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/20">
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Admin Dashboard</h1>
            <p className="text-neutral-300 text-lg">Monitor and manage the Varsity-Nest platform</p>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <button className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-blue-500/20 text-left">
                <div className="p-4 border border-blue-500/50 bg-blue-500/10 rounded-xl mr-4 group-hover:bg-blue-500/20 transition-all duration-300">
                  <Plus className="w-8 h-8 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-blue-300 transition-colors">Add Accommodation</h3>
                  <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Create new listing</p>
                </div>
              </button>

              <button className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-green-500/20 text-left">
                <div className="p-4 border border-green-500/50 bg-green-500/10 rounded-xl mr-4 group-hover:bg-green-500/20 transition-all duration-300">
                  <Users className="w-8 h-8 text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-green-300 transition-colors">Manage Providers</h3>
                  <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">View all providers</p>
                </div>
              </button>

              <button className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-purple-500/20 text-left">
                <div className="p-4 border border-purple-500/50 bg-purple-500/10 rounded-xl mr-4 group-hover:bg-purple-500/20 transition-all duration-300">
                  <TrendingUp className="w-8 h-8 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors">View Analytics</h3>
                  <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Platform insights</p>
                </div>
              </button>

              <button className="group flex items-center p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl hover:bg-white/5 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/20 text-left">
                <div className="p-4 border border-orange-500/50 bg-orange-500/10 rounded-xl mr-4 group-hover:bg-orange-500/20 transition-all duration-300">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg group-hover:text-orange-300 transition-colors">Pending Reviews</h3>
                  <p className="text-neutral-400 group-hover:text-neutral-300 transition-colors">Approve listings</p>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activity */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Recent Activity</h2>
              <div className="space-y-6">
                {recentActivity?.map((activity) => activity && (
                  <div key={activity.id} className="flex items-start space-x-4">
                    <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 shadow-lg shadow-blue-500/50"></div>
                    <div className="flex-1">
                      <p className="text-neutral-300">{activity.message}</p>
                      <p className="text-sm text-neutral-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pending Provider Approvals */}
            <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Pending Provider Approvals</h2>
              <div className="space-y-6">
                {pendingApprovals?.map((item) => item && (
                  <div key={item.id} className="flex items-center justify-between p-6 border border-yellow-500/50 bg-yellow-500/10 backdrop-blur-xl rounded-xl">
                    <div>
                      <p className="font-semibold text-white text-lg">{item.title}</p>
                      <p className="text-neutral-400">{item.provider}</p>
                      <div className="mt-3">
                        <button
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                          onClick={() => handleViewDocuments(item.id)}
                          disabled={isLoading}
                        >
                          View Documents
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors shadow-lg"
                        onClick={() => handleApprove(item.id)}
                        disabled={isLoading}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700 transition-colors shadow-lg"
                        onClick={() => handleReject(item.id)}
                        disabled={isLoading}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Accommodations */}
          <div className="relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-8 text-white shadow-2xl shadow-blue-500/10">
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Top Performing Accommodations</h2>
            <div className="space-y-6">
              {topAccommodations?.map((accommodation) => accommodation && (
                <div key={accommodation.id} className="flex items-center justify-between p-6 border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl">
                  <div className="flex items-center space-x-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl border border-white/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-400 rounded-lg"></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white text-lg">{accommodation.title}</h3>
                      <p className="text-neutral-400">{accommodation.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400 text-lg">{formatZar(accommodation.price || 0)}/month</p>
                    <p className="text-sm text-neutral-500">{accommodation.reviewCount} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </DashboardLayout>
      </AuthGuard>
    </>
  )
}
