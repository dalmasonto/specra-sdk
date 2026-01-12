# Specra SDK - Claude Developer Guide

## Introduction
Hello Claude! This document is designed to help you understand and work with the Specra SDK. Specra is a modern documentation framework for Next.js that makes it easy to create beautiful, searchable, and feature-rich documentation sites.

## Project Context

### What is Specra?
Specra is a comprehensive documentation library that sits on top of Next.js, providing out-of-the-box features that would typically require significant custom development:
- MDX-based content authoring
- Multi-version documentation support
- API reference generation from OpenAPI, Postman, or custom formats
- Integrated full-text search using MeiliSearch
- Beautiful UI components built with Radix UI and Tailwind CSS

### Project Relationships
This SDK is part of a three-project ecosystem:

1. **specra-sdk** (this project) - The core library
   - Published as `specra` on npm
   - Provides all the components, utilities, and Next.js integration
   - Used as a dependency by documentation sites

2. **specra-cli** (create-specra) - The scaffolding tool
   - Published as `create-specra` on npm
   - CLI that generates new documentation projects
   - Pre-configures Next.js with Specra SDK

3. **specra-docs** - The documentation site
   - Uses Specra to document itself (dogfooding)
   - Serves as both documentation and reference implementation
   - Hosted at https://specra.vercel.app

## Architecture Overview

### Package Structure
```
specra-sdk/
├── src/
│   ├── app/              # Next.js App Router components
│   │   ├── layout.tsx    # Root layout with theme provider
│   │   └── docs-page.tsx # Dynamic docs page component
│   ├── components/       # UI components
│   │   └── index.ts      # Exported components
│   ├── layouts/          # Page layouts
│   │   └── index.ts      # Layout components
│   ├── lib/              # Core utilities
│   │   ├── config.types.ts      # Configuration schema
│   │   ├── api.types.ts         # API types
│   │   ├── mdx.ts              # MDX processing
│   │   └── parsers/            # API format parsers
│   ├── middleware/       # Next.js middleware
│   │   └── security.ts   # Security headers
│   └── mdx-components.tsx # MDX component mappings
├── config/               # Next.js config presets
│   ├── next-config.mjs
│   ├── next.config.default.mjs
│   └── next.config.export.mjs
├── package.json
├── tsconfig.json
└── tsup.config.ts       # Build configuration
```

### Export Strategy
The package uses a sophisticated export map in package.json that allows consumers to import from multiple entry points:

```typescript
// Main exports
import { DocsLayout } from 'specra'
import { Callout } from 'specra/components'
import { parseMDX } from 'specra/lib'

// App route re-exports
export { default } from 'specra/app/layout'
export { default } from 'specra/app/docs-page'

// Styles
import 'specra/styles'

// Configuration helpers
import withSpecra from 'specra/next-config'
```

