#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.users.findMany({
    where: {
      OR: [
        { id: '00000000-0000-0000-0000-000000000002' },
        { email: 'kinkead@curryislandmicrogreens.com' },
        { id: '00000000-0000-0000-0000-000000000201' },
        { email: 'jay.cee@sharedoxygen.com' }
      ]
    }
  });
  console.log(users);
  await prisma.$disconnect();
}

main().catch(console.error); 