import type { SpecraApiSpec } from "../api-parser.types"

/**
 * Base interface for all API spec parsers
 */
export interface ApiSpecParser {
  /**
   * Parse the input spec and convert to Specra format
   */
  parse(input: any): SpecraApiSpec

  /**
   * Validate if the input is in the expected format
   */
  validate(input: any): boolean
}
