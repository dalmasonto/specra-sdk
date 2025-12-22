import type { SpecraApiSpec } from "../api-parser.types"
import type { ApiSpecParser } from "./base-parser"
import { SpecraParser } from "./specra-parser"
import { OpenApiParser } from "./openapi-parser"
import { PostmanParser } from "./postman-parser"

export type ParserType = "auto" | "specra" | "openapi" | "postman"

/**
 * Registry of all available parsers
 */
const parsers: Map<string, ApiSpecParser> = new Map([
  ["specra", new SpecraParser()],
  ["openapi", new OpenApiParser()],
  ["postman", new PostmanParser()],
])

/**
 * Auto-detect the parser type based on the input structure
 */
export function detectParserType(input: any): ParserType {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid API spec: input must be an object")
  }

  // Check for Postman Collection
  if (input.info?.schema?.includes("v2")) {
    return "postman"
  }

  // Check for OpenAPI/Swagger
  if (input.openapi || input.swagger) {
    return "openapi"
  }

  // Check for Specra format
  if (input.endpoints && Array.isArray(input.endpoints)) {
    return "specra"
  }

  throw new Error(
    "Unable to auto-detect API spec format. Supported formats: Specra, OpenAPI 3.x, Postman Collection v2.x"
  )
}

/**
 * Parse an API spec using the specified or auto-detected parser
 */
export function parseApiSpec(input: any, parserType: ParserType = "auto"): SpecraApiSpec {
  // Auto-detect if needed
  const actualType = parserType === "auto" ? detectParserType(input) : parserType

  // Get the parser
  const parser = parsers.get(actualType)
  if (!parser) {
    throw new Error(`Unknown parser type: ${actualType}`)
  }

  // Validate and parse
  if (!parser.validate(input)) {
    throw new Error(`Input does not match ${actualType} format`)
  }

  return parser.parse(input)
}

// Export parsers for direct use
export { SpecraParser, OpenApiParser, PostmanParser }
export type { ApiSpecParser }
