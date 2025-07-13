# 🚀 Production Deployment Checklist

## ✅ Database Setup Complete

### Local Development ✅
- [x] New Neon database configured
- [x] Prisma client generated
- [x] Schema pushed to database
- [x] Database seeded with initial data
- [x] Build completed successfully

### For Production Deployment:

#### 1. Environment Variables
Update these in your production environment (Vercel/Netlify/etc.):

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>/<database>?sslmode=require&channel_binding=require"

# All other environment variables from .env.local
OPENAI_API_KEY=sk-proj-...
NEXTAUTH_SECRET=<generate-a-strong-random-secret>
NEXTAUTH_URL=https://your-production-domain.com
GITHUB_CLIENT_ID=<your-github-client-id>
GITHUB_CLIENT_SECRET=<your-github-client-secret>
GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
ELEVENLABS_API_KEY=<your-elevenlabs-api-key>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
```

#### 2. Database Migration Commands
Run these commands in your production environment:

```bash
# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Optional: Seed production data
pnpm run db:seed
```

#### 3. Build Commands
```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start production server
pnpm start
```

#### 4. OAuth Configuration ⚠️ CRITICAL
**IMPORTANT: This is causing your current login errors!**

Update redirect URLs in your OAuth applications:

##### GitHub OAuth App Configuration:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Find your OAuth App (`<your-github-client-id>`)
3. Update **Authorization callback URL** to:
   ```
   https://your-production-domain.com/api/auth/callback/github
   ```

##### Google OAuth App Configuration:
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your OAuth 2.0 Client ID (`<your-google-client-id>.apps.googleusercontent.com`)
3. Add to **Authorized redirect URIs**:
   ```
   https://your-production-domain.com/api/auth/callback/google
   ```

##### Common Production Domains:
Replace `your-production-domain.com` with your actual domain:
- Vercel: `https://your-app-name.vercel.app`
- Netlify: `https://your-app-name.netlify.app`
- Custom domain: `https://autonoma-chat.com`

##### Environment Variables Update:
Make sure your production `NEXTAUTH_URL` matches your domain:
```bash
NEXTAUTH_URL=https://your-actual-production-domain.com
```

#### 5. Verification Steps
- [ ] All environment variables set in production
- [ ] Database migrations deployed
- [ ] **OAuth providers configured with correct callback URLs** ⚠️
- [ ] **NEXTAUTH_URL updated to production domain** ⚠️
- [ ] SSL certificates working
- [ ] API endpoints responding correctly
- [ ] Test login with GitHub ✅
- [ ] Test login with Google ✅

#### 6. Troubleshooting OAuth Issues
If you're still getting OAuth errors:

1. **Double-check callback URLs** in both GitHub and Google consoles
2. **Verify NEXTAUTH_URL** matches your production domain exactly
3. **Clear browser cache** and try again
4. **Check environment variables** are properly set in production
5. **Ensure HTTPS** is working (OAuth requires secure connections)

#### 7. Quick Fix Commands
After updating OAuth settings, redeploy:
```bash
# For Vercel
vercel --prod

# For other platforms
git push origin main
```

## 🎯 Ready for Production!

Your Autonoma Chat application is now ready for deployment with:
- ✅ Modern Next.js 15 architecture
- ✅ PostgreSQL database with Prisma ORM
- ✅ OpenAI GPT-4 & DALL-E 3 integration
- ✅ ElevenLabs Text-to-Speech
- ✅ Cloudinary image management
- ✅ OAuth authentication (GitHub & Google)
- ✅ Responsive glassmorphism design
- ✅ File upload capabilities
- ✅ Voice chat functionality
