-- =============================================================
-- PostgreSQL Least-Privilege User Setup
-- Run this as the postgres superuser ONCE during server setup.
-- After this, your app connects as 'mess_app' only.
--
-- AUDITED against all API routes in src/app/api/ on 2026-04-12
-- =============================================================

-- Step 1: Create the application user (low privilege)
-- Replace 'STRONG_APP_PASSWORD_HERE' with a secure random password
CREATE USER mess_app WITH PASSWORD 'STRONG_APP_PASSWORD_HERE' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- Step 2: Create the owner user (used only for running migrations)
-- Replace 'STRONG_OWNER_PASSWORD_HERE' with a different secure password
CREATE USER mess_owner WITH PASSWORD 'STRONG_OWNER_PASSWORD_HERE' NOSUPERUSER NOCREATEDB NOCREATEROLE;

-- Step 3: Grant the owner full rights to the database
GRANT ALL PRIVILEGES ON DATABASE mess_billing TO mess_owner;

-- Step 4: Connect to the database and set ownership
\c mess_billing
GRANT ALL ON SCHEMA public TO mess_owner;
ALTER SCHEMA public OWNER TO mess_owner;

-- =============================================================
-- Step 5: Base access for mess_app
-- =============================================================
GRANT CONNECT ON DATABASE mess_billing TO mess_app;
GRANT USAGE ON SCHEMA public TO mess_app;

-- =============================================================
-- Step 6: Stored procedure execution
-- Financial tables (fees, refunds, rebates, assignments) are
-- ONLY written via stored procedures — no direct table access.
-- =============================================================
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO mess_app;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO mess_app;

-- =============================================================
-- Step 7: READ access on all tables
-- (Needed for Prisma SELECT queries, dashboard, reports, etc.)
-- =============================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO mess_app;

-- =============================================================
-- Step 8: Direct WRITE access — ONLY for config/reference tables
-- These are audited API routes that use Prisma ORM directly
-- (not stored procedures) because they manage config, not money.
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

-- Student (partial update only — password reset token + bulk permission flag)
GRANT UPDATE (password, "resetToken", "resetTokenExp", "canViewBill") ON TABLE "Student" TO mess_app;

-- =============================================================
-- Step 9: Ensure future objects created by mess_owner are
-- accessible to mess_app automatically
-- =============================================================
ALTER DEFAULT PRIVILEGES FOR ROLE mess_owner IN SCHEMA public
    GRANT SELECT ON TABLES TO mess_app;

ALTER DEFAULT PRIVILEGES FOR ROLE mess_owner IN SCHEMA public
    GRANT EXECUTE ON FUNCTIONS TO mess_app;

-- =============================================================
-- Summary of what mess_app CANNOT do:
-- ❌ DROP TABLE, ALTER TABLE, TRUNCATE, CREATE TABLE
-- ❌ Direct INSERT/UPDATE/DELETE on financial tables:
--    FeesDeposited, Refund, MonthlyRebate, MessAssignment,
--    HostelAssignment, MessRate, AuditLog
-- ❌ CREATE / DROP USER
-- ❌ Access other databases
-- ❌ Modify Student columns except password/reset/canViewBill
-- =============================================================

-- Verify the setup (run manually to check):
-- \du mess_app
-- SELECT grantee, table_name, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE grantee = 'mess_app'
--   ORDER BY table_name, privilege_type;
