import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPositiveInt, isValidYear, isValidName } from '@/lib/security';

export async function GET() {
    try {
        const sessions = await prisma.session.findMany({ orderBy: { startYear: 'desc' } });
        return NextResponse.json(sessions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, startYear, semester } = await request.json();
        if (!name || !startYear || !semester) {
            return NextResponse.json({ error: 'name, startYear and semester are required' }, { status: 400 });
        }
        if (!isValidName(name)) return NextResponse.json({ error: 'Invalid session name' }, { status: 400 });
        if (!isValidYear(startYear)) return NextResponse.json({ error: 'Invalid startYear (must be 2000-2100)' }, { status: 400 });
        if (semester !== 'I' && semester !== 'II') {
            return NextResponse.json({ error: 'semester must be "I" or "II"' }, { status: 400 });
        }

        const session = await prisma.session.create({ data: { name: name.trim(), startYear: Number(startYear), semester } });
        return NextResponse.json(session, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Session already exists' }, { status: 409 });
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        await prisma.session.delete({ where: { id: Number(id) } });
        return NextResponse.json({ message: 'Session deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, name, startYear, semester } = await request.json();
        if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        if (!name || !startYear || !semester) {
            return NextResponse.json({ error: 'name, startYear and semester are required' }, { status: 400 });
        }
        if (!isValidName(name)) return NextResponse.json({ error: 'Invalid session name' }, { status: 400 });
        if (!isValidYear(startYear)) return NextResponse.json({ error: 'Invalid startYear (must be 2000-2100)' }, { status: 400 });
        if (semester !== 'I' && semester !== 'II') {
            return NextResponse.json({ error: 'semester must be "I" or "II"' }, { status: 400 });
        }

        const session = await prisma.session.update({
            where: { id: Number(id) },
            data: { name: name.trim(), startYear: Number(startYear), semester }
        });
        return NextResponse.json(session);
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Session already exists' }, { status: 409 });
        return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
    }
}
