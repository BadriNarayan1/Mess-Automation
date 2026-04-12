import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { loginLimiter, getClientIp } from "./rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.trim().toLowerCase() || "badrinarayan4445@gmail.com";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        // Rate limit login attempts by username + client IP
        const clientIp = getClientIp(request as Request);
        const rateLimitKey = `${username}:${clientIp}`;
        const rateLimitResult = loginLimiter.check(rateLimitKey);
        if (!rateLimitResult.allowed) {
          // Log rate-limited attempt
          await prisma.$queryRaw`SELECT log_login_attempt(NULL, ${username}, false)`.catch(() => {});
          return null;
        }

        const normalizedUsername = username.trim().toLowerCase();
        const isAdminAttempt = normalizedUsername === ADMIN_EMAIL || normalizedUsername === "admin";

        // Admin login (email-based; keep "admin" alias for backward compatibility)
        if (isAdminAttempt) {
          const adminHash = process.env.ADMIN_PASSWORD_HASH;
          if (!adminHash) {
            return null;
          }
          const isValid = await bcrypt.compare(password, adminHash);

          if (isValid) {
            // Log successful admin login
            await prisma.$queryRaw`SELECT log_login_attempt('admin', ${normalizedUsername}, true)`.catch(() => {});
            return {
              id: "admin",
              name: "Admin",
              email: ADMIN_EMAIL,
              role: "admin",
            };
          }
          // Log failed admin login
          await prisma.$queryRaw`SELECT log_login_attempt(NULL, ${normalizedUsername}, false)`.catch(() => {});
          return null;
        }

        // Student login — username is entry number
        const student = await prisma.student.findUnique({
          where: { entryNo: username },
        });

        if (!student || !student.password) {
          // Log failed student login
          await prisma.$queryRaw`SELECT log_login_attempt(NULL, ${username}, false)`.catch(() => {});
          return null;
        }

        const isValid = await bcrypt.compare(password, student.password);
        if (!isValid) {
          // Log failed student login
          await prisma.$queryRaw`SELECT log_login_attempt(NULL, ${username}, false)`.catch(() => {});
          return null;
        }

        // Log successful student login
        const sid = String(student.id);
        await prisma.$queryRaw`SELECT log_login_attempt(${sid}, ${username}, true)`.catch(() => {});

        return {
          id: String(student.id),
          name: student.name,
          email: student.email || "",
          role: "student",
          entryNo: student.entryNo,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      // For Google sign-in, allow whitelisted admin email or enrolled students.
      if (account?.provider === "google") {
        const userEmail = user.email?.trim().toLowerCase();
        if (!userEmail) return false;

        // Admin Google login
        if (userEmail === ADMIN_EMAIL) {
          await prisma.$queryRaw`SELECT log_login_attempt('admin', ${userEmail}, true)`.catch(() => {});
          (user as any).role = "admin";
          (user as any).id = "admin";
          (user as any).name = user.name || "Admin";
          return true;
        }

        // Student Google login
        const student = await prisma.student.findUnique({
          where: { email: userEmail },
        });
        if (!student) {
          await prisma.$queryRaw`SELECT log_login_attempt(NULL, ${userEmail}, false)`.catch(() => {});
          return false; // Reject sign-in if no student found
        }
        await prisma.$queryRaw`SELECT log_login_attempt(${String(student.id)}, ${userEmail}, true)`.catch(() => {});
        (user as any).role = "student";
        (user as any).entryNo = student.entryNo;
        (user as any).id = String(student.id);
        (user as any).name = student.name;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.entryNo = (user as any).entryNo;
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).entryNo = token.entryNo;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
});
