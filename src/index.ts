/**
 * Specra Documentation SDK
 *
 * A modern documentation framework for Next.js with:
 * - MDX-based documentation
 * - Versioning support
 * - API reference generation (OpenAPI, Postman, Specra formats)
 * - Full-text search integration (MeiliSearch)
 * - Tab groups for organizing content
 * - Dark mode and theming
 * - SEO optimization
 */

// Core library functions
export * from './lib'

// React components
export * from './components'

// Next.js app exports (for re-exporting in user projects)
export { default as RootLayout, generateMetadata as generateRootMetadata } from './app/layout'
export {
  default as DocsPage,
  generateMetadata as generateDocsMetadata,
  generateStaticParams as generateDocsStaticParams
} from './app/docs-page'

// Types
export type { SpecraConfig, SiteConfig, NavigationConfig, ThemeConfig } from './lib/config.types'
export type { Doc, DocMeta, TocItem } from './lib/mdx'
export type {
  ApiDocumentation,
  ApiSpecConfig,
  ParsedApiSpec,
  RestEndpoint,
  ApiParameter,
  ApiResponse,
  GraphQLSchema,
  WebSocketConnection
} from './lib/api.types'
// Note: SpecraApiResponse is exported from './lib' as a renamed type to avoid conflicts