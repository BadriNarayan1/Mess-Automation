import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { MAX_UPLOAD_SIZE, isValidExcelFile } from '@/lib/security';
import { getClientIp, uploadLimiter } from '@/lib/rate-limit';

// POST /api/upload-monthly-rebates
// Form fields: sessionId, month, year, hostelId ("any" | number), messId ("any" | number)
// Excel columns: EntryNo, StudentName, RebateDays, MessRate, GSTPercentage
//   + Mess (required when messId="any")
//   + Hostel (required when hostelId="any")
export async function POST(request: Request) {
    try {
        const rateLimitResult = uploadLimiter.check(getClientIp(request));
        if (!rateLimitResult.allowed) {
            return NextResponse.json({ error: 'Too many upload requests. Please try again later.' }, { status: 429 });
        }

        const formData = await request.formData();
        const file      = formData.get('file') as File;
        const sessionId = Number(formData.get('sessionId'));
        const month     = Number(formData.get('month'));
        const year      = Number(formData.get('year'));
        const rawMessId   = formData.get('messId')   as string | null;
        const rawHostelId = formData.get('hostelId') as string | null;

        const anyMess   = rawMessId   === 'any' || !rawMessId;
        const anyHostel = rawHostelId === 'any' || !rawHostelId;
        const formMessId   = anyMess   ? null : Number(rawMessId);
        const formHostelId = anyHostel ? null : Number(rawHostelId);

        if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        if (file.size > MAX_UPLOAD_SIZE) return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
        if (!isValidExcelFile(file)) return NextResponse.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' }, { status: 400 });
        if (!sessionId || !month || !year)
            return NextResponse.json({ error: 'sessionId, month, and year are required' }, { status: 400 });
        if (month < 1 || month > 12)
            return NextResponse.json({ error: 'month must be between 1 and 12' }, { status: 400 });

        const buffer   = new Uint8Array(await file.arrayBuffer());
        const workbook = XLSX.read(buffer, { type: 'array' });
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]) as any[];

        let success = 0;
        const errors: string[] = [];

        for (const row of jsonData) {
            const entryNo    = String(row.EntryNo ?? '').trim();
            const rebateDays = Number(row.RebateDays);
            const messRate   = row.MessRate != null ? Number(row.MessRate) : null;
            const gstPct     = row.GSTPercentage != null ? Number(row.GSTPercentage) : null;

            if (!entryNo || isNaN(rebateDays)) {
                errors.push(`Row missing or invalid: ${JSON.stringify(row)}`);
                continue;
            }

            const messName   = anyMess ? String(row.Mess ?? '').trim() : null;
            const hostelName = anyHostel ? String(row.Hostel ?? '').trim() : null;

            if (anyMess && !messName) {
                errors.push(`${entryNo}: Mess column missing (required when "Any Mess" selected)`);
                continue;
            }
            if (anyHostel && !hostelName) {
                errors.push(`${entryNo}: Hostel column missing (required when "Any Hostel" selected)`);
                continue;
            }

            try {
                // Single DB call via stored procedure
                const result = await prisma.$queryRaw<[{ bulk_upsert_monthly_rebate: string }]>`
                    SELECT bulk_upsert_monthly_rebate(
                        ${entryNo}::text,
                        ${sessionId}::int,
                        ${month}::int,
                        ${year}::int,
                        ${rebateDays}::int,
                        ${messName ?? null}::text,
                        ${hostelName ?? null}::text,
                        ${messRate ?? null}::double precision,
                        ${gstPct ?? null}::double precision,
                        ${formMessId ?? null}::int,
                        ${formHostelId ?? null}::int
                    )
                `;

                const msg = result[0]?.bulk_upsert_monthly_rebate;
                if (msg === 'ok') {
                    success++;
                } else {
                    errors.push(msg ?? `Unknown error for ${entryNo}`);
                }
            } catch (err: any) {
                console.error(`Error processing ${entryNo}:`, err.message);
                errors.push(`${entryNo}: ${err.message}`);
            }
        }

        return NextResponse.json({ message: `Processed ${success} rebate entries`, errors }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
    }
}
