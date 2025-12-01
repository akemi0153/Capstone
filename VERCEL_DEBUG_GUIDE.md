# Vercel White Screen Debugging Guide

## Quick Test

Visit: `https://your-app.vercel.app/test.html`

If you see a green success message, Vercel deployment is working and the issue is with the main app.

## Common Causes of White Screen

### 1. **Auth Module Loading Failure**
**Symptoms:** Page loads but stays white with loading spinner
**Fix:** Check browser console for errors with Supabase imports

### 2. **Missing Files**
**Symptoms:** 404 errors in console
**Check:** All files are committed and pushed to Git
```bash
git status
git add .
git commit -m "Fix deployment"
git push
```

### 3. **Module Import Errors**
**Symptoms:** "Failed to load module" errors
**Fix:** Check all import paths are relative (start with `./` or `../`)

### 4. **Case Sensitivity**
**Symptoms:** Works locally but not on Vercel
**Fix:** Vercel is case-sensitive. Check file names match exactly
- `Scripts/main.js` ≠ `scripts/main.js`
- `Components/sidebar.html` ≠ `components/sidebar.html`

## Step-by-Step Debugging

### Step 1: Check Browser Console
1. Visit your Vercel URL
2. Open DevTools (F12)
3. Go to Console tab
4. Look for errors:
   - ❌ `Failed to fetch` = File not found
   - ❌ `CORS error` = Supabase configuration issue
   - ❌ `Module parse error` = Syntax error in JavaScript

### Step 2: Check Network Tab
1. Open DevTools > Network tab
2. Reload page
3. Look for RED (failed) requests
4. Common issues:
   - `404` = File not found (check file name/path)
   - `500` = Server error
   - `CORS` = Cross-origin issue

### Step 3: Check Vercel Logs
1. Go to Vercel Dashboard
2. Click on your deployment
3. Click "Logs" tab
4. Look for build errors

### Step 4: Test Individual Components

**Test auth:**
Open console and run:
```javascript
import('./config/credentials.js')
  .then(mod => console.log('✅ Credentials loaded:', mod))
  .catch(err => console.error('❌ Failed:', err));
```

**Test Supabase:**
```javascript
import('https://esm.sh/@supabase/supabase-js@2')
  .then(mod => console.log('✅ Supabase loaded'))
  .catch(err => console.error('❌ Failed:', err));
```

## Emergency Fixes

### Fix 1: Disable Auth Temporarily
Edit `index.html` and comment out the auth check:
```html
<!-- <script type="module">
  // Auth code here
</script> -->
```

### Fix 2: Force Show Page
Add this to `<head>`:
```html
<script>
  window.addEventListener('load', function() {
    document.body.style.opacity = '1';
    document.body.classList.add('loaded');
  });
</script>
```

### Fix 3: Check Credentials File
Make sure `config/credentials.js` exists and is committed:
```bash
ls -la config/
git ls-files config/
```

## Current Implementation

Your index.html now has:
1. ✅ **Emergency fallback** - Shows page after 3 seconds no matter what
2. ✅ **Better error handling** - Catches and logs all errors
3. ✅ **Loading spinner** - Shows while auth checks
4. ✅ **Graceful degradation** - Shows error message if scripts fail

## What to Check on Vercel

### Files that MUST exist:
- ✅ `index.html`
- ✅ `Log In.html` (auth redirect target)
- ✅ `config/credentials.js`
- ✅ `scripts/main.js`
- ✅ `scripts/config.js`
- ✅ `scripts/loader.js`
- ✅ `scripts/navigation.js`
- ✅ `components/sidebar.html`
- ✅ `components/header.html`
- ✅ `components/modals.html`
- ✅ `pages/dashboard.html`
- ✅ `css/styles.css`
- ✅ `animation/auth.js`
- ✅ `animation/tailwind-config.js`

### Environment Variables (if needed)
If using `.env`, add these in Vercel Dashboard > Settings > Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Viewing Logs on Vercel

### Real-time Logs:
```bash
vercel logs --follow
```

### Check specific deployment:
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click on latest deployment
4. View "Function Logs" or "Build Logs"

## Testing Locally with Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Test locally
vercel dev

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Common Console Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Failed to fetch` | File not found | Check file path and case |
| `Unexpected token '<'` | HTML returned instead of JS | Check file exists and path is correct |
| `CORS error` | Supabase config issue | Check Supabase URL in credentials.js |
| `Module not found` | Import path wrong | Use relative paths: `./config.js` |
| `Cannot read property of undefined` | DOM element missing | Check HTML loaded before script runs |

## Success Checklist

- [ ] No console errors
- [ ] All files return 200 status in Network tab
- [ ] Loading spinner appears then disappears
- [ ] Page content becomes visible
- [ ] Tailwind styles are applied
- [ ] Sidebar and header load
- [ ] Dashboard page loads

## Still Having Issues?

1. **Check this test page:** `your-url.vercel.app/test.html`
2. **Share console errors** - Screenshot DevTools Console
3. **Check Vercel logs** - Share any error messages
4. **Verify all files committed:**
   ```bash
   git ls-files | grep -E "(html|js|css)$"
   ```

## Contact Info

If all else fails:
1. Check Vercel documentation: https://vercel.com/docs
2. Check Supabase status: https://status.supabase.com
3. Check browser console for specific error messages
