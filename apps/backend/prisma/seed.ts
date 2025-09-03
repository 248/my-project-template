import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Health check record
  await prisma.healthCheck.upsert({
    where: { id: 'health-check-1' },
    update: {
      status: 'healthy',
      message: 'Database connection successful',
    },
    create: {
      id: 'health-check-1',
      status: 'healthy',
      message: 'Database connection successful',
    },
  })

  console.log('✅ Database seeded successfully!')
}

main()
  .catch(e => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
