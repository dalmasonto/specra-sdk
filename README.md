# Specra

A modern documentation library for Next.js that makes it easy to create beautiful, feature-rich documentation sites.

## Features

- 📝 **MDX Support** - Write documentation in Markdown with React components
- 📚 **Multi-Version Docs** - Support multiple documentation versions seamlessly
- 🔌 **API Reference Generation** - Auto-generate API docs from OpenAPI, Postman, or Specra formats
- 🔍 **Full-Text Search** - Integrated MeiliSearch support for fast search
- 🎯 **Tab Groups** - Organize content into multiple navigation tabs
- 🌓 **Dark Mode** - Built-in theme switching with system preference detection
- 🎨 **Customizable** - Highly configurable with Tailwind CSS
- ⚡ **Fast** - Built on Next.js with optimized performance
- 📱 **Responsive** - Mobile-friendly design out of the box
- 🔥 **Hot Reload** - Instant updates during development

## Installation

```bash
npm install specra
# or
yarn add specra
# or
pnpm add specra
```

## Quick Start

### 1. Create a new Next.js app (if you don't have one)

```bash
npx create-next-app@latest my-docs
cd my-docs
```

### 2. Install Specra

```bash
npm install specra
```

### 3. Set up your app structure

```
my-docs/
├── app/
│   ├── layout.tsx          # Re-export from Specra
│   ├── page.tsx            # Your landing page
│   └── docs/
│       └── [version]/
│           └── [...slug]/
│               └── page.tsx  # Re-export from Specra
├── docs/                   # Your MDX content
│   └── v1.0.0/
│       └── getting-started.mdx
├── public/
│   └── logo.png
└── specra.config.json      # Specra configuration
```

### 4. Configure app/layout.tsx

```typescript
// app/layout.tsx
export { default } from 'specra/app/layout'
export { generateMetadata } from 'specra/app/layout'
```

### 5. Configure app/docs/[version]/[...slug]/page.tsx

```typescript
// app/docs/[version]/[...slug]/page.tsx
export { default } from 'specra/app/docs-page'
export {
  generateStaticParams,
  generateMetadata
} from 'specra/app/docs-page'
```

### 6. Create specra.config.json

```json
{
  "site": {
    "title": "My Documentation",
    "description": "Awesome docs built with Specra",
    "url": "https://docs.example.com",
    "logo": "/logo.png"
  },
  "theme": {
    "defaultMode": "system",
    "primaryColor": "#0070f3"
  },
  "navigation": {
    "sidebar": true,
    "breadcrumbs": true
  }
}
```

### 7. Create your first doc

```mdx
---
title: Getting Started
description: Learn how to get started with our platform
---

# Getting Started

Welcome to the documentation!
```

### 8. Import globals.css

Add to your `app/globals.css`:

```css
@import 'specra/styles';

/* Your custom styles */
```

### 9. Run development server

```bash
npm run dev
```

Visit `http://localhost:3000/docs/v1.0.0/getting-started` to see your docs!

## Configuration

See [Configuration Guide](https://docs.specra.dev/configuration) for full documentation.

## Upgrading

Simply update the package to get latest features and bug fixes:

```bash
npm update specra
```

Your content and configuration stay the same - only the SDK updates!

## Why Specra?

Specra is designed to be the easiest way to create documentation for your projects. It handles all the complex parts (versioning, search, API references) while letting you focus on writing great content.

## License

MIT

## Authors

dalmasonto, arthur-kamau