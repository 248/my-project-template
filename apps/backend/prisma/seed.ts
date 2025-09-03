import { PrismaClient } from '../generated/prisma/index.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Health check record
  const healthCheckData = {
    status: 'healthy',
    message: 'Database connection successful',
  }

  await prisma.healthCheck.upsert({
    where: { id: 'health-check-1' },
    update: healthCheckData,
    create: {
      id: 'health-check-1',
      ...healthCheckData,
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
