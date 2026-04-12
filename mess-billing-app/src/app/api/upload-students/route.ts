import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { MAX_UPLOAD_SIZE, isValidExcelFile } from '@/lib/security';
import { getClientIp, uploadLimiter } from '@/lib/rate-limit';

const parseDate = (val: any): Date | null => {
    if (!val) return null;
    if (typeof val === 'number') {
        const unixTime = (val - 25569) * 86400 * 1000;
        return new Date(unixTime);
    }
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
};

export async function POST(request: Request) {
    try {
        const rateLimitResult = uploadLimiter.check(getClientIp(request));
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Too many upload requests. Please try again later.' }, { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const includeBankDetails = formData.get('includeBankDetails') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }
        if (file.size > MAX_UPLOAD_SIZE) {
            return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        }
        if (!isValidExcelFile(file)) {
            return NextResponse.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let processed = 0;
        const errors: string[] = [];

        for (const row of jsonData as any[]) {
            const entryNoValue = row.EntryNo || row.RollNo;
            if (!entryNoValue || !row.Name) continue;

            const entryNo = String(entryNoValue);
            const hostelName = row.Hostel ? String(row.Hostel).trim() : null;
            const courseName = row.Course ? String(row.Course).trim() : null;

            try {
                // Single DB call via stored procedure
                const result = await prisma.$queryRaw<[{ bulk_upsert_student: string }]>`
                    SELECT bulk_upsert_student(
                        ${entryNo},
                        ${row.Name},
                        ${row.Batch ? String(row.Batch) : null},
                        ${hostelName},
                        ${row.Email ?? null},
                        ${row.Address ? String(row.Address) : null},
                        ${row.Gender ? String(row.Gender) : null},
                        ${row.MobileNo ? String(row.MobileNo) : null},
                        ${row.NameInBank ? String(row.NameInBank) : null},
                        ${row.JosaaRollNo ? String(row.JosaaRollNo) : null},
                        ${row.Department ? String(row.Department) : null},
                        ${row.ParentMobileNo ? String(row.ParentMobileNo) : null},
                        ${parseDate(row.DateOfJoining)}::timestamp,
                        ${parseDate(row.DateOfLeaving)}::timestamp,
                        ${row.MessSecurity ? Number(row.MessSecurity) : 0}::double precision,
                        ${courseName},
                        ${row.BankAccountNo ? String(row.BankAccountNo) : null},
                        ${row.BankName ? String(row.BankName) : null},
                        ${row.IFSC ? String(row.IFSC) : null},
                        ${includeBankDetails}
                    )
                `;

                const msg = result[0]?.bulk_upsert_student;
                if (msg === 'ok') {
                    processed++;
                } else {
                    errors.push(`${entryNo}: ${msg}`);
                }
            } catch (err) {
                errors.push(`${entryNoValue}: ${(err as any).message}`);
            }
        }

        return NextResponse.json({
            message: `Processed ${processed} students`,
            errors,
        }, { status: 200 });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
