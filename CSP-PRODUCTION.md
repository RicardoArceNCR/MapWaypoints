# Content Security Policy - Production Configuration

## Current Development CSP (index.html)
```
default-src 'self'; 
script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
style-src 'self' 'unsafe-inline'; 
font-src 'self' data:; 
img-src 'self' data: blob:; 
connect-src 'self' ws: wss:;
```

## Recommended Production CSP

### Option 1: Strict (Most Secure)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self'; 
  font-src 'self' data:; 
  img-src 'self' data: blob:; 
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
">
```

### Option 2: Moderate (Allows inline styles only)
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self'; 
  style-src 'self' 'unsafe-inline'; 
  font-src 'self' data:; 
  img-src 'self' data: blob:; 
  connect-src 'self';
  object-src 'none';
  base-uri 'self';
">
```

## Why Current Code is Safe

### ✅ No Unsafe Patterns Found
- **No `eval()`** usage in codebase
- **No `new Function()`** calls
- **No string-based `setTimeout/setInterval`** - all use function references
- **Safe localStorage usage** - Uses `JSON.parse()` and `JSON.stringify()`

### Code Verification Results
```javascript
// ✅ SAFE: editor.js localStorage usage
function loadPresetsFromStorage() {
  try {
    const stored = localStorage.getItem('editor-presets');
    return stored ? JSON.parse(stored) : {};  // Safe JSON parsing
  } catch {
    return {};
  }
}

// ✅ SAFE: app.js setTimeout usage
setTimeout(() => {  // Function reference, not string
  const afterMem = memoryMonitor.sample();
  if (afterMem) console.log('💾 Memoria después:', afterMem.usedMB.toFixed(2) + 'MB');
}, 100);
```

## Migration Steps for Production

1. **Test with strict CSP** in staging environment
2. **Remove `'unsafe-eval'`** from script-src (not needed - no eval in code)
3. **Consider removing `'unsafe-inline'`** for scripts (use nonces if needed)
4. **Keep `'unsafe-inline'`** for styles if using dynamic styling, or use CSS-in-JS with nonces
5. **Remove `ws: wss:`** from connect-src (only needed for Vite HMR)

## CSP Violation Debugging

If you see CSP violations in console:
1. Check browser console for specific violation details
2. Verify the violating resource/code
3. Add specific allowances or refactor code to avoid unsafe patterns

## Additional Security Headers (Optional)

```html
<meta http-equiv="X-Content-Type-Options" content="nosniff">
<meta http-equiv="X-Frame-Options" content="DENY">
<meta http-equiv="Referrer-Policy" content="strict-origin-when-cross-origin">
```
