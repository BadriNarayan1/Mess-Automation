import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt, isPositiveNumber, isValidDate } from '@/lib/security';

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

        const payments = await prisma.feesDeposited.findMany({
            where,
            include: {
                student: { select: { id: true, entryNo: true, name: true } },
                session: true,
            },
            orderBy: { paymentDate: 'desc' }
        });
        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { entryNo, sessionId, amount, paymentDate } = await request.json();
        if (!entryNo || !sessionId || amount == null || !paymentDate) {
            return NextResponse.json({ error: 'entryNo, sessionId, amount and paymentDate are required' }, { status: 400 });
        }
        if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
        if (!isPositiveNumber(amount)) return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 });
        if (!isValidDate(paymentDate)) return NextResponse.json({ error: 'Invalid payment date' }, { status: 400 });

        const sessionIdNum = Number(sessionId);
        const amountNum = Number(amount);
        const paymentDateVal = new Date(paymentDate);

        const result = await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw<[{ sp_create_fee_payment: number }]>`
                SELECT sp_create_fee_payment(${entryNo}, ${sessionIdNum}::int, ${amountNum}::double precision, ${paymentDateVal}::timestamp)
            `;
        });

        return NextResponse.json({ id: result[0].sp_create_fee_payment, message: 'Payment recorded' }, { status: 201 });
    } catch (error: any) {
        console.error(error);
        const msg = error?.message?.includes('Student not found') ? error.message : 'Failed to record payment';
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
            return tx.$queryRaw`SELECT sp_delete_fee_payment(${idNum}::int)`;
        });

        return NextResponse.json({ message: 'Payment deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 });
    }
}
