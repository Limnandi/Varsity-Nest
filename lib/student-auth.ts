export interface StudentUser {
  id: string
  email: string
  name: string
  university: string
  isVerified: boolean
  createdAt: string
  isBlocked?: boolean
  blockedAt?: string
  blockedReason?: string
}

export interface ReviewReport {
  id: string
  reviewId: number
  reportedBy: string
  reporterType: "student" | "provider"
  reporterName: string
  reason: string
  description: string
  createdAt: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  reviewedBy?: string
  reviewedAt?: string
  action?: "none" | "warning" | "block_user" | "delete_review"
}

export interface OTPVerification {
  email: string
  otp: string
  expiresAt: string
  attempts: number
  type: "registration" | "password_reset"
}

export interface WhitelistedDomain {
  id: string
  domain: string
  university: string
  createdAt: string
  isActive: boolean
}

// Default whitelisted domains
const defaultDomains: WhitelistedDomain[] = [
  {
    id: "1",
    domain: "@ufs4life.ac.za",
    university: "UFS",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
  {
    id: "2",
    domain: "@cut.ac.za",
    university: "CUT",
    createdAt: new Date().toISOString(),
    isActive: true,
  },
]

export class StudentAuthService {
  static getWhitelistedDomains(): WhitelistedDomain[] {
    if (typeof window === "undefined") return defaultDomains
    const stored = localStorage.getItem("whitelistedDomains")
    return stored ? JSON.parse(stored) : defaultDomains
  }

  static saveWhitelistedDomains(domains: WhitelistedDomain[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("whitelistedDomains", JSON.stringify(domains))
  }

  static addWhitelistedDomain(domain: string, university: string): WhitelistedDomain {
    const domains = this.getWhitelistedDomains()
    const newDomain: WhitelistedDomain = {
      id: Date.now().toString(),
      domain: domain.startsWith("@") ? domain : `@${domain}`,
      university,
      createdAt: new Date().toISOString(),
      isActive: true,
    }
    domains.push(newDomain)
    this.saveWhitelistedDomains(domains)
    return newDomain
  }

  static updateWhitelistedDomain(id: string, updates: Partial<WhitelistedDomain>): boolean {
    const domains = this.getWhitelistedDomains()
    const index = domains.findIndex((d) => d.id === id)
    if (index === -1) return false

    domains[index] = { ...domains[index], ...updates }
    this.saveWhitelistedDomains(domains)
    return true
  }

  static deleteWhitelistedDomain(id: string): boolean {
    const domains = this.getWhitelistedDomains()
    const filtered = domains.filter((d) => d.id !== id)
    if (filtered.length === domains.length) return false

    this.saveWhitelistedDomains(filtered)
    return true
  }

  static isEmailWhitelisted(email: string): { isValid: boolean; university?: string } {
    const domains = this.getWhitelistedDomains().filter((d) => d.isActive)
    const emailDomain = email.substring(email.indexOf("@"))

    for (const domain of domains) {
      if (emailDomain === domain.domain) {
        return { isValid: true, university: domain.university }
      }
    }

    return { isValid: false }
  }

  static generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  static hashOTP(otp: string): string {
    // Simple hash for demo - use proper hashing in production
    return btoa(otp + "salt").substring(0, 6)
  }

  // 🔥 REAL EMAIL SENDING WITH RESEND
  static async sendRealOTP(
    email: string,
    type: "registration" | "password_reset" = "registration",
  ): Promise<{ success: boolean; hashedOTP?: string; error?: string }> {
    const { isValid, university } = this.isEmailWhitelisted(email)

    if (!isValid) {
      return { success: false, error: "Email domain not whitelisted for student access" }
    }

    // For password reset, check if user exists
    if (type === "password_reset") {
      const students = await this.getStudents()
      const existingStudent = students.find((s: StudentUser) => s.email === email)
      if (!existingStudent) {
        return { success: false, error: "No account found with this email address" }
      }
      if (existingStudent.isBlocked) {
        return { success: false, error: "Your account has been suspended. Please contact support." }
      }
    }

    // Generate and hash OTP
    const otp = this.generateOTP()
    const hashedOTP = this.hashOTP(otp)

    try {
      // Call our API route to send the email
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          type,
          university: university === "UFS" ? "University of the Free State" : "Central University of Technology",
        }),
      })

      const result = await response.json()

      if (result.success) {
        // Store OTP verification data
        const verification: OTPVerification = {
          email,
          otp: hashedOTP,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
          attempts: 0,
          type,
        }

        localStorage.setItem(`otp_${email}`, JSON.stringify(verification))

        return { success: true, hashedOTP }
      } else {
        return { success: false, error: result.error || "Failed to send email" }
      }
    } catch (error) {
      console.error("Failed to send OTP:", error)
      return { success: false, error: "Failed to send verification email. Please try again." }
    }
  }


  static async verifyOTP(email: string, inputOTP: string): Promise<{ success: boolean; error?: string }> {
    const stored = localStorage.getItem(`otp_${email}`)
    if (!stored) {
      return { success: false, error: "No OTP found for this email" }
    }

    const verification: OTPVerification = JSON.parse(stored)

    // Check expiry
    if (new Date() > new Date(verification.expiresAt)) {
      localStorage.removeItem(`otp_${email}`)
      return { success: false, error: "OTP has expired" }
    }

    // Check attempts
    if (verification.attempts >= 3) {
      localStorage.removeItem(`otp_${email}`)
      return { success: false, error: "Too many failed attempts" }
    }

    // Verify OTP
    const hashedInput = this.hashOTP(inputOTP)
    if (hashedInput !== verification.otp) {
      verification.attempts++
      localStorage.setItem(`otp_${email}`, JSON.stringify(verification))
      return { success: false, error: "Invalid OTP" }
    }

    // Success - clean up
    localStorage.removeItem(`otp_${email}`)
    return { success: true }
  }

  static async registerStudent(email: string, name: string, password: string): Promise<StudentUser> {
    const { university } = this.isEmailWhitelisted(email)

    // Call secure registration API instead of localStorage
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          firstName: name.split(' ')[0],
          lastName: name.split(' ').slice(1).join(' ') || '',
          password,
          role: 'student',
          university: university!
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result.user
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    }
  }

  static async resetPassword(email: string, newPassword: string): Promise<boolean> {
    try {
      // Call secure password reset API
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, newPassword }),
      })

      return response.ok
    } catch (error) {
      console.error('Password reset error:', error)
      return false
    }
  }

  static async getStudents(): Promise<StudentUser[]> {
    try {
      // Call secure API to get students
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        return data.students || []
      }
      return []
    } catch (error) {
      console.error('Error fetching students:', error)
      return []
    }
  }

  static async getCurrentStudent(): Promise<StudentUser | null> {
    try {
      // Call secure session API
      const response = await fetch('/api/auth/session')
      if (response.ok) {
        const userSession = await response.json()
        return {
          id: userSession.userId,
          email: userSession.email,
          name: userSession.name,
          university: userSession.university || 'UFS',
          isVerified: userSession.emailVerified,
          createdAt: userSession.createdAt,
          isBlocked: !userSession.isActive,
          blockedAt: userSession.isActive ? undefined : userSession.updatedAt,
          blockedReason: userSession.isActive ? undefined : 'Account deactivated'
        }
      }
      return null
    } catch (error) {
      console.error('Error fetching current student:', error)
      return null
    }
  }

  static async loginStudent(email: string, password?: string): Promise<{ success: boolean; student?: StudentUser; error?: string }> {
    try {
      // Use secure login API instead of localStorage
      const response = await fetch('/api/auth/secure-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const result = await response.json()
        return { success: true, student: result.user }
      } else {
        const error = await response.json()
        return { success: false, error: error.error || "Login failed" }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: "Login failed. Please try again." }
    }
  }

  static async logoutStudent(): Promise<void> {
    try {
      // Call secure logout API
      await fetch('/api/auth/secure-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  static async blockStudent(studentId: string, reason: string): Promise<boolean> {
    try {
      // Call secure API to block student
      const response = await fetch('/api/admin/students/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId, 
          isActive: false, 
          reason 
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error blocking student:', error)
      return false
    }
  }

  static async unblockStudent(studentId: string): Promise<boolean> {
    try {
      // Call secure API to unblock student
      const response = await fetch('/api/admin/students/toggle-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          studentId, 
          isActive: true 
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error unblocking student:', error)
      return false
    }
  }

  // Report Management
  static getReports(): ReviewReport[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("reviewReports")
    return stored ? JSON.parse(stored) : []
  }

  static saveReports(reports: ReviewReport[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem("reviewReports", JSON.stringify(reports))
  }

  static submitReport(
    reviewId: number,
    reportedBy: string,
    reporterType: "student" | "provider",
    reporterName: string,
    reason: string,
    description: string,
  ): ReviewReport {
    const reports = this.getReports()

    const report: ReviewReport = {
      id: Date.now().toString(),
      reviewId,
      reportedBy,
      reporterType,
      reporterName,
      reason,
      description,
      createdAt: new Date().toISOString(),
      status: "pending",
    }

    reports.push(report)
    this.saveReports(reports)
    return report
  }

  static updateReportStatus(
    reportId: string,
    status: ReviewReport["status"],
    action?: ReviewReport["action"],
    reviewedBy?: string,
  ): boolean {
    const reports = this.getReports()
    const index = reports.findIndex((r) => r.id === reportId)

    if (index === -1) return false

    reports[index] = {
      ...reports[index],
      status,
      action,
      reviewedBy,
      reviewedAt: new Date().toISOString(),
    }

    this.saveReports(reports)
    return true
  }
}
