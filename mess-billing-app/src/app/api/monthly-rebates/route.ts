import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt, isNonNegativeNumber, isValidMonth, isValidYear } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const studentId = searchParams.get('studentId');

        const where: Record<string, number> = {};
        if (sessionId) {
            if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
            where.sessionId = Number(sessionId);
        }
        if (studentId) {
            if (!isPositiveInt(studentId)) return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 });
            where.studentId = Number(studentId);
        }

        const rebates = await prisma.monthlyRebate.findMany({
            where,
            include: {
                student: { select: { id: true, entryNo: true, name: true, hostel: true, hostelId: true, hostelRef: { select: { id: true, name: true } } } },
                session: true,
            },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        return NextResponse.json(rebates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch rebates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { entryNo, sessionId, month, year, rebateDays } = await request.json();
        if (!entryNo || !sessionId || !month || !year || rebateDays == null) {
            return NextResponse.json({ error: 'entryNo, sessionId, month, year and rebateDays are required' }, { status: 400 });
        }
        if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
        if (!isValidMonth(month)) return NextResponse.json({ error: 'month must be between 1 and 12' }, { status: 400 });
        if (!isValidYear(year)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 });
        if (!isNonNegativeNumber(rebateDays)) return NextResponse.json({ error: 'rebateDays must be a non-negative number' }, { status: 400 });

        // Ensure rebateDays doesn't exceed days in the month
        const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
        if (Number(rebateDays) > daysInMonth) {
            return NextResponse.json({ error: `rebateDays cannot exceed ${daysInMonth} for this month` }, { status: 400 });
        }

        const sessionIdNum = Number(sessionId);
        const monthNum = Number(month);
        const yearNum = Number(year);
        const rebateDaysNum = Number(rebateDays);

        const result = await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw<[{ sp_upsert_monthly_rebate: number }]>`
                SELECT sp_upsert_monthly_rebate(${entryNo}, ${sessionIdNum}::int, ${monthNum}::int, ${yearNum}::int, ${rebateDaysNum}::int)
            `;
        });

        return NextResponse.json({ id: result[0].sp_upsert_monthly_rebate, message: 'Rebate saved' }, { status: 201 });
    } catch (error: any) {
        console.error(error);
        const msg = error?.message?.includes('Student not found') ? error.message : 'Failed to create rebate';
        return NextResponse.json({ error: msg }, { status: error?.message?.includes('Student not found') ? 404 : 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { id } = await request.json();
        if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        const idNum = Number(id);

        await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw`SELECT sp_delete_monthly_rebate(${idNum}::int)`;
        });

        return NextResponse.json({ message: 'Rebate deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete rebate' }, { status: 500 });
    }
}
