import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { forgotPasswordLimiter } from "@/lib/rate-limit";
import { isValidEntryNo } from "@/lib/security";

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }
    const { entryNo } = body;
    const normalizedEntryNo = typeof entryNo === "string" ? entryNo.trim().toUpperCase() : "";

    if (!normalizedEntryNo || !isValidEntryNo(normalizedEntryNo)) {
      return NextResponse.json(
        { error: "Valid entry number is required" },
        { status: 400 }
      );
    }

    // Rate limit: 3 attempts per entry number per hour
    const rateLimitResult = forgotPasswordLimiter.check(normalizedEntryNo);
    if (!rateLimitResult.allowed) {
      const retryAfterSecs = Math.ceil(rateLimitResult.retryAfterMs / 1000);
      return NextResponse.json(
        { error: `Too many reset requests. Please try again in ${retryAfterSecs} seconds.` },
        { status: 429 }
      );
    }

    // Always return the same success response whether student exists or not
    // This prevents entry number enumeration attacks
    const genericResponse = {
      message: "If this entry number is registered, a reset key has been sent to the registered email address.",
    };

    const student = await prisma.student.findUnique({
      where: { entryNo: normalizedEntryNo },
    });

    if (!student || !student.email) {
      // Student doesn't exist or has no email — return same response (no 404 leak)
      return NextResponse.json(genericResponse);
    }

    // Generate random 8-character alphanumeric reset key
    const resetKey = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 8);
    const hashedToken = await bcrypt.hash(resetKey, 10);
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await prisma.student.update({
      where: { entryNo: normalizedEntryNo },
      data: {
        resetToken: hashedToken,
        resetTokenExp: expiry,
      },
    });

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: student.email,
      subject: "Password Reset Key - Mess Portal",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <p style="font-size: 16px; color: #334155;">Hello,</p>
          <p style="font-size: 16px; color: #334155;">The password reset key is: <strong style="font-size: 20px; letter-spacing: 2px; color: #4f46e5;">${resetKey}</strong></p>
          <p style="font-size: 14px; color: #64748b;">This key will expire in 30 minutes.</p>
          <p style="font-size: 14px; color: #64748b;">Please contact the academic section if you did not initiate this request.</p>
          <br/>
          <p style="font-size: 14px; color: #334155;">Thanks,<br/><strong>AIMS</strong></p>
        </div>
      `,
    });

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to process request. Please try again." },
      { status: 500 }
    );
  }
}
