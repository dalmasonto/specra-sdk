import fs from "fs"
import path from "path"
import matter from "gray-matter"
import { getAllCategoryConfigs } from "./category"
import { sortSidebarItems, sortSidebarGroups, buildSidebarStructure, type SidebarGroup } from "./sidebar-utils"
import { sanitizePath, validatePathWithinDirectory, validateMDXSecurity } from "./mdx-security"
import { getConfig } from "./config"
import { I18nConfig } from "./config.types"

const DOCS_DIR = path.join(process.cwd(), "docs")

/**
 * Calculate reading time based on word count
 * Average reading speed: 200 words per minute
 */
function calculateReadingTime(content: string): { minutes: number; words: number } {
  const words = content.trim().split(/\s+/).length
  const minutes = Math.ceil(words / 200)
  return { minutes, words }
}

export interface DocMeta {
  title: string
  description?: string
  slug?: string
  section?: string
  group?: string
  sidebar?: string
  order?: number
  sidebar_position?: number
  content?: string
  last_updated?: string
  draft?: boolean
  authors?: Array<{ id: string; name?: string }>
  tags?: string[]
  redirect_from?: string[]
  reading_time?: number
  word_count?: number
  icon?: string  // Icon name for sidebar display (Lucide icon name)
  tab_group?: string  // Tab group ID for organizing docs into tabs
  locale?: string // Locale of the document
}

export interface Doc {
  slug: string
  filePath: string  // Original file path for sidebar grouping
  title: string
  meta: DocMeta
  content: string
  categoryLabel?: string  // Label from _category_.json
  categoryPosition?: number  // Position from _category_.json
  categoryCollapsible?: boolean  // Collapsible from _category_.json
  categoryCollapsed?: boolean  // Default collapsed state from _category_.json
  categoryIcon?: string  // Icon from _category_.json
  categoryTabGroup?: string  // Tab group from _category_.json
  locale?: string // Locale of the document
}

export interface TocItem {
  id: string
  title: string
  level: number
}

export function getVersions(): string[] {
  try {
    const versions = fs.readdirSync(DOCS_DIR)
    return versions.filter((v) => fs.statSync(path.join(DOCS_DIR, v)).isDirectory())
  } catch (error) {
    return ["v1.0.0"]
  }
}

/**
 * Recursively find all MDX files in a directory
 */
function findMdxFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = []

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        files.push(...findMdxFiles(fullPath, baseDir))
      } else if (entry.isFile() && entry.name.endsWith(".mdx")) {
        // Get relative path from base directory and normalize to forward slashes
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/')
        files.push(relativePath)
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error)
  }

  return files
}

/**
 * Internal function to read a doc from file path
 */
function readDocFromFile(filePath: string, originalSlug: string): Doc | null {
  try {
    if (!fs.existsSync(filePath)) {
      return null
    }

    // Validate path is within allowed directory
    if (!validatePathWithinDirectory(filePath, DOCS_DIR)) {
      console.error(`[Security] Path traversal attempt blocked: ${filePath}`)
      return null
    }

    const fileContents = fs.readFileSync(filePath, "utf8")
    const { data, content } = matter(fileContents)

    // Security: Validate MDX content for dangerous patterns
    const securityCheck = validateMDXSecurity(content, {
      strictMode: process.env.NODE_ENV === 'production',
      blockDangerousPatterns: true,
    })

    if (!securityCheck.valid) {
      console.error(`[Security] MDX validation failed for ${filePath}:`, securityCheck.issues)
      if (process.env.NODE_ENV === 'production') {
        return null
      }
      // In development, log warnings but continue
      console.warn('[Security] Continuing in development mode with sanitized content')
    }

    // Use sanitized content if available
    const safeContent = securityCheck.sanitized || content

    // Calculate reading time
    const { minutes, words } = calculateReadingTime(safeContent)

    // If custom slug provided, replace only the filename part, keep the folder structure
    let finalSlug = originalSlug
    if (data.slug) {
      const customSlug = data.slug.replace(/^\//, '')
      const parts = originalSlug.split("/")

      if (parts.length > 1) {
        // Keep folder structure, replace only filename
        parts[parts.length - 1] = customSlug
        finalSlug = parts.join("/")
      } else {
        // Root level file, use custom slug as-is
        finalSlug = customSlug
      }
    }

    return {
      slug: finalSlug,
      filePath: originalSlug,  // Keep original file path for sidebar
      title: data.title || originalSlug,
      meta: {
        ...data,
        content: safeContent,
        reading_time: minutes,
        word_count: words,
      } as DocMeta,
      content: safeContent,
    }
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error)
    return null
  }
}

