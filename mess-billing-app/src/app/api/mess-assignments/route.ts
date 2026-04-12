import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt } from '@/lib/security';

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

        const assignments = await prisma.studentMessAssignment.findMany({
            where,
            include: {
                student: { select: { id: true, entryNo: true, name: true } },
                mess: true,
                session: true,
            },
            orderBy: { id: 'desc' }
        });
        return NextResponse.json(assignments);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch mess assignments' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { entryNo, messId, sessionId } = await request.json();
        if (!entryNo || !messId || !sessionId) {
            return NextResponse.json({ error: 'entryNo, messId and sessionId are required' }, { status: 400 });
        }
        if (!isPositiveInt(messId)) return NextResponse.json({ error: 'Invalid messId' }, { status: 400 });
        if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });

        const messIdNum = Number(messId);
        const sessionIdNum = Number(sessionId);

        const result = await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw<[{ sp_upsert_mess_assignment: number }]>`
                SELECT sp_upsert_mess_assignment(${entryNo}, ${messIdNum}::int, ${sessionIdNum}::int)
            `;
        });

        return NextResponse.json({ id: result[0].sp_upsert_mess_assignment, message: 'Mess assignment saved' }, { status: 201 });
    } catch (error: any) {
        console.error(error);
        const msg = error?.message?.includes('Student not found') ? error.message : 'Failed to create mess assignment';
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
            return tx.$queryRaw`SELECT sp_delete_mess_assignment(${idNum}::int)`;
        });

        return NextResponse.json({ message: 'Assignment deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
    }
}
