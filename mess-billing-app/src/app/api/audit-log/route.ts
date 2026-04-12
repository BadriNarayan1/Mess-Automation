import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPositiveInt } from '@/lib/security';

// GET /api/audit-log — paginated audit log with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page') || '1'));
        const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || '50')));
        const tableName = searchParams.get('table') || undefined;
        const operation = searchParams.get('operation') || undefined;
        const recordId = searchParams.get('recordId') || undefined;
        const changedBy = searchParams.get('changedBy') || undefined;

        const where: any = {};
        if (tableName) where.tableName = tableName;
        if (operation) where.operation = operation;
        if (recordId && isPositiveInt(Number(recordId))) where.recordId = Number(recordId);
        if (changedBy) where.changedBy = changedBy;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { changedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Audit log error:', error);
        return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 });
    }
}
