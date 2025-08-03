"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import { Plus, Edit, Trash2, Globe, Shield, CheckCircle, XCircle } from "lucide-react"

interface WhitelistedDomain {
  id: string
  domain: string
  university: string
  createdAt: string
  isActive: boolean
}

export default function AdminDomains() {
  const [domains, setDomains] = useState<WhitelistedDomain[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDomain, setEditingDomain] = useState<WhitelistedDomain | null>(null)
  const [newDomain, setNewDomain] = useState({
    domain: "",
    university: "",
  })

  useEffect(() => {
    loadDomains()
  }, [])

  const loadDomains = async () => {
    try {
      const response = await fetch('/api/admin/domains')
      if (!response.ok) throw new Error('Failed to fetch domains')
      
      const data = await response.json()
      setDomains(data.domains || [])
    } catch (error) {
      console.error('Error loading domains:', error)
      setDomains([])
    }
  }

  const handleAddDomain = async () => {
    if (!newDomain.domain.trim() || !newDomain.university.trim()) return

    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          domain: newDomain.domain,
          university: newDomain.university
        })
      })

      if (!response.ok) throw new Error('Failed to add domain')

      loadDomains()
      setNewDomain({ domain: "", university: "" })
      setShowAddForm(false)
    } catch (error) {
      alert("Failed to add domain")
    }
  }

  const handleEditDomain = (domain: WhitelistedDomain) => {
    setEditingDomain(domain)
    setNewDomain({
      domain: domain.domain,
      university: domain.university,
    })
  }

  const handleUpdateDomain = async () => {
    if (!editingDomain || !newDomain.domain.trim() || !newDomain.university.trim()) return

    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          domainId: editingDomain.id,
          domain: newDomain.domain,
          university: newDomain.university
        })
      })

      if (!response.ok) throw new Error('Failed to update domain')

      loadDomains()
      setEditingDomain(null)
      setNewDomain({ domain: "", university: "" })
    } catch (error) {
      alert("Failed to update domain")
    }
  }

  const handleDeleteDomain = async (id: string) => {
    if (confirm("Are you sure you want to delete this domain?")) {
      try {
        const response = await fetch(`/api/admin/domains?id=${id}`, {
          method: 'DELETE'
        })

        if (!response.ok) throw new Error('Failed to delete domain')

        loadDomains()
      } catch (error) {
        alert("Failed to delete domain")
      }
    }
  }

  const handleToggleStatus = async (domain: WhitelistedDomain) => {
    try {
      const response = await fetch('/api/admin/domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle',
          domainId: domain.id,
          isActive: !domain.isActive
        })
      })

      if (!response.ok) throw new Error('Failed to update domain status')

      loadDomains()
    } catch (error) {
      alert("Failed to update domain status")
    }
  }

  const cancelEdit = () => {
    setEditingDomain(null)
    setShowAddForm(false)
    setNewDomain({ domain: "", university: "" })
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Student Email Domains</h1>
              <p className="text-gray-600">Manage whitelisted email domains for student reviews</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add Domain</span>
            </button>
          </div>

          {/* Info Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Shield className="w-6 h-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">How Domain Whitelisting Works</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Only students with whitelisted email domains can write reviews</li>
                  <li>• Students must verify their email with a 6-digit OTP code</li>
                  <li>• Each domain is associated with a specific university</li>
                  <li>• You can temporarily disable domains without deleting them</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingDomain) && (
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">{editingDomain ? "Edit Domain" : "Add New Domain"}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      value={newDomain.domain}
                      onChange={(e) => setNewDomain((prev) => ({ ...prev, domain: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="@university.ac.za"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Include the @ symbol</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                  <input
                    type="text"
                    value={newDomain.university}
                    onChange={(e) => setNewDomain((prev) => ({ ...prev, university: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., UFS, CUT, WITS, UCT, etc."
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter the university code or name</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={editingDomain ? handleUpdateDomain : handleAddDomain}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingDomain ? "Update Domain" : "Add Domain"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Domains List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Whitelisted Domains ({domains.length})</h2>
            </div>

            <div className="divide-y">
              {domains.map((domain) => (
                <div key={domain.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${domain.isActive ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <div>
                      <p className="font-medium text-gray-900">{domain.domain}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                          {domain.university}
                        </span>
                        <span className="text-sm text-gray-500">
                          Added {new Date(domain.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(domain)}
                      className={`p-2 rounded-lg transition-colors ${
                        domain.isActive ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"
                      }`}
                      title={domain.isActive ? "Disable domain" : "Enable domain"}
                    >
                      {domain.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleEditDomain(domain)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit domain"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete domain"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {domains.length === 0 && (
                <div className="p-12 text-center">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No domains configured</h3>
                  <p className="text-gray-600 mb-4">Add your first whitelisted email domain to get started</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Add Domain
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{domains.length}</p>
                  <p className="text-sm text-gray-600">Total Domains</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{domains.filter((d) => d.isActive).length}</p>
                  <p className="text-sm text-gray-600">Active Domains</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Verified Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
