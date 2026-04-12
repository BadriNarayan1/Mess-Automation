import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt, isValidDate, sanitizeErrorMessage } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { studentId, sessionId, leaveDate } = await request.json();

        if (!studentId || !sessionId || !leaveDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }
        if (!isPositiveInt(studentId)) return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 });
        if (!isPositiveInt(sessionId)) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });
        if (!isValidDate(leaveDate)) return NextResponse.json({ error: 'Invalid leave date' }, { status: 400 });

        const studentIdNum = Number(studentId);
        const sessionIdNum = Number(sessionId);
        const leaveDateVal = new Date(leaveDate);

        const result = await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw<[{ sp_upsert_student_left: number }]>`
                SELECT sp_upsert_student_left(${studentIdNum}::int, ${sessionIdNum}::int, ${leaveDateVal}::timestamp)
            `;
        });

        return NextResponse.json({ id: result[0].sp_upsert_student_left, message: 'Record saved' });
    } catch (error) {
        console.error('StudentLeft error:', error);
        return NextResponse.json({ error: sanitizeErrorMessage(error, 'Failed to save') }, { status: 500 });
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
            return tx.$queryRaw`SELECT sp_delete_student_left(${idNum}::int)`;
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('StudentLeft delete error:', error);
        return NextResponse.json({ error: sanitizeErrorMessage(error, 'Failed to delete') }, { status: 500 });
    }
}
