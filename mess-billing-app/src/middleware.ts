import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Admin-only API routes — require role === "admin"
const ADMIN_ONLY_API_PREFIXES = [
  // Upload endpoints
  "/api/upload-students",
  "/api/upload-fees",
  "/api/upload-mess-assignments",
  "/api/upload-hostel-assignments",
  "/api/upload-monthly-rebates",
  "/api/upload-refunds",
  // Admin management
  "/api/admin",
  "/api/audit-log",
  // Reports
  "/api/reports",
  // Bulk data endpoints (students shouldn't see all records)
  "/api/students",
  "/api/courses",
  "/api/fees-deposited",
  "/api/hostel-assignments",
  "/api/hostels",
  "/api/mess",
  "/api/messes",
  "/api/mess-assignments",
  "/api/mess-rates",
  "/api/monthly-rebates",
  "/api/refunds",
  "/api/template",
  // Deprecated
  "/api/bill",
  "/api/rebate",
];

// Student-accessible API routes — require any authenticated session
// Student data isolation is enforced within the route handler itself
const STUDENT_ACCESSIBLE_API_PREFIXES = [
  "/api/student/", // /api/student/{id} — own data only (enforced in handler)
  "/api/sessions", // needed for session dropdown on student dashboard
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Public routes — don't protect
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  // Login page: redirect logged-in users to their dashboard
  if (pathname === "/") {
    if (session) {
      const role = (session.user as any)?.role;
      if (role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (role === "student") {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
    }
    return NextResponse.next();
  }

  // ── API Route Protection ──

  if (pathname.startsWith("/api/")) {
    // Admin-only APIs
    if (ADMIN_ONLY_API_PREFIXES.some((p) => pathname.startsWith(p))) {
      if (!session || (session.user as any)?.role !== "admin") {
        return NextResponse.json(
          { error: "Unauthorized. Admin access required." },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Student-accessible APIs (any authenticated user)
    if (STUDENT_ACCESSIBLE_API_PREFIXES.some((p) => pathname.startsWith(p))) {
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in." },
          { status: 401 }
        );
      }
      return NextResponse.next();
    }

    // Any other unlisted API — require admin by default (secure by default)
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // ── Page Route Protection ──

  if (pathname.startsWith("/admin")) {
    if (!session || (session.user as any)?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/student")) {
    if (!session || (session.user as any)?.role !== "student") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
