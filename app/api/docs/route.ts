import { NextRequest, NextResponse } from 'next/server'
import { ApiDocumentation } from '@/lib/api-documentation'
import { ApiMiddleware } from '@/lib/api-middleware'

export const GET = ApiMiddleware.withMiddleware(
  async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const version = searchParams.get('version') || 'all'

    try {
      let data: any

      if (format === 'spec' || format === 'json') {
        data = ApiDocumentation.generateApiSpec()
      } else if (format === 'endpoints') {
        if (version === 'all') {
          data = ApiDocumentation.getAllEndpoints()
        } else {
          data = ApiDocumentation.getEndpointsByVersion(version)
        }
      } else {
        // Default JSON format
        data = {
          info: {
            title: 'Varsity Nest API',
            description: 'Student accommodation platform API',
            version: '1.0.0',
            documentation: {
              spec: '/api/docs?format=spec',
              endpoints: '/api/docs?format=endpoints',
              versions: ['v1', 'v2']
            }
          },
          endpoints: ApiDocumentation.getAllEndpoints(),
          spec: ApiDocumentation.generateApiSpec()
        }
      }

      return ApiMiddleware.createResponse(data, 'API documentation retrieved successfully')
    } catch (error) {
      return await ApiMiddleware.createErrorResponse(
        error instanceof Error ? error : new Error(String(error)),
        request,
        500,
        { component: 'api_docs' }
      )
    }
  },
  {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50 // 50 requests per window
    },
    cors: true
  }
)
