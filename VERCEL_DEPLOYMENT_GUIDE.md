# Vercel Deployment Guide with zkLogin

## The Problem You're Facing

When logging in with zkLogin on your Vercel deployment, you see this URL:
```
https://totalbeginers-suitters.vercel.app/feed/#id_token=eyJhbGci...
```

This causes the authentication to fail because the token is appended to `/feed` instead of the root URL.

## Why This Happens

1. Your Google OAuth app is configured with the wrong redirect URI
2. Or Google is remembering a previous redirect URL from an old configuration

## Complete Fix

### Step 1: Update Google Cloud Console (CRITICAL!)

1. **Go to Google Cloud Console**
   - URL: https://console.cloud.google.com/
   - Sign in with the account that owns the OAuth app

2. **Navigate to Credentials**
   - Click the menu (☰) → APIs & Services → Credentials
   - Find this OAuth 2.0 Client ID: `454702532596-gragumqf7nb0suihfhadbdc25tlditra`
   - Click the pencil icon to edit

3. **Update Authorized Redirect URIs**
   
   **DELETE** any URIs with `/feed` or other paths
   
   **ADD** these exact URIs:
   ```
   https://totalbeginers-suitters.vercel.app
   http://localhost:5173
   ```
   
   ⚠️ **CRITICAL**: 
   - No trailing slashes
   - No `/feed` or any other path
   - Just protocol + domain

4. **Update Authorized JavaScript Origins**
   
   **ADD** these:
   ```
   https://totalbeginers-suitters.vercel.app
   http://localhost:5173
   ```

5. **Save and Wait**
   - Click "Save"
   - Wait 5-10 minutes for Google's servers to update

### Step 2: Configure Vercel Environment Variables

1. **Go to your Vercel project**
   - URL: https://vercel.com/dashboard
   - Select your project: `totalbeginers-suitters`

2. **Go to Settings → Environment Variables**

3. **Add these variables:**

   | Variable Name | Value | Environment |
   |--------------|-------|-------------|
   | `VITE_GOOGLE_CLIENT_ID` | `454702532596-gragumqf7nb0suihfhadbdc25tlditra.apps.googleusercontent.com` | Production, Preview, Development |
   | `VITE_SUI_NETWORK_URL` | `https://fullnode.testnet.sui.io` | Production, Preview, Development |
   | `VITE_BACKEND_URL` | Your backend URL (e.g., Railway/Render) | Production, Preview, Development |
   | `VITE_PACKAGE_ID` | `0x0db33491723b9ce4a589cd916f6639591870615dcb319d8cb700f1a68df12a1e` | Production, Preview, Development |
   | `VITE_REGISTRY_ID` | `0x905473011eb1a4cc30fb4375040c5e899e2e3ad59b7007f8616edaf54bb8a8dd` | Production, Preview, Development |
   | `VITE_SUI_NETWORK` | `testnet` | Production, Preview, Development |
   | `VITE_PROVER_URL` | `https://prover-dev.mystenlabs.com/v1` | Production, Preview, Development |

4. **Save all variables**

### Step 3: Redeploy

After adding environment variables:

1. **Trigger a new deployment**
   - Go to Deployments tab
   - Click on the latest deployment
   - Click "Redeploy"
   - OR push a new commit to trigger automatic deployment

2. **Wait for deployment to complete**

### Step 4: Test

1. **Clear your browser completely**
   ```
   - Open DevTools (F12)
   - Right-click the refresh button
   - Select "Empty Cache and Hard Reload"
   - OR go to Settings → Privacy → Clear browsing data
   ```

2. **Visit your app**
   - URL: https://totalbeginers-suitters.vercel.app
   - You should see the landing page

3. **Click "Login with Google"**
   - Should redirect to Google
   - After authentication, should come back to root URL
   - Should briefly show processing
   - Should redirect to /feed (authenticated)

4. **Check the URL after redirect**
   - Should be: `https://totalbeginers-suitters.vercel.app/feed`
   - Should NOT have `#id_token=...` in the URL

## Expected Flow

```
Landing Page (/)
     ↓
Click "Login with Google"
     ↓
Redirect to: accounts.google.com
     ↓
User approves
     ↓
Redirect to: https://totalbeginers-suitters.vercel.app/#id_token=...
     ↓
Landing page detects token
     ↓
Process zkLogin authentication
     ↓
Clean URL (remove hash)
     ↓
Redirect to: https://totalbeginers-suitters.vercel.app/feed
     ↓
User is authenticated!
```

## Troubleshooting

### Issue: Still redirecting to `/feed` with token

**Cause**: Google Cloud Console changes haven't propagated yet

**Fix**:
- Wait 15-30 minutes
- Clear browser cache completely
- Try in incognito/private window
- Check Google Cloud Console settings are saved

### Issue: "redirect_uri_mismatch" error

**Cause**: Redirect URI in Google Console doesn't match exactly

**Fix**:
- Verify no trailing slashes in redirect URI
- Must be: `https://totalbeginers-suitters.vercel.app`
- NOT: `https://totalbeginers-suitters.vercel.app/`
- NOT: `https://totalbeginers-suitters.vercel.app/feed`

### Issue: Backend errors (profile/posts not loading)

**Cause**: `VITE_BACKEND_URL` not set or incorrect

**Fix**:
- Check Vercel environment variables
- Make sure `VITE_BACKEND_URL` is set to your backend URL
- Redeploy after adding the variable

### Issue: Contract not found errors

**Cause**: Package IDs not set in environment variables

**Fix**:
- Add `VITE_PACKAGE_ID` and `VITE_REGISTRY_ID` to Vercel env vars
- Use the values from your `.env` file

## Backend Setup

Your backend also needs to be deployed for zkLogin to work fully. The backend provides:
- Salt generation endpoint: `/api/zklogin/salt`
- Posts API: `/api/posts`
- Profile API: `/api/profile/:address`

Make sure to:
1. Deploy your backend to Railway/Render/etc
2. Set `VITE_BACKEND_URL` in Vercel to point to your deployed backend
3. Configure CORS on backend to allow your Vercel domain

## Code Changes Summary

The following files have been updated to fix the zkLogin redirect:

1. ✅ `frontend/src/zklogin/utils.ts` - Always use `window.location.origin` as redirect
2. ✅ `frontend/src/pages/Landing.tsx` - Better handling of OAuth callback
3. ✅ `frontend/.env.production` - Template for production env vars
4. 📄 `GOOGLE_OAUTH_SETUP.md` - Detailed Google OAuth setup guide
5. 📄 `ZKLOGIN_FIX_SUMMARY.md` - Quick summary of the fix

## Need Help?

If you're still experiencing issues:

1. **Check browser console for errors**
   - Press F12 → Console tab
   - Look for red error messages

2. **Check network requests**
   - Press F12 → Network tab
   - Look for failed requests (red)
   - Check the redirect_uri parameter in OAuth requests

3. **Verify Google OAuth settings**
   - Screenshot your Authorized redirect URIs
   - Make sure they match exactly

4. **Test locally first**
   - Run `pnpm run dev` in the frontend folder
   - Try login at `http://localhost:5173`
   - If it works locally, the issue is in Vercel/Google config

---

**After completing all steps above, zkLogin should work perfectly on Vercel!**
