import { env } from '@/lib/env'
// in prod or development, add to the url /api/docs?format=endpoints to see the documentation
export interface ApiEndpoint {
  path: string
  method: string
  version: string
  description: string
  parameters?: ApiParameter[]
  requestBody?: ApiRequestBody
  responses: ApiResponse[]
  examples?: ApiExample[]
  rateLimit?: {
    windowMs: number
    max: number
  }
  authentication?: {
    required: boolean
    roles?: string[]
  }
}

export interface ApiParameter {
  name: string
  type: string
  required: boolean
  description: string
  example?: any
  location: 'query' | 'path' | 'header'
}

export interface ApiRequestBody {
  contentType: string
  schema: any
  required: boolean
  description: string
  example?: any
}

export interface ApiResponse {
  status: number
  description: string
  schema: any
  example?: any
}

export interface ApiExample {
  name: string
  description: string
  request: {
    method: string
    url: string
    headers?: Record<string, string>
    body?: any
  }
  response: {
    status: number
    body: any
  }
}

export class ApiDocumentation {
  private static endpoints: Map<string, ApiEndpoint> = new Map()

  /**
   * Register an API endpoint
   */
  static registerEndpoint(endpoint: ApiEndpoint): void {
    const key = `${endpoint.method}:${endpoint.path}:${endpoint.version}`
    this.endpoints.set(key, endpoint)
  }

  /**
   * Get all registered endpoints
   */
  static getAllEndpoints(): ApiEndpoint[] {
    return Array.from(this.endpoints.values())
  }

  /**
   * Get endpoints by version
   */
  static getEndpointsByVersion(version: string): ApiEndpoint[] {
    return this.getAllEndpoints().filter(ep => ep.version === version)
  }

  /**
   * Get endpoint documentation
   */
  static getEndpoint(method: string, path: string, version: string): ApiEndpoint | undefined {
    const key = `${method}:${path}:${version}`
    return this.endpoints.get(key)
  }

  /**
   * Generate API specification in JSON format
   */
  static generateApiSpec(): any {
    const endpoints = this.getAllEndpoints()

    const spec = {
      api: {
        name: 'Varsity Nest API',
        description: 'Student accommodation platform API',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@varsity-nest.com'
        }
      },
      servers: [
        {
          url: env.API_URL,
          description: env.NODE_ENV === 'production' ? 'Production' : 'Development'
        }
      ],
      authentication: {
        type: 'Bearer Token',
        description: 'JWT token required for protected endpoints'
      },
      schemas: this.generateSchemas(),
      endpoints: this.generateEndpointsDocumentation(endpoints)
    }

