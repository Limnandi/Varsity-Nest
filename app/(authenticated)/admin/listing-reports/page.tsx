"use client"

import { useEffect, useState } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { AlertTriangle, CheckCircle, Clock, Eye, Flag, MapPin, XCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface ListingReport {
  id: string
  accommodationId: string
  accommodationName: string
  accommodationAddress?: string | null
  reportType: string
  description: string
  status: "pending" | "investigating" | "resolved" | "dismissed"
  adminId?: string | null
  adminNotes?: string | null
  createdAt: string
  updatedAt: string
  reporter: {
    userId?: string | null
    role?: string | null
    name?: string | null
    email?: string | null
    phone?: string | null
  }
}

const getStatusColor = (status: ListingReport["status"]) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800"
    case "investigating":
      return "bg-blue-100 text-blue-800"
    case "resolved":
      return "bg-green-100 text-green-800"
    case "dismissed":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: ListingReport["status"]) => {
  switch (status) {
    case "pending":
      return <Clock className="w-4 h-4" />
    case "investigating":
      return <Eye className="w-4 h-4" />
    case "resolved":
      return <CheckCircle className="w-4 h-4" />
    case "dismissed":
      return <XCircle className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    location: "Location issue",
    images: "Misleading images",
    pricing: "Pricing/fees issue",
    owner: "Owner/provider issue",
    safety: "Safety/scam concern",
    other: "Other",
  }
  return labels[type] || type
}

