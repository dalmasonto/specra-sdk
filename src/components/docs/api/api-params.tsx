interface ApiParam {
  name: string
  type: string
  required?: boolean
  description?: string
  default?: string
}

interface ApiParamsProps {
  title?: string
  params: ApiParam[]
}

export function ApiParams({ title = "Parameters", params }: ApiParamsProps) {
  if (!params || params.length === 0) return null

  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-foreground mb-3">{title}</h4>
      <div className="space-y-3">
        {params.map((param) => (
          <div key={param.name} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono text-foreground">{param.name}</code>
              <span className="text-xs text-muted-foreground">{param.type}</span>
              {param.required && (
                <span className="text-xs text-red-600 dark:text-red-400">required</span>
              )}
              {param.default && (
                <span className="text-xs text-muted-foreground">
                  default: <code className="text-xs">{param.default}</code>
                </span>
              )}
            </div>
            {param.description && (
              <p className="text-sm text-muted-foreground">{param.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