    return spec
  }

  /**
   * Generate endpoints documentation
   */
  private static generateEndpointsDocumentation(endpoints: ApiEndpoint[]): any {
    return endpoints.map(endpoint => ({
      method: endpoint.method,
      path: endpoint.path,
      version: endpoint.version,
      description: endpoint.description,
      parameters: endpoint.parameters?.map(param => ({
        name: param.name,
        location: param.location,
        type: param.type,
        required: param.required,
        description: param.description,
        example: param.example
      })) || [],
      requestBody: endpoint.requestBody ? {
        contentType: endpoint.requestBody.contentType,
        required: endpoint.requestBody.required,
        description: endpoint.requestBody.description,
        schema: endpoint.requestBody.schema,
        example: endpoint.requestBody.example
      } : undefined,
      responses: endpoint.responses.map(response => ({
        status: response.status,
        description: response.description,
        schema: response.schema,
        example: response.example
      })),
      authentication: endpoint.authentication ? {
        required: endpoint.authentication.required,
        roles: endpoint.authentication.roles || []
      } : undefined,
      rateLimit: endpoint.rateLimit ? {
        windowMs: endpoint.rateLimit.windowMs,
        max: endpoint.rateLimit.max
      } : undefined
    }))
  }


  /**
   * Generate common schemas
   */
  private static generateSchemas(): any {
    return {
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' },
          code: { type: 'string' },
          errorId: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          role: { type: 'string', enum: ['student', 'provider', 'admin'] },
          isActive: { type: 'boolean' },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        }
      },
      Accommodation: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          price: { type: 'number' },
          rating: { type: 'number' },
          reviewCount: { type: 'number' },
          isOpen: { type: 'boolean' },
          verified: { type: 'boolean' },
          featured: { type: 'boolean' },
          amenities: { type: 'array', items: { type: 'string' } },
          images: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  }

  /**
   * Initialize API documentation with all endpoints
   */
  static initializeDocumentation() {
    // Authentication endpoints
    this.createEndpointDoc('GET', '/api/auth/session', 'v1', 'Get current user session')
      .addResponse({ status: 200, description: 'User session data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Account deactivated', schema: { type: 'object' } })
      .setRateLimit(15 * 60 * 1000, 200)
      .register()

    this.createEndpointDoc('POST', '/api/auth/register', 'v1', 'Register new provider with documents')
      .setRequestBody({
        contentType: 'multipart/form-data',
        schema: { type: 'object' },
        required: true,
        description: 'Provider registration form data'
      })
      .addResponse({ status: 201, description: 'Provider registered successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid form data', schema: { type: 'object' } })
      .addResponse({ status: 404, description: 'User not found. Please complete registration first.', schema: { type: 'object' } })
      .addResponse({ status: 415, description: 'Unsupported content type', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/auth/secure-login', 'v1', 'Secure login with JWT session')
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Login credentials'
      })
      .addResponse({ status: 200, description: 'Login successful', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Email and password are required', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Invalid email or password', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Account is deactivated', schema: { type: 'object' } })
      .register()

    // Accommodations endpoints
    this.createEndpointDoc('GET', '/api/accommodations', 'v1', 'Get accommodations with filters')
      .addParameter({ name: 'limit', type: 'integer', required: false, description: 'Number of results to return (default: 50)', location: 'query' })
      .addParameter({ name: 'offset', type: 'integer', required: false, description: 'Number of results to skip (default: 0)', location: 'query' })
      .addParameter({ name: 'accreditation_status', type: 'string', required: false, description: 'Filter by accreditation status', location: 'query' })
      .addParameter({ name: 'featured', type: 'boolean', required: false, description: 'Filter by featured status', location: 'query' })
      .addParameter({ name: 'provider_id', type: 'string', required: false, description: 'Filter by provider ID', location: 'query' })
      .addParameter({ name: 'query', type: 'string', required: false, description: 'Search query', location: 'query' })
      .addParameter({ name: 'minPrice', type: 'number', required: false, description: 'Minimum price filter', location: 'query' })
      .addParameter({ name: 'maxPrice', type: 'number', required: false, description: 'Maximum price filter', location: 'query' })
      .addParameter({ name: 'area', type: 'string', required: false, description: 'Area filter', location: 'query' })
      .addParameter({ name: 'amenities', type: 'string', required: false, description: 'Comma-separated amenities', location: 'query' })
      .addResponse({ status: 200, description: 'List of accommodations', schema: { type: 'array' } })
      .addResponse({ status: 400, description: 'Invalid parameters', schema: { type: 'object' } })
      .setRateLimit(15 * 60 * 1000, 100)
      .register()

    this.createEndpointDoc('POST', '/api/accommodations', 'v1', 'Create new accommodation')
      .setAuthentication(true, ['provider'])
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Accommodation data'
      })
      .addResponse({ status: 201, description: 'Accommodation created successfully', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Provider access required', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid input data', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('PATCH', '/api/accommodations/{id}', 'v1', 'Update accommodation')
      .setAuthentication(true, ['provider'])
      .addParameter({ name: 'id', type: 'string', required: true, description: 'Accommodation ID', location: 'path' })
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Updated accommodation data'
      })
      .addResponse({ status: 200, description: 'Accommodation updated successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid update data or no valid fields to update', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Forbidden - not accommodation owner', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('DELETE', '/api/accommodations/{id}', 'v1', 'Delete accommodation')
      .setAuthentication(true, ['provider'])
      .addParameter({ name: 'id', type: 'string', required: true, description: 'Accommodation ID', location: 'path' })
      .addResponse({ status: 200, description: 'Accommodation deleted successfully', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Forbidden - not accommodation owner', schema: { type: 'object' } })
      .register()

    // Admin endpoints
    this.createEndpointDoc('GET', '/api/admin/providers', 'v1', 'Get provider management data')
      .setAuthentication(true, ['admin'])
      .addParameter({ name: 'type', type: 'string', required: false, description: 'Type of providers to fetch', location: 'query' })
      .addResponse({ status: 200, description: 'Provider data or dashboard stats', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/admin/providers', 'v1', 'Manage provider actions')
      .setAuthentication(true, ['admin'])
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Provider action data'
      })
      .addResponse({ status: 200, description: 'Action completed successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid action', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/settings', 'v1', 'Get admin settings')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'Admin settings', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/admin/settings', 'v1', 'Update admin settings')
      .setAuthentication(true, ['admin'])
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Updated settings data'
      })
      .addResponse({ status: 200, description: 'Settings updated successfully', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/students', 'v1', 'Get all students')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'List of students', schema: { type: 'array' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/user', 'v1', 'Get admin user information')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'Admin user data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/domains', 'v1', 'Get whitelisted domains')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'List of whitelisted domains', schema: { type: 'array' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .addResponse({ status: 501, description: 'Functionality not implemented yet', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/admin/domains', 'v1', 'Add or update domain')
      .setAuthentication(true, ['admin'])
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Domain data'
      })
      .addResponse({ status: 200, description: 'Domain added successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid domain data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    // Analytics endpoints
    this.createEndpointDoc('GET', '/api/admin/analytics/overview', 'v1', 'Get analytics overview data')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'Analytics overview data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/analytics/revenue', 'v1', 'Get revenue analytics data')
      .setAuthentication(true, ['admin'])
      .addParameter({ name: 'period', type: 'string', required: false, description: 'Time period for revenue data', location: 'query' })
      .addResponse({ status: 200, description: 'Revenue chart data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/analytics/system-health', 'v1', 'Get system health metrics')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'System health data', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/admin/analytics/top-performers', 'v1', 'Get top performing accommodations')
      .setAuthentication(true, ['admin'])
      .addResponse({ status: 200, description: 'Top performers data', schema: { type: 'array' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Admin access required', schema: { type: 'object' } })
      .register()

    // Provider endpoints
    this.createEndpointDoc('GET', '/api/provider/accommodations', 'v1', 'Get accommodations for a provider')
      .addParameter({ name: 'providerId', type: 'string', required: true, description: 'Provider ID', location: 'query' })
      .addParameter({ name: 'limit', type: 'integer', required: false, description: 'Number of results to return (default: 200)', location: 'query' })
      .addResponse({ status: 200, description: 'List of provider accommodations', schema: { type: 'array' } })
      .addResponse({ status: 400, description: 'Provider ID is required', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('GET', '/api/provider/stats', 'v1', 'Get provider statistics')
      .addParameter({ name: 'providerId', type: 'string', required: true, description: 'Provider ID', location: 'query' })
      .addResponse({ status: 200, description: 'Provider statistics', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Provider ID is required', schema: { type: 'object' } })
      .register()

    // Payment endpoints
    this.createEndpointDoc('POST', '/api/paystack/initiate', 'v1', 'Initiate Paystack payment')
      .setAuthentication(true, ['provider'])
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Payment initiation data'
      })
      .addResponse({ status: 200, description: 'Payment initiated successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Invalid request data or amount too high', schema: { type: 'object' } })
      .addResponse({ status: 401, description: 'Authentication required', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Provider access required or provider account not found', schema: { type: 'object' } })
      .addResponse({ status: 409, description: 'Duplicate payment detected', schema: { type: 'object' } })
      .addResponse({ status: 500, description: 'Payment system not configured or internal error', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/paystack/webhook', 'v1', 'Paystack webhook notification')
      .addResponse({ status: 200, description: 'Webhook processed successfully', schema: { type: 'string' } })
      .addResponse({ status: 400, description: 'Invalid webhook data or missing required fields', schema: { type: 'object' } })
      .addResponse({ status: 403, description: 'Unauthorized webhook source', schema: { type: 'string' } })
      .addResponse({ status: 500, description: 'Internal server error', schema: { type: 'string' } })
      .register()

    // OTP endpoints
    this.createEndpointDoc('POST', '/api/send-otp', 'v1', 'Send OTP via email')
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'OTP data'
      })
      .addResponse({ status: 200, description: 'Email sent successfully', schema: { type: 'object' } })
      .addResponse({ status: 500, description: 'Failed to send email', schema: { type: 'object' } })
      .register()

    this.createEndpointDoc('POST', '/api/resend-otp', 'v1', 'Resend OTP')
      .setRequestBody({
        contentType: 'application/json',
        schema: { type: 'object' },
        required: true,
        description: 'Resend OTP data'
      })
      .addResponse({ status: 200, description: 'OTP resent successfully', schema: { type: 'object' } })
      .addResponse({ status: 400, description: 'Email and user type are required', schema: { type: 'object' } })
      .addResponse({ status: 500, description: 'Failed to resend OTP', schema: { type: 'object' } })
      .register()

    // Webhook endpoints
    this.createEndpointDoc('POST', '/api/stack/webhook', 'v1', 'StackAuth webhook handler')
      .addResponse({ status: 200, description: 'Webhook processed successfully', schema: { type: 'string' } })
      .addResponse({ status: 401, description: 'Invalid signature', schema: { type: 'string' } })
      .addResponse({ status: 500, description: 'Missing secret or internal error', schema: { type: 'string' } })
      .register()

    // Documentation endpoint
    this.createEndpointDoc('GET', '/api/docs', 'v1', 'Get API documentation')
      .addParameter({ name: 'format', type: 'string', required: false, description: 'Documentation format (spec, endpoints)', location: 'query' })
      .addParameter({ name: 'version', type: 'string', required: false, description: 'API version filter', location: 'query' })
      .addResponse({ status: 200, description: 'API documentation', schema: { type: 'object' } })
      .setRateLimit(15 * 60 * 1000, 50)
      .register()
  }

  /**
   * Create endpoint documentation helper
   */
  static createEndpointDoc(
    method: string,
    path: string,
    version: string = 'v1',
    description: string
  ) {
    return {
      method,
      path,
      version,
      description,
      parameters: [] as ApiParameter[],
      responses: [] as ApiResponse[],
      examples: [] as ApiExample[],
      requestBody: undefined as ApiRequestBody | undefined,
      rateLimit: undefined as { windowMs: number; max: number } | undefined,
      authentication: undefined as { required: boolean; roles?: string[] } | undefined,
      
      addParameter(param: ApiParameter) {
        this.parameters.push(param)
        return this
      },
      
      addResponse(response: ApiResponse) {
        this.responses.push(response)
        return this
      },
      
      addExample(example: ApiExample) {
        this.examples.push(example)
        return this
      },
      
      setRequestBody(body: ApiRequestBody) {
        this.requestBody = body
        return this
      },
      
      setRateLimit(windowMs: number, max: number) {
        this.rateLimit = { windowMs, max }
        return this
      },
      
      setAuthentication(required: boolean, roles?: string[]) {
        this.authentication = { required, roles }
        return this
      },
      
      register() {
        ApiDocumentation.registerEndpoint(this as ApiEndpoint)
        return this
      }
    }
  }
}

// Auto-register all API endpoints
ApiDocumentation.initializeDocumentation()
