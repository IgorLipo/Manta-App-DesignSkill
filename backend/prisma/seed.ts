// Solar Ops MVP — Database Seed
// Run: npx ts-node prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin123', 12);
  const scaffolderPassword = await bcrypt.hash('scaffold123', 12);
  const ownerPassword = await bcrypt.hash('owner123', 12);

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@solarops.co.uk' },
    update: {},
    create: {
      email: 'admin@solarops.co.uk',
      passwordHash: adminPassword,
      role: 'ADMIN',
      emailVerified: true,
    },
  });
  console.log('Admin created:', admin.email);

  // Scaffolder
  const scaffolderUser = await prisma.user.upsert({
    where: { email: 'apex@scaffolding.co.uk' },
    update: {},
    create: {
      email: 'apex@scaffolding.co.uk',
      passwordHash: scaffolderPassword,
      role: 'SCAFFOLDER',
      emailVerified: true,
    },
  });

  const region = await prisma.region.upsert({
    where: { code: 'SW' },
    update: {},
    create: { name: 'South West', code: 'SW' },
  });

  const scaffolder = await prisma.scaffolder.upsert({
    where: { userId: scaffolderUser.id },
    update: {},
    create: {
      userId: scaffolderUser.id,
      companyName: 'Apex Scaffolding Ltd',
      firstName: 'Dave',
      lastName: 'Wilson',
      phone: '+44 7700 900123',
    },
  });

  await prisma.scaffolderRegion.upsert({
    where: { scaffolderId_regionId: { scaffolderId: scaffolder.id, regionId: region.id } },
    update: {},
    create: { scaffolderId: scaffolder.id, regionId: region.id },
  });
  console.log('Scaffolder created:', scaffolderUser.email);

  // Owner
  const ownerUser = await prisma.user.upsert({
    where: { email: 'john.smith@email.co.uk' },
    update: {},
    create: {
      email: 'john.smith@email.co.uk',
      passwordHash: ownerPassword,
      role: 'OWNER',
      emailVerified: true,
    },
  });

  const owner = await prisma.owner.upsert({
    where: { userId: ownerUser.id },
    update: {},
    create: {
      userId: ownerUser.id,
      firstName: 'John',
      lastName: 'Smith',
      phone: '+44 7700 900456',
    },
  });

  // Property
  const property = await prisma.property.upsert({
    where: { id: 'demo-property-1' },
    update: {},
    create: {
      id: 'demo-property-1',
      ownerId: owner.id,
      addressLine1: '14 Oak Avenue',
      city: 'Bristol',
      postcode: 'BS1 4LG',
      latitude: 51.4545,
      longitude: -2.5879,
    },
  });

  // Job
  const job = await prisma.job.upsert({
    where: { id: 'demo-job-1' },
    update: {},
    create: {
      id: 'demo-job-1',
      propertyId: property.id,
      status: 'ASSIGNED_TO_SCAFFOLDER',
    },
  });

  await prisma.jobAssignment.upsert({
    where: { id: 'demo-assignment-1' },
    update: {},
    create: {
      id: 'demo-assignment-1',
      jobId: job.id,
      scaffolderId: scaffolder.id,
      assignedBy: admin.id,
    },
  });

  console.log('Demo job created:', job.id);
  console.log('\nDemo credentials:');
  console.log('Admin:      admin@solarops.co.uk / admin123');
  console.log('Scaffolder: apex@scaffolding.co.uk / scaffold123');
  console.log('Owner:      john.smith@email.co.uk / owner123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
