-- Phase 3: Database Audit Trail
-- Adds automatic audit logging at the database level.
-- Captures ALL changes to sensitive tables — whether from the app,
-- a direct DB connection, or a migration script.

-- ============================================================
-- 1. Create the AuditLog table
-- ============================================================
CREATE TABLE IF NOT EXISTS "AuditLog" (
    id            SERIAL PRIMARY KEY,
    table_name    TEXT NOT NULL,
    operation     TEXT NOT NULL,  -- INSERT, UPDATE, DELETE
    record_id     INT,
    old_data      JSONB,
    new_data      JSONB,
    changed_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table ON "AuditLog"(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON "AuditLog"(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON "AuditLog"(record_id);


-- ============================================================
-- 2. Create the audit trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, new_data)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, old_data)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. Attach triggers to sensitive tables
-- ============================================================

-- Financial tables (most critical for audit)
CREATE TRIGGER audit_fees_deposited
    AFTER INSERT OR UPDATE OR DELETE ON "FeesDeposited"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_refund
    AFTER INSERT OR UPDATE OR DELETE ON "Refund"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_monthly_rebate
    AFTER INSERT OR UPDATE OR DELETE ON "MonthlyRebate"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_mess_rate
    AFTER INSERT OR UPDATE OR DELETE ON "MessRate"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Student data (sensitive PII)
CREATE TRIGGER audit_student
    AFTER INSERT OR UPDATE OR DELETE ON "Student"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Assignment changes
CREATE TRIGGER audit_mess_assignment
    AFTER INSERT OR UPDATE OR DELETE ON "StudentMessAssignment"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER audit_student_left
    AFTER INSERT OR UPDATE OR DELETE ON "StudentLeft"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
