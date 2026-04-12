import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
    const session = await prisma.session.findUnique({ where: { name: '2026-I' }});
    console.log("Session:", session);
    if (!session) return;
    const rates = await prisma.messRate.findMany({ where: { sessionId: session.id }});
    console.log("Rates months:", rates.map(r => r.month));
    const rebates = await prisma.monthlyRebate.findMany({ where: { sessionId: session.id }});
    console.log("Rebates months/years:", rebates.map(r => `${r.month}-${r.year}`).slice(0, 10), rebates.length > 10 ? '...' : '');
}
run();
