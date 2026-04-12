import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt, isNonNegativeNumber, isValidMonth } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const messId = searchParams.get('messId');
        const month = searchParams.get('month');

        const where: Record<string, number> = {};
        if (sessionId) {
            if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
            where.sessionId = Number(sessionId);
        }
        if (messId) {
            if (!isPositiveInt(messId)) return NextResponse.json({ error: 'Invalid messId' }, { status: 400 });
            where.messId = Number(messId);
        }
        if (month) {
            if (!isValidMonth(month)) return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
            where.month = Number(month);
        }

        const rates = await prisma.messRate.findMany({
            where,
            include: { mess: true, session: true },
            orderBy: [{ sessionId: 'desc' }, { month: 'asc' }]
        });
        return NextResponse.json(rates);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mess rates' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { messId, sessionId, month, monthlyRate, gstPercentage } = await request.json();
        if (!messId || !sessionId || !month || monthlyRate == null) {
            return NextResponse.json({ error: 'messId, sessionId, month and monthlyRate are required' }, { status: 400 });
        }
        if (!isPositiveInt(messId)) return NextResponse.json({ error: 'Invalid messId' }, { status: 400 });
        if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
        if (!isValidMonth(month)) return NextResponse.json({ error: 'month must be between 1 and 12' }, { status: 400 });
        if (!isNonNegativeNumber(monthlyRate)) return NextResponse.json({ error: 'monthlyRate must be a non-negative number' }, { status: 400 });
        if (gstPercentage != null) {
            const gst = Number(gstPercentage);
            if (!Number.isFinite(gst) || gst < 0 || gst > 100) {
                return NextResponse.json({ error: 'gstPercentage must be between 0 and 100' }, { status: 400 });
            }
        }

        const messIdNum = Number(messId);
        const sessionIdNum = Number(sessionId);
        const monthNum = Number(month);
        const rateNum = Number(monthlyRate);
        const gstNum = gstPercentage != null ? Number(gstPercentage) : 0;

        const result = await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw<[{ sp_upsert_mess_rate: number }]>`
                SELECT sp_upsert_mess_rate(${messIdNum}::int, ${sessionIdNum}::int, ${monthNum}::int, ${rateNum}::double precision, ${gstNum}::double precision)
            `;
        });

        return NextResponse.json({ id: result[0].sp_upsert_mess_rate, message: 'Mess rate saved' }, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to set mess rate' }, { status: 500 });
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
            return tx.$queryRaw`SELECT sp_delete_mess_rate(${idNum}::int)`;
        });

        return NextResponse.json({ message: 'Rate deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete rate' }, { status: 500 });
    }
}
