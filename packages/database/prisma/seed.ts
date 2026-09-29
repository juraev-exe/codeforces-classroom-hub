import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with user Codeforces account...');

  const teacherHandle = process.env.TEACHER_CF_HANDLE || 'AbubakrJ';

  // 1. Create or update Teacher / Personal User Account
  const teacher = await prisma.user.upsert({
    where: { email: 'abubakrjuraevv@gmail.com' },
    update: {
      name: 'Abubakr Juraev',
      codeforcesHandle: 'AbubakrJ',
    },
    create: {
      name: 'Abubakr Juraev',
      email: 'abubakrjuraevv@gmail.com',
      passwordHash: '$2a$10$IX.zGaVfvNAaEwVi.Mu6lu2D5juZO15dgfVBflSbSuwzd/Jq/vGNi',
      role: 'teacher',
      codeforcesHandle: 'AbubakrJ',
    },
  });

  console.log(`Teacher account configured: ${teacher.name} (@${teacher.codeforcesHandle})`);

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

  console.log(`Classroom active: ${classroom.name}`);

  // 3. Add AbubakrJ and students for live API tracking
  const initialStudents = [
    { name: 'Abubakr Juraev', handle: 'AbubakrJ', group: 'Batch Lead' },
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
    console.log(`Tracked: ${student.name} (@${student.codeforcesHandle})`);
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
