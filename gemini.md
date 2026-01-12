# Specra SDK - Gemini Developer Guide

## Overview
Welcome! This guide will help you understand and contribute to the Specra SDK. Specra is a modern, full-featured documentation framework built for Next.js applications.

## What is Specra?

### Purpose
Specra is an npm package that transforms Next.js applications into powerful documentation sites with minimal setup. It provides:
- **Content Management**: MDX-based authoring with React component integration
- **Version Control**: Multi-version documentation support
- **API Documentation**: Auto-generation from OpenAPI, Postman, and custom formats
- **Search**: Full-text search powered by MeiliSearch
- **UI Components**: Pre-built, accessible components using Radix UI
- **Theming**: Dark/light mode with Tailwind CSS customization

### Project Ecosystem
Specra consists of three interconnected projects:

| Project | Package Name | Purpose | Relationship |
|---------|-------------|---------|--------------|
| **specra-sdk** | `specra` | Core library | Foundation for everything |
| **specra-cli** | `create-specra` | Project generator | Uses SDK to scaffold projects |
| **specra-docs** | N/A (website) | Documentation | Built with SDK, demonstrates features |

**Flow**: Developer runs `create-specra` → CLI scaffolds project with `specra` dependency → Developer writes docs → Refers to `specra-docs` for guidance

## Technical Architecture

### Technology Stack
```
Foundation:
├── Next.js 14/15/16 (App Router)
├── React 18/19
└── TypeScript 5

Styling:
├── Tailwind CSS 4
├── Radix UI (primitives)
└── next-themes (theme switching)

Content:
├── MDX (next-mdx-remote)
├── gray-matter (frontmatter)
├── remark plugins (GFM, math)
└── rehype plugins (KaTeX, slug generation)

Features:
├── MeiliSearch (search)
├── Zod (validation)
└── date-fns (date formatting)

Build:
├── tsup (bundling)
└── ts-json-schema-generator (config schema)
```

### Directory Structure
```
specra-sdk/
├── src/
│   ├── app/                    # Next.js App Router integration
│   │   ├── layout.tsx          # Root layout (theme provider, metadata)
│   │   ├── docs-page.tsx       # Dynamic docs page component
│   │   └── api/mdx-watch/      # Hot reload API endpoint
│   │
│   ├── components/             # React UI components
│   │   ├── navigation/         # Sidebar, breadcrumbs, TOC
│   │   ├── content/            # Callouts, code blocks, tabs
│   │   ├── search/             # Search UI
│   │   └── index.ts            # Public exports
│   │
│   ├── layouts/                # Page layout templates
│   │   ├── docs-layout.tsx     # Main docs layout
│   │   └── index.ts
│   │
│   ├── lib/                    # Core utilities
│   │   ├── config.types.ts     # Configuration TypeScript types
│   │   ├── api.types.ts        # API documentation types
│   │   ├── mdx.ts             # MDX processing engine
│   │   ├── config.ts          # Config loader/validator
│   │   └── parsers/           # API format parsers
│   │       ├── openapi.ts
│   │       ├── postman.ts
│   │       └── specra.ts
│   │
│   ├── middleware/             # Next.js middleware
│   │   └── security.ts         # Security headers
│   │
│   ├── mdx-components.tsx      # MDX component mappings
│   └── index.ts                # Main package entry
│
├── config/                     # Next.js config presets
│   ├── next-config.mjs         # Base config helper
│   ├── next.config.default.mjs # Default deployment
│   └── next.config.export.mjs  # Static export
│
├── dist/                       # Build output (generated)
│   ├── *.js                    # CommonJS
│   ├── *.mjs                   # ES Modules
│   ├── *.d.ts                  # TypeScript definitions
│   └── styles.css              # Bundled CSS
│
├── package.json                # Package configuration
├── tsconfig.json               # TypeScript config
├── tsup.config.ts             # Build configuration
└── README.md                   # User-facing documentation
```

### Build System

#### Build Tool: tsup
Configuration in `tsup.config.ts`:
- **Input**: TypeScript source files in `src/`
- **Output**: Multiple formats (CJS, ESM) in `dist/`
- **Splitting**: Code splitting for optimal loading
- **Treeshaking**: Removes unused code
- **Type Generation**: Emits TypeScript definitions
- **CSS**: Bundles Tailwind styles

