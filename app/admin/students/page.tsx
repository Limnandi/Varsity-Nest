"use client"

import { useState, useEffect, useCallback } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { Users, Search, UserCheck, UserX, Trash2, GraduationCap, Mail, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Student {
  id: string
  name: string
  email: string
  university: "UFS" | "CUT"
  isActive: boolean
  createdAt: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all")
  const { toast } = useToast()

  const fetchStudents = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/students")
      if (response.ok) {
        const data = await response.json()
        setStudents(data.students)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const toggleStudentStatus = async (studentId: string, currentStatus: boolean) => {
    try {
      const response = await fetch("/api/admin/students/toggle-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, isActive: !currentStatus }),
      })

      if (response.ok) {
        setStudents(
          students.map((student) => (student.id === studentId ? { ...student, isActive: !currentStatus } : student)),
        )
        toast({
          title: "Success",
          description: `Student ${!currentStatus ? "activated" : "deactivated"} successfully`,
        })
      } else {
        throw new Error("Failed to update student status")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update student status",
        variant: "destructive",
      })
    }
  }

  const deleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch("/api/admin/students/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId }),
      })

      if (response.ok) {
        setStudents(students.filter((student) => student.id !== studentId))
        toast({
          title: "Success",
          description: "Student deleted successfully",
        })
      } else {
        throw new Error("Failed to delete student")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete student",
        variant: "destructive",
      })
    }
  }

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && student.isActive) ||
      (filterStatus === "inactive" && !student.isActive)

    return matchesSearch && matchesStatus
  })

  const stats = {
    total: students.length,
    active: students.filter((s) => s.isActive).length,
    inactive: students.filter((s) => !s.isActive).length,
    ufs: students.filter((s) => s.university === "UFS").length,
    cut: students.filter((s) => s.university === "CUT").length,
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-white/20 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-white/20 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-white/20 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Student Management</h1>
          <p className="text-neutral-300">Manage registered students and their access</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-blue-500/50 bg-blue-500/10 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Total Students</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-green-500/50 bg-green-500/10 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Active</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-red-500/50 bg-red-500/10 rounded-lg">
              <UserX className="w-6 h-6 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">Inactive</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-red-400 via-rose-500 to-red-600 bg-clip-text text-transparent">{stats.inactive}</p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-orange-500/50 bg-orange-500/10 rounded-lg">
              <GraduationCap className="w-6 h-6 text-orange-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">UFS Students</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-orange-400 via-amber-500 to-orange-600 bg-clip-text text-transparent">{stats.ufs}</p>
            </div>
          </div>
        </div>

        <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
          <div className="flex items-center">
            <div className="p-2 border border-purple-500/50 bg-purple-500/10 rounded-lg">
              <GraduationCap className="w-6 h-6 text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-neutral-300">CUT Students</p>
              <p className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text text-transparent">{stats.cut}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as "all" | "active" | "inactive")}
            className="px-4 py-3 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
          >
            <option value="all" className="bg-black text-white">All Students</option>
            <option value="active" className="bg-black text-white">Active Only</option>
            <option value="inactive" className="bg-black text-white">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  University
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-white/10">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-white/5 transition-all duration-300">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-400">
                            {student.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">{student.name}</div>
                        <div className="text-sm text-neutral-300 flex items-center">
                          <Mail className="w-4 h-4 mr-1" />
                          {student.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        student.university === "UFS" ? "bg-orange-500/20 text-orange-400 border-orange-500/50" : "bg-purple-500/20 text-purple-400 border-purple-500/50"
                      }`}
                    >
                      {student.university}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                        student.isActive ? "bg-green-500/20 text-green-400 border-green-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"
                      }`}
                    >
                      {student.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(student.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => toggleStudentStatus(student.id, student.isActive)}
                        className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border transition-all duration-300 hover:scale-105 ${
                          student.isActive
                            ? "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
                            : "bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30"
                        }`}
                      >
                        {student.isActive ? (
                          <>
                            <UserX className="w-4 h-4 mr-1" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Activate
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => deleteStudent(student.id)}
                        className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30 transition-all duration-300 hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
              <Users className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="mt-2 text-lg font-medium text-white">No students found</h3>
            <p className="mt-1 text-sm text-neutral-300">
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filter criteria."
                : "No students have registered yet."}
            </p>
          </div>
        )}
      </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
