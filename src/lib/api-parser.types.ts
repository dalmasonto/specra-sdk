/**
 * Simple API Documentation Format for Specra
 * Easy to write, easy to parse
 */

export interface ApiParam {
  name: string
  type: string
  required?: boolean
  description?: string
  default?: any
  example?: any
}

export interface ApiHeader {
  name: string
  value: string
  description?: string
}

export interface ApiResponse {
  status: number
  description?: string
  example?: any
  schema?: any
}

export interface ApiEndpointSpec {
  title: string
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  description?: string

  // Parameters
  pathParams?: ApiParam[]
  queryParams?: ApiParam[]
  headers?: ApiHeader[]
  body?: {
    description?: string
    example?: any
    schema?: any
  }

  // Responses
  successResponse?: ApiResponse
  errorResponses?: ApiResponse[]

  // Examples
  examples?: {
    title: string
    language: string
    code: string
  }[]
}

export interface SpecraApiSpec {
  version?: string
  title?: string
  description?: string
  baseUrl: string

  // Environment variables for interpolation
  env?: Record<string, string>

  // Global headers applied to all endpoints
  globalHeaders?: ApiHeader[]

  // Authentication
  auth?: {
    type: "bearer" | "apiKey" | "basic"
    description?: string
    headerName?: string
    tokenPrefix?: string
  }

  // Endpoints
  endpoints: ApiEndpointSpec[]
}
