import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validatePasswordStrength,
  verifyPassword,
  hashPassword,
  getPasswordRequirements,
} from "@/lib/password";

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
    const { entryNo, resetKey, newPassword } = body;

    // Validate input
    if (!entryNo || !resetKey || !newPassword) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate password strength
    const validation = validatePasswordStrength(newPassword);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: "Password does not meet security requirements",
          details: validation.errors,
          requirements: getPasswordRequirements(),
        },
        { status: 400 }
      );
    }

    // Find student by entryNo
    const student = await prisma.student.findUnique({
      where: { entryNo },
    });

    if (!student || !student.resetToken || !student.resetTokenExp) {
      return NextResponse.json(
        { error: "Invalid or expired reset request. Please request a new key." },
        { status: 400 }
      );
    }

    // Check token expiry
    if (new Date() > student.resetTokenExp) {
      return NextResponse.json(
        { error: "Reset key has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Verify reset key (constant-time comparison to prevent timing attacks)
    const isValidToken = await verifyPassword(resetKey, student.resetToken);
    if (!isValidToken) {
      return NextResponse.json(
        { error: "Invalid reset key" },
        { status: 400 }
      );
    }

    // Hash new password with 13 rounds (secure)
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.student.update({
      where: { entryNo },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return NextResponse.json({
      message: "Password has been reset successfully. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    );
  }
}
