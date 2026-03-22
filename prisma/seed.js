/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@admin.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@admin.com',
      role: 'ADMIN',
      onboardingStatus: {
        create: {
          status: 'COMPLETED'
        }
      }
    }
  })

  const employee = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      name: 'Test Employee',
      email: 'test@example.com',
      role: 'EMPLOYEE',
      onboardingStatus: {
        create: {
          status: 'INVITED'
        }
      }
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
