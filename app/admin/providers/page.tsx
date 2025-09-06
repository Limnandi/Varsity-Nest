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
    <div key={provider.id} className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <Building className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{provider.companyName}</h3>
              <p className="text-sm text-gray-600">
                {provider.name} • {provider.email}
              </p>
              <p className="text-xs text-gray-500">
                Submitted: {new Date(provider.submittedAt).toLocaleDateString()}
              </p>
              {!isPending && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    provider.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    provider.isVerified ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {provider.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {provider.documents.length > 0 && (
            <div className="mt-3 ml-11">
              <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
              <div className="flex flex-wrap gap-2">
                {provider.documents.map((doc, index) => (
                  <button
                    key={index}
                    className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-lg text-sm transition-colors"
                    onClick={() => handleViewDocuments([doc])}
                  >
                    <Eye className="w-4 h-4" />
                    <span>View {doc.split('.').pop()?.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedProvider(provider)}
            className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>View</span>
          </button>
          
          {isPending ? (
            <>
              <button
                onClick={() => handleApprove(provider.id)}
                className="flex items-center space-x-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </button>
              <button
                onClick={() => handleReject(provider.id)}
                className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Reject</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => handleDelete(provider.id)}
              className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-2 rounded-lg transition-colors"
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
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Provider Management</h1>
              <p className="text-gray-600">Manage provider applications and current providers</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('pending')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Pending Approvals ({pendingProviders.length})</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('current')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'current'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              {activeTab === 'pending' ? (
                <>
                  <h2 className="text-lg font-semibold mb-4">Pending Applications</h2>
                  {pendingProviders.length === 0 ? (
                    <div className="text-center py-8">
                      <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No pending applications</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingProviders.map((provider) => renderProviderCard(provider, true))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold mb-4">Current Providers</h2>
                  {currentProviders.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No current providers</p>
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Provider Details</h2>
                    <button onClick={() => setSelectedProvider(null)} className="text-gray-400 hover:text-gray-600">
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Company Name</label>
                      <p className="text-gray-900">{selectedProvider.companyName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                      <p className="text-gray-900">{selectedProvider.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{selectedProvider.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Submitted</label>
                      <p className="text-gray-900">{new Date(selectedProvider.submittedAt).toLocaleString()}</p>
                    </div>

                    {selectedProvider.documents.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Documents</label>
                        <div className="space-y-2">
                          {selectedProvider.documents.map((doc, index) => (
                            <button
                              key={index}
                              className="flex items-center space-x-2 w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              onClick={() => handleViewDocuments([doc])}
                            >
                              <Eye className="w-5 h-5 text-blue-600" />
                              <span className="text-gray-900">View {doc.split('.').pop()?.toUpperCase()}</span>
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
                          className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleReject(selectedProvider.id)
                            setSelectedProvider(null)
                          }}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
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
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
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