import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isPositiveInt, isValidName } from '@/lib/security';

export async function GET() {
    try {
        const courses = await prisma.course.findMany({ orderBy: { name: 'asc' } });
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        if (!isValidName(name)) return NextResponse.json({ error: 'A valid course name is required (max 200 chars)' }, { status: 400 });
        const course = await prisma.course.create({ data: { name: name.trim() } });
        return NextResponse.json(course, { status: 201 });
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: 'Course already exists' }, { status: 409 });
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { id } = await request.json();
        if (!isPositiveInt(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
        await prisma.course.delete({ where: { id: Number(id) } });
        return NextResponse.json({ message: 'Course deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
    }
}
