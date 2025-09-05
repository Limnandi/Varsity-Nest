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
      const students = this.getStudents()
      const existingStudent = students.find((s) => s.email === email)
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

    const student: StudentUser = {
      id: Date.now().toString(),
      email,
      name,
      university: university!,
      isVerified: true,
      createdAt: new Date().toISOString(),
      isBlocked: false,
    }

    // Store student
    const students = this.getStudents()
    students.push(student)
    localStorage.setItem("students", JSON.stringify(students))

    // Store password (in production, hash this!)
    localStorage.setItem(`password_${email}`, password)

    // Set current student
    localStorage.setItem("currentStudent", JSON.stringify(student))

    return student
  }

  static async resetPassword(email: string, newPassword: string): Promise<boolean> {
    const students = this.getStudents()
    const student = students.find((s) => s.email === email)

    if (!student || student.isBlocked) {
      return false
    }

    // Update password (in production, hash this!)
    localStorage.setItem(`password_${email}`, newPassword)
    return true
  }

  static getStudents(): StudentUser[] {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("students")
    return stored ? JSON.parse(stored) : []
  }

  static getCurrentStudent(): StudentUser | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("currentStudent")
    return stored ? JSON.parse(stored) : null
  }

  static loginStudent(email: string, password?: string): { success: boolean; student?: StudentUser; error?: string } {
    const students = this.getStudents()
    const student = students.find((s) => s.email === email)

    if (!student) {
      return { success: false, error: "No account found with this email" }
    }

    if (student.isBlocked) {
      return {
        success: false,
        error: `Your account has been suspended${student.blockedReason ? ` for: ${student.blockedReason}` : ""}. Please contact support.`,
      }
    }

    // Check password if provided (for regular login)
    if (password) {
      const storedPassword = localStorage.getItem(`password_${email}`)
      if (storedPassword !== password) {
        return { success: false, error: "Invalid password" }
      }
    }

    localStorage.setItem("currentStudent", JSON.stringify(student))
    return { success: true, student }
  }

  static logoutStudent(): void {
    localStorage.removeItem("currentStudent")
  }

  static blockStudent(studentId: string, reason: string): boolean {
    const students = this.getStudents()
    const index = students.findIndex((s) => s.id === studentId)

    if (index === -1) return false

    students[index] = {
      ...students[index],
      isBlocked: true,
      blockedAt: new Date().toISOString(),
      blockedReason: reason,
    }

    localStorage.setItem("students", JSON.stringify(students))
    return true
  }

  static unblockStudent(studentId: string): boolean {
    const students = this.getStudents()
    const index = students.findIndex((s) => s.id === studentId)

    if (index === -1) return false

    students[index] = {
      ...students[index],
      isBlocked: false,
      blockedAt: undefined,
      blockedReason: undefined,
    }

    localStorage.setItem("students", JSON.stringify(students))
    return true
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
