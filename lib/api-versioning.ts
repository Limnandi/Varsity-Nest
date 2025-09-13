import { NextRequest, NextResponse } from 'next/server'
import { ApiErrorResponseBuilder } from './api-error-response'

export interface ApiVersion {
  version: string
  deprecated: boolean
  sunsetDate?: string
  supported: boolean
}

export const API_VERSIONS: Record<string, ApiVersion> = {
  'v1': {
    version: 'v1',
    deprecated: false,
    supported: true
  },
  'v2': {
    version: 'v2',
    deprecated: false,
    supported: true
  }
}

export const DEFAULT_API_VERSION = 'v1'
export const LATEST_API_VERSION = 'v2'

export class ApiVersioning {
  /**
   * Extract API version from request
   */
  static extractVersion(request: NextRequest): string {
    // Check URL path for version
    const pathname = request.nextUrl.pathname
    const versionMatch = pathname.match(/^\/api\/(v\d+)\//)
    
    if (versionMatch) {
      return versionMatch[1]
    }

    // Check X-API-Version header
    const headerVersion = request.headers.get('X-API-Version')
    if (headerVersion && API_VERSIONS[headerVersion]) {
      return headerVersion
    }

    // Check query parameter
    const queryVersion = request.nextUrl.searchParams.get('version')
    if (queryVersion && API_VERSIONS[queryVersion]) {
      return queryVersion
    }

    return DEFAULT_API_VERSION
  }

  /**
   * Validate API version
   */
  static validateVersion(version: string): { valid: boolean; error?: NextResponse } {
    const versionInfo = API_VERSIONS[version]
    
    if (!versionInfo) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'Unsupported API version',
            message: `API version '${version}' is not supported. Supported versions: ${Object.keys(API_VERSIONS).join(', ')}`,
            code: 'UNSUPPORTED_API_VERSION',
            supportedVersions: Object.keys(API_VERSIONS),
            timestamp: new Date().toISOString()
          },
          { status: 400 }
        )
      }
    }

    if (!versionInfo.supported) {
      return {
        valid: false,
        error: NextResponse.json(
          {
            success: false,
            error: 'API version not supported',
            message: `API version '${version}' is no longer supported`,
            code: 'API_VERSION_NOT_SUPPORTED',
            supportedVersions: Object.keys(API_VERSIONS).filter(v => API_VERSIONS[v].supported),
            timestamp: new Date().toISOString()
          },
          { status: 410 }
        )
      }
    }

    return { valid: true }
  }

  /**
   * Add version headers to response
   */
  static addVersionHeaders(response: NextResponse, version: string): NextResponse {
    const versionInfo = API_VERSIONS[version]
    
    response.headers.set('X-API-Version', version)
    response.headers.set('X-API-Supported-Versions', Object.keys(API_VERSIONS).join(', '))
    response.headers.set('X-API-Latest-Version', LATEST_API_VERSION)
    
    if (versionInfo.deprecated) {
      response.headers.set('X-API-Deprecated', 'true')
      if (versionInfo.sunsetDate) {
        response.headers.set('X-API-Sunset-Date', versionInfo.sunsetDate)
      }
    }

    return response
  }

  /**
   * Create versioned response wrapper
   */
  static withVersioning<T = any>(
    handler: (request: NextRequest, version: string) => Promise<NextResponse<T>>
  ) {
    return async (request: NextRequest): Promise<NextResponse<T>> => {
      const version = this.extractVersion(request)
      
      // Validate version
      const validation = this.validateVersion(version)
      if (!validation.valid) {
        return validation.error! as NextResponse<T>
      }

      try {
        // Execute handler with version
        const response = await handler(request, version)
        
        // Add version headers
        return this.addVersionHeaders(response, version) as NextResponse<T>
      } catch (error) {
        // Handle errors with version context
        const errorResponse = await ApiErrorResponseBuilder.createErrorResponse(
          error instanceof Error ? error : new Error(String(error)),
          request,
          { apiVersion: version }
        )
        
        return this.addVersionHeaders(errorResponse, version) as NextResponse<T>
      }
    }
  }

  /**
   * Get version-specific route handler
   */
  static getVersionedHandler<T = any>(
    handlers: Record<string, (request: NextRequest) => Promise<NextResponse<T>>>
  ) {
    return async (request: NextRequest): Promise<NextResponse<T>> => {
      const version = this.extractVersion(request)
      
      // Validate version
      const validation = this.validateVersion(version)
      if (!validation.valid) {
        return validation.error! as NextResponse<T>
      }

      const handler = handlers[version] || handlers[DEFAULT_API_VERSION]
      
      if (!handler) {
        return NextResponse.json(
          {
            success: false,
            error: 'Handler not found',
            message: `No handler found for API version '${version}'`,
            code: 'HANDLER_NOT_FOUND',
            timestamp: new Date().toISOString()
          },
          { status: 501 }
        ) as NextResponse<T>
      }

      try {
        const response = await handler(request)
        return this.addVersionHeaders(response, version) as NextResponse<T>
      } catch (error) {
        const errorResponse = await ApiErrorResponseBuilder.createErrorResponse(
          error instanceof Error ? error : new Error(String(error)),
          request,
          { apiVersion: version }
        )
        
        return this.addVersionHeaders(errorResponse, version) as NextResponse<T>
      }
    }
  }
}

/**
 * Middleware to handle API versioning
 */
export function withApiVersioning<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    const request = args[0] as NextRequest
    const version = ApiVersioning.extractVersion(request)
    
    // Validate version
    const validation = ApiVersioning.validateVersion(version)
    if (!validation.valid) {
      return validation.error!
    }

    try {
      const response = await handler(...args)
      return ApiVersioning.addVersionHeaders(response, version)
    } catch (error) {
      const errorResponse = await ApiErrorResponseBuilder.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        { apiVersion: version }
      )
      
      return ApiVersioning.addVersionHeaders(errorResponse, version)
    }
  }
}
