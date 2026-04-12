import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidName } from '@/lib/security';

// GET /api/hostels — list all hostels
export async function GET(request: Request) {
    try {
        const hostels = await prisma.hostel.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(hostels);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to fetch hostels' }, { status: 500 });
    }
}

// POST /api/hostels — create a hostel by name (upsert)
export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!isValidName(name)) return NextResponse.json({ error: 'A valid hostel name is required (max 200 chars)' }, { status: 400 });
        const hostel = await prisma.hostel.upsert({
            where: { name: name.trim() },
            update: {},
            create: { name: name.trim() },
        });
        return NextResponse.json(hostel, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to create hostel' }, { status: 500 });
    }
}
