"use client"

import { useState, useEffect } from "react"
import type { SpecraApiSpec } from "@/lib/api-parser.types"
import { parseApiSpec, type ParserType } from "@/lib/parsers"
import { Accordion, AccordionItem } from "../accordion"
import { ApiEndpoint } from "./api-endpoint"
import { ApiParams } from "./api-params"
import { ApiResponse } from "./api-response"
import { ApiPlayground } from "./api-playground"
import { CodeBlock } from "../code-block"
import { Loader2 } from "lucide-react"

interface ApiReferenceProps {
  /**
   * Path to the API spec JSON file (relative to /public)
   * Example: "/api-specs/my-api.json"
   */
  spec: string

  /**
   * Parser type - auto-detect by default
   * - "auto": Auto-detect format (Specra, OpenAPI, or Postman)
   * - "specra": Native Specra format
   * - "openapi": OpenAPI 3.x / Swagger
   * - "postman": Postman Collection v2.x
   */
  parser?: ParserType

  /**
   * Show API playground for testing
   */
  showPlayground?: boolean
}

export function ApiReference({ spec, parser = "auto", showPlayground = true }: ApiReferenceProps) {
  const [apiSpec, setApiSpec] = useState<SpecraApiSpec | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadSpec() {
      try {
        const response = await fetch(spec)
        if (!response.ok) {
          throw new Error(`Failed to load API spec: ${response.statusText}`)
        }
        const data = await response.json()

        // Parse using the appropriate parser
        const parsedSpec = parseApiSpec(data, parser)
        setApiSpec(parsedSpec)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load API spec")
      } finally {
        setLoading(false)
      }
    }

    loadSpec()
  }, [spec, parser])

  // Replace environment variables in text
  const interpolateEnv = (text: string, env?: Record<string, string>): string => {
    if (!env) return text
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return env[key] || match
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading API specification...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
        <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (!apiSpec) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* API Info */}
      {(apiSpec.title || apiSpec.description) && (
        <div className="mb-8">
          {apiSpec.title && (
            <h2 className="text-2xl font-semibold mb-2 text-foreground">{apiSpec.title}</h2>
          )}
          {apiSpec.description && (
            <p className="text-muted-foreground">{apiSpec.description}</p>
          )}
          {apiSpec.baseUrl && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-muted-foreground mb-1">Base URL</p>
              <code className="text-sm px-2 py-1 bg-muted rounded">{apiSpec.baseUrl}</code>
            </div>
          )}
        </div>
      )}

      {/* Authentication */}
      {apiSpec.auth && (
        <div className="rounded-lg border border-border bg-card/30 p-4 mb-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">Authentication</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {apiSpec.auth.description || `This API uses ${apiSpec.auth.type} authentication.`}
          </p>
          {apiSpec.auth.type === "bearer" && (
            <CodeBlock
              code={`Authorization: ${apiSpec.auth.tokenPrefix || "Bearer"} {YOUR_TOKEN}`}
              language="bash"
            />
          )}
          {apiSpec.auth.type === "apiKey" && (
            <CodeBlock
              code={`${apiSpec.auth.headerName || "X-API-Key"}: {YOUR_API_KEY}`}
              language="bash"
            />
          )}
        </div>
      )}

      {/* Endpoints as Accordion */}
      <Accordion type="single" collapsible className="space-y-4">
        {apiSpec.endpoints.map((endpoint, index) => {
          // Merge global and endpoint-specific headers
          const allHeaders = [
            ...(apiSpec.globalHeaders || []),
            ...(endpoint.headers || []),
          ].map((header) => ({
            ...header,
            value: interpolateEnv(header.value, apiSpec.env),
          }))

          return (
            <AccordionItem
              key={index}
              value={`endpoint-${index}`}
              title={
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      endpoint.method === "GET"
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : endpoint.method === "POST"
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : endpoint.method === "PUT"
                        ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                        : endpoint.method === "PATCH"
                        ? "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                        : "bg-red-500/10 text-red-600 dark:text-red-400"
                    }`}
                  >
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono">{endpoint.path}</code>
                  <span className="text-sm text-muted-foreground ml-auto">{endpoint.title}</span>
                </div>
              }
            >
              <div className="space-y-6 pt-4">
                {/* Description */}
                {endpoint.description && (
                  <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                )}

                {/* Path Parameters */}
                {endpoint.pathParams && endpoint.pathParams.length > 0 && (
                  <ApiParams title="Path Parameters" params={endpoint.pathParams} />
                )}

                {/* Query Parameters */}
                {endpoint.queryParams && endpoint.queryParams.length > 0 && (
                  <ApiParams title="Query Parameters" params={endpoint.queryParams} />
                )}

                {/* Headers */}
                {allHeaders.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Headers</h4>
                    <div className="space-y-2">
                      {allHeaders.map((header, idx) => (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono text-foreground">{header.name}</code>
                            <span className="text-xs text-muted-foreground">{header.value}</span>
                          </div>
                          {header.description && (
                            <p className="text-sm text-muted-foreground">{header.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Request Body */}
                {endpoint.body && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Request Body</h4>
                    {endpoint.body.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {endpoint.body.description}
                      </p>
                    )}
                    {endpoint.body.example && (
                      <CodeBlock
                        code={
                          typeof endpoint.body.example === "string"
                            ? endpoint.body.example
                            : JSON.stringify(endpoint.body.example, null, 2)
                        }
                        language="json"
                      />
                    )}
                  </div>
                )}

                {/* Responses */}
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Responses</h4>
                  {endpoint.successResponse && (
                    <ApiResponse
                      status={endpoint.successResponse.status}
                      description={endpoint.successResponse.description}
                      example={endpoint.successResponse.example}
                      schema={endpoint.successResponse.schema}
                    />
                  )}
                  {endpoint.errorResponses?.map((response, idx) => (
                    <ApiResponse
                      key={idx}
                      status={response.status}
                      description={response.description}
                      example={response.example}
                      schema={response.schema}
                    />
                  ))}
                </div>

                {/* Code Examples */}
                {endpoint.examples && endpoint.examples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Examples</h4>
                    {endpoint.examples.map((example, idx) => (
                      <div key={idx} className="mb-3">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                          {example.title}
                        </p>
                        <CodeBlock code={example.code} language={example.language} />
                      </div>
                    ))}
                  </div>
                )}

                {/* API Playground */}
                {showPlayground && (
                  <ApiPlayground
                    method={endpoint.method}
                    path={endpoint.path}
                    baseUrl={apiSpec.baseUrl}
                    headers={Object.fromEntries(allHeaders.map((h) => [h.name, h.value]))}
                    pathParams={endpoint.pathParams}
                    defaultBody={
                      endpoint.body?.example
                        ? typeof endpoint.body.example === "string"
                          ? endpoint.body.example
                          : JSON.stringify(endpoint.body.example, null, 2)
                        : undefined
                    }
                  />
                )}
              </div>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