function getI18nConfig(): I18nConfig | null {
  const config = getConfig()
  const i18n = config.features?.i18n

  if (!i18n) return null

  if (typeof i18n === 'boolean') {
    return i18n ? {
      defaultLocale: 'en',
      locales: ['en'],
      localeNames: { en: 'English' }
    } : null
  }

  return i18n
}

export async function getDocBySlug(slug: string, version = "v1.0.0", locale?: string): Promise<Doc | null> {
  try {
    // Security: Sanitize and validate slug
    const sanitizedVersion = sanitizePath(version)
    let sanitizedSlug = sanitizePath(slug)

    // Get i18n config
    const i18nConfig = getI18nConfig()

    // Determine locale from slug if not provided
    let detectedLocale = locale || i18nConfig?.defaultLocale

    if (i18nConfig) {
      const parts = sanitizedSlug.split('/')
      if (parts.length > 0 && i18nConfig.locales.includes(parts[0])) {
        detectedLocale = parts[0]
        sanitizedSlug = parts.slice(1).join('/')
        if (sanitizedSlug === "") sanitizedSlug = "index"
      }
    }

    const targetLocale = detectedLocale
    const isDefaultLocale = targetLocale === i18nConfig?.defaultLocale

    // Try finding the file in this order:
    // 1. Localized extension: slug.locale.mdx (e.g. guide.fr.mdx)
    // 2. Default file: slug.mdx (only if using default locale and configured to fallback or strictly default)

    // Construct potential paths
    const basePath = path.join(DOCS_DIR, sanitizedVersion)

    // 1. Try localized file extension
    if (targetLocale) {
      const localizedPath = path.join(basePath, `${sanitizedSlug}.${targetLocale}.mdx`)
      const doc = readDocFromFile(localizedPath, sanitizedSlug) // Keep parsed slug
      if (doc) {
        doc.slug = i18nConfig ? `${targetLocale}/${sanitizedSlug}` : sanitizedSlug
        doc.meta.locale = targetLocale
        return doc
      }
    }

    // 2. Try default file
    const defaultPath = path.join(basePath, `${sanitizedSlug}.mdx`)
    const doc = readDocFromFile(defaultPath, sanitizedSlug)

    if (doc) {
      // If we found a default file but requested a specific locale using prefix, 
      // we might want to return it but with the prefix in slug if we are doing fallback.
      // For now, strict mode: if I request /fr/guide and guide.fr.mdx is missing, 
      // should I return guide.mdx? 
      // Let's assume explicitly: Yes, but keep the URL /fr/guide ?? 
      // No, typically you want 404 if translation missing, OR fallback.
      // Let's stick to: if explicit locale requested and file not found, we fall through to null eventually.
      // BUT if it matches default locale, we return it.

      if (isDefaultLocale || !i18nConfig) {
        // For default locale, we might want to prefix if prompt said "add language to url"
        // If i18n enabled and prefixDefault is true, ensure slug has prefix.
        // But existing behavior for default locale usually omits prefix.
        // If plan said: /en/docs/... then we probably want prefix even for default?
        // The config I added has `prefixDefault`. Checks that.

        const usePrefix = i18nConfig && (i18nConfig.prefixDefault || targetLocale !== i18nConfig.defaultLocale)

        if (usePrefix && targetLocale) {
          doc.slug = `${targetLocale}/${doc.slug}`
        }
        doc.meta.locale = targetLocale || 'en'
        return doc
      }
    }

    // If still not found, search all docs for a matching custom slug
    // This part is expensive and might need update for i18n, disabling for now or leaving as is for default locale
    // Ideally custom slugs should also be localized? 
    // Let's rely on standard file resolution for now for i18n to ensure stability.

    return null
  } catch (error) {
    console.error(`Error reading doc ${slug}:`, error)
    return null
  }
}

