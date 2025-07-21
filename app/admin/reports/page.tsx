"use client"

import { useState, useEffect } from "react"
import { Flag, Eye, CheckCircle, XCircle, AlertTriangle, Trash2, Ban, Clock } from "lucide-react"
import { StudentAuthService, type ReviewReport } from "@/lib/student-auth"

export default function ReportsPage() {
  const [reports, setReports] = useState<ReviewReport[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "reviewed" | "resolved">("all")
  const [selectedReport, setSelectedReport] = useState<ReviewReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = () => {
    setIsLoading(true)
    const allReports = StudentAuthService.getReports()
    setReports(allReports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setIsLoading(false)
  }

  const filteredReports = reports.filter((report) => {
    if (filter === "all") return true
    return report.status === filter
  })

  const handleAction = (reportId: string, action: ReviewReport["action"], status: ReviewReport["status"]) => {
    const success = StudentAuthService.updateReportStatus(reportId, status, action, "Admin")

    if (success) {
      // If blocking user, also block them in the system
      if (action === "block_user") {
        const report = reports.find((r) => r.id === reportId)
        if (report) {
          // Find the student who wrote the review and block them
          const students = StudentAuthService.getStudents()
          const reviewAuthor = students.find((s) => s.name === getReviewAuthor(report.reviewId))
          if (reviewAuthor) {
            StudentAuthService.blockStudent(reviewAuthor.id, `Reported for: ${report.reason}`)
          }
        }
      }

      loadReports()
      setSelectedReport(null)
    }
  }

  const getReviewAuthor = (reviewId: number): string => {
    // This would normally fetch from your reviews data
    // For demo, we'll return a placeholder
    return "Review Author"
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
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Reports</h1>
          <p className="text-gray-600">Manage reported reviews and take moderation actions</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filter:</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Reports</option>
            <option value="pending">Pending</option>
            <option value="reviewed">Reviewed</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Reviewed</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "reviewed").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports.filter((r) => r.status === "resolved").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Flag className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{reports.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {filteredReports.length === 0 ? (
          <div className="p-12 text-center">
            <Flag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {filter === "all" ? "No reports have been submitted yet." : `No ${filter} reports found.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reporter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-red-100 rounded-lg mr-3">
                          {getReasonIcon(report.reason)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{getReasonLabel(report.reason)}</div>
                          <div className="text-sm text-gray-500">Review ID: {report.reviewId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{report.reporterName}</div>
                      <div className="text-sm text-gray-500 capitalize">{report.reporterType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          report.status
                        )}`}
                      >
                        {getStatusIcon(report.status)}
                        <span className="ml-1 capitalize">{report.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold">Report Details</h2>
              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report ID</label>
                    <p className="text-sm text-gray-900">{selectedReport.id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Review ID</label>
                    <p className="text-sm text-gray-900">{selectedReport.reviewId}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reporter</label>
                    <p className="text-sm text-gray-900">{selectedReport.reporterName}</p>
                    <p className="text-xs text-gray-500 capitalize">{selectedReport.reporterType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <div className="flex items-center space-x-2">
                    {getReasonIcon(selectedReport.reason)}
                    <span className="text-sm text-gray-900">{getReasonLabel(selectedReport.reason)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedReport.description}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedReport.status
                    )}`}
                  >
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-1 capitalize">{selectedReport.status}</span>
                  </span>
                </div>

                {selectedReport.status === "pending" && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Take Action</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleAction(selectedReport.id, "none", "dismissed")}
                        className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => handleAction(selectedReport.id, "warning", "resolved")}
                        className="flex items-center justify-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Issue Warning
                      </button>\
