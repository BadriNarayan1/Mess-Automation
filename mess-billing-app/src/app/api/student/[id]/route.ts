import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { sanitizeStudent } from '@/lib/sanitize';
import { withAuditUser } from '@/lib/audit';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const session = await auth();

        let student: any;
        if (!isNaN(Number(id))) {
            student = await prisma.student.findUnique({
                where: { id: Number(id) },
                include: {
                    course: true,
                    messAssignments: { include: { mess: true, session: true } },
                    monthlyRebates: { include: { session: true }, orderBy: [{ year: 'desc' }, { month: 'desc' }] },
                    feesDeposited: { include: { session: true }, orderBy: { paymentDate: 'desc' } },
                    refunds: { include: { session: true }, orderBy: { id: 'desc' } },
                    leftRecords: { include: { session: true } },
                },
            });
        }

        if (!student) {
            student = await prisma.student.findUnique({
                where: { entryNo: id },
                include: {
                    course: true,
                    messAssignments: { include: { mess: true, session: true } },
                    monthlyRebates: { include: { session: true }, orderBy: [{ year: 'desc' }, { month: 'desc' }] },
                    feesDeposited: { include: { session: true }, orderBy: { paymentDate: 'desc' } },
                    refunds: { include: { session: true }, orderBy: { id: 'desc' } },
                    leftRecords: { include: { session: true } },
                },
            });
        }

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Student data isolation: students can only access their own data
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;
        if (userRole === 'student' && String(student.id) !== String(userId)) {
            return NextResponse.json({ error: 'Access denied. You can only view your own data.' }, { status: 403 });
        }

        return NextResponse.json(sanitizeStudent(student));
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch student' }, { status: 500 });
    }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const session = await auth();
        const body = await request.json();
        const auditUserId = (session?.user as any)?.id ?? 'unknown';

        let studentId: number | undefined;
        if (!isNaN(Number(id))) {
            studentId = Number(id);
        } else {
            const s = await prisma.student.findUnique({ where: { entryNo: id } });
            if (s) studentId = s.id;
        }

        if (!studentId) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Student data isolation: students can only modify their own data
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;
        if (userRole === 'student' && String(studentId) !== String(userId)) {
            return NextResponse.json({ error: 'Access denied. You can only modify your own data.' }, { status: 403 });
        }

        const currentStudent = await prisma.student.findUnique({ where: { id: studentId } });

        // Bank details update — via stored procedure
        if (body.bankAccountNo !== undefined) {
            if (!currentStudent?.isBankEditable) {
                return NextResponse.json({ error: 'Bank details editing is disabled' }, { status: 403 });
            }

            const bankAccountNo = body.bankAccountNo ?? null;
            const bankName = body.bankName ?? null;
            const ifsc = body.ifsc ?? null;

            await withAuditUser(auditUserId, async (tx) => {
                return tx.$queryRaw`SELECT sp_update_student_bank(${studentId!}::int, ${bankAccountNo}, ${bankName}, ${ifsc})`;
            });

            const updated = await prisma.student.findUnique({ where: { id: studentId } });
            if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            return NextResponse.json(sanitizeStudent(updated));
        }

        // isBankEditable toggle is admin-only — via stored procedure
        if (body.isBankEditable !== undefined) {
            if (userRole !== 'admin') {
                return NextResponse.json({ error: 'Only admins can change edit permissions' }, { status: 403 });
            }
            await withAuditUser(auditUserId, async (tx) => {
                return tx.$executeRaw`UPDATE "Student" SET "isBankEditable" = ${body.isBankEditable}, "updatedAt" = NOW() WHERE id = ${studentId!}`;
            });
            const updated = await prisma.student.findUnique({ where: { id: studentId } });
            if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            return NextResponse.json(sanitizeStudent(updated));
        }

        // General student profile update (address, messSecurity, courseId etc.) — admin only, via stored procedure
        if (userRole !== 'admin') {
            return NextResponse.json({ error: 'Only admins can update student profiles' }, { status: 403 });
        }

        const address = body.address ?? null;
        const messSecurity = body.messSecurity != null ? Number(body.messSecurity) : null;
        const courseId = body.courseId != null ? Number(body.courseId) : null;
        const hostel = body.hostel ?? null;
        const batch = body.batch ?? null;
        const email = body.email ?? null;

        if (address || messSecurity != null || courseId != null || hostel || batch || email) {
            await withAuditUser(auditUserId, async (tx) => {
                return tx.$queryRaw`SELECT sp_update_student_profile(
                    ${studentId!}::int,
                    ${address},
                    ${messSecurity}::double precision,
                    ${courseId}::int,
                    ${hostel},
                    ${batch},
                    ${email}
                )`;
            });
            const updated = await prisma.student.findUnique({ where: { id: studentId } });
            if (!updated) return NextResponse.json({ error: 'Student not found' }, { status: 404 });
            return NextResponse.json(sanitizeStudent(updated));
        }

        return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });

    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json({ error: 'Failed to update student' }, { status: 500 });
    }
}
