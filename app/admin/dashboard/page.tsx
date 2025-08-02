"use client"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { DocumentViewer } from "@/components/DocumentViewer"
import { useState, useEffect } from "react"
import { Building, Users, DollarSign, TrendingUp, Eye, Plus, AlertTriangle } from "lucide-react"

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
      value: `R${(stats.totalRevenue || 0).toLocaleString()}`,
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
                {recentActivity?.map((activity) => activity && (
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

            {/* Pending Provider Approvals */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Pending Provider Approvals</h2>
              <div className="space-y-4">
                {pendingApprovals?.map((item) => item && (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.title}</p>
                      <p className="text-sm text-gray-600">{item.provider}</p>
                      <div className="mt-2">
                        <button
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          onClick={() => handleViewDocuments(item.id)}
                          disabled={isLoading}
                        >
                          View Documents
                        </button>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                        onClick={() => handleApprove(item.id)}
                        disabled={isLoading}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h2 className="text-lg font-semibold mb-4">Top Performing Accommodations</h2>
            <div className="space-y-4">
              {topAccommodations?.map((accommodation) => accommodation && (
                <div key={accommodation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-300 rounded-lg"></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{accommodation.title}</h3>
                      <p className="text-sm text-gray-600">{accommodation.address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">R{(accommodation.price || 0).toLocaleString()}/month</p>
                    <p className="text-sm text-gray-500">{accommodation.reviewCount} reviews</p>
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
