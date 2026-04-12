import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPositiveInt, isValidName } from '@/lib/security';

export async function GET() {
    try {
        const messes = await prisma.mess.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(messes);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch messes' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!isValidName(name)) return NextResponse.json({ error: 'A valid mess name is required (max 200 chars)' }, { status: 400 });
        const mess = await prisma.mess.create({ data: { name: name.trim() } });
        return NextResponse.json(mess, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Mess already exists' }, { status: 409 });
        return NextResponse.json({ error: 'Failed to create mess' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        await prisma.mess.delete({ where: { id: Number(id) } });
        return NextResponse.json({ message: 'Mess deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete mess' }, { status: 500 });
    }
}
