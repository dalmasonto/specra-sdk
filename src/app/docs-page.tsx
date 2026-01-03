import type { Metadata } from "next"
import { extractTableOfContents, getAdjacentDocs, isCategoryPage } from "../lib/mdx"
import { getCachedVersions, getCachedAllDocs, getCachedDocBySlug } from "../lib/mdx-cache"
import { DocLayout } from "../components/docs/doc-layout"
import { TableOfContents } from "../components/docs/table-of-contents"
import { Header } from "../components/docs/header"
import { HotReloadIndicator } from "../components/docs/hot-reload-indicator"
import { DevModeBadge } from "../components/docs/dev-mode-badge"
import { MdxHotReload } from "../components/docs/mdx-hot-reload"
import { CategoryIndex } from "../components/docs/category-index"
import { NotFoundContent } from "../components/docs/not-found-content"
import { getConfig } from "../lib/config"
import { Suspense } from "react"
import { DocLoading } from "../components/docs/doc-loading"
import { DocLayoutWrapper } from "../components/docs/doc-layout-wrapper"

interface PageProps {
  params: Promise<{
    version: string
    slug: string[]
  }>
}

/**
 * Generate metadata for documentation pages
 * This is exported so users can re-export it from their page.tsx
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { version, slug: slugArray } = await params
  const slug = slugArray.join("/")

  const doc = await getCachedDocBySlug(slug, version)

  if (!doc) {
    return {
      title: "Page Not Found",
      description: "The requested documentation page could not be found.",
    }
  }

  const title = doc.meta.title || doc.title
  const description = doc.meta.description || `Documentation for ${title}`
  const url = `/docs/${version}/${slug}`

  return {
    title: `${title}`,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Documentation Platform",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

/**
 * Generate static params for all documentation pages
 * This enables static generation at build time
 */
export async function generateStaticParams() {
  const versions = getCachedVersions()
  const params = []

  for (const version of versions) {
    const docs = await getCachedAllDocs(version)
    for (const doc of docs) {
      // Add the custom slug path
      params.push({
        version,
        slug: doc.slug.split("/").filter(Boolean),
      })
    }
  }

  return params
}

/**
 * Documentation page component
 * Handles:
 * - Regular documentation pages
 * - Category index pages (with or without content)
 * - 404 pages (when doc not found)
 */
export default async function DocPage({ params }: PageProps) {
  const { version, slug: slugArray } = await params
  const slug = slugArray.join("/")

  const allDocs = await getCachedAllDocs(version)
  const versions = getCachedVersions()
  const config = getConfig()
  const isCategory = isCategoryPage(slug, allDocs)

  // Try to get the doc (might be index.mdx or regular .mdx)
  const doc = await getCachedDocBySlug(slug, version)

  // If no doc found and it's a category, show category index
  if (!doc && isCategory) {
    // Find a doc in this category to get the tab group
    const categoryDoc = allDocs.find((d) => d.slug.startsWith(slug + "/"))
    const categoryTabGroup = categoryDoc?.meta?.tab_group || categoryDoc?.categoryTabGroup

    return (
      <>
        <DocLayoutWrapper
          header={<Header currentVersion={version} versions={versions} config={config} />}
          docs={allDocs}
          version={version}
          children={
            <CategoryIndex
              categoryPath={slug}
              version={version}
              allDocs={allDocs}
              title={slug.split("/").pop()?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || "Category"}
              description="Browse the documentation in this section."
              config={config}
            />
          }
          toc={<div />}
          config={config}
          currentPageTabGroup={categoryTabGroup}
        />
        <MdxHotReload />
        <HotReloadIndicator />
        <DevModeBadge />
      </>
    )
  }

  // If no doc found, render 404 content within the layout (keeps sidebar visible)
  if (!doc) {
    return (
      <>
        <Suspense fallback={<DocLoading />}>
          <DocLayoutWrapper
            header={<Header currentVersion={version} versions={versions} config={config} />}
            docs={allDocs}
            version={version}
            children={<NotFoundContent version={version} />}
            toc={<div />}
            config={config}
            currentPageTabGroup={undefined}
          />
          <MdxHotReload />
          <HotReloadIndicator />
          <DevModeBadge />
        </Suspense>
      </>
    )
  }

  const toc = extractTableOfContents(doc.content)
  const { previous, next } = getAdjacentDocs(slug, allDocs)

  // If doc exists but is also a category, show both content and children
  const showCategoryIndex = isCategory && doc

  // Get current page's tab group from doc metadata or category
  const currentPageTabGroup = doc.meta?.tab_group || doc.categoryTabGroup

  return (
    <>
      <Suspense fallback={<DocLoading />}>
        <DocLayoutWrapper
          header={<Header currentVersion={version} versions={versions} config={config} />}
          docs={allDocs}
          version={version}
          children={
            showCategoryIndex ? (
              <CategoryIndex
                categoryPath={slug}
                version={version}
                allDocs={allDocs}
                title={doc.meta.title}
                description={doc.meta.description}
                content={doc.content}
                config={config}
              />
            ) : (
              <DocLayout
                meta={doc.meta}
                content={doc.content}
                previousDoc={previous ? { title: previous.meta.title, slug: previous.slug } : undefined}
                nextDoc={next ? { title: next.meta.title, slug: next.slug } : undefined}
                version={version}
                slug={slug}
                config={config}
              />
            )
          }
          toc={showCategoryIndex ? <div /> : <TableOfContents items={toc} config={config} />}
          config={config}
          currentPageTabGroup={currentPageTabGroup}
        />
        <MdxHotReload />
        <HotReloadIndicator />
        <DevModeBadge />
      </Suspense>
    </>
  )
}