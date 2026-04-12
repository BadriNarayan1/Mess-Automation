const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const student = await prisma.student.findFirst({
    include: {
      course: true,
      messAssignments: { include: { mess: true, session: true } },
      monthlyRebates: { include: { session: true } },
      feesDeposited: { include: { session: true } },
    }
  });
  console.log(student);
}
test().catch(console.error).finally(() => prisma.$disconnect());
