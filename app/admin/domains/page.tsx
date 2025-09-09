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
        <div className="space-y-6 p-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Student Email Domains</h1>
              <p className="text-neutral-300">Manage whitelisted email domains for student reviews</p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Add Domain</span>
            </button>
          </div>

          {/* Info Card */}
          <div className="group relative border border-blue-500/50 bg-blue-500/10 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/20">
            <div className="flex items-start space-x-3">
              <div className="p-2 border border-blue-500/50 bg-blue-500/20 rounded-lg">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2 text-lg">How Domain Whitelisting Works</h3>
                <ul className="text-neutral-300 text-sm space-y-1">
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
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10">
              <h2 className="text-xl font-semibold mb-4 text-white">{editingDomain ? "Edit Domain" : "Add New Domain"}</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Email Domain</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 w-5 h-5" />
                    <input
                      type="text"
                      value={newDomain.domain}
                      onChange={(e) => setNewDomain((prev) => ({ ...prev, domain: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
                      placeholder="@university.ac.za"
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">Include the @ symbol</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">University</label>
                  <input
                    type="text"
                    value={newDomain.university}
                    onChange={(e) => setNewDomain((prev) => ({ ...prev, university: e.target.value }))}
                    className="w-full px-4 py-3 border border-white/20 bg-white/10 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-neutral-400"
                    placeholder="e.g., UFS, CUT, WITS, UCT, etc."
                  />
                  <p className="text-xs text-neutral-400 mt-1">Enter the university code or name</p>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={editingDomain ? handleUpdateDomain : handleAddDomain}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                >
                  {editingDomain ? "Update Domain" : "Add Domain"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="border border-white/20 bg-white/10 text-white px-4 py-2 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Domains List */}
          <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Whitelisted Domains ({domains.length})</h2>
            </div>

            <div className="divide-y divide-white/10">
              {domains.map((domain) => (
                <div key={domain.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all duration-300">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${domain.isActive ? "bg-green-400 shadow-[0_0_10px_theme(colors.green.400/50%)]" : "bg-neutral-400"}`}></div>
                    <div>
                      <p className="font-medium text-white text-lg">{domain.domain}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/50">
                          {domain.university}
                        </span>
                        <span className="text-sm text-neutral-300">
                          Added {new Date(domain.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(domain)}
                      className={`p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                        domain.isActive ? "text-green-400 hover:bg-green-500/20" : "text-neutral-400 hover:bg-neutral-500/20"
                      }`}
                      title={domain.isActive ? "Disable domain" : "Enable domain"}
                    >
                      {domain.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>

                    <button
                      onClick={() => handleEditDomain(domain)}
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                      title="Edit domain"
                    >
                      <Edit className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDeleteDomain(domain.id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-300 hover:scale-110"
                      title="Delete domain"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              {domains.length === 0 && (
                <div className="p-12 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/50 bg-blue-500/10 shadow-[0_0_20px_theme(colors.blue.500/40%)] mb-4">
                    <Globe className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No domains configured</h3>
                  <p className="text-neutral-300 mb-4">Add your first whitelisted email domain to get started</p>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105"
                  >
                    Add Domain
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500/20 border border-blue-500/50 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">{domains.length}</p>
                  <p className="text-sm text-neutral-300">Total Domains</p>
                </div>
              </div>
            </div>

            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-green-400 via-emerald-500 to-green-600 bg-clip-text text-transparent">{domains.filter((d) => d.isActive).length}</p>
                  <p className="text-sm text-neutral-300">Active Domains</p>
                </div>
              </div>
            </div>

            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white bg-gradient-to-r from-purple-400 via-violet-500 to-purple-600 bg-clip-text text-transparent">0</p>
                  <p className="text-sm text-neutral-300">Verified Students</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
