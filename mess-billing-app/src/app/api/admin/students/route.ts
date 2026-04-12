import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const students = await prisma.student.findMany({
            select: {
                id: true,
                entryNo: true,
                name: true,
                batch: true,
                hostel: true,
                isBankEditable: true,
                course: { select: { id: true, name: true } },
                messAssignments: {
                    include: { mess: true, session: true }
                },
            },
            orderBy: { entryNo: 'asc' }
        });
        return NextResponse.json(students);
    } catch (error) {
        console.error('Failed to fetch students:', error);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
