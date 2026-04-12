import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { MAX_UPLOAD_SIZE, isValidExcelFile } from '@/lib/security';
import { getClientIp, uploadLimiter } from '@/lib/rate-limit';

// POST /api/upload-mess-assignments
// Excel columns: EntryNo, MessName, SessionName
export async function POST(request: Request) {
    try {
        const rateLimitResult = uploadLimiter.check(getClientIp(request));
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Too many upload requests. Please try again later.' }, { status: 429 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        if (file.size > MAX_UPLOAD_SIZE) return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        if (!isValidExcelFile(file)) return NextResponse.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' }, { status: 400 });

        const buffer = new Uint8Array(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];

        let success = 0;
        const errors: string[] = [];

        for (const row of jsonData) {
            const entryNo = String(row.EntryNo ?? '').trim();
            const messName = String(row.MessName ?? '').trim();
            const sessionName = String(row.SessionName ?? '').trim();

            if (!entryNo || !messName || !sessionName) {
                errors.push(`Row missing fields: ${JSON.stringify(row)}`);
                continue;
            }

            // Single DB call via stored procedure
            const result = await prisma.$queryRaw<[{ bulk_assign_mess: string }]>`
                SELECT bulk_assign_mess(${entryNo}, ${messName}, ${sessionName})
            `;

            const msg = result[0]?.bulk_assign_mess;
            if (msg === 'ok') {
                success++;
            } else {
                errors.push(msg ?? `Unknown error for ${entryNo}`);
            }
        }

        return NextResponse.json({ message: `Processed ${success} assignments`, errors }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