export default function ListingReportsPage() {
  const [reports, setReports] = useState<ListingReport[]>([])
  const [filter, setFilter] = useState<"all" | "pending" | "investigating" | "resolved" | "dismissed">("pending")
  const [selectedReport, setSelectedReport] = useState<ListingReport | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/listing-reports?status=${filter}&limit=50&offset=0`, {
        credentials: "include",
      })
      if (!res.ok) {
        setReports([])
        return
      }
      const json = await res.json()
      if (json?.success && Array.isArray(json.data)) {
        setReports(json.data)
      } else {
        setReports([])
      }
    } catch (err) {
      console.error("Error loading listing reports:", err)
      setReports([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = async (reportId: string, status: ListingReport["status"], adminNotes?: string) => {
    setIsUpdating(true)
    try {
      const res = await fetch("/api/admin/listing-reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reportId, status, adminNotes }),
      })
      if (!res.ok) {
        const error = await res.json().catch(() => null)
        console.error("Failed to update listing report:", error)
        toast.error("Failed to update report. Please try again.")
        return
      }
      await loadReports()
      setSelectedReport(null)
    } catch (err) {
      console.error("Error updating listing report:", err)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/3"></div>
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
              <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                Listing Reports
              </h1>
              <p className="text-neutral-300">Investigate reports about listings (location, images, pricing, safety, etc.)</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-neutral-300">Filter:</span>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-2 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                <option value="all" className="bg-black text-white">
                  All
                </option>
                <option value="pending" className="bg-black text-white">
                  Pending
                </option>
                <option value="investigating" className="bg-black text-white">
                  Investigating
                </option>
                <option value="resolved" className="bg-black text-white">
                  Resolved
                </option>
                <option value="dismissed" className="bg-black text-white">
                  Dismissed
                </option>
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-2 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-300">Pending</p>
                  <p className="text-2xl font-bold text-white">{reports.filter((r) => r.status === "pending").length}</p>
                </div>
              </div>
            </div>
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
                  <Eye className="w-6 h-6 text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-300">Investigating</p>
                  <p className="text-2xl font-bold text-white">
                    {reports.filter((r) => r.status === "investigating").length}
                  </p>
                </div>
              </div>
            </div>
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-2 border border-green-500/50 bg-green-500/10 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-300">Resolved</p>
                  <p className="text-2xl font-bold text-white">{reports.filter((r) => r.status === "resolved").length}</p>
                </div>
              </div>
            </div>
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <div className="flex items-center">
                <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-lg">
                  <Flag className="w-6 h-6 text-red-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-neutral-300">Total</p>
                  <p className="text-2xl font-bold text-white">{reports.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
            {reports.length === 0 ? (
              <div className="p-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 mb-4">
                  <Flag className="w-8 h-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
                <p className="text-neutral-300">
                  {filter === "all" ? "No listing reports have been submitted yet." : `No ${filter} listing reports found.`}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Report
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Listing
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                        Reporter
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
                    {reports.map((r) => (
                      <tr key={r.id} className="hover:bg-white/5 transition-all duration-300">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-lg mr-3">
                              <AlertTriangle className="w-4 h-4 text-red-300" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{getTypeLabel(r.reportType)}</div>
                              <div className="text-xs text-neutral-400 max-w-xs truncate">{r.description || "—"}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white max-w-[280px] truncate">
                            <Link
                              href={`/listing/${r.accommodationId}`}
                              className="text-blue-300 hover:text-blue-200 underline underline-offset-2"
                            >
                              {r.accommodationName}
                            </Link>
                          </div>
                          {r.accommodationAddress ? (
                            <div className="text-xs text-neutral-400 flex items-center gap-1 max-w-[280px] truncate">
                              <MapPin className="w-3 h-3" />
                              {r.accommodationAddress}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{r.reporter?.name || "Anonymous"}</div>
                          <div className="text-xs text-neutral-300">{r.reporter?.email || "—"}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              r.status,
                            )}`}
                          >
                            {getStatusIcon(r.status)}
                            <span className="ml-1 capitalize">{r.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedReport(r)}
                            className="text-blue-400 hover:text-blue-300 transition-colors duration-300"
                          >
                            View details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Details modal */}
          {selectedReport && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl shadow-blue-500/20">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h2 className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Listing report details
                  </h2>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="p-2 border border-white/20 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110"
                    aria-label="Close report details"
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
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Status</label>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                            selectedReport.status,
                          )}`}
                        >
                          {getStatusIcon(selectedReport.status)}
                          <span className="ml-1 capitalize">{selectedReport.status}</span>
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Listing</label>
                      <p className="text-sm text-white">{selectedReport.accommodationName}</p>
                      <p className="text-xs text-neutral-400">ID: {selectedReport.accommodationId}</p>
                      <div className="mt-2">
                        <Link
                          href={`/listing/${selectedReport.accommodationId}`}
                          className="text-blue-300 hover:text-blue-200 underline underline-offset-2 text-sm"
                        >
                          Open listing
                        </Link>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Type</label>
                        <p className="text-sm text-white">{getTypeLabel(selectedReport.reportType)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-1">Report date</label>
                        <p className="text-sm text-white">{new Date(selectedReport.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-300 mb-1">Description</label>
                      <p className="text-sm text-white bg-white/10 p-3 rounded-lg border border-white/20">
                        {selectedReport.description || "—"}
                      </p>
                    </div>

                    <div className="border border-white/10 bg-black/20 rounded-xl p-4">
                      <label className="block text-sm font-medium text-neutral-300 mb-2">Reporter (optional)</label>
                      <p className="text-sm text-white">{selectedReport.reporter?.name || "Anonymous"}</p>
                      <p className="text-xs text-neutral-300">{selectedReport.reporter?.email || "—"}</p>
                      <p className="text-xs text-neutral-300">{selectedReport.reporter?.phone || "—"}</p>
                      <p className="text-xs text-neutral-400 mt-2">
                        User ID: {selectedReport.reporter?.userId || "—"} • Role: {selectedReport.reporter?.role || "—"}
                      </p>
                    </div>

                    {selectedReport.status === "pending" ? (
                      <div className="border-t border-white/10 pt-6">
                        <h3 className="text-lg font-medium text-white mb-4">Take action</h3>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => handleAction(selectedReport.id, "dismissed")}
                            disabled={isUpdating}
                            className="flex items-center justify-center px-4 py-2 border border-white/20 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleAction(selectedReport.id, "resolved")}
                            disabled={isUpdating}
                            className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Resolve
                          </button>
                          <button
                            onClick={() => handleAction(selectedReport.id, "investigating")}
                            disabled={isUpdating}
                            className="col-span-2 flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Mark as investigating
                          </button>
                        </div>
                      </div>
                    ) : null}
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

