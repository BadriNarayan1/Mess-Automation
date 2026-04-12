import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

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
        const monthParam = searchParams.get('month');
        const yearParam = searchParams.get('year');
        const colsParam = searchParams.get('cols');
        const allowedCols = colsParam ? new Set(colsParam.split(',')) : null;

        if (!sessionId) {
            return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
        }

        const sessionIdNum = Number(sessionId);
        const isAllMonths = !monthParam || monthParam === 'all';
        const singleMonth = isAllMonths ? null : parseInt(monthParam!);
        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

        const session = await prisma.session.findUnique({ where: { id: sessionIdNum } });

        // Get billing data from stored function
        const billingData = await prisma.$queryRaw<BillingRow[]>`
            SELECT * FROM calculate_session_billing(${sessionIdNum}::int)
        `;

        // Get distinct months
        let months: SessionMonth[];
        if (isAllMonths) {
            const allMonths = await prisma.$queryRaw<SessionMonth[]>`
                SELECT * FROM get_session_months(${sessionIdNum}::int)
            `;
            months = allMonths.map(m => ({ month: Number(m.month), year: Number(m.year) }));
        } else {
            const y = session
                ? (session.semester === 'I'
                    ? (singleMonth! >= 7 ? session.startYear : session.startYear + 1)
                    : (singleMonth! <= 6 ? session.startYear : session.startYear - 1))
                : year;
            months = [{ month: singleMonth!, year: y }];
        }

        // Index billing by student_id
        const billingMap = new Map<number, BillingRow[]>();
        for (const row of billingData) {
            const sid = Number(row.student_id);
            if (!billingMap.has(sid)) billingMap.set(sid, []);
            billingMap.get(sid)!.push(row);
        }

        // Fetch assignments with student data
        const assignments = await prisma.studentMessAssignment.findMany({
            where: { sessionId: sessionIdNum },
            include: {
                student: {
                    include: {
                        course: true,
                        feesDeposited: { where: { sessionId: sessionIdNum } },
                        refunds: { where: { sessionId: sessionIdNum } },
                        leftRecords: { where: { sessionId: sessionIdNum } },
                    },
                },
                mess: true,
                session: true,
            },
        });

        // Group by mess
        const messGrouping: Record<string, { totalAmount: number; students: any[] }> = {};

        assignments.forEach((a) => {
            const messName = a.mess.name;
            if (!messGrouping[messName]) {
                messGrouping[messName] = { totalAmount: 0, students: [] };
            }

            const student = a.student;
            const totalFees = student.feesDeposited.reduce((sum, f) => sum + f.amount, 0);
            const totalRefunds = student.refunds.reduce((sum, r) => sum + r.amount, 0);
            let totalAmount = 0;

            const monthBreakdown: any = {};
            const studentBilling = billingMap.get(student.id) ?? [];

            for (const { month, year: y } of months) {
                const bill = studentBilling.find(b => Number(b.month) === month && Number(b.year) === y);
                const rebateDays = bill ? Number(bill.rebate_days) : 0;
                const amount = bill ? Number(bill.amount) : 0;
                totalAmount += amount;

                const label = `${MONTH_NAMES[month - 1].substring(0, 3)} ${y}`;
                if (!allowedCols || allowedCols.has('Rebate Days')) {
                    monthBreakdown[`${label} Rebate`] = rebateDays;
                }
                monthBreakdown[`${label} Amount`] = parseFloat(amount.toFixed(2));
            }

            messGrouping[messName].totalAmount += totalAmount;
            const row: any = {
                'Entry No': student.entryNo,
                'Name': student.name,
            };

            if (!allowedCols || allowedCols.has('Gender')) row['Gender'] = student.gender ?? '-';
            if (!allowedCols || allowedCols.has('Mobile No')) row['Mobile No'] = student.mobileNo ?? '-';
            if (!allowedCols || allowedCols.has('Name in Bank')) row['Name in Bank'] = student.nameInBank ?? '-';
            if (!allowedCols || allowedCols.has('JoSAA Roll No')) row['JoSAA Roll No'] = student.josaaRollNo ?? '-';
            if (!allowedCols || allowedCols.has('Department')) row['Department'] = student.department ?? '-';
            if (!allowedCols || allowedCols.has('Parent Mobile No')) row['Parent Mobile No'] = student.parentMobileNo ?? '-';
            if (!allowedCols || allowedCols.has('Date of Joining')) row['Date of Joining'] = student.dateOfJoining ? new Date(student.dateOfJoining).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Date of Leaving')) row['Date of Leaving'] = student.dateOfLeaving ? new Date(student.dateOfLeaving).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Left Date')) row['Left Date'] = student.leftRecords?.[0]?.leaveDate ? new Date(student.leftRecords[0].leaveDate).toLocaleDateString('en-GB') : '-';
            if (!allowedCols || allowedCols.has('Course')) row['Course'] = student.course?.name ?? '-';
            if (!allowedCols || allowedCols.has('Batch')) row['Batch'] = student.batch ?? '-';
            if (!allowedCols || allowedCols.has('Hostel')) row['Hostel'] = student.hostel ?? '-';

            row['Session'] = a.session.name;
            Object.assign(row, monthBreakdown);
            row['Total Amount (₹)'] = parseFloat(totalAmount.toFixed(2));
            row['Total Fees Deposited (₹)'] = parseFloat(totalFees.toFixed(2));
            row['Total Refunds (₹)'] = parseFloat(totalRefunds.toFixed(2));
            row['Net Balance (₹)'] = parseFloat((totalFees - (totalAmount + totalRefunds)).toFixed(2));

            messGrouping[messName].students.push(row);
        });

        const workbook = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = Object.keys(messGrouping).map((mess) => ({
            Mess: mess,
            'Student Count': messGrouping[mess].students.length,
            'Total Amount (₹)': parseFloat(messGrouping[mess].totalAmount.toFixed(2)),
        }));
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryData), 'Summary');

        // Per-mess sheets
        Object.keys(messGrouping).forEach((mess) => {
            XLSX.utils.book_append_sheet(
                workbook,
                XLSX.utils.json_to_sheet(messGrouping[mess].students),
                mess.substring(0, 31)
            );
        });

        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        const label = isAllMonths ? 'all_months' : `${MONTH_NAMES[singleMonth! - 1]}_${year}`;

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="mess_wise_report_${label}.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        console.error('Hostel-wise report error:', error);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
