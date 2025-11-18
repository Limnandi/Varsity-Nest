"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { Flag, Eye, CheckCircle, XCircle, AlertTriangle, Trash2, Ban, Clock } from "lucide-react"

interface ReviewReport {
  id: string
  reviewId: string
  reason: string
  description?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  adminId?: string
  adminNotes?: string
  createdAt: string
  updatedAt: string
  review: {
    content: string
    rating: number
  }
  reporter: {
    id: string
    name: string
    email: string
  }
  reviewAuthor: {
    name: string
    email: string
  }
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReviewReport[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved" | "dismissed">("pending")
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/reports?status=${filter}&limit=50&offset=0`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setReports(result.data)
        }
      } else {
        console.error('Failed to load reports:', response.statusText)
        setReports([])
      }
    } catch (error) {
      console.error('Error loading reports:', error)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (reportId: string, status: ReviewReport["status"], adminNotes?: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reportId,
          status,
          adminNotes
        })
      })

      if (response.ok) {
        await loadReports()
        setSelectedReport(null)
      } else {
        const error = await response.json()
        console.error('Failed to update report:', error)
        alert('Failed to update report. Please try again.')
      }
    } catch (error) {
      console.error('Error updating report:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const getStatusColor = (status: ReviewReport["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "reviewed":
        return "bg-blue-100 text-blue-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "dismissed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusIcon = (status: ReviewReport["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />
      case "reviewed":
        return <Eye className="w-4 h-4" />
      case "resolved":
        return <CheckCircle className="w-4 h-4" />
      case "dismissed":
        return <XCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case "inappropriate":
        return <Ban className="w-4 h-4" />
      case "spam":
        return <Trash2 className="w-4 h-4" />
      case "harassment":
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Flag className="w-4 h-4" />
    }
  }

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      inappropriate: "Inappropriate Language",
      spam: "Spam or Fake Review",
      harassment: "Harassment or Bullying",
      false_info: "False Information",
      personal_attack: "Personal Attack",
      other: "Other",
    }
    return labels[reason] || reason
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/4"></div>
          <div className="h-32 bg-white/20 rounded"></div>
          <div className="h-32 bg-white/20 rounded"></div>
          <div className="h-32 bg-white/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Review Reports</h1>
          <p className="text-neutral-300">Manage reported reviews and take moderation actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-neutral-300">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="all" className="bg-black text-white">All Reports</option>
            <option value="pending" className="bg-black text-white">Pending</option>
            <option value="reviewed" className="bg-black text-white">Reviewed</option>
            <option value="resolved" className="bg-black text-white">Resolved</option>
            <option value="dismissed" className="bg-black text-white">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Pending</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 bg-clip-text text-transparent">
                {reports.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Reviewed</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">
                {reports.filter((r) => r.status === "reviewed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-green-500/50 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Resolved</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">
                {reports.filter((r) => r.status === "resolved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-lg">
              <Flag className="w-6 h-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Total Reports</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-red-400 via-rose-500 to-red-600 bg-clip-text text-transparent">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
              <Flag className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
            <p className="text-neutral-300">
              {filter === "all" ? "No reports have been submitted yet." : `No ${filter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-white/10">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Report Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Review Author
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-white/10">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-all duration-300">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-lg mr-3">
                          {getReasonIcon(report.reason)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{getReasonLabel(report.reason)}</div>
                          <div className="text-sm text-neutral-300">Review ID: {report.reviewId}</div>
                          {report.review && (
                            <div className="text-xs text-neutral-400 mt-1 max-w-xs truncate">
                              &quot;{report.review.content}&quot;
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{report.reporter.name}</div>
                      <div className="text-sm text-neutral-300">{report.reporter.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">{report.reviewAuthor.name}</div>
                      <div className="text-sm text-neutral-300">{report.reviewAuthor.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        <span className="ml-1 capitalize">{report.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-400 hover:text-blue-300 mr-4 transition-colors duration-300"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 border border-white/20 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <XCircle className="w-5 h-5 text-neutral-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Report ID</label>
                    <p className="text-sm text-white">{selectedReport.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Review ID</label>
                    <p className="text-sm text-white">{selectedReport.reviewId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Reporter</label>
                    <p className="text-sm text-white">{selectedReport.reporter.name}</p>
                    <p className="text-xs text-neutral-300">{selectedReport.reporter.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1">Report Date</label>
                    <p className="text-sm text-white">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Reason</label>
                  <div className="flex items-center space-x-2">
                    {getReasonIcon(selectedReport.reason)}
                    <span className="text-sm text-white">{getReasonLabel(selectedReport.reason)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                  <p className="text-sm text-white bg-white/10 p-3 rounded-lg border border-white/20">{selectedReport.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Current Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedReport.status
                    )}`}
                  >
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-1 capitalize">{selectedReport.status}</span>
                  </span>
                </div>

                {selectedReport.status === "pending" && (
                  <div className="border-t border-white/10 pt-6">
                    <h3 className="text-lg font-medium text-white mb-4">Take Action</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAction(selectedReport.id, "dismissed")}
                        disabled={isUpdating}
                        className="flex items-center justify-center px-4 py-2 border border-white/20 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => handleAction(selectedReport.id, "resolved")}
                        disabled={isUpdating}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve Report
                      </button>
                      <button
                        onClick={() => handleAction(selectedReport.id, "reviewed")}
                        disabled={isUpdating}
                        className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Mark as Reviewed
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
