# Security Quick Start Guide

Get your Specra documentation site secured in 5 minutes.

## 1. Add Security Middleware (2 minutes)

Create `middleware.ts` in your Next.js app root:

```typescript
import { createSecurityMiddleware } from 'specra/middleware/security'

export const middleware = createSecurityMiddleware({
  production: process.env.NODE_ENV === 'production',
  strictPathValidation: true,
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

**That's it!** Security is now active. 🎉

## 2. Verify It's Working (1 minute)

### Test Path Traversal Protection

Try accessing: `http://localhost:3000/docs/../../../package.json`

**Expected:** 400 Bad Request

### Test CSP Headers

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click any request
5. Check Response Headers

**Expected to see:**
```
Content-Security-Policy: default-src 'self'; ...
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
```

## 3. Test Your MDX Content (1 minute)

Create a test file: `docs/v1.0.0/security-test.mdx`

```mdx
---
title: Security Test
---

# This should work ✅

Normal markdown content is safe.

<Callout type="info">
  Safe components work fine
</Callout>

# These should be blocked ❌

<script>alert('XSS')</script>

{eval("dangerous code")}
```

**Build your site:**
```bash
npm run build
```

**Expected:** Build warnings or errors about dangerous content in production mode.

## 4. Review Cookie Security (1 minute)

If you have authentication cookies and your docs are on a subdomain:

```typescript
// ❌ DON'T DO THIS
app.use(session({
  cookie: {
    domain: '.yourcompany.com'  // Accessible from all subdomains!
  }
}))

// ✅ DO THIS
app.use(session({
  cookie: {
    domain: 'app.yourcompany.com'  // Only accessible from app subdomain
  }
}))
```

**Or better yet:** Use a completely different domain for docs:
- Main app: `app.yourcompany.com`
- Docs: `docs.yourcompany.io` (different TLD)

## Done! ✅

Your documentation is now protected against:
- ✅ XSS attacks
- ✅ Path traversal
- ✅ Code injection
- ✅ Clickjacking
- ✅ MIME sniffing
- ✅ Cross-origin attacks

## Optional: Advanced Configuration

### Custom CSP for Analytics

```typescript
import { generateCSPHeader } from 'specra/lib/mdx-security'
import { NextResponse } from 'next/server'

export function middleware(request) {
  const response = NextResponse.next()

  const csp = generateCSPHeader({
    'script-src': [
      "'self'",
      "'unsafe-inline'",
      "https://www.googletagmanager.com",
    ],
    'connect-src': [
      "'self'",
      "https://analytics.google.com",
    ],
  }, true)

  response.headers.set('Content-Security-Policy', csp)
  return response
}
```

### Add Security Tests

```typescript
// tests/security.test.ts
import { validateMDXSecurity } from 'specra/lib/mdx-security'

test('blocks dangerous MDX', () => {
  const content = '{eval("bad code")}'
  const result = validateMDXSecurity(content, { strictMode: true })
  expect(result.valid).toBe(false)
})
```

### Add CI/CD Security Scanning

```yaml
# .github/workflows/security.yml
name: Security

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit
      - run: npm run build
        env:
          NODE_ENV: production
```

## Need Help?

- 📖 Full guide: [SECURITY.md](../SECURITY.md)
- 🧪 Testing guide: [examples/security-testing.md](examples/security-testing.md)
- 🔧 Examples: [examples/middleware.example.ts](examples/middleware.example.ts)
- 🐛 Issues: [GitHub Issues](https://github.com/dalmasonto/specra/issues)

## Security Updates

Keep Specra updated for latest security patches:

```bash
npm update specra
```

Watch the repository for security advisories.

---

**Remember:** Security is a process, not a one-time setup. Review and test regularly! 🔒
