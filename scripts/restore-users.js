#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function restoreUsers() {
  // Christian Kinkead
  await prisma.users.update({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    data: {
      email: 'kinkead@curryislandmicrogreens.com',
      firstName: 'Christian',
      lastName: 'Kinkead',
      password: await bcrypt.hash('changeme123', 10),
      department: 'Executive',
      position: 'Owner',
      roles: 'OWNER,ADMIN',
      permissions: 'FULL_ACCESS',
      hireDate: new Date('2022-01-01'),
      isActive: true,
      updatedAt: new Date()
    }
  });
  console.log('Updated: kinkead@curryislandmicrogreens.com');

  // Jay Cee (id: ...300)
  await prisma.users.update({
    where: { id: '00000000-0000-0000-0000-000000000300' },
    data: {
      email: 'jay.cee@sharedoxygen.com',
      firstName: 'Jay',
      lastName: 'Cee',
      password: await bcrypt.hash('changeme123', 10),
      department: 'Executive',
      position: 'Owner',
      roles: 'OWNER,ADMIN',
      permissions: 'FULL_ACCESS',
      hireDate: new Date('2022-01-01'),
      isActive: true,
      updatedAt: new Date()
    }
  });
  console.log('Updated: jay.cee@sharedoxygen.com');

  await prisma.$disconnect();
}

restoreUsers().catch(console.error); 