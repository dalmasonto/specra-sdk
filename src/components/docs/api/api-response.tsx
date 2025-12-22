import { CodeBlock } from "../code-block"

interface ApiResponseProps {
  status: number
  description?: string
  example?: any
  schema?: any
}

const statusColors: Record<string, string> = {
  "2": "text-green-600 dark:text-green-400",
  "3": "text-blue-600 dark:text-blue-400",
  "4": "text-orange-600 dark:text-orange-400",
  "5": "text-red-600 dark:text-red-400",
}

export function ApiResponse({ status, description, example, schema }: ApiResponseProps) {
  const statusClass = statusColors[String(status)[0]] || "text-muted-foreground"

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-semibold ${statusClass}`}>{status}</span>
        {description && <span className="text-sm text-muted-foreground">{description}</span>}
      </div>

      {example && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Example Response</p>
          <CodeBlock
            code={typeof example === "string" ? example : JSON.stringify(example, null, 2)}
            language="json"
          />
        </div>
      )}

      {schema && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">Schema</p>
          <CodeBlock
            code={typeof schema === "string" ? schema : JSON.stringify(schema, null, 2)}
            language="json"
          />
        </div>
      )}
    </div>
  )
}
