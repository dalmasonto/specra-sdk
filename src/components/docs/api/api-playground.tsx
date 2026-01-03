"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "../code-block"
import { Play, Loader2 } from "lucide-react"

interface PathParam {
  name: string
  type: string
  example?: any
}

interface ApiPlaygroundProps {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  path: string
  baseUrl?: string
  headers?: Record<string, string>
  defaultBody?: string
  pathParams?: PathParam[]
}

export function ApiPlayground({
  method,
  path,
  baseUrl = "",
  headers = {},
  defaultBody,
  pathParams = []
}: ApiPlaygroundProps) {
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestBody, setRequestBody] = useState(defaultBody || "")

  // Initialize headers with empty strings if not provided
  const initialHeaders = useMemo(() => {
    const cleanHeaders: Record<string, string> = {}
    Object.entries(headers).forEach(([key, value]) => {
      cleanHeaders[key] = value || ""
    })
    return cleanHeaders
  }, [headers])

  const [requestHeaders, setRequestHeaders] = useState(JSON.stringify(initialHeaders, null, 2))

  // Extract path parameters and initialize with defaults
  const extractedParams = useMemo(() => {
    const params: Record<string, string> = {}
    const pathParamPattern = /:(\w+)/g
    let match

    while ((match = pathParamPattern.exec(path)) !== null) {
      const paramName = match[1]
      const paramConfig = pathParams.find(p => p.name === paramName)

      // Set default value based on example or type
      if (paramConfig?.example !== undefined) {
        params[paramName] = String(paramConfig.example)
      } else if (paramConfig?.type === "number") {
        params[paramName] = "1"
      } else {
        params[paramName] = ""
      }
    }

    return params
  }, [path, pathParams])

  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>(extractedParams)

  // Build the final URL with path params replaced
  const buildUrl = () => {
    let finalPath = path
    Object.entries(pathParamValues).forEach(([key, value]) => {
      finalPath = finalPath.replace(`:${key}`, value)
    })
    return `${baseUrl}${finalPath}`
  }

  const handleSend = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const url = buildUrl()
      const parsedHeaders = JSON.parse(requestHeaders)

      const options: RequestInit = {
        method,
        headers: {
          "Content-Type": "application/json",
          ...parsedHeaders,
        },
      }

      if (method !== "GET" && method !== "DELETE" && requestBody) {
        options.body = requestBody
      }

      const res = await fetch(url, options)
      const data = await res.json()

      setResponse({
        status: res.status,
        statusText: res.statusText,
        headers: Object.fromEntries(res.headers.entries()),
        body: data,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="not-prose border border-border rounded-lg overflow-hidden bg-card/30">
      <div className="bg-muted/50 px-4 py-2 border-b border-border">
        <h4 className="text-sm font-semibold text-foreground">API Playground</h4>
      </div>

      <div className="p-4 space-y-4">
        {/* Path Parameters */}
        {Object.keys(pathParamValues).length > 0 && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Path Parameters
            </label>
            <div className="space-y-2">
              {Object.entries(pathParamValues).map(([paramName, paramValue]) => {
                const paramConfig = pathParams.find(p => p.name === paramName)
                return (
                  <div key={paramName} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground min-w-[80px]">
                      :{paramName}
                    </span>
                    <Input
                      value={paramValue}
                      onChange={(e) =>
                        setPathParamValues((prev) => ({ ...prev, [paramName]: e.target.value }))
                      }
                      placeholder={paramConfig?.example || paramConfig?.type || "value"}
                      className="font-mono text-sm"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* URL */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Request URL
          </label>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {method}
            </Badge>
            <Input value={buildUrl()} readOnly className="font-mono text-sm" />
          </div>
        </div>

        {/* Headers */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-2 block">
            Headers (JSON)
          </label>
          <Textarea
            value={requestHeaders}
            onChange={(e) => setRequestHeaders(e.target.value)}
            className="font-mono text-sm"
            rows={4}
          />
        </div>

        {/* Body (for POST, PUT, PATCH) */}
        {method !== "GET" && method !== "DELETE" && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Request Body (JSON)
            </label>
            <Textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="font-mono text-sm"
              rows={6}
              placeholder='{\n  "key": "value"\n}'
            />
          </div>
        )}

        {/* Send Button */}
        <Button onClick={handleSend} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Send Request
            </>
          )}
        </Button>

        {/* Response */}
        {response && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block">
              Response ({response.status} {response.statusText})
            </label>
            <CodeBlock code={JSON.stringify(response.body, null, 2)} language="json" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
