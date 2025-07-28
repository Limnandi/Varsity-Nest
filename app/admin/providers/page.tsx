"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { DocumentViewer } from "@/components/DocumentViewer"
import { Building, Eye, Check, X, AlertTriangle, Download } from "lucide-react"

interface PendingProvider {
  id: string
  name: string
  email: string
  companyName: string
  submittedAt: string
  documents: string[]
  status: "pending" | "approved" | "rejected"
}

export default function ProvidersPage() {
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [currentDocuments, setCurrentDocuments] = useState<Array<{
    url: string
    name: string
    type: string
  }>>([])

  useEffect(() => {
    fetchPendingProviders()
  }, [])

  const fetchPendingProviders = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: PendingProvider[] = [
        {
          id: "1",
          name: "John Smith",
          email: "john@example.com",
          companyName: "Smith Student Housing",
          submittedAt: "2024-01-15T10:30:00Z",
          documents: ["certificate1.pdf", "license.jpg"],
          status: "pending",
        },
        {
          id: "2",
          name: "Sarah Johnson",
          email: "sarah@housing.com",
          companyName: "Johnson Properties",
          submittedAt: "2024-01-14T14:20:00Z",
          documents: ["accreditation.pdf"],
          status: "pending",
        },
      ]
      setPendingProviders(mockData)
    } catch (error) {
      console.error("Error fetching pending providers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (providerId: string) => {
    try {
      // API call to approve provider
      console.log("Approving provider:", providerId)

      setPendingProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, status: "approved" } : p)))

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
      // API call to reject provider
      console.log("Rejecting provider:", providerId, "Reason:", reason)

      setPendingProviders((prev) => prev.map((p) => (p.id === providerId ? { ...p, status: "rejected" } : p)))

      alert("Provider rejected successfully!")
    } catch (error) {
      console.error("Error rejecting provider:", error)
      alert("Failed to reject provider")
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

  if (loading) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <DocumentViewer
            documents={currentDocuments}
            isOpen={documentModalOpen}
            onClose={() => setDocumentModalOpen(false)}
          />
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
              <h1 className="text-2xl font-bold text-gray-900">Provider Applications</h1>
              <p className="text-gray-600">Review and approve provider registration requests</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-yellow-800 font-medium">
                  {pendingProviders.filter((p) => p.status === "pending").length} pending applications
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Pending Applications</h2>

              {pendingProviders.filter((p) => p.status === "pending").length === 0 ? (
                <div className="text-center py-8">
                  <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No pending applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProviders
                    .filter((p) => p.status === "pending")
                    .map((provider) => (
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
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Actions */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Recent Actions</h2>
              <div className="space-y-3">
                {pendingProviders
                  .filter((p) => p.status !== "pending")
                  .map((provider) => (
                    <div key={provider.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="w-6 h-6 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">{provider.companyName}</p>
                          <p className="text-sm text-gray-600">{provider.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            provider.status === "approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                          }`}
                        >
                          {provider.status === "approved" ? "Approved" : "Rejected"}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
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
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  )
}
