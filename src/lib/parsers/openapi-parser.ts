import type { SpecraApiSpec, ApiEndpointSpec, ApiParam, ApiResponse } from "../api-parser.types"
import type { ApiSpecParser } from "./base-parser"

/**
 * Parser for OpenAPI 3.0/3.1 specifications
 */
export class OpenApiParser implements ApiSpecParser {
  validate(input: any): boolean {
    return (
      typeof input === "object" &&
      input !== null &&
      ("openapi" in input || "swagger" in input) &&
      "paths" in input
    )
  }

  parse(input: any): SpecraApiSpec {
    if (!this.validate(input)) {
      throw new Error("Invalid OpenAPI spec format")
    }

    const baseUrl = this.extractBaseUrl(input)
    const endpoints: ApiEndpointSpec[] = []

    // Parse paths
    for (const [path, pathItem] of Object.entries(input.paths || {})) {
      const methods = ["get", "post", "put", "patch", "delete"] as const

      for (const method of methods) {
        const operation = (pathItem as any)[method]
        if (!operation) continue

        const endpoint = this.parseOperation(path, method.toUpperCase() as any, operation, input)
        endpoints.push(endpoint)
      }
    }

    return {
      version: input.info?.version,
      title: input.info?.title,
      description: input.info?.description,
      baseUrl,
      auth: this.extractAuth(input),
      endpoints,
    }
  }

  private extractBaseUrl(spec: any): string {
    // OpenAPI 3.x servers
    if (spec.servers && spec.servers.length > 0) {
      return spec.servers[0].url
    }

    // Swagger 2.0
    if (spec.host) {
      const scheme = spec.schemes?.[0] || "https"
      const basePath = spec.basePath || ""
      return `${scheme}://${spec.host}${basePath}`
    }

    return ""
  }

  private extractAuth(spec: any): SpecraApiSpec["auth"] {
    const securitySchemes = spec.components?.securitySchemes || spec.securityDefinitions

    if (!securitySchemes) return undefined

    // Get the first security scheme
    const firstScheme = Object.values(securitySchemes)[0] as any
    if (!firstScheme) return undefined

    if (firstScheme.type === "http" && firstScheme.scheme === "bearer") {
      return {
        type: "bearer",
        description: firstScheme.description,
        tokenPrefix: "Bearer",
      }
    }

    if (firstScheme.type === "apiKey") {
      return {
        type: "apiKey",
        description: firstScheme.description,
        headerName: firstScheme.name || "X-API-Key",
      }
    }

    if (firstScheme.type === "http" && firstScheme.scheme === "basic") {
      return {
        type: "basic",
        description: firstScheme.description,
      }
    }

    return undefined
  }

  private parseOperation(
    path: string,
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
    operation: any,
    spec: any
  ): ApiEndpointSpec {
    const endpoint: ApiEndpointSpec = {
      title: operation.summary || operation.operationId || `${method} ${path}`,
      method,
      path: this.convertPathParams(path),
      description: operation.description,
    }

    // Parse parameters
    const params = this.parseParameters(operation.parameters || [], spec)
    if (params.path.length > 0) endpoint.pathParams = params.path
    if (params.query.length > 0) endpoint.queryParams = params.query
    if (params.header.length > 0) {
      endpoint.headers = params.header.map((p) => ({
        name: p.name,
        value: p.example || "",
        description: p.description,
      }))
    }

    // Parse request body
    if (operation.requestBody) {
      endpoint.body = this.parseRequestBody(operation.requestBody, spec)
    }

    // Parse responses
    const responses = this.parseResponses(operation.responses || {}, spec)
    if (responses.success) endpoint.successResponse = responses.success
    if (responses.errors.length > 0) endpoint.errorResponses = responses.errors

    return endpoint
  }

  private convertPathParams(path: string): string {
    // Convert OpenAPI {param} to :param
    return path.replace(/\{([^}]+)\}/g, ":$1")
  }

  private parseParameters(
    parameters: any[],
    spec: any
  ): { path: ApiParam[]; query: ApiParam[]; header: ApiParam[] } {
    const result = { path: [] as ApiParam[], query: [] as ApiParam[], header: [] as ApiParam[] }

    for (const param of parameters) {
      // Resolve $ref if present
      const resolved = param.$ref ? this.resolveRef(param.$ref, spec) : param

      const apiParam: ApiParam = {
        name: resolved.name,
        type: resolved.schema?.type || resolved.type || "string",
        required: resolved.required,
        description: resolved.description,
        example: resolved.example || resolved.schema?.example,
      }

      if (resolved.in === "path") result.path.push(apiParam)
      else if (resolved.in === "query") result.query.push(apiParam)
      else if (resolved.in === "header") result.header.push(apiParam)
    }

    return result
  }

  private parseRequestBody(requestBody: any, spec: any): ApiEndpointSpec["body"] {
    const content = requestBody.content?.["application/json"]
    if (!content) return undefined

    return {
      description: requestBody.description,
      example: content.example || this.generateExample(content.schema, spec),
      schema: content.schema,
    }
  }

  private parseResponses(
    responses: any,
    spec: any
  ): { success?: ApiResponse; errors: ApiResponse[] } {
    const result: { success?: ApiResponse; errors: ApiResponse[] } = { errors: [] }

    for (const [statusCode, response] of Object.entries(responses)) {
      const status = parseInt(statusCode)
      if (isNaN(status)) continue

      const resolved = (response as any).$ref ? this.resolveRef((response as any).$ref, spec) : response
      const content = (resolved as any).content?.["application/json"]

      const apiResponse: ApiResponse = {
        status,
        description: (resolved as any).description,
        example: content?.example || this.generateExample(content?.schema, spec),
        schema: content?.schema,
      }

      if (status >= 200 && status < 300) {
        result.success = apiResponse
      } else {
        result.errors.push(apiResponse)
      }
    }

    return result
  }

  private generateExample(schema: any, spec: any): any {
    if (!schema) return undefined
    if (schema.$ref) schema = this.resolveRef(schema.$ref, spec)
    if (schema.example) return schema.example

    // Simple example generation based on schema type
    if (schema.type === "object" && schema.properties) {
      const example: any = {}
      for (const [key, prop] of Object.entries(schema.properties)) {
        example[key] = this.generateExample(prop, spec)
      }
      return example
    }

    if (schema.type === "array" && schema.items) {
      return [this.generateExample(schema.items, spec)]
    }

    // Default values by type
    const defaults: any = {
      string: "string",
      number: 0,
      integer: 0,
      boolean: false,
      object: {},
      array: [],
    }

    return defaults[schema.type] || null
  }

  private resolveRef(ref: string, spec: any): any {
    const path = ref.replace(/^#\//, "").split("/")
    let current = spec

    for (const segment of path) {
      current = current[segment]
      if (!current) return {}
    }

    return current
  }
}
