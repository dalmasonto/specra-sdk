import { defineConfig } from 'tsup'

export default defineConfig([
  // Client components (with "use client" directive)
  {
    entry: {
      'components/index': 'src/components/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    external: [
      'react',
      'react-dom',
      'next',
      'next/server',
      'next/navigation',
      'next/image',
      'next/link',
    ],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      }
    },
  },
  // Server-only modules (no "use client" directive)
  {
    entry: {
      index: 'src/index.ts',
      'app/layout': 'src/app/layout.tsx',
      'app/docs-page': 'src/app/docs-page.tsx',
      'app/api/mdx-watch/route': 'src/app/api/mdx-watch/route.ts',
      'lib/index': 'src/lib/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false, // Don't clean since components already built
    external: [
      'react',
      'react-dom',
      'next',
      'next/server',
      'next/navigation',
      'next/image',
      'next/link',
    ],
  },
])