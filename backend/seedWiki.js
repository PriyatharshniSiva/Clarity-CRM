const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (!adminUser) {
    console.log('No admin user found to use as author');
    return;
  }

  const documents = [
    { title: 'Clarity InfoTech Intern Onboarding Guide', content: 'Step-by-step checklist for system configurations and access setup.\n\n1. Setup Email\n2. Configure Git\n3. Request Access', authorId: adminUser.id, createdAt: new Date('2026-07-15T00:00:00.000Z') },
    { title: 'Frontend Coding Style & UI Standards', content: 'Rules for tailwind configs, custom CSS classes, and Lucide icons.\n\n- Use Tailwind spacing\n- Avoid inline styles', authorId: adminUser.id, createdAt: new Date('2026-07-12T00:00:00.000Z') },
    { title: 'API Endpoints & Database Schemas Guide', content: 'Documentation of attendance and team route endpoints parameters.\n\nSee the swagger docs for more info.', authorId: adminUser.id, createdAt: new Date('2026-07-10T00:00:00.000Z') }
  ];

  for (const doc of documents) {
    await prisma.wikiPage.create({
      data: doc
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
