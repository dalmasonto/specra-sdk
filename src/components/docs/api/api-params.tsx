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
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Property
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Required
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Default
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {params.map((param, index) => (
              <tr
                key={param.name}
                className={index !== params.length - 1 ? "border-b border-border/50" : ""}
              >
                <td className="py-2.5 px-3">
                  <code className="text-sm font-mono text-foreground">{param.name}</code>
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-sm text-muted-foreground font-mono">{param.type}</span>
                </td>
                <td className="py-2.5 px-3">
                  {param.required ? (
                    <span className="text-sm text-red-600 dark:text-red-400">Yes</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">No</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {param.default ? (
                    <code className="text-sm font-mono text-muted-foreground">{param.default}</code>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
                <td className="py-2.5 px-3">
                  {param.description ? (
                    <span className="text-sm text-muted-foreground">{param.description}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
