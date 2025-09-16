import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // See which model delegates exist
  const keys = Object.keys(prisma).filter(
    (k) => !k.startsWith('$') && typeof prisma[k] === 'object'
  );
  console.log('Delegates:', keys); // should include "event" if your model is Event

  // Query one row from events table via the Event model
  const rows = await prisma.event.findMany({ take: 1 });
  console.log('First row:', rows);
}

main()
  .catch((e) => console.error('❌ Error:', e))
  .finally(async () => {
    await prisma.$disconnect();
  });
