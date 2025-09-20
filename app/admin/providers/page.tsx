"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { DocumentViewer } from "@/components/DocumentViewer"
import { Building, Eye, Check, X, AlertTriangle, Trash2, Users, Clock } from "lucide-react"

interface Provider {
  id: string
  name: string
  email: string
  companyName: string
  submittedAt: string
  documents: string[]
  status: "pending" | "approved" | "rejected"
  phone?: string
  address?: string
  isActive?: boolean
  isVerified?: boolean
}

export default function ProvidersPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'current'>('pending')
  const [pendingProviders, setPendingProviders] = useState<Provider[]>([])
  const [currentProviders, setCurrentProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [currentDocuments, setCurrentDocuments] = useState<Array<{
    url: string
    name: string
    type: string
  }>>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [pendingRes, currentRes] = await Promise.all([
        fetch('/api/admin/providers?type=pending'),
        fetch('/api/admin/providers?type=current')
      ])
      
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json()
        setPendingProviders(pendingData.providers || [])
      }
      
      if (currentRes.ok) {
        const currentData = await currentRes.json()
        setCurrentProviders(currentData.providers || [])
      }
    } catch (error) {
      console.error("Error fetching providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (providerId: string) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          providerId: providerId
        })
      })

      if (!response.ok) throw new Error('Failed to approve provider')

      setPendingProviders((prev) => prev.filter((p) => p.id !== providerId))
      await fetchData() // Refresh current providers
      alert("Provider approved successfully!")
    } catch (error) {
      console.error("Error approving provider:", error)
      alert("Failed to approve provider")
    }
  }

  const handleReject = async (providerId: string) => {
    const reason = prompt("Please provide a reason for rejection:")
    if (!reason) return

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          providerId: providerId,
          reason: reason
        })
      })

      if (!response.ok) throw new Error('Failed to reject provider')

      setPendingProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, status: "rejected" } : p)))
      alert("Provider rejected successfully!")
    } catch (error) {
      console.error("Error rejecting provider:", error)
      alert("Failed to reject provider")
    }
  }

  const handleDelete = async (providerId: string) => {
    if (!confirm("Are you sure you want to delete this provider? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          providerId: providerId
        })
      })

      if (!response.ok) throw new Error('Failed to delete provider')

      setCurrentProviders((prev) => prev.filter((p) => p.id !== providerId))
      alert("Provider deleted successfully!")
    } catch (error) {
      console.error("Error deleting provider:", error)
      alert("Failed to delete provider")
    }
  }

  const handleViewDocuments = (documents: string[]) => {
    setCurrentDocuments(documents.map(doc => ({
      url: doc,
      name: doc.split('/').pop() || 'Document',
      type: doc.endsWith('.pdf') ? 'application/pdf' :
            doc.match(/\.(jpg|jpeg|png|gif)$/) ? 'image/' + doc.split('.').pop() :
            'application/octet-stream'
    })))
    setDocumentModalOpen(true)
  }

  const renderProviderCard = (provider: Provider, isPending: boolean = false) => (
    <div key={provider.id} className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
              <Building className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-lg">{provider.companyName}</h3>
              <p className="text-sm text-neutral-300">
                {provider.name} • {provider.email}
              </p>
              <p className="text-xs text-neutral-400">
                Submitted: {new Date(provider.submittedAt).toLocaleDateString()}
              </p>
              {!isPending && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    provider.isActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'
                  }`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    provider.isVerified ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-neutral-500/20 text-neutral-400 border-neutral-500/50'
                  }`}>
                    {provider.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {provider.documents.length > 0 && (
            <div className="mt-4 ml-11">
              <p className="text-sm font-medium text-neutral-300 mb-2">Documents:</p>
              <div className="flex flex-wrap gap-2">
                {provider.documents.map((doc, index) => (
                  <button
                    key={index}
                    className="flex items-center space-x-1 border border-white/20 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg text-sm transition-all duration-300 hover:scale-105"
                    onClick={() => handleViewDocuments([doc])}
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-white">View {doc.split('.').pop()?.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedProvider(provider)}
            className="flex items-center space-x-1 border border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          {isPending ? (
            <>
              <button
                onClick={() => handleApprove(provider.id)}
                className="flex items-center space-x-1 border border-green-500/50 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleReject(provider.id)}
                className="flex items-center space-x-1 border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleDelete(provider.id)}
              className="flex items-center space-x-1 border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-3 py-2 rounded-lg transition-all duration-300 hover:scale-105"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Provider Management</h1>
              <p className="text-neutral-300">Manage provider applications and current providers</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Approvals ({pendingProviders.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-300 ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Current Providers ({currentProviders.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10">
            <div className="p-6">
              {activeTab === 'pending' ? (
                <>
                  <h2 className="text-xl font-semibold mb-6 text-white">Pending Applications</h2>
                  {pendingProviders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                        <Building className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-neutral-300 text-lg">No pending applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProviders.map((provider) => renderProviderCard(provider, true))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-6 text-white">Current Providers</h2>
                  {currentProviders.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                        <Users className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-neutral-300 text-lg">No current providers</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentProviders.map((provider) => renderProviderCard(provider, false))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Provider Details Modal */}
          {selectedProvider && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
              <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-blue-500/20">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Provider Details</h2>
                    <button onClick={() => setSelectedProvider(null)} className="p-2 border border-white/20 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110">
                      <X className="w-5 h-5 text-neutral-400 hover:text-white" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Company Name</label>
                      <p className="text-white text-lg">{selectedProvider.companyName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Contact Person</label>
                      <p className="text-white text-lg">{selectedProvider.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Email</label>
                      <p className="text-white text-lg">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Submitted</label>
                      <p className="text-white text-lg">{new Date(selectedProvider.submittedAt).toLocaleString()}</p>
                    </div>

                    {selectedProvider.documents.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2">Documents</label>
                        <div className="space-y-2">
                          {selectedProvider.documents.map((doc, index) => (
                            <button
                              key={index}
                              className="flex items-center space-x-2 w-full text-left p-3 border border-white/20 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-[1.02]"
                              onClick={() => handleViewDocuments([doc])}
                            >
                              <Eye className="w-5 h-5 text-blue-400" />
                              <span className="text-white">View {doc.split('.').pop()?.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 mt-6">
                    {activeTab === 'pending' ? (
                      <>
                        <button
                          onClick={() => {
                            handleApprove(selectedProvider.id)
                            setSelectedProvider(null)
                          }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium hover:scale-105"
                        >
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleReject(selectedProvider.id)
                            setSelectedProvider(null)
                          }}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium hover:scale-105"
                        >
                          Reject Application
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleDelete(selectedProvider.id)
                          setSelectedProvider(null)
                        }}
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium hover:scale-105"
                      >
                        Delete Provider
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DocumentViewer
            documents={currentDocuments}
            isOpen={documentModalOpen}
            onClose={() => setDocumentModalOpen(false)}
          />
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}