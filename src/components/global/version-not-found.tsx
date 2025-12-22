import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export function VersionNotFound() {
  return (
    <>
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500" />
        </div>
        <h1 className="mb-2 text-4xl font-bold">Version Not Found</h1>
        <p className="mb-6 text-muted-foreground">
          The documentation version you're looking for doesn't exist.
        </p>
        <Link
          href="/docs/v1.0.0"
          className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go to Latest Version
        </Link>
      </div>
    </div>
    </>
  )
}