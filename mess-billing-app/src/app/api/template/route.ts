import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'student';

        let data: any[] = [];
        let filename = 'template.xlsx';

        if (type === 'student') {
            const includeBankDetails = searchParams.get('includeBankDetails') === 'true';
            filename = 'student_template.xlsx';
            const baseData = [
                {
                    EntryNo: '2023CSB1101', Name: 'Aditi Sharma', Batch: '2023', Course: 'B.Tech',
                    Hostel: 'H1', Email: 'aditi@example.com', Address: '123 Main Street, Delhi',
                    Gender: 'Female', MobileNo: '9876543210', NameInBank: 'Aditi Sharma',
                    JosaaRollNo: 'J2023001', Department: 'Computer Science', ParentMobileNo: '9988776655',
                    DateOfJoining: '2023-08-01', DateOfLeaving: '', MessSecurity: 5000,
                },
                {
                    EntryNo: '2023CSB1102', Name: 'Rahul Verma', Batch: '2023', Course: 'M.Tech',
                    Hostel: 'H2', Email: 'rahul@example.com', Address: '456 Park Ave, Mumbai',
                    Gender: 'Male', MobileNo: '8765432109', NameInBank: 'Rahul Verma',
                    JosaaRollNo: 'J2023002', Department: 'Electrical', ParentMobileNo: '8877665544',
                    DateOfJoining: '2023-08-01', DateOfLeaving: '', MessSecurity: 5000,
                }
            ];

            data = baseData.map(row => {
                if (includeBankDetails) {
                    return {
                        ...row,
                        BankAccountNo: row.EntryNo === '2023CSB1101' ? '12345678901' : '98765432109',
                        BankName: row.EntryNo === '2023CSB1101' ? 'SBI' : 'HDFC',
                        IFSC: row.EntryNo === '2023CSB1101' ? 'SBIN0001234' : 'HDFC0001234',
                    };
                }
                return row;
            });
        } else if (type === 'fees') {
            filename = 'fees_deposited_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', Amount: 5000, PaymentDate: '2026-01-15', SessionName: '2026-I' }];
        } else if (type === 'refunds') {
            filename = 'refunds_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', Amount: 1500, PaymentDate: '2026-05-20', SessionName: '2026-I' }];
        } else if (type === 'mess-assignments') {
            filename = 'mess_assignments_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', MessName: 'Satluj', SessionName: '2026-I' }];
        } else if (type === 'hostel-assignments') {
            filename = 'hostel_assignments_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', HostelName: 'Chenab', RoomNo: 'B-101', SessionName: '2026-I' }];
        } else if (type === 'monthly-rebates-base') {
            filename = 'monthly_rebates_base_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', StudentName: 'Rahul Kumar', RebateDays: 5, MessRate: 4500, GSTPercentage: 5 }];
        } else if (type === 'monthly-rebates-mess') {
            filename = 'monthly_rebates_with_mess_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', StudentName: 'Rahul Kumar', RebateDays: 5, MessRate: 4500, GSTPercentage: 5, Mess: 'Satluj' }];
        } else if (type === 'monthly-rebates-mess-hostel') {
            filename = 'monthly_rebates_with_mess_hostel_template.xlsx';
            data = [{ EntryNo: '2023CSB1101', StudentName: 'Rahul Kumar', RebateDays: 5, MessRate: 4500, GSTPercentage: 5, Mess: 'Satluj', Hostel: 'Chenab' }];
        } else {
            return NextResponse.json({ error: 'Unknown template type' }, { status: 400 });
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

        const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

        return new Response(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
    }
}
