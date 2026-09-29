import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create or update Default Teacher
  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@classroom.cf' },
    update: {
      passwordHash: '$2a$10$IX.zGaVfvNAaEwVi.Mu6lu2D5juZO15dgfVBflSbSuwzd/Jq/vGNi',
      codeforcesHandle: process.env.TEACHER_CF_HANDLE || 'tourist',
    },
    create: {
      name: 'Professor Gennady',
      email: 'teacher@classroom.cf',
      passwordHash: '$2a$10$IX.zGaVfvNAaEwVi.Mu6lu2D5juZO15dgfVBflSbSuwzd/Jq/vGNi', // "admin123"
      role: 'teacher',
      codeforcesHandle: process.env.TEACHER_CF_HANDLE || 'tourist',
    },
  });

  console.log(`Teacher seeded: ${teacher.name} (${teacher.codeforcesHandle})`);

  // 2. Create Default Classroom
  const classroom = await prisma.classroom.upsert({
    where: { id: 'class-algorithms-2026' },
    update: {},
    create: {
      id: 'class-algorithms-2026',
      name: 'Competitive Programming 2026',
      description: 'Advanced Competitive Programming & Algorithm Design batch',
    },
  });

  console.log(`Classroom seeded: ${classroom.name}`);

  // 3. Add initial real Codeforces handles as students for testing real API sync
  // Handles: Benq, ecnerwala, Um_nik, jiangly, Radewoosh
  const initialStudents = [
    { name: 'Benjamin Qi', handle: 'Benq', group: 'Team A' },
    { name: 'Andrew He', handle: 'ecnerwala', group: 'Team A' },
    { name: 'Aleksei Daniliuk', handle: 'Um_nik', group: 'Team B' },
    { name: 'Jiang Ling', handle: 'jiangly', group: 'Team B' },
  ];

  for (const s of initialStudents) {
    const student = await prisma.student.upsert({
      where: { codeforcesHandle: s.handle },
      update: {
        name: s.name,
        classId: classroom.id,
        group: s.group,
      },
      create: {
        name: s.name,
        codeforcesHandle: s.handle,
        classId: classroom.id,
        group: s.group,
        active: true,
      },
    });
    console.log(`Student prepared: ${student.name} (@${student.codeforcesHandle})`);
  }

  console.log('✅ Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
