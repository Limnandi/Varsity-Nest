"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { DocumentViewer } from "@/components/DocumentViewer"
import { Building, Eye, Check, X, Trash2, Users, Clock } from "lucide-react"

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
    <div key={provider.id} className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-4 sm:p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1 min-w-0 w-full sm:w-auto">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg flex-shrink-0">
              <Building className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-base sm:text-lg break-words">{provider.companyName}</h3>
              <p className="text-xs sm:text-sm text-neutral-300 break-words">
                {provider.name} • {provider.email}
              </p>
              <p className="text-xs text-neutral-400 break-words">
                Submitted: {new Date(provider.submittedAt).toLocaleDateString()}
              </p>
              {!isPending && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full border break-words ${
                    provider.isActive ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-red-500/20 text-red-400 border-red-500/50'
                  }`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border break-words ${
                    provider.isVerified ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-neutral-500/20 text-neutral-400 border-neutral-500/50'
                  }`}>
                    {provider.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {provider.documents.length > 0 && (
            <div className="mt-4 ml-0 sm:ml-11">
              <p className="text-xs sm:text-sm font-medium text-neutral-300 mb-2 break-words">Documents:</p>
              <div className="flex flex-wrap gap-2">
                {provider.documents.map((doc, index) => (
                  <button
                    key={index}
                    className="flex items-center gap-1 border border-white/20 bg-white/10 hover:bg-white/20 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-all duration-300 hover:scale-105 break-words"
                    onClick={() => handleViewDocuments([doc])}
                  >
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                    <span className="text-white break-words">View {doc.split('.').pop()?.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setSelectedProvider(provider)}
            className="flex items-center gap-1 border border-blue-500/50 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[80px] justify-center break-words"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
            <span className="break-words">View</span>
          </button>
          
          {isPending ? (
            <>
              <button
                onClick={() => handleApprove(provider.id)}
                className="flex items-center gap-1 border border-green-500/50 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[80px] justify-center break-words"
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words">Approve</span>
              </button>
              <button
                onClick={() => handleReject(provider.id)}
                className="flex items-center gap-1 border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[80px] justify-center break-words"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-words">Reject</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleDelete(provider.id)}
              className="flex items-center gap-1 border border-red-500/50 bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:scale-105 text-xs sm:text-sm flex-1 sm:flex-initial min-w-[80px] justify-center break-words"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="break-words">Delete</span>
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
        <div className="space-y-4 sm:space-y-6 p-4 sm:p-6 overflow-x-hidden">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Provider Management</h1>
              <p className="text-neutral-300 text-sm sm:text-base break-words">Manage provider applications and current providers</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 overflow-x-auto">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 min-w-max">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">Pending ({pendingProviders.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-neutral-400 hover:text-white hover:border-white/30'
                }`}
              >
                <div className="flex items-center gap-1 sm:gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">Current ({currentProviders.length})</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10">
            <div className="p-4 sm:p-6">
              {activeTab === 'pending' ? (
                <>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white break-words">Pending Applications</h2>
                  {pendingProviders.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                        <Building className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <p className="text-neutral-300 text-base sm:text-lg break-words">No pending applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProviders.map((provider) => renderProviderCard(provider, true))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-white break-words">Current Providers</h2>
                  {currentProviders.length === 0 ? (
                    <div className="text-center py-8 sm:py-12">
                      <div className="mx-auto flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                        <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                      </div>
                      <p className="text-neutral-300 text-base sm:text-lg break-words">No current providers</p>
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
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent break-words">Provider Details</h2>
                    <button onClick={() => setSelectedProvider(null)} className="p-2 border border-white/20 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110 flex-shrink-0">
                      <X className="w-4 h-4 sm:w-5 sm:h-5 text-neutral-400 hover:text-white" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 break-words">Company Name</label>
                      <p className="text-white text-base sm:text-lg break-words">{selectedProvider.companyName}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 break-words">Contact Person</label>
                      <p className="text-white text-base sm:text-lg break-words">{selectedProvider.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 break-words">Email</label>
                      <p className="text-white text-base sm:text-lg break-words">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1 break-words">Submitted</label>
                      <p className="text-white text-base sm:text-lg break-words">{new Date(selectedProvider.submittedAt).toLocaleString()}</p>
                    </div>

                    {selectedProvider.documents.length > 0 && (
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-2 break-words">Documents</label>
                        <div className="space-y-2">
                          {selectedProvider.documents.map((doc, index) => (
                            <button
                              key={index}
                              className="flex items-center gap-2 w-full text-left p-2 sm:p-3 border border-white/20 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-[1.02] break-words"
                              onClick={() => handleViewDocuments([doc])}
                            >
                              <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                              <span className="text-white text-sm sm:text-base break-words">View {doc.split('.').pop()?.toUpperCase()}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    {activeTab === 'pending' ? (
                      <>
                        <button
                          onClick={() => {
                            handleApprove(selectedProvider.id)
                            setSelectedProvider(null)
                          }}
                          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-2 sm:py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 font-medium hover:scale-105 text-sm sm:text-base break-words"
                        >
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleReject(selectedProvider.id)
                            setSelectedProvider(null)
                          }}
                          className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 sm:py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium hover:scale-105 text-sm sm:text-base break-words"
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
                        className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white py-2 sm:py-3 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-300 font-medium hover:scale-105 text-sm sm:text-base break-words"
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