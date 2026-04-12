import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { isPositiveInt } from '@/lib/security';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

interface BillRow {
    mess_name: string;
    session_name: string;
    month: number;
    year: number;
    days_in_month: number;
    rebate_days: number;
    chargeable_days: number;
    daily_rate: number;
    gst_percentage: number;
    amount: number;
    total_amount: number;
    total_fees_deposited: number;
    total_refunds: number;
    net_balance: number;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const sessionId = searchParams.get('sessionId');

        if (!studentId || !sessionId) {
            return NextResponse.json({ error: 'studentId and sessionId are required' }, { status: 400 });
        }
        if (!isPositiveInt(Number(studentId))) return NextResponse.json({ error: 'Invalid studentId' }, { status: 400 });
        if (!isPositiveInt(Number(sessionId))) return NextResponse.json({ error: 'Invalid sessionId' }, { status: 400 });

        const session = await auth();
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;

        // Students can only access their own billing
        if (userRole === 'student' && String(userId) !== String(studentId)) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const studentIdNum = Number(studentId);
        const sessionIdNum = Number(sessionId);

        // Call the stored function instead of computing in TypeScript
        const rows = await prisma.$queryRaw<BillRow[]>`
            SELECT * FROM get_student_bill_summary(${studentIdNum}::int, ${sessionIdNum}::int)
        `;

        if (!rows || rows.length === 0) {
            return NextResponse.json({
                messName: 'Not Assigned',
                sessionName: '',
                bills: [],
                totalAmount: 0,
            });
        }

        const bills = rows.map(r => ({
            month: MONTH_NAMES[Number(r.month) - 1],
            year: Number(r.year),
            daysInMonth: Number(r.days_in_month),
            rebateDays: Number(r.rebate_days),
            chargeableDays: Number(r.chargeable_days),
            dailyRate: Number(r.daily_rate),
            gst: Number(r.gst_percentage),
            amount: parseFloat(Number(r.amount).toFixed(2)),
        }));

        return NextResponse.json({
            messName: rows[0].mess_name ?? 'Not Assigned',
            sessionName: rows[0].session_name,
            bills,
            totalAmount: parseFloat(Number(rows[0].total_amount).toFixed(2)),
        });
    } catch (error) {
        console.error('Student billing error:', error);
        return NextResponse.json({ error: 'Failed to compute billing' }, { status: 500 });
    }
}
