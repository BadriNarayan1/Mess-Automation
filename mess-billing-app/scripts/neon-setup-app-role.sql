-- =============================================================
-- Neon Database: mess_app Role Grant Script
--
-- HOW TO RUN:
--   1. Create the 'mess_app' role in Neon Dashboard → Roles
--   2. Open Neon SQL Editor (connected as neondb_owner)
--   3. Paste and run this entire file
--
-- AUDITED against all API routes in src/app/api/ on 2026-04-12
-- =============================================================

-- =============================================================
-- Base access
-- =============================================================
GRANT CONNECT ON DATABASE neondb TO mess_app;
GRANT USAGE ON SCHEMA public TO mess_app;

-- =============================================================
-- Stored procedure execution
-- Financial tables are ONLY written via stored procedures.
-- mess_app never gets direct INSERT/UPDATE/DELETE on these.
-- =============================================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mess_app;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO mess_app;

-- =============================================================
-- READ access on all tables
-- Needed for Prisma SELECT queries: dashboard, reports, etc.
-- =============================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mess_app;

-- =============================================================
-- Direct WRITE access — config/reference tables ONLY
-- These use Prisma ORM directly because they manage config,
-- not money. Identified by auditing all API route files.
-- =============================================================

-- Sessions (admin: create, edit, delete academic sessions)
GRANT INSERT, UPDATE, DELETE ON TABLE "Session" TO mess_app;
GRANT USAGE, SELECT ON SEQUENCE "Session_id_seq" TO mess_app;

-- Mess (admin: add/remove mess options)
GRANT INSERT, DELETE ON TABLE "Mess" TO mess_app;
GRANT USAGE, SELECT ON SEQUENCE "Mess_id_seq" TO mess_app;

-- Hostel (admin: upsert hostel records)
GRANT INSERT, UPDATE ON TABLE "Hostel" TO mess_app;
GRANT USAGE, SELECT ON SEQUENCE "Hostel_id_seq" TO mess_app;

-- Course (admin: add/remove course options)
GRANT INSERT, DELETE ON TABLE "Course" TO mess_app;
GRANT USAGE, SELECT ON SEQUENCE "Course_id_seq" TO mess_app;

-- Student (column-level — password reset + permission flag only)
GRANT UPDATE (password, "resetToken", "resetTokenExp", "isBankEditable") ON TABLE "Student" TO mess_app;

-- =============================================================
-- Ensure future tables created by owner are also readable
-- (Run this again after any migration that adds new tables)
-- =============================================================
ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT SELECT ON TABLES TO mess_app;

ALTER DEFAULT PRIVILEGES FOR ROLE neondb_owner IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO mess_app;

-- =============================================================
-- Verify (run separately to check what was granted)
-- =============================================================
-- SELECT table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE grantee = 'mess_app'
--   ORDER BY table_name, privilege_type;