export async function getAllDocs(version = "v1.0.0", locale?: string): Promise<Doc[]> {
  try {
    const versionDir = path.join(DOCS_DIR, version)

    if (!fs.existsSync(versionDir)) {
      return []
    }

    // Get i18n config
    const i18nConfig = getI18nConfig()
    const targetLocale = locale || i18nConfig?.defaultLocale || 'en'

    const mdxFiles = findMdxFiles(versionDir)
    const categoryConfigs = getAllCategoryConfigs(version)

    const docs = await Promise.all(
      mdxFiles.map(async (file) => {
        // file contains path relative to version dir, e.g. "getting-started/intro.mdx" or "intro.fr.mdx"

        let originalFilePath = file.replace(/\.mdx$/, "")

        // Handle localized files
        let isLocalized = false
        let fileLocale = i18nConfig?.defaultLocale || 'en'

        if (i18nConfig) {
          // Check for .<locale> suffix
          const parts = originalFilePath.split('.')
          const lastPart = parts[parts.length - 1]
          if (i18nConfig.locales.includes(lastPart)) {
            fileLocale = lastPart
            isLocalized = true
            originalFilePath = parts.slice(0, -1).join('.')
          }
        }

        // If we requested a specific locale, filter out others
        // If target is 'fr', we want intro.fr.mdx (if exists) OR intro.mdx (fallback? no, getAllDocs is usually for list)
        // Actually, for sidebar we want the "best" version of each doc for the current locale.

        // Strategy: Map all files to their logical slug, then group by slug and pick best locale.
        // But getAllDocs is async and parallel.

        // Simplified: Just process all files, returning the doc with its true locale.
        // Then filter/merge later? 
        // No, current logic returns flat array.

        // Let's try to load the doc.
        const doc = await getDocBySlug(originalFilePath, version, isLocalized ? fileLocale : undefined)

        if (!doc) return null

        // Override filePath properties for sidebar grouping 
        // (we want grouped by logical path, not physically localized path if possible)
        doc.filePath = originalFilePath // Use logical path (without .fr) for grouping

        const folderPath = path.dirname(originalFilePath).replace(/\\/g, '/')
        if (folderPath !== ".") {
          const categoryConfig = categoryConfigs.get(folderPath)
          if (categoryConfig) {
            doc.categoryLabel = categoryConfig.label
            doc.categoryPosition = categoryConfig.position ?? categoryConfig.sidebar_position
            doc.categoryCollapsible = categoryConfig.collapsible
            doc.categoryCollapsed = categoryConfig.collapsed
            doc.categoryIcon = categoryConfig.icon
            doc.categoryTabGroup = categoryConfig.tab_group
          }
        }

        return doc
      }),
    )

    const isDevelopment = process.env.NODE_ENV === "development"

    // Create a map to track unique slugs and avoid duplicates, prioritizing target locale
    const uniqueDocs = new Map<string, Doc>()

    // Sort docs such that target locale comes first? No, we need to filter/merge.
    const validDocs = docs.filter((doc): doc is Doc => doc !== null && (isDevelopment || !doc.meta.draft))

    // Group by logical slug (we stored logical path in filePath, maybe use that?)
    // Actually doc.slug might differ if custom slug used.

    // If we have intro.mdx (en) and intro.fr.mdx (fr)
    // And targetLocale is 'fr'
    // We want the 'fr' one.

    validDocs.forEach(doc => {
      // Identify logical slug. 
      // If doc.slug already has prefix (e.g. fr/intro), stripped slug is 'intro'.
      let logicalSlug = doc.slug
      if (i18nConfig) {
        const parts = logicalSlug.split('/')
        if (i18nConfig.locales.includes(parts[0])) {
          logicalSlug = parts.slice(1).join('/')
        }
      }

      const existing = uniqueDocs.get(logicalSlug)

      if (!existing) {
        // If doc matches target locale or is default (and we allow default fallback), take it.
        // For now, take everything, filter later?
        // Better: Only add if it matches target locale OR is default and we don't have target yet.
        if (doc.meta.locale === targetLocale) {
          uniqueDocs.set(logicalSlug, doc)
        } else if (doc.meta.locale === i18nConfig?.defaultLocale) {
          uniqueDocs.set(logicalSlug, doc)
        }
      } else {
        // We have an existing entry. prefer targetLocale
        if (doc.meta.locale === targetLocale && existing.meta.locale !== targetLocale) {
          uniqueDocs.set(logicalSlug, doc)
        }
      }
    })

    return Array.from(uniqueDocs.values()).sort((a, b) => {
      const orderA = a.meta.sidebar_position ?? a.meta.order ?? 999
      const orderB = b.meta.sidebar_position ?? b.meta.order ?? 999
      return orderA - orderB
    })
  } catch (error) {
    console.error(`Error getting all docs for version ${version}:`, error)
    return []
  }
}