#### Build Commands
```bash
npm run build          # Full production build
npm run dev            # Watch mode for development
npm run typecheck      # Type checking without emit
npm run generate:schema # Generate JSON schema from types
```

#### Build Process
1. Clean `dist/` directory
2. Generate config JSON schema from TypeScript types
3. Compile TypeScript to JavaScript (CJS + ESM)
4. Generate type definition files
5. Bundle CSS from Tailwind
6. Copy static assets (config files)

### Package Exports

The package.json `exports` field defines multiple entry points:

```json
{
  "exports": {
    ".": "./dist/index.js",                    // Main entry
    "./app/layout": "./dist/app/layout.js",     // App layout
    "./app/docs-page": "./dist/app/docs-page.js", // Docs page
    "./components": "./dist/components/index.js", // UI components
    "./layouts": "./dist/layouts/index.js",      // Layouts
    "./lib": "./dist/lib/index.js",             // Utilities
    "./middleware/security": "./dist/middleware/security.js",
    "./next-config": "./config/next-config.mjs", // Config helper
    "./styles": "./dist/styles.css"              // Styles
  }
}
```

This allows granular imports:
```typescript
// Consumers can import specific parts
import { Callout } from 'specra/components'
import { parseMDX } from 'specra/lib'
import 'specra/styles'
```

## Core Features

### 1. MDX Processing Pipeline

**File**: `src/lib/mdx.ts`

**Process**:
```
MDX File → Parse Frontmatter → Compile MDX → Apply Plugins → Return Content + Metadata
```

**Key Functions**:
- `parseMDX(filePath)`: Reads and processes MDX file
- `compileMDX(content)`: Compiles MDX string to React
- `extractFrontmatter(content)`: Parses YAML frontmatter

**Plugins Chain**:
1. **Remark** (Markdown processing):
   - remark-gfm: GitHub Flavored Markdown
   - remark-math: Math equation support

2. **Rehype** (HTML processing):
   - rehype-slug: Auto-generate heading IDs
   - rehype-katex: Render math with KaTeX
   - rehype-raw: Allow HTML in MDX

**Component Resolution**:
MDX components mapped in `mdx-components.tsx` to custom implementations (e.g., custom `<a>`, `<code>`, `<img>` tags).

### 2. Configuration System

**File**: `src/lib/config.types.ts` (source of truth)

**Schema Definition**:
Uses TypeScript interfaces with JSDoc comments, auto-generates JSON schema via `ts-json-schema-generator`.

**Config Structure**:
```typescript
interface SpecraConfig {
  site: SiteConfig          // Title, description, logo, etc.
  theme: ThemeConfig        // Colors, dark mode settings
  navigation: NavConfig     // Sidebar, breadcrumbs, TOC
  versions?: VersionConfig  // Multi-version support
  search?: SearchConfig     // MeiliSearch integration
  api?: APIConfig          // API documentation sources
  deployment?: DeployConfig // Build and deployment options
}
```

**Loading Process**:
1. Look for `specra.config.json` in project root
2. Validate against JSON schema
3. Merge with defaults
4. Return typed configuration object

**Validation**: Uses Zod schemas generated from TypeScript types for runtime validation.

### 3. Versioning System

**Structure**:
```
docs/
├── v1.0.0/
│   ├── getting-started.mdx
│   └── api/
│       └── endpoints.mdx
├── v1.1.0/
│   ├── getting-started.mdx
│   └── api/
│       └── endpoints.mdx
└── v2.0.0/
    └── ...
```

**Routing**:
- Dynamic route: `/docs/[version]/[...slug]`
- `[version]`: Matches version directories
- `[...slug]`: Catches all nested paths

**Implementation**:
- `generateStaticParams()`: Pre-renders all version/path combinations
- Version selector component: Switches between versions
- Maintains URL structure across versions

### 4. API Documentation Generation

**Supported Formats**:

| Format | Parser | Input | Use Case |
|--------|--------|-------|----------|
| OpenAPI | `parsers/openapi.ts` | .json/.yaml | Standard REST APIs |
| Postman | `parsers/postman.ts` | .json | Postman collections |
| Specra | `parsers/specra.ts` | .json | Simplified custom format |

**Conversion Flow**:
```
Input Format → Parser → Unified Internal Format → React Components → Rendered Docs
```

**Internal Format** (`src/lib/api.types.ts`):
- Normalized structure across all input formats
- Includes endpoints, methods, parameters, responses
- Supports examples, authentication, tags

