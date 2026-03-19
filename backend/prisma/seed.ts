// Solar Ops MVP — Database Seed
// Run: npx prisma db seed

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 3600 * 1000);
}
function daysAgo(d: number): Date {
  return new Date(Date.now() - d * 24 * 3600 * 1000);
}
function daysAhead(d: number): Date {
  return new Date(Date.now() + d * 24 * 3600 * 1000);
}

async function main() {
  console.log('Clearing existing data in correct FK order...');

  // Delete in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.siteReport.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.jobStatusHistory.deleteMany();
  await prisma.jobAssignment.deleteMany();
  await prisma.job.deleteMany();
  await prisma.property.deleteMany();
  await prisma.scaffolderRegion.deleteMany();
  await prisma.scaffolder.deleteMany();
  await prisma.engineer.deleteMany();
  await prisma.owner.deleteMany();
  await prisma.region.deleteMany();
  await prisma.consent.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...\n');

  // ── Regions ─────────────────────────────────────────────────────────────────
  const regionLondon = await prisma.region.create({
    data: { name: 'London South', code: 'LS', postcode: 'SE1' },
  });
  const regionMidlands = await prisma.region.create({
    data: { name: 'Midlands', code: 'MID', postcode: 'B1' },
  });
  const regionNorthWest = await prisma.region.create({
    data: { name: 'North West', code: 'NW', postcode: 'M1' },
  });
  console.log(`Created 3 regions`);

  // ── Scaffolder users & scaffolders ────────────────────────────────────────
  const scaffPassword = await bcrypt.hash('scaffold123', 12);

  const scaffUser1 = await prisma.user.create({
    data: {
      clerkId: 'local-apex@scaffolding.co.uk',
      email: 'apex@scaffolding.co.uk',
      name: 'Dave Wilson',
      role: 'SCAFFOLDER',
      passwordHash: scaffPassword,
      emailVerified: new Date(),
    },
  });
  const scaff1 = await prisma.scaffolder.create({
    data: {
      userId: scaffUser1.id,
      companyName: 'Apex Scaffolding Ltd',
      firstName: 'Dave',
      lastName: 'Wilson',
      phone: '+44 7700 900123',
    },
  });

  const scaffUser2 = await prisma.user.create({
    data: {
      clerkId: 'local-saferise@scaffolding.co.uk',
      email: 'saferise@scaffolding.co.uk',
      name: 'Paul Brown',
      role: 'SCAFFOLDER',
      passwordHash: scaffPassword,
      emailVerified: new Date(),
    },
  });
  const scaff2 = await prisma.scaffolder.create({
    data: {
      userId: scaffUser2.id,
      companyName: 'SafeRise Scaffolding',
      firstName: 'Paul',
      lastName: 'Brown',
      phone: '+44 7700 900456',
    },
  });

  const scaffUser3 = await prisma.user.create({
    data: {
      clerkId: 'local-highline@scaffolding.co.uk',
      email: 'highline@scaffolding.co.uk',
      name: 'Sarah Connor',
      role: 'SCAFFOLDER',
      passwordHash: scaffPassword,
      emailVerified: new Date(),
    },
  });
  const scaff3 = await prisma.scaffolder.create({
    data: {
      userId: scaffUser3.id,
      companyName: 'HighLine Scaffolding Solutions',
      firstName: 'Sarah',
      lastName: 'Connor',
      phone: '+44 7700 900789',
    },
  });

  const scaffUser4 = await prisma.user.create({
    data: {
      clerkId: 'local-vertical@scaffolding.co.uk',
      email: 'vertical@scaffolding.co.uk',
      name: 'Mike Turner',
      role: 'SCAFFOLDER',
      passwordHash: scaffPassword,
      emailVerified: new Date(),
    },
  });
  const scaff4 = await prisma.scaffolder.create({
    data: {
      userId: scaffUser4.id,
      companyName: 'Vertical Scaffolding Co',
      firstName: 'Mike',
      lastName: 'Turner',
      phone: '+44 7700 901234',
    },
  });

  // Assign scaffolders to regions
  await prisma.scaffolderRegion.createMany({
    data: [
      { scaffolderId: scaff1.id, regionId: regionLondon.id },
      { scaffolderId: scaff1.id, regionId: regionMidlands.id },
      { scaffolderId: scaff2.id, regionId: regionLondon.id },
      { scaffolderId: scaff3.id, regionId: regionMidlands.id },
      { scaffolderId: scaff3.id, regionId: regionNorthWest.id },
      { scaffolderId: scaff4.id, regionId: regionNorthWest.id },
    ],
  });
  console.log(`Created 4 scaffolders`);

  // ── Admin user ─────────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      clerkId: 'local-admin@solarops.co.uk',
      email: 'admin@solarops.co.uk',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: adminPassword,
      emailVerified: new Date(),
    },
  });
  console.log(`Created 1 admin user`);

  // ── Engineer users & engineers ──────────────────────────────────────────────
  const engPassword = await bcrypt.hash('engineer123', 12);

  const engUser1 = await prisma.user.create({
    data: {
      clerkId: 'local-joe@solarops.co.uk',
      email: 'joe@solarops.co.uk',
      name: 'Joe Technical',
      role: 'ENGINEER',
      passwordHash: engPassword,
      emailVerified: new Date(),
    },
  });
  const eng1 = await prisma.engineer.create({ data: { userId: engUser1.id } });

  const engUser2 = await prisma.user.create({
    data: {
      clerkId: 'local-lisa@solarops.co.uk',
      email: 'lisa@solarops.co.uk',
      name: 'Lisa Surveyor',
      role: 'ENGINEER',
      passwordHash: engPassword,
      emailVerified: new Date(),
    },
  });
  const eng2 = await prisma.engineer.create({ data: { userId: engUser2.id } });
  console.log(`Created 2 engineers`);

  // ── Owner users & owners ────────────────────────────────────────────────────
  const ownerPassword = await bcrypt.hash('owner123', 12);

  const ownerUser1 = await prisma.user.create({
    data: {
      clerkId: 'local-john.smith@email.co.uk',
      email: 'john.smith@email.co.uk',
      name: 'John Smith',
      role: 'OWNER',
      passwordHash: ownerPassword,
      emailVerified: new Date(),
    },
  });
  const owner1 = await prisma.owner.create({
    data: { userId: ownerUser1.id },
  });

  const ownerUser2 = await prisma.user.create({
    data: {
      clerkId: 'local-priya.patel@email.co.uk',
      email: 'priya.patel@email.co.uk',
      name: 'Priya Patel',
      role: 'OWNER',
      passwordHash: ownerPassword,
      emailVerified: new Date(),
    },
  });
  const owner2 = await prisma.owner.create({
    data: { userId: ownerUser2.id },
  });
  console.log(`Created 2 owners`);

  // ── Properties ──────────────────────────────────────────────────────────────
  const prop1 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      addressLine1: '14 Oak Avenue',
      city: 'London',
      postcode: 'SE15 4LG',
      latitude: 51.4745,
      longitude: -2.5879,
    },
  });
  const prop2 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      addressLine1: '72 Maple Street',
      city: 'Birmingham',
      postcode: 'B3 1HJ',
      latitude: 52.4797,
      longitude: -1.9022,
    },
  });
  const prop3 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      addressLine1: '5 Cedar Gardens',
      city: 'Manchester',
      postcode: 'M4 6EL',
      latitude: 53.4808,
      longitude: -2.2426,
    },
  });
  const prop4 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      addressLine1: '28 Birch Lane',
      city: 'London',
      postcode: 'SW2 4AA',
      latitude: 51.4345,
      longitude: -0.1234,
    },
  });
  const prop5 = await prisma.property.create({
    data: {
      ownerId: owner1.id,
      addressLine1: '9 Pine Crescent',
      city: 'Birmingham',
      postcode: 'B5 7PQ',
      latitude: 52.4597,
      longitude: -1.8122,
    },
  });
  const prop6 = await prisma.property.create({
    data: {
      ownerId: owner2.id,
      addressLine1: '41 Willow Way',
      city: 'London',
      postcode: 'SE6 3BN',
      latitude: 51.4245,
      longitude: -0.0234,
    },
  });
  console.log(`Created 6 properties`);

  // ── Jobs (8) across full 22-state workflow ──────────────────────────────────
  const job1 = await prisma.job.create({
    data: {
      title: '14 Oak Avenue — Solar Panel Installation',
      description: 'Standard 4kW domestic solar panel installation',
      address: '14 Oak Avenue, London, SE15 4LG',
      status: 'COMPLETED',
      ownerId: ownerUser1.id,
      propertyId: prop1.id,
      scheduledDate: daysAgo(14),
      completionDate: daysAgo(10),
      completionNotes: 'Installation completed successfully. All panels operational.',
      createdAt: daysAgo(30),
    },
  });

  const job2 = await prisma.job.create({
    data: {
      title: '72 Maple Street — Scaffolding & Installation',
      description: 'Full roof-mount solar installation with scaffolding access required',
      address: '72 Maple Street, Birmingham, B3 1HJ',
      status: 'SITE_REPORT_SUBMITTED',
      ownerId: ownerUser1.id,
      propertyId: prop2.id,
      scheduledDate: daysAhead(5),
      createdAt: daysAgo(20),
    },
  });

  const job3 = await prisma.job.create({
    data: {
      title: '5 Cedar Gardens — New Build Solar',
      description: 'New build property with integrated solar system',
      address: '5 Cedar Gardens, Manchester, M4 6EL',
      status: 'QUOTE_APPROVED',
      ownerId: ownerUser2.id,
      propertyId: prop3.id,
      createdAt: daysAgo(15),
    },
  });

  const job4 = await prisma.job.create({
    data: {
      title: '28 Birch Lane — Roof Assessment',
      description: 'Initial roof assessment and photo documentation',
      address: '28 Birch Lane, London, SW2 4AA',
      status: 'SUBMITTED',
      ownerId: ownerUser2.id,
      propertyId: prop4.id,
      createdAt: daysAgo(7),
    },
  });

  const job5 = await prisma.job.create({
    data: {
      title: '9 Pine Crescent — Commercial Solar',
      description: '15kW commercial solar installation',
      address: '9 Pine Crescent, Birmingham, B5 7PQ',
      status: 'ASSIGNED_TO_SCAFFOLDER',
      ownerId: ownerUser1.id,
      propertyId: prop5.id,
      inviteToken: 'inv-token-abc123',
      inviteSentAt: daysAgo(3),
      inviteExpiresAt: daysAhead(4),
      createdAt: daysAgo(10),
    },
  });

  const job6 = await prisma.job.create({
    data: {
      title: '41 Willow Way — Residential Solar',
      description: '6kW residential solar with battery storage',
      address: '41 Willow Way, London, SE6 3BN',
      status: 'SCHEDULED',
      ownerId: ownerUser2.id,
      propertyId: prop6.id,
      scheduledDate: daysAhead(7),
      scheduledDuration: 480,
      createdAt: daysAgo(12),
    },
  });

  const job7 = await prisma.job.create({
    data: {
      title: '14 Oak Avenue — Follow-up Inspection',
      description: 'Annual inspection following initial install',
      address: '14 Oak Avenue, London, SE15 4LG',
      status: 'DRAFT',
      ownerId: ownerUser1.id,
      propertyId: prop1.id,
      createdAt: hoursAgo(2),
    },
  });

  const job8 = await prisma.job.create({
    data: {
      title: '5 Cedar Gardens — Scaffolding Review',
      description: 'Post-quote scaffolding inspection required',
      address: '5 Cedar Gardens, Manchester, M4 6EL',
      status: 'QUOTE_PENDING',
      ownerId: ownerUser2.id,
      propertyId: prop3.id,
      createdAt: daysAgo(5),
    },
  });
  console.log(`Created 8 jobs`);

  // ── Job Assignments ──────────────────────────────────────────────────────────
  await prisma.jobAssignment.createMany({
    data: [
      { jobId: job1.id, scaffolderId: scaff1.id, assignedBy: admin.id },
      { jobId: job2.id, scaffolderId: scaff2.id, assignedBy: admin.id },
      { jobId: job3.id, scaffolderId: scaff3.id, assignedBy: admin.id },
      { jobId: job4.id, scaffolderId: scaff1.id, assignedBy: admin.id },
      { jobId: job5.id, scaffolderId: scaff3.id, assignedBy: admin.id },
      { jobId: job6.id, scaffolderId: scaff2.id, assignedBy: admin.id },
    ],
  });

  // ── Job Status History ──────────────────────────────────────────────────────
  await prisma.jobStatusHistory.createMany({
    data: [
      { jobId: job1.id, fromStatus: null, toStatus: 'DRAFT', changedBy: ownerUser1.id, note: 'Job created', createdAt: daysAgo(30) },
      { jobId: job1.id, fromStatus: 'DRAFT', toStatus: 'AWAITING_OWNER_SUBMISSION', changedBy: ownerUser1.id, createdAt: daysAgo(28) },
      { jobId: job1.id, fromStatus: 'AWAITING_OWNER_SUBMISSION', toStatus: 'SUBMITTED', changedBy: ownerUser1.id, createdAt: daysAgo(25) },
      { jobId: job1.id, fromStatus: 'SUBMITTED', toStatus: 'VALIDATED', changedBy: admin.id, createdAt: daysAgo(24) },
      { jobId: job1.id, fromStatus: 'VALIDATED', toStatus: 'ASSIGNED_TO_SCAFFOLDER', changedBy: admin.id, createdAt: daysAgo(22) },
      { jobId: job1.id, fromStatus: 'ASSIGNED_TO_SCAFFOLDER', toStatus: 'QUOTE_SUBMITTED', changedBy: scaffUser1.id, createdAt: daysAgo(20) },
      { jobId: job1.id, fromStatus: 'QUOTE_SUBMITTED', toStatus: 'QUOTE_APPROVED', changedBy: ownerUser1.id, createdAt: daysAgo(18) },
      { jobId: job1.id, fromStatus: 'QUOTE_APPROVED', toStatus: 'SCHEDULED', changedBy: admin.id, createdAt: daysAgo(16) },
      { jobId: job1.id, fromStatus: 'SCHEDULED', toStatus: 'SCAFFOLD_WORK_IN_PROGRESS', changedBy: scaffUser1.id, createdAt: daysAgo(14) },
      { jobId: job1.id, fromStatus: 'SCAFFOLD_WORK_IN_PROGRESS', toStatus: 'SCAFFOLD_COMPLETE', changedBy: scaffUser1.id, createdAt: daysAgo(12) },
      { jobId: job1.id, fromStatus: 'SCAFFOLD_COMPLETE', toStatus: 'INSTALLER_ASSIGNED', changedBy: admin.id, createdAt: daysAgo(11) },
      { jobId: job1.id, fromStatus: 'INSTALLER_ASSIGNED', toStatus: 'SITE_REPORT_PENDING', changedBy: engUser1.id, createdAt: daysAgo(11) },
      { jobId: job1.id, fromStatus: 'SITE_REPORT_PENDING', toStatus: 'SITE_REPORT_SUBMITTED', changedBy: engUser1.id, createdAt: daysAgo(10) },
      { jobId: job1.id, fromStatus: 'SITE_REPORT_SUBMITTED', toStatus: 'COMPLETED', changedBy: admin.id, createdAt: daysAgo(10) },
    ],
  });
  console.log(`Created job status history entries`);

  // ── Quotes (5) ──────────────────────────────────────────────────────────────
  const quote1 = await prisma.quote.create({
    data: {
      jobId: job1.id,
      scaffolderId: scaff1.id,
      amount: 2400.00,
      notes: 'Standard domestic scaffolding, 2-person team, 3-day hire',
      status: 'APPROVED',
      proposedDate: daysAgo(16),
      reviewedBy: ownerUser1.id,
      reviewedAt: daysAgo(18),
      version: 1,
      submittedAt: daysAgo(20),
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      jobId: job2.id,
      scaffolderId: scaff2.id,
      amount: 4200.00,
      notes: 'Commercial grade scaffolding, 4-person team, 5-day hire',
      status: 'SUBMITTED',
      proposedDate: daysAhead(3),
      version: 1,
      submittedAt: daysAgo(3),
    },
  });

  const quote3 = await prisma.quote.create({
    data: {
      jobId: job3.id,
      scaffolderId: scaff3.id,
      amount: 3100.00,
      notes: 'Standard scaffolding with roof edge protection',
      status: 'APPROVED',
      proposedDate: daysAgo(8),
      reviewedBy: ownerUser2.id,
      reviewedAt: daysAgo(6),
      version: 1,
      submittedAt: daysAgo(10),
    },
  });

  const quote4 = await prisma.quote.create({
    data: {
      jobId: job6.id,
      scaffolderId: scaff2.id,
      amount: 1950.00,
      notes: 'Residential scaffolding, single team, 2-day hire',
      status: 'APPROVED',
      proposedDate: daysAgo(5),
      reviewedBy: ownerUser2.id,
      reviewedAt: daysAgo(4),
      version: 1,
      submittedAt: daysAgo(6),
    },
  });

  const quote5 = await prisma.quote.create({
    data: {
      jobId: job8.id,
      scaffolderId: scaff3.id,
      amount: 2800.00,
      notes: 'Scaffolding inspection and quote revision',
      status: 'PENDING',
      version: 1,
      submittedAt: daysAgo(1),
    },
  });
  console.log(`Created 5 quotes`);

  // ── Schedules ───────────────────────────────────────────────────────────────
  await prisma.schedule.createMany({
    data: [
      {
        jobId: job1.id,
        proposedDate: daysAgo(14),
        proposedBy: scaffUser1.id,
        duration: 480,
        status: 'CONFIRMED',
        confirmedAt: daysAgo(15),
        confirmedBy: ownerUser1.id,
        note: 'Confirmed for scaffold erection',
      },
      {
        jobId: job6.id,
        proposedDate: daysAhead(7),
        proposedBy: scaffUser2.id,
        duration: 240,
        status: 'CONFIRMED',
        confirmedAt: daysAgo(3),
        confirmedBy: ownerUser2.id,
      },
    ],
  });
  console.log(`Created 2 schedules`);

  // ── Photos ──────────────────────────────────────────────────────────────────
  await prisma.photo.createMany({
    data: [
      {
        jobId: job1.id,
        uploadedById: ownerUser1.id,
        url: 'https://storage.example.com/photos/prop1-roof1.jpg',
        storageKey: 'photos/job1/roof1.jpg',
        caption: 'Full roof overview',
        reviewStatus: 'APPROVED',
        approved: true,
        category: 'ROOF',
        fileName: 'roof1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 2456000,
        latitude: 51.4745,
        longitude: -2.5879,
        reviewedBy: admin.id,
        reviewedAt: daysAgo(26),
        createdAt: daysAgo(27),
      },
      {
        jobId: job1.id,
        uploadedById: ownerUser1.id,
        url: 'https://storage.example.com/photos/prop1-electrical1.jpg',
        storageKey: 'photos/job1/electrical1.jpg',
        caption: 'Consumer unit and wiring',
        reviewStatus: 'APPROVED',
        approved: true,
        category: 'ELECTRICAL',
        fileName: 'electrical1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 1850000,
        latitude: 51.4745,
        longitude: -2.5879,
        reviewedBy: admin.id,
        reviewedAt: daysAgo(26),
        createdAt: daysAgo(27),
      },
      {
        jobId: job2.id,
        uploadedById: ownerUser1.id,
        url: 'https://storage.example.com/photos/prop2-roof1.jpg',
        storageKey: 'photos/job2/roof1.jpg',
        caption: 'South-facing roof slope',
        reviewStatus: 'PENDING',
        approved: false,
        category: 'ROOF',
        fileName: 'roof1.jpg',
        mimeType: 'image/jpeg',
        fileSize: 3200000,
        createdAt: daysAgo(6),
      },
    ],
  });
  console.log(`Created 3 photos`);

  // ── Site Reports ─────────────────────────────────────────────────────────────
  await prisma.siteReport.create({
    data: {
      jobId: job1.id,
      engineerId: eng1.id,
      summary: 'Site visit completed. Roof structure suitable for standard solar installation. All panels mounted successfully.',
      findings: 'Roof age: 8 years. Condition: Good. Orientation: South-southwest. Shading: Minimal. Electrical panel: 100A. Acceptable.',
      pdfUrl: 'https://storage.example.com/reports/job1-report.pdf',
      storageKey: 'reports/job1/report.pdf',
      status: 'SUBMITTED',
      data: { roofArea: 32, panelCount: 12, inverterLocation: 'Garage' },
      submittedAt: daysAgo(10),
    },
  });

  await prisma.siteReport.create({
    data: {
      jobId: job2.id,
      engineerId: eng2.id,
      summary: 'Site assessment completed. Scaffolding required for safe access.',
      findings: 'Roof is 3-storey. Steep pitch. Scaffolding quote approved. Installer access via side gate.',
      status: 'SUBMITTED',
      data: { roofArea: 55, panelCount: 20, scaffoldingRequired: true },
      submittedAt: daysAgo(2),
    },
  });
  console.log(`Created 2 site reports`);

  // ── Notifications (10) ──────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId: ownerUser1.id,
        type: 'JOB_UPDATE',
        title: 'Job Completed',
        message: 'Your solar installation at 14 Oak Avenue has been marked as completed.',
        read: false,
        metadata: { jobId: job1.id },
        createdAt: daysAgo(10),
      },
      {
        userId: ownerUser1.id,
        type: 'QUOTE_RECEIVED',
        title: 'New Quote Available',
        message: 'A new quote of £4,200 has been submitted for your job at 72 Maple Street.',
        read: true,
        metadata: { jobId: job2.id, quoteId: quote2.id },
        createdAt: daysAgo(3),
      },
      {
        userId: ownerUser2.id,
        type: 'QUOTE_APPROVED',
        title: 'Quote Approved',
        message: 'Your quote of £3,100 for 5 Cedar Gardens has been approved.',
        read: true,
        metadata: { jobId: job3.id, quoteId: quote3.id },
        createdAt: daysAgo(6),
      },
      {
        userId: scaffUser1.id,
        type: 'JOB_ASSIGNED',
        title: 'New Job Assignment',
        message: 'You have been assigned to a new job at 28 Birch Lane.',
        read: false,
        metadata: { jobId: job4.id },
        createdAt: daysAgo(7),
      },
      {
        userId: scaffUser3.id,
        type: 'JOB_ASSIGNED',
        title: 'Job Assignment',
        message: 'You have been assigned to 9 Pine Crescent — Commercial Solar.',
        read: false,
        metadata: { jobId: job5.id },
        createdAt: daysAgo(10),
      },
      {
        userId: ownerUser2.id,
        type: 'SCHEDULE_CONFIRMED',
        title: 'Schedule Confirmed',
        message: 'Scaffold work at 41 Willow Way is confirmed for next week.',
        read: false,
        metadata: { jobId: job6.id },
        createdAt: daysAgo(3),
      },
      {
        userId: engUser1.id,
        type: 'SITE_REPORT_REQUEST',
        title: 'Site Report Required',
        message: 'A site report is required for job at 14 Oak Avenue.',
        read: true,
        metadata: { jobId: job1.id },
        createdAt: daysAgo(11),
      },
      {
        userId: ownerUser1.id,
        type: 'PHOTO_REVIEWED',
        title: 'Photos Approved',
        message: 'Your submitted photos for 14 Oak Avenue have been approved.',
        read: true,
        metadata: { jobId: job1.id },
        createdAt: daysAgo(26),
      },
      {
        userId: scaffUser2.id,
        type: 'JOB_ASSIGNED',
        title: 'New Job',
        message: 'New job assignment at 41 Willow Way — Residential Solar.',
        read: false,
        metadata: { jobId: job6.id },
        createdAt: daysAgo(12),
      },
      {
        userId: admin.id,
        type: 'SYSTEM_ALERT',
        title: 'Quote Pending Review',
        message: 'A new quote is awaiting review for 5 Cedar Gardens.',
        read: false,
        metadata: { jobId: job8.id, quoteId: quote5.id },
        createdAt: daysAgo(1),
      },
    ],
  });
  console.log(`Created 10 notifications`);

  // ── Audit Logs (15) ─────────────────────────────────────────────────────────
  await prisma.auditLog.createMany({
    data: [
      { jobId: job1.id, userId: ownerUser1.id, action: 'CREATE', entityType: 'Job', entityId: job1.id, metadata: { ip: '192.168.1.1' }, timestamp: daysAgo(30) },
      { jobId: job1.id, userId: ownerUser1.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job1.id, previousValue: 'DRAFT', newValue: 'SUBMITTED', metadata: { ip: '192.168.1.1' }, timestamp: daysAgo(25) },
      { jobId: job1.id, userId: admin.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job1.id, previousValue: 'SUBMITTED', newValue: 'VALIDATED', metadata: { ip: '10.0.0.1' }, timestamp: daysAgo(24) },
      { jobId: job1.id, userId: admin.id, action: 'ASSIGN_SCAFFOLDER', entityType: 'JobAssignment', entityId: scaff1.id, previousValue: null, newValue: scaffUser1.id, metadata: { ip: '10.0.0.1' }, timestamp: daysAgo(22) },
      { jobId: job1.id, userId: scaffUser1.id, action: 'QUOTE_SUBMITTED', entityType: 'Quote', entityId: quote1.id, changes: { amount: 2400 }, metadata: { ip: '172.16.0.1' }, timestamp: daysAgo(20) },
      { jobId: job1.id, userId: ownerUser1.id, action: 'QUOTE_APPROVED', entityType: 'Quote', entityId: quote1.id, changes: { status: 'APPROVED' }, metadata: { ip: '192.168.1.1' }, timestamp: daysAgo(18) },
      { jobId: job1.id, userId: scaffUser1.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job1.id, previousValue: 'SCHEDULED', newValue: 'SCAFFOLD_WORK_IN_PROGRESS', metadata: { ip: '172.16.0.1' }, timestamp: daysAgo(14) },
      { jobId: job1.id, userId: engUser1.id, action: 'REPORT_SUBMITTED', entityType: 'SiteReport', entityId: 'site-report-1', changes: { status: 'SUBMITTED' }, metadata: { ip: '172.16.0.2' }, timestamp: daysAgo(10) },
      { jobId: job2.id, userId: admin.id, action: 'CREATE', entityType: 'Job', entityId: job2.id, metadata: { ip: '10.0.0.1' }, timestamp: daysAgo(20) },
      { jobId: job2.id, userId: ownerUser1.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job2.id, previousValue: 'VALIDATED', newValue: 'ASSIGNED_TO_SCAFFOLDER', metadata: { ip: '192.168.1.1' }, timestamp: daysAgo(18) },
      { jobId: job3.id, userId: admin.id, action: 'CREATE', entityType: 'Job', entityId: job3.id, metadata: { ip: '10.0.0.1' }, timestamp: daysAgo(15) },
      { jobId: job3.id, userId: ownerUser2.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job3.id, previousValue: 'QUOTE_SUBMITTED', newValue: 'QUOTE_APPROVED', metadata: { ip: '192.168.1.2' }, timestamp: daysAgo(6) },
      { jobId: job4.id, userId: ownerUser2.id, action: 'CREATE', entityType: 'Job', entityId: job4.id, metadata: { ip: '192.168.1.2' }, timestamp: daysAgo(7) },
      { jobId: job5.id, userId: admin.id, action: 'INVITE_SENT', entityType: 'Job', entityId: job5.id, changes: { inviteToken: 'inv-token-abc123' }, metadata: { ip: '10.0.0.1' }, timestamp: daysAgo(3) },
      { jobId: job6.id, userId: ownerUser2.id, action: 'STATUS_CHANGE', entityType: 'Job', entityId: job6.id, previousValue: 'QUOTE_APPROVED', newValue: 'SCHEDULED', metadata: { ip: '192.168.1.2' }, timestamp: daysAgo(4) },
    ],
  });
  console.log(`Created 15 audit log entries`);

  // ── Consents ────────────────────────────────────────────────────────────────
  await prisma.consent.createMany({
    data: [
      { userId: ownerUser1.id, type: 'MARKETING', granted: true },
      { userId: ownerUser2.id, type: 'MARKETING', granted: false },
      { userId: scaffUser1.id, type: 'TERMS', granted: true },
      { userId: admin.id, type: 'TERMS', granted: true },
    ],
  });
  console.log(`Created 4 consents`);

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n=== Seed Complete ===');
  console.log('Demo credentials:');
  console.log('  Admin:      admin@solarops.co.uk / admin123');
  console.log('  Scaffolder: apex@scaffolding.co.uk / scaffold123');
  console.log('              saferise@scaffolding.co.uk / scaffold123');
  console.log('              highline@scaffolding.co.uk / scaffold123');
  console.log('              vertical@scaffolding.co.uk / scaffold123');
  console.log('  Engineer:   joe@solarops.co.uk / engineer123');
  console.log('              lisa@solarops.co.uk / engineer123');
  console.log('  Owner:      john.smith@email.co.uk / owner123');
  console.log('              priya.patel@email.co.uk / owner123');
  console.log('\nRecord counts:');
  console.log('  Regions:       3');
  console.log('  Scaffolders:   4 (+ 4 users)');
  console.log('  Engineers:      2 (+ 2 users)');
  console.log('  Owners:         2 (+ 2 users)');
  console.log('  Admin users:    1');
  console.log('  Properties:     6');
  console.log('  Jobs:           8');
  console.log('  JobAssignments: 6');
  console.log('  Quotes:          5');
  console.log('  Schedules:      2');
  console.log('  Photos:         3');
  console.log('  SiteReports:    2');
  console.log('  Notifications:  10');
  console.log('  AuditLogs:      15');
  console.log('  Consents:       4');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