// export function getAdjacentDocs(currentSlug: string, allDocs: Doc[]): { previous?: Doc; next?: Doc } {
//   const currentIndex = allDocs.findIndex((doc) => doc.slug === currentSlug)

//   if (currentIndex === -1) {
//     return {}
//   }

//   return {
//     previous: currentIndex > 0 ? allDocs[currentIndex - 1] : undefined,
//     next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : undefined,
//   }
// }

// Flatten the sidebar structure into a linear order
function flattenSidebarOrder(
  rootGroups: Record<string, SidebarGroup>,
  standalone: Doc[]
): Doc[] {
  const flatDocs: Doc[] = []

  // Recursively flatten groups - intermix folders and files by position
  const flattenGroup = (group: SidebarGroup) => {
    const sortedChildren = sortSidebarGroups(group.children)
    const sortedItems = sortSidebarItems(group.items)

    // Merge child groups and items, then sort by position
    const merged: Array<{ type: 'group', group: SidebarGroup, position: number } | { type: 'item', doc: Doc, position: number }> = [
      ...sortedChildren.map(([, childGroup]) => ({
        type: 'group' as const,
        group: childGroup,
        position: childGroup.position
      })),
      ...sortedItems.map((doc) => ({
        type: 'item' as const,
        doc,
        position: doc.meta.sidebar_position ?? doc.meta.order ?? 999
      }))
    ]

    // Sort by position
    merged.sort((a, b) => a.position - b.position)

    // Process in sorted order
    merged.forEach((item) => {
      if (item.type === 'group') {
        flattenGroup(item.group)
      } else {
        flatDocs.push(item.doc)
      }
    })
  }

  // Add standalone items first
  sortSidebarItems(standalone).forEach((doc) => {
    flatDocs.push(doc)
  })

  // Then add all grouped items
  const sortedRootGroups = sortSidebarGroups(rootGroups)
  sortedRootGroups.forEach(([, group]) => {
    flattenGroup(group)
  })

  return flatDocs
}

export function getAdjacentDocs(currentSlug: string, allDocs: Doc[]): { previous?: Doc; next?: Doc } {
  // Build the same sidebar structure
  const { rootGroups, standalone } = buildSidebarStructure(allDocs)

  // Flatten into the same order as shown in the sidebar
  const orderedDocs = flattenSidebarOrder(rootGroups, standalone)

  // Find current doc in the ordered list
  const currentIndex = orderedDocs.findIndex((doc) => doc.slug === currentSlug)

  if (currentIndex === -1) {
    return {}
  }

  const currentDoc = orderedDocs[currentIndex]

  // Get current doc's tab group (from meta or category)
  const currentTabGroup = currentDoc.meta?.tab_group || currentDoc.categoryTabGroup

  // Filter docs to match the current doc's tab group status
  // If current has a tab group, only show docs in the same tab group
  // If current has NO tab group, only show docs with NO tab group
  const filteredDocs = orderedDocs.filter((doc) => {
    const docTabGroup = doc.meta?.tab_group || doc.categoryTabGroup

    // If current doc has a tab group, only include docs with the same tab group
    if (currentTabGroup) {
      return docTabGroup === currentTabGroup
    }

    // If current doc has no tab group, only include docs with no tab group
    return !docTabGroup
  })

  // Find current doc's index within the filtered list
  const filteredIndex = filteredDocs.findIndex((doc) => doc.slug === currentSlug)

  if (filteredIndex === -1) {
    return {}
  }

  return {
    previous: filteredIndex > 0 ? filteredDocs[filteredIndex - 1] : undefined,
    next: filteredIndex < filteredDocs.length - 1 ? filteredDocs[filteredIndex + 1] : undefined,
  }
}

export function extractTableOfContents(content: string): TocItem[] {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const toc: TocItem[] = []
  let match

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length
    const text = match[2]
    // Generate ID the same way rehype-slug does
    const id = text
      .toLowerCase()
      .replace(/\s+/g, "-") // Replace spaces with hyphens first
      .replace(/[^a-z0-9-]/g, "") // Remove special chars (dots, slashes, etc)
      .replace(/^-|-$/g, "") // Remove leading/trailing hyphens

    toc.push({ id, title: text, level })
  }

  return toc
}

/**
 * Check if a slug represents a category (has child documents)
 */
export function isCategoryPage(slug: string, allDocs: Doc[]): boolean {
  return allDocs.some((doc) => {
    const parts = doc.slug.split("/")
    const docParent = parts.slice(0, -1).join("/")
    return docParent === slug && doc.slug !== slug
  })
}