**Rendering**:
Custom components display API information:
- Endpoint cards with HTTP methods
- Request/response examples
- Parameter tables
- Authentication requirements

### 5. Search Integration

**Provider**: MeiliSearch (cloud or self-hosted)

**Implementation**:
1. **Indexing**: Script scans MDX files and API docs
2. **Storage**: Pushes to MeiliSearch instance
3. **Client**: Search UI component queries MeiliSearch
4. **Results**: Display with highlighting and navigation

**Configuration**:
```json
{
  "search": {
    "enabled": true,
    "provider": "meilisearch",
    "config": {
      "host": "https://search.example.com",
      "apiKey": "your-api-key",
      "indexName": "docs"
    }
  }
}
```

### 6. Theme System

**Implementation**: `next-themes` library

**Features**:
- Light/dark mode toggle
- System preference detection
- Persistent user preference
- No flash on page load
- CSS variable-based theming

**Customization**:
- Primary colors via config
- Tailwind CSS classes
- Custom CSS injection

## Development Guide

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/dalmasonto/specra.git
cd specra-sdk

# Install dependencies
npm install

# Start development mode
npm run dev

# In another terminal, link for local testing
npm link
```

### Testing Changes Locally

**Method 1: npm link**
```bash
# In specra-sdk
npm run build
npm link

# In test project
npm link specra
```

**Method 2: Use specra-docs**
The specra-docs project is perfect for testing since it uses this SDK:
```bash
# In specra-docs
npm install ../specra-sdk
npm run dev
```

### Common Development Tasks

#### Adding a New Component

1. **Create Component File**:
```typescript
// src/components/my-component.tsx
'use client' // If needs client-side features

export interface MyComponentProps {
  // Props
}

export function MyComponent({ ...props }: MyComponentProps) {
  // Implementation
}
```

2. **Export from Index**:
```typescript
// src/components/index.ts
export { MyComponent } from './my-component'
export type { MyComponentProps } from './my-component'
```

3. **Update Package Exports** (if needed):
```json
// package.json
{
  "exports": {
    "./components/my-component": {
      "types": "./dist/components/my-component.d.ts",
      "import": "./dist/components/my-component.mjs"
    }
  }
}
```

4. **Build and Test**:
```bash
npm run build
npm run typecheck
```

#### Modifying Configuration Schema

1. **Update Types**:
```typescript
// src/lib/config.types.ts
export interface SpecraConfig {
  // Add new field with JSDoc
  /** Description of new field */
  newField?: string
}
```

2. **Regenerate Schema**:
```bash
npm run generate:schema
```

3. **Verify Output**:
Check `config/specra.config.schema.json` for new field.

4. **Update Validation**:
Add Zod validators if needed for runtime checks.

5. **Document**:
Update specra-docs with new configuration option.

#### Modifying MDX Processing

1. **Edit Pipeline**:
```typescript
// src/lib/mdx.ts
import newRemarkPlugin from 'remark-new-plugin'

