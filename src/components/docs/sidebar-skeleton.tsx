export function SidebarSkeleton() {
  return (
    <aside className="w-64 pr-8 py-6">
      <div className="space-y-6">
        {/* Documentation title */}
        <div className="px-2">
          <div className="h-5 w-32 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Skeleton items */}
        <div className="space-y-1">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="px-3 py-2">
              <div
                className="h-4 bg-muted/50 rounded animate-pulse"
                style={{ width: `${60 + Math.random() * 40}%` }}
              />
            </div>
          ))}
        </div>

        {/* Another section */}
        <div className="space-y-1">
          <div className="px-2 mb-2">
            <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-3 py-2">
              <div
                className="h-4 bg-muted/50 rounded animate-pulse"
                style={{ width: `${50 + Math.random() * 50}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
