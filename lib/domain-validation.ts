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

      // Query database for active whitelisted domains
      const result = await query(`
        SELECT university 
        FROM whitelisted_domains 
        WHERE domain = $1 AND is_active = true
      `, [emailDomain])

      if (result.rows && result.rows.length > 0) {
        return { 
          isValid: true, 
          university: result.rows[0].university 
        }
      }

      return { 
        isValid: false, 
        error: "Email domain not whitelisted for student registration" 
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
      const result = await query(`
        SELECT domain 
        FROM whitelisted_domains 
        WHERE is_active = true
        ORDER BY domain
      `)

      return result.rows.map((row: any) => row.domain)
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
      const result = await query(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive
        FROM whitelisted_domains
      `)

      const stats = result.rows[0]
      return {
        total: parseInt(stats.total) || 0,
        active: parseInt(stats.active) || 0,
        inactive: parseInt(stats.inactive) || 0
      }
    } catch (error) {
      console.error("Error fetching domain stats:", error)
      return { total: 0, active: 0, inactive: 0 }
    }
  }
}