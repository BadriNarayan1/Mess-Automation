import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { withAuditUser } from '@/lib/audit';
import { isPositiveInt, isValidName } from '@/lib/security';

// POST /api/hostel-assignments — assign a student to a hostel
export async function POST(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { entryNo, hostelName } = await request.json();
        if (!entryNo || !hostelName) {
            return NextResponse.json({ error: 'entryNo and hostelName are required' }, { status: 400 });
        }
        if (!isValidName(hostelName)) return NextResponse.json({ error: 'Invalid hostel name' }, { status: 400 });

        await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw`SELECT sp_assign_hostel(${entryNo}, ${hostelName.trim()})`;
        });

        // Fetch updated student to return
        const updated = await prisma.student.findUnique({
            where: { entryNo },
            include: { hostelRef: true, course: true },
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error(error);
        const msg = error?.message?.includes('Student not found') ? error.message : 'Failed to assign hostel';
        return NextResponse.json({ error: msg }, { status: error?.message?.includes('Student not found') ? 404 : 500 });
    }
}

// DELETE /api/hostel-assignments — remove hostel assignment from a student
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const userId = (session?.user as any)?.id ?? 'unknown';

        const { studentId } = await request.json();
        if (!isPositiveInt(studentId)) return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 });
        const studentIdNum = Number(studentId);

        await withAuditUser(userId, async (tx) => {
            return tx.$queryRaw`SELECT sp_remove_hostel_assignment(${studentIdNum}::int)`;
        });

        return NextResponse.json({ message: 'Hostel assignment removed' });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to remove assignment' }, { status: 500 });
    }
}
