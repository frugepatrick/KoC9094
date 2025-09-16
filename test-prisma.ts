import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const events = await prisma.events.findMany({ take: 1 })
  console.log(events)
}

main().finally(() => prisma.$disconnect());