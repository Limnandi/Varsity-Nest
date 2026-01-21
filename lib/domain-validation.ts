import { query } from "./database"

export interface DomainValidationResult {
  isValid: boolean
  university?: string
  error?: string
}

export class DomainValidationService {
  /**
   * Check if an email domain is whitelisted for student registration
   */
  static async isEmailWhitelisted(email: string): Promise<DomainValidationResult> {
    try {
      // Extract domain from email
      const emailDomain = email.substring(email.indexOf("@"))
      
      if (!emailDomain || emailDomain === "@") {
        return { isValid: false, error: "Invalid email format" }
      }

      // Reject common non-university domains
      const commonDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com', '@icloud.com']
      if (commonDomains.includes(emailDomain.toLowerCase())) {
        return { 
          isValid: false, 
          error: "Personal email domains are not allowed for student registration. Please use your university email address." 
        }
      }

      // Query database for active whitelisted domains
      const result = await query`SELECT university FROM whitelisted_domains WHERE domain = ${emailDomain} AND is_active = true LIMIT 1`
      
      const row = result.rows?.[0]
      if (row) {
        return { 
          isValid: true, 
          university: row.university 
        }
      }

      return { 
        isValid: false, 
        error: "Email domain not whitelisted for student registration. Please use your student email address or contact support if facing any issues." 
      }
    } catch (error) {
      console.error("Domain validation error:", error)
      return { 
        isValid: false, 
        error: "Failed to validate email domain" 
      }
    }
  }

  /**
   * Get all active whitelisted domains
   */
  static async getActiveWhitelistedDomains(): Promise<string[]> {
    try {
      const rows = await query`SELECT domain FROM whitelisted_domains WHERE is_active = true ORDER BY domain ASC`
      return rows.rows.map((row: any) => row.domain)
    } catch (error) {
      console.error("Error fetching whitelisted domains:", error)
      return []
    }
  }

  /**
   * Get domain statistics
   */
  static async getDomainStats(): Promise<{
    total: number
    active: number
    inactive: number
  }> {
    try {
      const [total, active, inactive] = await Promise.all([
        (async () => Number.parseInt((await query`SELECT COUNT(*) AS c FROM whitelisted_domains`).rows[0].c))(),
        (async () => Number.parseInt((await query`SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = true`).rows[0].c))(),
        (async () => Number.parseInt((await query`SELECT COUNT(*) AS c FROM whitelisted_domains WHERE is_active = false`).rows[0].c))(),
      ])
      return {
        total,
        active,
        inactive
      }
    } catch (error) {
      console.error("Error fetching domain stats:", error)
      return { total: 0, active: 0, inactive: 0 }
    }
  }
}