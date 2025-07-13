#!/bin/bash

echo "🚀 Setting up database for production..."

# Load environment variables
source .env.local

echo "📊 Database URL: ${DATABASE_URL:0:20}..."

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Push schema to database
echo "📤 Pushing schema to database..."
npx prisma db push

# Check migration status
echo "📋 Checking migration status..."
npx prisma migrate status

# Seed database (optional)
echo "🌱 Seeding database..."
pnpm run db:seed

echo "✅ Database setup complete!"
echo ""
echo "🔧 Next steps for production deployment:"
echo "1. Update DATABASE_URL in your production environment"
echo "2. Run: npx prisma migrate deploy"
echo "3. Run: npx prisma generate"
echo "4. Deploy your application"
