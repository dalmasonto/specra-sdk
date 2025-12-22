/**
 * Specra API Documentation Schema
 * Supports REST, GraphQL, and WebSocket APIs
 */

// ============================================================================
// Common Types
// ============================================================================

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS"

export interface ApiParameter {
  name: string
  type: string
  required?: boolean
  description?: string
  default?: any
  example?: any
  enum?: string[]
}

export interface ApiResponse {
  status: number
  description: string
  schema?: any
  example?: any
  headers?: Record<string, string>
}

export interface ApiExample {
  title: string
  language: string
  code: string
}

export interface ApiAuthentication {
  type: "apiKey" | "bearer" | "basic" | "oauth2" | "none"
  description?: string
  location?: "header" | "query" | "cookie" // For apiKey
  name?: string // Header/query parameter name
  scheme?: string // Bearer scheme
}

// ============================================================================
// REST API Types
// ============================================================================

export interface RestEndpoint {
  type: "rest"
  method: HttpMethod
  path: string
  summary: string
  description?: string
  operationId?: string
  tags?: string[]
  deprecated?: boolean

  // Authentication
  authentication?: ApiAuthentication

  // Parameters
  pathParams?: ApiParameter[]
  queryParams?: ApiParameter[]
  headers?: ApiParameter[]
  body?: {
    contentType: string
    schema?: any
    example?: any
    description?: string
  }

  // Responses
  responses: ApiResponse[]

  // Code Examples
  examples?: ApiExample[]
}

// ============================================================================
// GraphQL API Types
// ============================================================================

export interface GraphQLField {
  name: string
  type: string
  description?: string
  args?: ApiParameter[]
  deprecated?: boolean
  deprecationReason?: string
}

export interface GraphQLType {
  name: string
  kind: "OBJECT" | "INPUT_OBJECT" | "ENUM" | "SCALAR" | "INTERFACE" | "UNION"
  description?: string
  fields?: GraphQLField[]
  enumValues?: { name: string; description?: string }[]
}

export interface GraphQLQuery {
  type: "graphql"
  operationType: "query" | "mutation" | "subscription"
  name: string
  description?: string
  args?: ApiParameter[]
  returnType: string
  example?: string
  response?: any
}

export interface GraphQLSchema {
  queries?: GraphQLQuery[]
  mutations?: GraphQLQuery[]
  subscriptions?: GraphQLQuery[]
  types?: GraphQLType[]
}

// ============================================================================
// WebSocket API Types
// ============================================================================

export interface WebSocketEvent {
  type: "websocket"
  event: string
  direction: "client-to-server" | "server-to-client" | "bidirectional"
  description?: string
  payload?: {
    schema?: any
    example?: any
  }
  response?: {
    schema?: any
    example?: any
  }
}

export interface WebSocketConnection {
  url: string
  authentication?: ApiAuthentication
  description?: string
  events: WebSocketEvent[]
}

// ============================================================================
// Unified API Documentation
// ============================================================================

export interface ApiDocumentation {
  version: string
  title: string
  description?: string
  baseUrl?: string
  servers?: Array<{
    url: string
    description?: string
  }>

  // REST endpoints
  rest?: {
    endpoints: RestEndpoint[]
  }

  // GraphQL schema
  graphql?: GraphQLSchema

  // WebSocket connections
  websocket?: WebSocketConnection[]

  // Global settings
  authentication?: ApiAuthentication[]
  headers?: Record<string, string>
}

// ============================================================================
// API Spec Sources
// ============================================================================

export interface ApiSpecConfig {
  // Source type
  source: "openapi" | "postman" | "insomnia" | "specra" | "manual"

  // File path (relative to public/api-specs/)
  path?: string

  // Inline spec (for Specra format)
  spec?: ApiDocumentation

  // Auto-generate pages
  autoGenerate?: boolean

  // Output directory for generated pages
  outputDir?: string
}

// ============================================================================
// Helper Types for Parsing
// ============================================================================

export interface ParsedApiSpec {
  source: ApiSpecConfig["source"]
  documentation: ApiDocumentation
}
