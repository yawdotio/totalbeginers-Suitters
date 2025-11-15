# Google OAuth Setup for zkLogin

## The Issue

When you complete zkLogin authentication, Google OAuth is redirecting to:
```
https://totalbeginers-suitters.vercel.app/feed/#id_token=...
```

But your app expects the redirect at the root URL:
```
https://totalbeginers-suitters.vercel.app/#id_token=...
```

## Solution

You need to update your **Google Cloud Console** OAuth settings to use the correct redirect URI.

### Steps to Fix:

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Select your project (or create one if you haven't)

2. **Navigate to OAuth 2.0 Settings**
   - Go to: APIs & Services → Credentials
   - Find your OAuth 2.0 Client ID (the one matching `VITE_GOOGLE_CLIENT_ID`)
   - Click to edit it

3. **Update Authorized Redirect URIs**
   
   Add BOTH of these URIs:
   ```
   http://localhost:5173
   https://totalbeginers-suitters.vercel.app
   ```
   
   **Important Notes:**
   - ❌ Do NOT include `/feed` or any path
   - ❌ Do NOT include trailing slashes
   - ✅ Just the origin (protocol + domain + port)

4. **Authorized JavaScript Origins**
   
   Also add these under "Authorized JavaScript origins":
   ```
   http://localhost:5173
   https://totalbeginers-suitters.vercel.app
   ```

5. **Save Changes**
   - Click "Save" at the bottom
   - Wait a few minutes for changes to propagate

### Environment Variables

Create a `.env.production` file in your `frontend` folder:

```env
# Google OAuth
VITE_GOOGLE_CLIENT_ID=454702532596-gragumqf7nb0suihfhadbdc25tlditra.apps.googleusercontent.com

# Sui Network
VITE_SUI_NETWORK_URL=https://fullnode.devnet.sui.io

# Backend API
VITE_API_BASE_URL=https://your-backend-url.com

# Salt Service (optional - uses backend if not set)
VITE_SALT_SERVICE_URL=

# ZK Prover
VITE_PROVER_URL=https://prover-dev.mystenlabs.com/v1
```

### How It Works Now

1. User clicks "Login with Google" → redirects to Google
2. Google authenticates user → redirects to `https://totalbeginers-suitters.vercel.app/#id_token=...`
3. Landing page detects the token in URL hash → processes zkLogin
4. After successful authentication → redirects to `/feed`

### Testing

1. **Clear your browser storage**:
   ```javascript
   // In browser console:
   localStorage.clear();
   sessionStorage.clear();
   ```

2. **Try logging in again**

3. **Expected flow**:
   - Click login → Google auth page
   - Approve → Redirected to home (/)
   - Processing authentication...
   - Redirected to /feed

### Troubleshooting

If you still see issues:

1. **Check the URL Google is redirecting to**:
   - Should be: `https://totalbeginers-suitters.vercel.app/#id_token=...`
   - NOT: `https://totalbeginers-suitters.vercel.app/feed/#id_token=...`

2. **Verify Google Console Settings**:
   - Redirect URIs must match EXACTLY (no trailing slash, no paths)

3. **Check Browser Console**:
   - Look for errors about invalid redirect_uri
   - Check if JWT is being extracted properly

4. **Clear Cache & Cookies**:
   - Sometimes old OAuth sessions cause issues

## Code Changes Made

1. **Updated `frontend/src/zklogin/utils.ts`**:
   - `getGoogleLoginURL()` now always uses `window.location.origin` as redirect URI
   - This ensures it works in both dev and production

2. **Updated `frontend/src/pages/Landing.tsx`**:
   - OAuth callback is processed on the landing page
   - After authentication, user is redirected to `/feed`

## Deployment to Vercel

Make sure to set environment variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add all the variables from `.env.production`
4. Redeploy your app

---

**Need Help?**

If issues persist, check:
- Browser console for errors
- Network tab for redirect URLs
- Google Cloud Console audit logs
