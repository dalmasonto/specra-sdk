/**
 * Configuration schema for Specra documentation system
 */

/**
 * Site metadata and branding
 */
export interface SiteConfig {
  /** The title of the documentation site */
  title: string
  /** Short description of the documentation */
  description?: string
  /** URL where the documentation is hosted */
  url?: string
  /** Base URL path for the documentation (e.g., '/docs') */
  baseUrl?: string
  /** Path to the site logo - can be a string or an object with light/dark variants */
  logo?: string | { light: string; dark: string }
  /** Path to the favicon */
  favicon?: string
  /** Default language for the documentation */
  language?: string
  /** Organization or author name */
  organizationName?: string
  /** Project name */
  projectName?: string
  /** Active/default version for the documentation */
  activeVersion?: string
  /** Whether to hide the site title in the header */
  hideTitle?: boolean
  /** Whether to hide the site logo in the header */
  hideLogo?: boolean
}

/**
 * Theme and appearance settings
 */
export interface ThemeConfig {
  /** Primary color for the theme */
  primaryColor?: string
  /** Default theme mode */
  defaultMode?: "light" | "dark" | "system"
  /** Whether to respect system preferences */
  respectPrefersColorScheme?: boolean
  /** Custom CSS file path */
  customCss?: string
}

/**
 * Tab group for organizing documentation
 */
export interface TabGroup {
  /** Unique identifier for the tab group */
  id: string
  /** Display label for the tab */
  label: string
  /** Optional icon name (lucide-react icon) */
  icon?: string
}

/**
 * Navigation and sidebar configuration
 */
export interface NavigationConfig {
  /** Whether to show the sidebar by default */
  showSidebar?: boolean
  /** Whether the sidebar is collapsible */
  collapsibleSidebar?: boolean
  /** Whether to show breadcrumbs */
  showBreadcrumbs?: boolean
  /** Whether to show table of contents */
  showTableOfContents?: boolean
  /** Position of table of contents */
  tocPosition?: "left" | "right"
  /** Maximum depth for table of contents */
  tocMaxDepth?: number
  /** Tab groups for organizing documentation sections */
  tabGroups?: TabGroup[]
}

/**
 * Social and external links
 */
export interface SocialLinks {
  /** GitHub repository URL */
  github?: string
  /** Twitter/X handle or URL */
  twitter?: string
  /** Discord invite URL */
  discord?: string
  /** LinkedIn profile or company page */
  linkedin?: string
  /** YouTube channel URL */
  youtube?: string
  /** Custom social links */
  custom?: Array<{
    label: string
    url: string
    icon?: string
  }>
}

/**
 * Search configuration
 */
export interface SearchConfig {
  /** Enable/disable search functionality */
  enabled?: boolean
  /** Placeholder text for search input */
  placeholder?: string
  /** Search provider type */
  provider?: "meilisearch" | "algolia" | "local"
  /** Meilisearch configuration */
  meilisearch?: {
    /** Meilisearch server URL */
    host: string
    /** API key for Meilisearch */
    apiKey?: string
    /** Index name */
    indexName: string
  }
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Google Analytics tracking ID */
  googleAnalytics?: string
  /** Google Tag Manager ID */
  googleTagManager?: string
  /** Plausible Analytics domain */
  plausible?: string
  /** Custom analytics scripts */
  custom?: Array<{
    src: string
    async?: boolean
    defer?: boolean
  }>
}

/**
 * Footer configuration
 */
export interface FooterConfig {
  /** Copyright text */
  copyright?: string
  /** Footer links organized by columns */
  links?: Array<{
    title: string
    items: Array<{
      label: string
      href: string
    }>
  }>
  /** Custom footer content */
  customContent?: string
}

/**
 * Documentation features
 */
export interface FeaturesConfig {
  /** Enable/disable edit this page links */
  editUrl?: string | false
  /** Show last updated timestamp */
  showLastUpdated?: boolean
  /** Show reading time estimate */
  showReadingTime?: boolean
  /** Show author information */
  showAuthors?: boolean
  /** Show tags */
  showTags?: boolean
  /** Enable version dropdown */
  versioning?: boolean
  /** Enable i18n (internationalization) */
  i18n?: boolean
}

/**
 * Site-wide banner configuration
 */
export interface BannerConfig {
  /** Whether the banner is enabled */
  enabled?: boolean
  /** Banner message */
  message?: string
  /** Banner type */
  type?: "info" | "warning" | "success" | "error"
  /** Whether the banner can be dismissed */
  dismissible?: boolean
}

/**
 * Environment variables that can be used in documentation
 * These will be replaced at build time or runtime
 */
export interface EnvironmentVariables {
  /** API base URL */
  API_BASE_URL?: string
  /** API version */
  API_VERSION?: string
  /** CDN URL */
  CDN_URL?: string
  /** Custom environment variables */
  [key: string]: string | undefined
}

/**
 * Deployment configuration for different hosting scenarios
 */
export interface DeploymentConfig {
  /**
   * Deployment target
   * - 'vercel': For Vercel or similar Node.js hosting (uses 'standalone' output)
   * - 'github-pages': For GitHub Pages static hosting (uses 'export' output)
   * - 'static': For any static hosting like Netlify, Cloudflare Pages, etc.
   * - 'custom-domain-static': For static hosting with custom domain (no basePath needed)
   */
  target?: "vercel" | "github-pages" | "static" | "custom-domain-static"

  /**
   * Base path for assets when deploying to GitHub Pages without custom domain
   * This should be your repository name (e.g., 'my-repo')
   * Only used when target is 'github-pages' and no custom domain is configured
   */
  basePath?: string

  /**
   * Whether a custom domain is configured
   * When true, basePath will be ignored even for GitHub Pages
   */
  customDomain?: boolean
}

/**
 * Main configuration interface
 */
export interface SpecraConfig {
  /** Site metadata and branding */
  site: SiteConfig
  /** Theme and appearance settings */
  theme?: ThemeConfig
  /** Navigation and sidebar configuration */
  navigation?: NavigationConfig
  /** Social and external links */
  social?: SocialLinks
  /** Search configuration */
  search?: SearchConfig
  /** Analytics configuration */
  analytics?: AnalyticsConfig
  /** Footer configuration */
  footer?: FooterConfig
  /** Site-wide banner */
  banner?: BannerConfig
  /** Documentation features */
  features?: FeaturesConfig
  /** Environment variables for use in docs */
  env?: EnvironmentVariables
  /** Deployment configuration */
  deployment?: DeploymentConfig
}

/**
 * Default configuration values
 */
export const defaultConfig: SpecraConfig = {
  site: {
    title: "Documentation",
    description: "Project documentation",
    baseUrl: "/",
    language: "en",
  },
  theme: {
    defaultMode: "system",
    respectPrefersColorScheme: true,
  },
  navigation: {
    showSidebar: true,
    collapsibleSidebar: true,
    showBreadcrumbs: true,
    showTableOfContents: true,
    tocPosition: "right",
    tocMaxDepth: 3,
  },
  search: {
    enabled: true,
    provider: "local",
    placeholder: "Search documentation...",
  },
  features: {
    showLastUpdated: true,
    showReadingTime: true,
    showAuthors: false,
    showTags: true,
    versioning: true,
    i18n: false,
  },
}
