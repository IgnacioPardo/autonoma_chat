import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Create development user
  const devUser = await prisma.user.upsert({
    where: { 
      id: 'dev-user-id' 
    },
    update: {},
    create: {
      id: 'dev-user-id',
      name: 'Development User',
      email: 'dev@example.com',
      emailVerified: new Date(),
    },
  })

  console.log('✅ Development user created:', devUser)
  console.log('🌱 Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