const mdxOptions = {
  remarkPlugins: [
    // ... existing plugins
    newRemarkPlugin,
  ],
}
```

2. **Add Dependencies**:
```bash
npm install remark-new-plugin
```

3. **Test**:
Create sample MDX file and verify processing.

#### Adding New Export Path

1. **Create Feature**:
Implement the feature in `src/`

2. **Update Exports**:
```json
// package.json
{
  "exports": {
    "./new-feature": {
      "types": "./dist/new-feature.d.ts",
      "import": "./dist/new-feature.mjs",
      "require": "./dist/new-feature.js"
    }
  }
}
```

3. **Update Build**:
```typescript
// tsup.config.ts
entry: {
  // ... existing entries
  'new-feature': 'src/new-feature.ts',
}
```

4. **Test Import**:
```typescript
// In test project
import { something } from 'specra/new-feature'
```

### Code Style Guidelines

**TypeScript**:
- Use strict mode
- Prefer interfaces over types for objects
- Use type for unions/intersections
- Export types alongside implementations

**React**:
- Functional components with hooks
- Use "use client" only when necessary
- Server components by default
- Props interfaces exported

**Styling**:
- Tailwind utility classes
- Dark mode via `dark:` prefix
- Responsive via breakpoint prefixes
- Extract repeated patterns to components

**Imports**:
- Group: React, third-party, local
- Use named imports
- Avoid default exports except App Router requirements

## Dependency Management

### Peer Dependencies
Must be installed by consumers:
- `next`: Framework compatibility
- `react`, `react-dom`: UI library

### Runtime Dependencies
Shipped with package, key ones:
- `next-mdx-remote`: MDX processing
- `radix-ui/*`: UI primitives
- `tailwindcss`: Styling
- `meilisearch`: Search client
- `zod`: Validation

### Dev Dependencies
Build-time only:
- `tsup`: Bundler
- `typescript`: Language
- `ts-json-schema-generator`: Schema generation

## Troubleshooting

### Build Failures

**Symptom**: Build fails with module errors
**Solution**:
- Check `tsup.config.ts` entry points
- Verify imports are correct
- Check for circular dependencies

**Symptom**: Type generation fails
**Solution**:
- Run `npm run typecheck` first
- Fix TypeScript errors
- Ensure all exports are typed

### Runtime Issues

**Symptom**: Components not rendering
**Solution**:
- Check "use client" directives
- Verify imports from correct paths
- Check Next.js version compatibility

**Symptom**: Styles not applied
**Solution**:
- Verify `import 'specra/styles'` in app
- Check Tailwind config
- Verify CSS bundle in dist/

**Symptom**: MDX not processing
**Solution**:
- Check file path resolution
- Verify MDX plugins are installed
- Check for syntax errors in MDX

### Type Issues

**Symptom**: Types not found in consumer
**Solution**:
- Check exports in package.json
- Verify .d.ts files in dist/
- Ensure TypeScript version compatibility

## Release Process

### Version Bumping
```bash
# Update version
npm version patch  # or minor, major

# This updates package.json and creates git tag
```

### Pre-Release Checklist
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Build succeeds: `npm run build`
- [ ] Changes documented in specra-docs
- [ ] README.md updated if needed
- [ ] Breaking changes noted

### Publishing
```bash
# Build
npm run build

# Publish to npm
npm publish

# Push tags
git push && git push --tags
```

### Post-Release
1. Update specra-cli templates if needed
2. Update specra-docs to use new version
3. Announce in documentation
4. Update examples/tutorials

## Integration Points

### With specra-cli
CLI templates should:
- Use latest stable version of specra
- Include all peer dependencies
- Set up configuration correctly
- Provide sample content

### With specra-docs
Documentation should:
- Showcase all features
- Provide working examples
- Stay up-to-date with SDK changes
- Serve as integration test

## Performance Considerations

### Build Time
- Use `npm run dev` for watch mode during development
- Full build takes ~10-30 seconds depending on machine
- Schema generation is fast (<1s)

### Bundle Size
- Main bundle: ~500KB (minified, including dependencies)
- Styles: ~50KB (with Tailwind)
- Use tree-shaking to reduce consumer bundles
- Code splitting by export path

### Runtime Performance
- Server components reduce client JS
- MDX compiled at build time (SSG)
- Lazy load search client
- Virtual scrolling for large lists

## Best Practices

### For Maintainers
1. **Backward Compatibility**: Avoid breaking changes in minor versions
2. **Documentation First**: Update docs before releasing features
3. **Type Safety**: Maintain strict TypeScript
4. **Testing**: Use specra-docs as living test suite
5. **Versioning**: Follow semantic versioning strictly

### For Contributors
1. **Read This Guide**: Understand architecture first
2. **Small PRs**: Focus on single feature/fix
3. **Type Everything**: No `any` types
4. **Test Locally**: Use npm link before PR
5. **Document**: Update relevant docs

## Resources

### Official
- **Repository**: https://github.com/dalmasonto/specra
- **Documentation**: https://specra.vercel.app
- **npm Package**: https://www.npmjs.com/package/specra

### Related Projects
- **CLI**: https://github.com/dalmasonto/specra-cli
- **Docs**: https://github.com/dalmasonto/specra-docs

### External Documentation
- **Next.js App Router**: https://nextjs.org/docs/app
- **MDX**: https://mdxjs.com
- **Tailwind CSS**: https://tailwindcss.com
- **Radix UI**: https://www.radix-ui.com

## Contact

**Authors**: dalmasonto, arthur-kamau
**License**: MIT

---

This guide provides a comprehensive understanding of the Specra SDK architecture, development workflows, and integration patterns. Use it as your reference when working with the codebase.
