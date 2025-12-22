import type { SpecraApiSpec, ApiEndpointSpec, ApiParam, ApiHeader } from "../api-parser.types"
import type { ApiSpecParser } from "./base-parser"

/**
 * Parser for Postman Collection v2.0/v2.1
 */
export class PostmanParser implements ApiSpecParser {
  validate(input: any): boolean {
    return (
      typeof input === "object" &&
      input !== null &&
      "info" in input &&
      input.info?.schema?.includes("v2")
    )
  }

  parse(input: any): SpecraApiSpec {
    if (!this.validate(input)) {
      throw new Error("Invalid Postman Collection format (requires v2.0 or v2.1)")
    }

    const baseUrl = this.extractBaseUrl(input)
    const endpoints: ApiEndpointSpec[] = []

    // Parse items (can be nested in folders)
    this.parseItems(input.item || [], endpoints, baseUrl, input)

    return {
      version: input.info?.version,
      title: input.info?.name,
      description: input.info?.description,
      baseUrl,
      auth: this.extractAuth(input.auth),
      globalHeaders: this.extractGlobalHeaders(input),
      endpoints,
    }
  }

  private extractBaseUrl(collection: any): string {
    // Try to get from variables
    const baseUrlVar = collection.variable?.find(
      (v: any) => v.key === "baseUrl" || v.key === "base_url" || v.key === "url"
    )
    if (baseUrlVar) return baseUrlVar.value

    // Try to extract from first request
    if (collection.item && collection.item.length > 0) {
      const firstRequest = this.findFirstRequest(collection.item)
      if (firstRequest?.request?.url) {
        const url = this.parseUrl(firstRequest.request.url)
        if (url.host) {
          return `${url.protocol}://${url.host.join(".")}`
        }
      }
    }

    return ""
  }

  private findFirstRequest(items: any[]): any {
    for (const item of items) {
      if (item.request) return item
      if (item.item) {
        const found = this.findFirstRequest(item.item)
        if (found) return found
      }
    }
    return null
  }

  private extractAuth(auth: any): SpecraApiSpec["auth"] {
    if (!auth) return undefined

    if (auth.type === "bearer") {
      return {
        type: "bearer",
        tokenPrefix: "Bearer",
      }
    }

    if (auth.type === "apikey") {
      const keyData = auth.apikey?.find((a: any) => a.key === "key")
      const keyName = keyData?.value || "X-API-Key"

      return {
        type: "apiKey",
        headerName: keyName,
      }
    }

    if (auth.type === "basic") {
      return {
        type: "basic",
      }
    }

    return undefined
  }

  private extractGlobalHeaders(collection: any): ApiHeader[] {
    // Postman doesn't have global headers in the same way, but we can check for common patterns
    return []
  }

  private parseItems(items: any[], endpoints: ApiEndpointSpec[], baseUrl: string, collection: any) {
    for (const item of items) {
      // If it's a folder, recurse
      if (item.item && Array.isArray(item.item)) {
        this.parseItems(item.item, endpoints, baseUrl, collection)
      }
      // If it's a request
      else if (item.request) {
        const endpoint = this.parseRequest(item, baseUrl, collection)
        endpoints.push(endpoint)
      }
    }
  }

  private parseRequest(item: any, baseUrl: string, collection: any): ApiEndpointSpec {
    const request = item.request
    const url = this.parseUrl(request.url)

    const endpoint: ApiEndpointSpec = {
      title: item.name,
      method: request.method.toUpperCase(),
      path: this.buildPath(url, baseUrl),
      description: item.request.description || item.description,
    }

    // Parse URL parameters (path and query)
    const params = this.parseUrlParams(url)
    if (params.path.length > 0) endpoint.pathParams = params.path
    if (params.query.length > 0) endpoint.queryParams = params.query

    // Parse headers
    if (request.header && request.header.length > 0) {
      endpoint.headers = request.header
        .filter((h: any) => !h.disabled)
        .map((h: any) => ({
          name: h.key,
          value: h.value || "",
          description: h.description,
        }))
    }

    // Parse request body
    if (request.body) {
      endpoint.body = this.parseBody(request.body)
    }

    // Parse response examples
    const responses = this.parseResponses(item.response || [])
    if (responses.success) endpoint.successResponse = responses.success
    if (responses.errors.length > 0) endpoint.errorResponses = responses.errors

    return endpoint
  }

  private parseUrl(url: any): {
    protocol: string
    host: string[]
    path: string[]
    query: any[]
    variable: any[]
  } {
    if (typeof url === "string") {
      // Parse string URL
      const urlObj = new URL(url)
      return {
        protocol: urlObj.protocol.replace(":", ""),
        host: urlObj.hostname.split("."),
        path: urlObj.pathname.split("/").filter(Boolean),
        query: [],
        variable: [],
      }
    }

    return {
      protocol: url.protocol || "https",
      host: url.host || [],
      path: url.path || [],
      query: url.query || [],
      variable: url.variable || [],
    }
  }

  private buildPath(url: any, baseUrl: string): string {
    let path = "/"

    if (url.path && url.path.length > 0) {
      path += url.path.join("/")
    }

    // Convert Postman :param to our :param format (they're the same!)
    // But we need to handle {{variable}} syntax
    path = path.replace(/\{\{([^}]+)\}\}/g, ":$1")

    return path
  }

  private parseUrlParams(url: any): { path: ApiParam[]; query: ApiParam[] } {
    const result = { path: [] as ApiParam[], query: [] as ApiParam[] }

    // Path parameters from variables
    if (url.variable && url.variable.length > 0) {
      for (const v of url.variable) {
        result.path.push({
          name: v.key,
          type: v.type || "string",
          description: v.description,
          example: v.value,
        })
      }
    }

    // Extract path params from the path itself
    if (url.path && url.path.length > 0) {
      for (const segment of url.path) {
        if (segment.startsWith(":")) {
          const paramName = segment.slice(1)
          // Only add if not already added from variables
          if (!result.path.find((p) => p.name === paramName)) {
            result.path.push({
              name: paramName,
              type: "string",
            })
          }
        }
      }
    }

    // Query parameters
    if (url.query && url.query.length > 0) {
      for (const q of url.query) {
        if (q.disabled) continue
        result.query.push({
          name: q.key,
          type: "string",
          description: q.description,
          example: q.value,
        })
      }
    }

    return result
  }

  private parseBody(body: any): ApiEndpointSpec["body"] {
    if (!body) return undefined

    let example: any
    let description = body.description

    if (body.mode === "raw") {
      try {
        example = JSON.parse(body.raw)
      } catch {
        example = body.raw
      }
    } else if (body.mode === "formdata" || body.mode === "urlencoded") {
      example = {}
      for (const item of body[body.mode] || []) {
        if (!item.disabled) {
          example[item.key] = item.value
        }
      }
    }

    return {
      description,
      example,
    }
  }

  private parseResponses(responses: any[]): { success?: any; errors: any[] } {
    const result: { success?: any; errors: any[] } = { errors: [] }

    for (const response of responses) {
      let example: any
      try {
        example = JSON.parse(response.body)
      } catch {
        example = response.body
      }

      const apiResponse = {
        status: response.code || 200,
        description: response.name,
        example,
      }

      if (apiResponse.status >= 200 && apiResponse.status < 300) {
        if (!result.success) result.success = apiResponse
      } else {
        result.errors.push(apiResponse)
      }
    }

    return result
  }
}
