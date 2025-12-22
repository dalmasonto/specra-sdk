import type { SpecraApiSpec } from "../api-parser.types"
import type { ApiSpecParser } from "./base-parser"

/**
 * Parser for native Specra API format
 * This is a pass-through parser since the input is already in the correct format
 */
export class SpecraParser implements ApiSpecParser {
  validate(input: any): boolean {
    return (
      typeof input === "object" &&
      input !== null &&
      "endpoints" in input &&
      Array.isArray(input.endpoints)
    )
  }

  parse(input: any): SpecraApiSpec {
    if (!this.validate(input)) {
      throw new Error("Invalid Specra API spec format")
    }
    return input as SpecraApiSpec
  }
}
