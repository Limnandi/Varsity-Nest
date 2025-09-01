import { postgrest } from "./postgrest"

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
      const row = await postgrest.single<any>('whitelisted_domains', { domain: emailDomain, is_active: true as any })
      if (row) {
        return { 
          isValid: true, 
          university: row.university 
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
      const rows = await postgrest.get<any>('whitelisted_domains', { select: 'domain', filter: { is_active: true as any }, order: 'domain.asc' })
      return rows.map((row: any) => row.domain)
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
        postgrest.count('whitelisted_domains'),
        postgrest.count('whitelisted_domains', { is_active: true as any }),
        postgrest.count('whitelisted_domains', { is_active: false as any })
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