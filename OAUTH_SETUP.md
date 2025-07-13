# 🔐 OAuth Configuration for Production

## 🚨 Current Issue: OAuth Callback Error

You're getting "Error en la configuración de OAuth" because the callback URLs in your OAuth applications don't match your production domain.

## 📋 Step-by-Step Fix

### 1. Find Your Production Domain
First, identify your actual production URL:
- **Vercel**: `https://your-app-name.vercel.app`
- **Netlify**: `https://your-app-name.netlify.app` 
- **Custom domain**: `https://your-domain.com`

### 2. Update GitHub OAuth App

1. **Go to GitHub Developer Settings**:
   ```
   https://github.com/settings/developers
   ```

2. **Find your OAuth App**:
   - Look for Client ID: `<your-github-client-id>`

3. **Update Authorization callback URL**:
   ```
   https://YOUR-PRODUCTION-DOMAIN/api/auth/callback/github
   ```
   
   Example:
   ```
   https://autonoma-chat.vercel.app/api/auth/callback/github
   ```

### 3. Update Google OAuth App

1. **Go to Google Cloud Console**:
   ```
   https://console.cloud.google.com/apis/credentials
   ```

2. **Find your OAuth 2.0 Client**:
   - Look for Client ID: `<your-google-client-id>.apps.googleusercontent.com`

3. **Add Authorized redirect URI**:
   ```
   https://YOUR-PRODUCTION-DOMAIN/api/auth/callback/google
   ```
   
   Example:
   ```
   https://autonoma-chat.vercel.app/api/auth/callback/google
   ```

### 4. Update Environment Variables

In your production environment (Vercel, Netlify, etc.), update:

```bash
NEXTAUTH_URL=https://YOUR-PRODUCTION-DOMAIN
```

### 5. Test the Fix

1. **Redeploy your application**
2. **Clear browser cache**
3. **Try logging in with GitHub**
4. **Try logging in with Google**

## ✅ Verification Checklist

- [ ] GitHub OAuth callback URL updated
- [ ] Google OAuth callback URL updated  
- [ ] NEXTAUTH_URL environment variable updated
- [ ] Application redeployed
- [ ] GitHub login working ✅
- [ ] Google login working ✅

## 🔧 Common Issues & Solutions

### Issue: Still getting OAuth errors
- **Solution**: Double-check that callback URLs exactly match your domain (including https://)

### Issue: Google login not working
- **Solution**: Make sure to add the callback URL to "Authorized redirect URIs" not "Authorized origins"

### Issue: GitHub login not working  
- **Solution**: Verify the "Authorization callback URL" field is updated, not the homepage URL

### Issue: Environment variables not taking effect
- **Solution**: Redeploy your application after updating environment variables

## 📞 Quick Support

If you're still having issues:
1. Check browser developer tools for specific error messages
2. Verify SSL certificate is working
3. Ensure all environment variables are set correctly
4. Try logging in from an incognito/private browser window
