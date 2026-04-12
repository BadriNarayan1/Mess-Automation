-- Complete Audit Trail
-- Adds changed_by tracking, 4 missing table triggers, login audit logging,
-- and a retention policy cleanup function.

-- ============================================================
-- 1. Add changed_by column to AuditLog
-- ============================================================
ALTER TABLE "AuditLog" ADD COLUMN IF NOT EXISTS changed_by TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_by ON "AuditLog"(changed_by);


-- ============================================================
-- 2. Update audit_trigger_func() to capture who made the change
--    Reads from SET LOCAL "app.audit_user" (set by the app layer)
-- ============================================================
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_user TEXT;
BEGIN
    v_user := current_setting('app.audit_user', true);
    IF TG_OP = 'INSERT' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, new_data, changed_by)
        VALUES (TG_TABLE_NAME, 'INSERT', NEW.id, to_jsonb(NEW), v_user);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, old_data, new_data, changed_by)
        VALUES (TG_TABLE_NAME, 'UPDATE', NEW.id, to_jsonb(OLD), to_jsonb(NEW), v_user);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO "AuditLog" (table_name, operation, record_id, old_data, changed_by)
        VALUES (TG_TABLE_NAME, 'DELETE', OLD.id, to_jsonb(OLD), v_user);
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. Add missing audit triggers on Session, Course, Hostel, Mess
-- ============================================================
DROP TRIGGER IF EXISTS audit_session ON "Session";
CREATE TRIGGER audit_session
    AFTER INSERT OR UPDATE OR DELETE ON "Session"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_course ON "Course";
CREATE TRIGGER audit_course
    AFTER INSERT OR UPDATE OR DELETE ON "Course"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_hostel ON "Hostel";
CREATE TRIGGER audit_hostel
    AFTER INSERT OR UPDATE OR DELETE ON "Hostel"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS audit_mess ON "Mess";
CREATE TRIGGER audit_mess
    AFTER INSERT OR UPDATE OR DELETE ON "Mess"
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();


-- ============================================================
-- 4. Login audit logging function
-- ============================================================
CREATE OR REPLACE FUNCTION log_login_attempt(
    p_user_id TEXT,
    p_username TEXT,
    p_success BOOLEAN,
    p_ip TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO "AuditLog" (table_name, operation, new_data, changed_by)
    VALUES (
        '_auth',
        CASE WHEN p_success THEN 'LOGIN_SUCCESS' ELSE 'LOGIN_FAILURE' END,
        jsonb_build_object('username', p_username, 'ip', p_ip),
        CASE WHEN p_success THEN p_user_id ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 5. Audit log retention policy cleanup function
--    Default: keep 365 days of logs
--    Usage: SELECT cleanup_old_audit_logs(365);
--    Schedule monthly via pg_cron or system crontab:
--      SELECT cron.schedule('cleanup-audit', '0 3 1 * *', $$SELECT cleanup_old_audit_logs(365)$$);
-- ============================================================
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(p_retention_days INT DEFAULT 365)
RETURNS INT AS $$
DECLARE
    v_deleted INT;
BEGIN
    DELETE FROM "AuditLog"
    WHERE changed_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_deleted = ROW_COUNT;
    RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;