### Build Process
- **Tool**: tsup (fast TypeScript bundler)
- **Outputs**:
  - CommonJS (dist/*.js)
  - ESM (dist/*.mjs)
  - Type definitions (dist/*.d.ts)
  - CSS bundle (dist/styles.css)
- **Special**: JSON schema generation for config validation

## Key Features Deep Dive

### 1. MDX Processing
Located in `src/lib/mdx.ts`, this handles:
- Parsing MDX files with frontmatter
- Applying rehype/remark plugins (math, syntax highlighting, etc.)
- Component resolution
- Hot reload support

### 2. Version Management
Specra supports multiple documentation versions:
- Each version in separate directory (e.g., `docs/v1.0.0/`)
- Version-aware routing via `[version]` dynamic segment
- Version selector UI component
- Static generation for all versions

### 3. API Documentation Generation
Supports three formats:
- **OpenAPI/Swagger**: Standard REST API specs
- **Postman Collections**: Exported Postman collections
- **Specra Format**: Custom simplified format

Parsers located in `src/lib/parsers/` convert these to unified internal format.

### 4. Search Integration
- Built-in MeiliSearch support
- Indexes MDX content and API references
- Search UI component included
- Optional feature (can be disabled in config)

### 5. Component Library
Includes pre-built components:
- Callouts/alerts
- Code blocks with syntax highlighting
- Tabs and tab groups
- Cards and grids
- API endpoint displays
- Table of contents
- Breadcrumbs
- Navigation sidebar

## Configuration Schema

### specra.config.json Structure
```typescript
interface SpecraConfig {
  site: {
    title: string
    description: string
    url: string
    logo?: string
    favicon?: string
  }
  theme: {
    defaultMode: 'light' | 'dark' | 'system'
    primaryColor: string
    customCSS?: string
  }
  navigation: {
    sidebar: boolean
    breadcrumbs: boolean
    toc: boolean
    links?: NavigationLink[]
  }
  versions: {
    current: string
    available: string[]
    defaultVersion?: string
  }
  search?: {
    enabled: boolean
    provider: 'meilisearch'
    config: MeiliSearchConfig
  }
  api?: {
    enabled: boolean
    sources: APISource[]
  }
}
```

Full schema generated at `config/specra.config.schema.json`.

## Working with Specra

### When Adding Features
1. **Components**: Add to `src/components/`, export from `index.ts`
2. **Utilities**: Add to `src/lib/`, maintain type safety
3. **Layouts**: Add to `src/layouts/` if creating new page templates
4. **Middleware**: Add to `src/middleware/` for request handling
5. **Exports**: Update package.json exports map if adding new entry points

### When Fixing Bugs
1. **Check types**: Most issues surface in TypeScript
2. **MDX rendering**: Issues often in `src/lib/mdx.ts`
3. **Styling**: Check Tailwind classes and CSS imports
4. **Routes**: Verify dynamic route handling in `src/app/`

### When Modifying Configuration
1. Update `src/lib/config.types.ts`
2. Run `npm run generate:schema` to update JSON schema
3. Update documentation in specra-docs
4. Consider backward compatibility

### Common Patterns
```typescript
// Loading configuration
import { loadConfig } from 'specra/lib'
const config = await loadConfig()

// Processing MDX
import { parseMDX } from 'specra/lib'
const { content, frontmatter } = await parseMDX(filePath)

// Using components
import { Callout, CodeBlock } from 'specra/components'

// Applying layouts
import { DocsLayout } from 'specra/layouts'
```

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start watch mode (rebuilds on changes)
npm run dev

# Type check
npm run typecheck

# Build for production
npm run build
```

### Testing Changes
To test changes in a real project:
```bash
# In specra-sdk
npm run build
npm link

# In test project
npm link specra
```

Or use specra-docs as a test bed since it uses this SDK.

## Dependencies to Know

### Peer Dependencies (Required by Consumer)
- next: ^14.0.0 || ^15.0.0 || ^16.0.0
- react: ^18.0.0 || ^19.0.0
- react-dom: ^18.0.0 || ^19.0.0

### Key Runtime Dependencies
- **next-mdx-remote**: MDX processing
- **gray-matter**: Frontmatter parsing
- **meilisearch**: Search functionality
- **radix-ui**: UI primitives
- **next-themes**: Theme management
- **tailwindcss**: Styling framework
- **zod**: Schema validation
- **rehype/remark plugins**: Content transformation

## Common Tasks

### Adding a New Component
1. Create component file in `src/components/`
2. Export from `src/components/index.ts`
3. Update package.json exports if needed
4. Add to MDX components if usable in MDX
5. Document in specra-docs

### Modifying MDX Processing
1. Edit `src/lib/mdx.ts`
2. Add rehype/remark plugins as needed
3. Update dependencies if adding plugins
4. Test with various MDX content

### Updating Config Schema
1. Modify `src/lib/config.types.ts`
2. Run `npm run generate:schema`
3. Verify `config/specra.config.schema.json`
4. Update consumers to use new config

### Adding New Export Path
1. Update package.json exports map
2. Ensure TypeScript types are exported
3. Update documentation
4. Test import in consumer project

## Important Files

### Configuration
- `package.json` - Package metadata and exports
- `tsconfig.json` - TypeScript configuration
- `tsup.config.ts` - Build configuration

### Core Logic
- `src/lib/config.types.ts` - Configuration schema (source of truth)
- `src/lib/mdx.ts` - MDX processing pipeline
- `src/app/layout.tsx` - Root layout component
- `src/app/docs-page.tsx` - Dynamic docs page

### Build Outputs
- `dist/` - Compiled code (generated)
- `config/specra.config.schema.json` - Generated JSON schema

## Best Practices

### For Code Changes
1. Maintain TypeScript strict mode compliance
2. Keep components server-compatible where possible
3. Use "use client" directive only when necessary
4. Follow existing code patterns and structure
5. Update types before implementation

### For Configuration
1. Use Zod for runtime validation
2. Provide sensible defaults
3. Document all options thoroughly
4. Maintain backward compatibility

### For Styling
1. Use Tailwind CSS classes
2. Support dark mode via next-themes
3. Ensure responsive design
4. Leverage Radix UI for accessibility

## Troubleshooting

### Build Issues
- Check tsup.config.ts for entry points
- Verify all imports are resolvable
- Ensure external dependencies are marked correctly

### Type Issues
- Run `npm run typecheck` to catch issues early
- Check peer dependency versions
- Verify exports in package.json match actual files

### Runtime Issues
- Check Next.js version compatibility
- Verify client/server component boundaries
- Check middleware configuration

## Version Management
Current version: 0.1.7

When releasing:
1. Update version in package.json
2. Build and test: `npm run build`
3. Publish to npm: `npm publish`
4. Tag in git: `git tag v0.1.7`
5. Update specra-cli templates if needed
6. Update specra-docs to use new version

## Questions to Consider

When working with this codebase, ask yourself:
- Does this change affect the public API?
- Will existing users need to migrate?
- Does the configuration schema need updating?
- Should this be documented in specra-docs?
- Does this affect specra-cli templates?
- Is this change compatible with all supported Next.js versions?

## Resources
- GitHub: https://github.com/dalmasonto/specra
- Documentation: https://specra.vercel.app
- npm: https://www.npmjs.com/package/specra

## Authors
- dalmasonto
- arthur-kamau

---

This guide should give you a comprehensive understanding of the Specra SDK. When making changes, always consider the impact on the broader ecosystem (CLI and docs site).
