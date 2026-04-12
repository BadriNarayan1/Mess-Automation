-- P0 Financial CRUD Stored Procedures
-- Replaces inline Prisma ORM calls for fees, refunds, rebates, and mess rates.

-- ============================================================
-- 1. sp_create_fee_payment
-- ============================================================
CREATE OR REPLACE FUNCTION sp_create_fee_payment(
    p_entry_no TEXT,
    p_session_id INT,
    p_amount double precision,
    p_payment_date TIMESTAMP
) RETURNS INT AS $$
DECLARE
    v_student_id INT;
    v_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found: %', p_entry_no;
    END IF;

    INSERT INTO "FeesDeposited" ("studentId", "sessionId", amount, "paymentDate")
    VALUES (v_student_id, p_session_id, p_amount, p_payment_date)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. sp_delete_fee_payment
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_fee_payment(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "FeesDeposited" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Fee payment not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. sp_create_refund
-- ============================================================
CREATE OR REPLACE FUNCTION sp_create_refund(
    p_entry_no TEXT,
    p_session_id INT,
    p_amount double precision,
    p_payment_date TIMESTAMP
) RETURNS INT AS $$
DECLARE
    v_student_id INT;
    v_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found: %', p_entry_no;
    END IF;

    INSERT INTO "Refund" ("studentId", "sessionId", amount, "paymentDate")
    VALUES (v_student_id, p_session_id, p_amount, p_payment_date)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 4. sp_delete_refund
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_refund(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "Refund" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Refund not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 5. sp_upsert_monthly_rebate
-- ============================================================
CREATE OR REPLACE FUNCTION sp_upsert_monthly_rebate(
    p_entry_no TEXT,
    p_session_id INT,
    p_month INT,
    p_year INT,
    p_rebate_days INT
) RETURNS INT AS $$
DECLARE
    v_student_id INT;
    v_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found: %', p_entry_no;
    END IF;

    -- Validate rebate days don't exceed days in month
    IF p_rebate_days > EXTRACT(DAY FROM
        (DATE_TRUNC('month', MAKE_DATE(p_year, p_month, 1)) + INTERVAL '1 month' - INTERVAL '1 day'))::INT THEN
        RAISE EXCEPTION 'rebateDays exceeds days in month';
    END IF;

    INSERT INTO "MonthlyRebate" ("studentId", "sessionId", month, year, "rebateDays")
    VALUES (v_student_id, p_session_id, p_month, p_year, p_rebate_days)
    ON CONFLICT ("studentId", "sessionId", month, year)
    DO UPDATE SET "rebateDays" = EXCLUDED."rebateDays"
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 6. sp_delete_monthly_rebate
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_monthly_rebate(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "MonthlyRebate" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Rebate not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 7. sp_upsert_mess_rate
-- ============================================================
CREATE OR REPLACE FUNCTION sp_upsert_mess_rate(
    p_mess_id INT,
    p_session_id INT,
    p_month INT,
    p_monthly_rate double precision,
    p_gst_percentage double precision
) RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO "MessRate" ("messId", "sessionId", month, "monthlyRate", "gstPercentage")
    VALUES (p_mess_id, p_session_id, p_month, p_monthly_rate, p_gst_percentage)
    ON CONFLICT ("messId", "sessionId", month)
    DO UPDATE SET
        "monthlyRate" = EXCLUDED."monthlyRate",
        "gstPercentage" = EXCLUDED."gstPercentage"
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 8. sp_delete_mess_rate
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_mess_rate(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "MessRate" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mess rate not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
