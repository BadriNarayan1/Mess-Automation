import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface BillingRow {
    student_id: number;
    month: number;
    year: number;
    days_in_month: number;
    rebate_days: number;
    chargeable_days: number;
    daily_rate: number;
    gst_percentage: number;
    amount: number;
}

interface SessionMonth {
    month: number;
    year: number;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get('sessionId');
        const colsParam = searchParams.get('cols');
        const allowedCols = colsParam ? new Set(colsParam.split(',')) : null;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        const sessionIdNum = Number(sessionId);
        const session = await prisma.session.findUnique({ where: { id: sessionIdNum } });

        // Get distinct months from the stored function
        const distinctMonths = await prisma.$queryRaw<SessionMonth[]>`
            SELECT * FROM get_session_months(${sessionIdNum}::int)
        `;

        // Get all billing data in ONE call via the stored function
        const billingData = await prisma.$queryRaw<BillingRow[]>`
            SELECT * FROM calculate_session_billing(${sessionIdNum}::int)
        `;

        // Index billing data by student_id for fast lookup
        const billingMap = new Map<number, BillingRow[]>();
        for (const row of billingData) {
            const sid = Number(row.student_id);
            if (!billingMap.has(sid)) billingMap.set(sid, []);
            billingMap.get(sid)!.push(row);
        }

        // Fetch student metadata (still via Prisma — this is presentation data)
        const students = await prisma.student.findMany({
            include: {
                course: true,
                messAssignments: {
                    where: { sessionId: sessionIdNum },
                    include: { mess: true },
                },
                feesDeposited: {
                    where: { sessionId: sessionIdNum },
                },
                refunds: {
                    where: { sessionId: sessionIdNum },
                },
                leftRecords: {
                    where: { sessionId: sessionIdNum },
                },
            },
            orderBy: { entryNo: 'asc' },
        });

        const data = students.map((student) => {
            const assignment = student.messAssignments[0];
            const totalFees = student.feesDeposited.reduce((sum, f) => sum + f.amount, 0);
            const totalRefunds = student.refunds.reduce((sum, r) => sum + r.amount, 0);

            const row: any = {
                'Entry No': student.entryNo,
                'Name': student.name,
            };

            if (!allowedCols || allowedCols.has('Course')) row['Course'] = student.course?.name ?? '-';
            if (!allowedCols || allowedCols.has('Batch')) row['Batch'] = student.batch ?? '-';
            if (!allowedCols || allowedCols.has('Hostel')) row['Hostel'] = student.hostel ?? '-';
            if (!allowedCols || allowedCols.has('Mess')) row['Mess'] = assignment?.mess?.name ?? '-';
            if (!allowedCols || allowedCols.has('Mess Security')) row['Mess Security'] = student.messSecurity;
            if (!allowedCols || allowedCols.has('Address')) row['Address'] = student.address ?? '-';
            if (!allowedCols || allowedCols.has('Gender')) row['Gender'] = student.gender ?? '-';
            if (!allowedCols || allowedCols.has('Mobile No')) row['Mobile No'] = student.mobileNo ?? '-';
            if (!allowedCols || allowedCols.has('Name in Bank')) row['Name in Bank'] = student.nameInBank ?? '-';
            if (!allowedCols || allowedCols.has('JoSAA Roll No')) row['JoSAA Roll No'] = student.josaaRollNo ?? '-';
            if (!allowedCols || allowedCols.has('Department')) row['Department'] = student.department ?? '-';
            if (!allowedCols || allowedCols.has('Parent Mobile No')) row['Parent Mobile No'] = student.parentMobileNo ?? '-';
            if (!allowedCols || allowedCols.has('Date of Joining')) row['Date of Joining'] = student.dateOfJoining ? new Date(student.dateOfJoining).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Date of Leaving')) row['Date of Leaving'] = student.dateOfLeaving ? new Date(student.dateOfLeaving).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Left Date')) row['Left Date'] = student.leftRecords?.[0]?.leaveDate ? new Date(student.leftRecords[0].leaveDate).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Bank Account No')) row['Bank Account No'] = student.bankAccountNo ?? '-';
            if (!allowedCols || allowedCols.has('Bank Name')) row['Bank Name'] = student.bankName ?? '-';
            if (!allowedCols || allowedCols.has('IFSC')) row['IFSC'] = student.ifsc ?? '-';

            let totalAmount = 0;
            const studentBilling = billingMap.get(student.id) ?? [];

            for (const { month, year } of distinctMonths) {
                const m = Number(month);
                const y = Number(year);
                const bill = studentBilling.find(b => Number(b.month) === m && Number(b.year) === y);
                const rebateDays = bill ? Number(bill.rebate_days) : 0;
                const amount = bill ? Number(bill.amount) : 0;
                totalAmount += amount;

                const label = `${MONTH_NAMES[m - 1]} ${y}`;
                if (!allowedCols || allowedCols.has('Rebate Days')) {
                    row[`${label} Rebate Days`] = rebateDays;
                }
                row[`${label} Amount (₹)`] = parseFloat(amount.toFixed(2));
            }

            row['Total Amount (₹)'] = parseFloat(totalAmount.toFixed(2));
            row['Total Fees Deposited (₹)'] = parseFloat(totalFees.toFixed(2));
            row['Total Refunds (₹)'] = parseFloat(totalRefunds.toFixed(2));
            row['Net Balance (₹)'] = parseFloat((totalFees - (totalAmount + totalRefunds)).toFixed(2));
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, `${session?.name ?? 'Session'}`);
        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="consolidated_${session?.name ?? sessionId}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        console.error('Consolidated report error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
