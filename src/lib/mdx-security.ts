/**
 * MDX Security Layer
 *
 * Protects against:
 * - XSS via malicious MDX expressions
 * - Path traversal attacks
 * - Dangerous component usage
 * - Cross-domain vulnerabilities
 */

import path from "path"

/**
 * Sanitize file paths to prevent path traversal attacks
 * Blocks: ../, ..\, absolute paths, encoded traversal attempts
 */
export function sanitizePath(userPath: string): string {
  // Decode URI components to catch encoded traversal attempts
  const decoded = decodeURIComponent(userPath)

  // Block path traversal patterns
  if (
    decoded.includes("../") ||
    decoded.includes("..\\") ||
    decoded.includes("%2e%2e") ||
    decoded.includes("%252e%252e") ||
    path.isAbsolute(decoded)
  ) {
    throw new Error("Path traversal detected")
  }

  // Normalize and validate the path
  const normalized = path.normalize(decoded).replace(/\\/g, "/")

  // Ensure path doesn't escape after normalization
  if (normalized.startsWith("..") || normalized.includes("/../")) {
    throw new Error("Invalid path detected")
  }

  return normalized
}

/**
 * Validate that a file path is within allowed directory
 */
export function validatePathWithinDirectory(filePath: string, allowedDir: string): boolean {
  const resolvedPath = path.resolve(allowedDir, filePath)
  const resolvedDir = path.resolve(allowedDir)

  return resolvedPath.startsWith(resolvedDir + path.sep) || resolvedPath === resolvedDir
}

/**
 * Dangerous MDX patterns that should be blocked
 * These patterns can execute arbitrary code during SSR
 */
const DANGEROUS_PATTERNS = [
  // JavaScript execution
  /eval\s*\(/gi,
  /Function\s*\(/gi,
  /import\s*\(/gi,
  /require\s*\(/gi,

  // File system access
  /fs\.[a-z]+/gi,
  /readFile/gi,
  /writeFile/gi,
  /process\.env/gi,

  // Network requests during SSR (legitimate client-side usage should use components)
  /fetch\s*\(/gi,

  // Dangerous Node.js modules
  /child_process/gi,
  /exec\s*\(/gi,
  /spawn\s*\(/gi,

  // Script tag injection
  /<script[>\s]/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, onload, etc.
]

/**
 * Scan MDX content for dangerous patterns
 * Returns array of detected issues
 */
export function scanMDXForDangerousPatterns(content: string): string[] {
  const issues: string[] = []

  for (const pattern of DANGEROUS_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      issues.push(`Dangerous pattern detected: ${pattern.source}`)
    }
  }

  return issues
}

/**
 * Sanitize MDX content by removing/escaping dangerous patterns
 * This is a defensive measure - ideally content should be rejected if dangerous
 */
export function sanitizeMDXContent(content: string, strict: boolean = false): string {
  if (strict) {
    const issues = scanMDXForDangerousPatterns(content)
    if (issues.length > 0) {
      throw new Error(`MDX content contains dangerous patterns: ${issues.join(", ")}`)
    }
  }

  // Remove inline script tags
  let sanitized = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")

  // Remove event handlers from HTML tags
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "")

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "")

  return sanitized
}

/**
 * Content Security Policy configuration
 * Use this in your Next.js middleware or headers config
 */
export const CSP_DIRECTIVES = {
  "default-src": ["'self'"],
  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Next.js
    "'unsafe-eval'", // Required for dev mode - remove in production
  ],
  "style-src": ["'self'", "'unsafe-inline'"], // Required for styled-components/emotion
  "img-src": ["'self'", "data:", "https:"],
  "font-src": ["'self'", "data:"],
  "connect-src": ["'self'"],
  "frame-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'self'"],
  "upgrade-insecure-requests": [],
} as const

/**
 * Generate CSP header value from directives
 */
export function generateCSPHeader(
  customDirectives?: Partial<typeof CSP_DIRECTIVES>,
  production: boolean = true
): string {
  const directives: Record<string, readonly string[]> = { ...CSP_DIRECTIVES, ...customDirectives }

  // Remove unsafe-eval in production
  if (production && directives["script-src"]) {
    directives["script-src"] = directives["script-src"].filter(
      (src) => src !== "'unsafe-eval'"
    )
  }

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ")
}

/**
 * Allowlist of safe MDX components
 * Only these components can be used in MDX files
 */
export const SAFE_MDX_COMPONENTS = new Set([
  // Standard HTML elements (automatically allowed by MDX)
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "a", "ul", "ol", "li", "code", "pre",
  "blockquote", "table", "thead", "tbody", "tr", "th", "td",
  "img", "video", "audio", "br", "hr", "strong", "em",

  // Custom safe components
  "Callout", "CodeBlock", "Accordion", "AccordionItem",
  "Tabs", "Tab", "Image", "Video", "Card", "CardGrid",
  "ImageCard", "ImageCardGrid", "Steps", "Step",
  "Icon", "Mermaid", "Math", "Columns", "Column",
  "Badge", "Tooltip", "Frame",
  "ApiEndpoint", "ApiParams", "ApiResponse", "ApiPlayground", "ApiReference",
])

/**
 * Validate component usage in MDX
 */
export function validateMDXComponents(content: string): { valid: boolean; issues: string[] } {
  const issues: string[] = []

  // Find all JSX-like component usage
  const componentRegex = /<([A-Z][a-zA-Z0-9]*)/g
  let match

  while ((match = componentRegex.exec(content)) !== null) {
    const componentName = match[1]
    if (!SAFE_MDX_COMPONENTS.has(componentName)) {
      issues.push(`Unsafe component detected: ${componentName}`)
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Comprehensive MDX security check
 * Use this before processing MDX content
 */
export function validateMDXSecurity(
  content: string,
  options: {
    strictMode?: boolean
    allowCustomComponents?: boolean
    blockDangerousPatterns?: boolean
  } = {}
): { valid: boolean; issues: string[]; sanitized?: string } {
  const {
    strictMode = false,
    allowCustomComponents = true,
    blockDangerousPatterns = true,
  } = options

  const issues: string[] = []

  // Check for dangerous patterns
  if (blockDangerousPatterns) {
    const patternIssues = scanMDXForDangerousPatterns(content)
    issues.push(...patternIssues)
  }

  // Validate components
  if (!allowCustomComponents) {
    const componentValidation = validateMDXComponents(content)
    if (!componentValidation.valid) {
      issues.push(...componentValidation.issues)
    }
  }

  // In strict mode, reject any issues
  if (strictMode && issues.length > 0) {
    return { valid: false, issues }
  }

  // Otherwise, sanitize and warn
  const sanitized = sanitizeMDXContent(content, false)

  return {
    valid: true,
    issues,
    sanitized,
  }
}
