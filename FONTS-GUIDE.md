# Font Configuration Guide

## Current Setup (Fixed)

### Font Files Location
```
/public/assets/fonts/
├── inter-v20-latin-regular.woff2
├── inter-v20-latin-500.woff2
├── inter-v20-latin-600.woff2
├── inter-v20-latin-700.woff2
└── inter-v20-latin-800.woff2
```

### Font-Face Declarations (style.css)
```css
@font-face {
  font-family: 'Inter';
  font-weight: 400;  /* Regular */
  src: url('/assets/fonts/inter-v20-latin-regular.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-weight: 500;  /* Medium */
  src: url('/assets/fonts/inter-v20-latin-500.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-weight: 600;  /* Semi-Bold */
  src: url('/assets/fonts/inter-v20-latin-600.woff2') format('woff2');
}

@font-face {
  font-family: 'Inter';
  font-weight: 700;  /* Bold */
  src: url('/assets/fonts/inter-v20-latin-700.woff2') format('woff2');
}
```

### Preload Links (index.html)
```html
<link rel="preload" href="/assets/fonts/inter-v20-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-v20-latin-600.woff2" as="font" type="font/woff2" crossorigin>
```

## Issues Fixed

### ❌ Previous Problems
1. **Version mismatch**: CSS referenced `inter-v12` but files were `inter-v20`
2. **Path mismatch**: CSS used `../assets/` but should use `/assets/` (absolute path for Vite)
3. **Missing fallbacks**: CSS had `.woff` fallbacks but only `.woff2` files existed
4. **OTS parsing errors**: Browser couldn't find correct font files

### ✅ Solutions Applied
1. Updated all `@font-face` declarations to reference `inter-v20`
2. Changed to absolute paths: `/assets/fonts/` (works with Vite's public directory)
3. Removed `.woff` fallbacks (woff2 has 95%+ browser support)
4. Updated preload links to match actual files

## Browser Support

### WOFF2 Format
- **Chrome**: 36+ (2014)
- **Firefox**: 39+ (2015)
- **Safari**: 10+ (2016)
- **Edge**: All versions
- **Coverage**: ~97% of global users

No need for `.woff` fallbacks in modern projects.

## Updating Fonts

### Option 1: Google Fonts (Recommended)
1. Visit https://fonts.google.com/specimen/Inter
2. Select weights: 400, 500, 600, 700
3. Download family
4. Extract `.woff2` files to `/public/assets/fonts/`
5. Rename to match pattern: `inter-vXX-latin-{weight}.woff2`

### Option 2: Official Inter (Latest)
1. Visit https://rsms.me/inter/
2. Download latest version
3. Extract `woff2/` folder contents
4. Copy to `/public/assets/fonts/`
5. Update version number in CSS if needed

### Option 3: Fontsource (NPM)
```bash
npm install @fontsource/inter
```

```javascript
// In app.js
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
```

## Verification Steps

### 1. Check Font Files
```bash
# Verify files exist
ls -lh public/assets/fonts/

# Check file sizes (should be 50-150KB each)
du -h public/assets/fonts/*.woff2
```

### 2. Test in Browser
1. Open DevTools → Network tab
2. Filter by "Font"
3. Reload page
4. Verify all fonts load with `200` status
5. Check Console for no OTS errors

### 3. Visual Verification
```css
/* Test different weights */
.test-regular { font-weight: 400; }
.test-medium  { font-weight: 500; }
.test-semibold { font-weight: 600; }
.test-bold    { font-weight: 700; }
```

## Performance Tips

### Current Preloading
Only preload **critical** fonts (regular + semi-bold for UI):
```html
<link rel="preload" href="/assets/fonts/inter-v20-latin-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/inter-v20-latin-600.woff2" as="font" type="font/woff2" crossorigin>
```

### Font Display Strategy
```css
font-display: swap;  /* Show fallback immediately, swap when loaded */
```

### Subsetting (Advanced)
If you only need Latin characters, fonts are already subsetted (`-latin-` in filename).

For further optimization, use tools like:
- **glyphhanger**: https://github.com/zachleat/glyphhanger
- **fonttools**: https://github.com/fonttools/fonttools

## Troubleshooting

### "Failed to load font" errors
- Check file paths are correct (absolute `/assets/` not relative `../assets/`)
- Verify files exist in `/public/assets/fonts/`
- Clear browser cache (Cmd+Shift+R on Mac)

### "OTS parsing error"
- Font file is corrupted → Re-download from source
- Wrong format → Ensure files are actually `.woff2` (check with `file` command)
- Version mismatch → CSS and files must match

### Fonts not applying
- Check `font-family: 'Inter'` in CSS
- Verify font-weight matches declared weights (400, 500, 600, 700)
- Inspect element in DevTools → Computed → Font

## Additional Resources

- **Inter Official**: https://rsms.me/inter/
- **Google Fonts**: https://fonts.google.com/specimen/Inter
- **WOFF2 Spec**: https://www.w3.org/TR/WOFF2/
- **Font Loading Best Practices**: https://web.dev/font-best-practices/
