import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { getConfig } from "../lib/config"
import { getAssetPath } from "../lib/utils"
import { ConfigProvider } from "../components/config-provider"
import { TabProvider } from "../components/docs/tab-context"
import "../styles/globals.css"

const geist = Geist({ subsets: ["latin"] })
const geistMono = Geist_Mono({ subsets: ["latin"] })

/**
 * Generate metadata for the root layout
 * This can be imported and used by the user's app/layout.tsx
 */
export function generateMetadata(): Metadata {
  const config = getConfig()

  return {
    title: {
      default: config.site.title,
      template: `%s | ${config.site.title}`,
    },
    description: config.site.description || "Modern documentation platform",
    generator: "Specra Documentation",
    metadataBase: config.site.url ? new URL(config.site.url) : undefined,
    icons: {
      icon: getAssetPath(config.site.favicon ?? "") ? [
        {
          url: getAssetPath(config.site.favicon ?? ""),
        },
      ] : [],
      apple: getAssetPath("/apple-icon.png"),
    },
    openGraph: {
      title: config.site.title,
      description: config.site.description,
      url: config.site.url,
      siteName: config.site.title,
      locale: config.site.language || "en",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: config.site.title,
      description: config.site.description,
    },
  }
}

export const metadata: Metadata = generateMetadata()

/**
 * Root layout component for Specra documentation sites
 * This provides the HTML structure and global providers
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const config = getConfig()
  const defaultTab = config.navigation?.tabGroups?.[0]?.id || ""

  return (
    <html lang={config.site.language || "en"} suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`}>
        <ConfigProvider config={config}>
          <TabProvider defaultTab={defaultTab}>
            {children}
          </TabProvider>
        </ConfigProvider>
      </body>
    </html>
  )
}