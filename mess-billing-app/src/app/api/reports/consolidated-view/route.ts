import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
            return NextResponse.json([]); // Return empty if no session selected
        }

        const sessionIdNum = Number(sessionId);
        const session = await prisma.session.findUnique({ where: { id: sessionIdNum } });

        // Get distinct months from stored function
        const distinctMonths = await prisma.$queryRaw<SessionMonth[]>`
            SELECT * FROM get_session_months(${sessionIdNum}::int)
        `;

        // Get all billing data in ONE call
        const billingData = await prisma.$queryRaw<BillingRow[]>`
            SELECT * FROM calculate_session_billing(${sessionIdNum}::int)
        `;

        // Index billing data by student_id
        const billingMap = new Map<number, BillingRow[]>();
        for (const row of billingData) {
            const sid = Number(row.student_id);
            if (!billingMap.has(sid)) billingMap.set(sid, []);
            billingMap.get(sid)!.push(row);
        }

        // Fetch student metadata
        const students = await prisma.student.findMany({
            include: {
                course: true,
                hostelRef: true,
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
                id: student.id,
                'Entry No': student.entryNo,
                'Name': student.name,
            };

            if (!allowedCols || allowedCols.has('Course')) row['Course'] = student.course?.name ?? '-';
            if (!allowedCols || allowedCols.has('Batch')) row['Batch'] = student.batch ?? '-';
            if (!allowedCols || allowedCols.has('Hostel')) row['Hostel'] = student.hostelRef?.name ?? student.hostel ?? '-';
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

        // Build column list for the UI
        const baseColumns = ['Entry No', 'Name', 'Course', 'Batch', 'Hostel', 'Mess', 'Mess Security', 'Address', 'Gender', 'Mobile No', 'Name in Bank', 'JoSAA Roll No', 'Department', 'Parent Mobile No', 'Date of Joining', 'Date of Leaving', 'Left Date', 'Bank Account No', 'Bank Name', 'IFSC'];
        const columns = baseColumns.filter(c => !allowedCols || ['Entry No', 'Name'].includes(c) || allowedCols.has(c));

        for (const { month, year } of distinctMonths) {
            const label = `${MONTH_NAMES[Number(month) - 1]} ${Number(year)}`;
            if (!allowedCols || allowedCols.has('Rebate Days')) {
                columns.push(`${label} Rebate Days`);
            }
            columns.push(`${label} Amount (₹)`);
        }
        columns.push('Total Amount (₹)', 'Total Fees Deposited (₹)', 'Total Refunds (₹)', 'Net Balance (₹)');

        return NextResponse.json({ data, columns });
    } catch (error) {
        console.error('Consolidated report view error:', error);
        return NextResponse.json({ error: 'Failed to generate report schema' }, { status: 500 });
    }
}
