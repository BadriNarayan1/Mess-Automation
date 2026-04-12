-- Phase 2: Bulk Upload Stored Procedures
-- Fixed: All INSERTs/UPDATEs include "updatedAt" for Mess and Student tables.

-- ============================================================
-- 1. bulk_upsert_monthly_rebate
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_upsert_monthly_rebate(
    p_entry_no TEXT,
    p_session_id INT,
    p_month INT,
    p_year INT,
    p_rebate_days INT,
    p_mess_name TEXT DEFAULT NULL,
    p_hostel_name TEXT DEFAULT NULL,
    p_mess_rate double precision DEFAULT NULL,
    p_gst_pct double precision DEFAULT NULL,
    p_form_mess_id INT DEFAULT NULL,
    p_form_hostel_id INT DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
    v_student_id INT;
    v_mess_id INT;
    v_hostel_id INT;
    v_hostel_display TEXT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN RETURN 'Student not found: ' || p_entry_no; END IF;

    -- Resolve mess
    v_mess_id := p_form_mess_id;
    IF v_mess_id IS NULL AND p_mess_name IS NOT NULL AND p_mess_name != '' THEN
        INSERT INTO "Mess" (name, "updatedAt") VALUES (p_mess_name, NOW())
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
        RETURNING id INTO v_mess_id;
    END IF;

    -- Resolve hostel
    v_hostel_id := p_form_hostel_id;
    IF p_hostel_name IS NOT NULL AND p_hostel_name != '' THEN
        INSERT INTO "Hostel" (name) VALUES (p_hostel_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_hostel_id;
        v_hostel_display := p_hostel_name;
    ELSIF p_form_hostel_id IS NOT NULL THEN
        SELECT name INTO v_hostel_display FROM "Hostel" WHERE id = p_form_hostel_id;
    END IF;

    -- Update student hostel if resolved
    IF v_hostel_id IS NOT NULL THEN
        UPDATE "Student" SET "hostelId" = v_hostel_id, hostel = v_hostel_display, "updatedAt" = NOW() WHERE id = v_student_id;
    END IF;

    -- Upsert MonthlyRebate
    INSERT INTO "MonthlyRebate" ("studentId", "sessionId", month, year, "rebateDays")
    VALUES (v_student_id, p_session_id, p_month, p_year, p_rebate_days)
    ON CONFLICT ("studentId", "sessionId", month, year) DO UPDATE SET "rebateDays" = EXCLUDED."rebateDays";

    -- Upsert StudentMessAssignment
    IF v_mess_id IS NOT NULL THEN
        INSERT INTO "StudentMessAssignment" ("studentId", "messId", "sessionId")
        VALUES (v_student_id, v_mess_id, p_session_id)
        ON CONFLICT ("studentId", "sessionId") DO UPDATE SET "messId" = EXCLUDED."messId";
    END IF;

    -- Upsert MessRate if provided
    IF v_mess_id IS NOT NULL AND (p_mess_rate IS NOT NULL OR p_gst_pct IS NOT NULL) THEN
        INSERT INTO "MessRate" ("messId", "sessionId", month, "monthlyRate", "gstPercentage")
        VALUES (v_mess_id, p_session_id, p_month, COALESCE(p_mess_rate, 0), COALESCE(p_gst_pct, 0))
        ON CONFLICT ("messId", "sessionId", month) DO UPDATE SET
            "monthlyRate" = CASE WHEN p_mess_rate IS NOT NULL THEN p_mess_rate ELSE "MessRate"."monthlyRate" END,
            "gstPercentage" = CASE WHEN p_gst_pct IS NOT NULL THEN p_gst_pct ELSE "MessRate"."gstPercentage" END;
    END IF;

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. bulk_upsert_student
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_upsert_student(
    p_entry_no TEXT,
    p_name TEXT,
    p_batch TEXT DEFAULT NULL,
    p_hostel_name TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL,
    p_address TEXT DEFAULT NULL,
    p_gender TEXT DEFAULT NULL,
    p_mobile_no TEXT DEFAULT NULL,
    p_name_in_bank TEXT DEFAULT NULL,
    p_josaa_roll_no TEXT DEFAULT NULL,
    p_department TEXT DEFAULT NULL,
    p_parent_mobile_no TEXT DEFAULT NULL,
    p_date_of_joining TIMESTAMP DEFAULT NULL,
    p_date_of_leaving TIMESTAMP DEFAULT NULL,
    p_mess_security double precision DEFAULT 0,
    p_course_name TEXT DEFAULT NULL,
    p_bank_account_no TEXT DEFAULT NULL,
    p_bank_name TEXT DEFAULT NULL,
    p_ifsc TEXT DEFAULT NULL,
    p_include_bank BOOLEAN DEFAULT FALSE
) RETURNS TEXT AS $$
DECLARE
    v_course_id INT;
    v_hostel_id INT;
BEGIN
    -- Resolve course
    IF p_course_name IS NOT NULL AND p_course_name != '' THEN
        INSERT INTO "Course" (name) VALUES (p_course_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_course_id;
    END IF;

    -- Resolve hostel
    IF p_hostel_name IS NOT NULL AND p_hostel_name != '' THEN
        INSERT INTO "Hostel" (name) VALUES (p_hostel_name)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_hostel_id;
    END IF;

    -- Upsert student (include updatedAt since it's NOT NULL with no default)
    INSERT INTO "Student" (
        "entryNo", name, batch, hostel, "hostelId", email, address,
        gender, "mobileNo", "nameInBank", "josaaRollNo", department,
        "parentMobileNo", "dateOfJoining", "dateOfLeaving", "messSecurity",
        "courseId", "bankAccountNo", "bankName", ifsc, "updatedAt"
    ) VALUES (
        p_entry_no, p_name, p_batch, p_hostel_name, v_hostel_id, p_email, p_address,
        p_gender, p_mobile_no, p_name_in_bank, p_josaa_roll_no, p_department,
        p_parent_mobile_no, p_date_of_joining, p_date_of_leaving, COALESCE(p_mess_security, 0),
        v_course_id,
        CASE WHEN p_include_bank THEN p_bank_account_no END,
        CASE WHEN p_include_bank THEN p_bank_name END,
        CASE WHEN p_include_bank THEN p_ifsc END,
        NOW()
    )
    ON CONFLICT ("entryNo") DO UPDATE SET
        name = EXCLUDED.name,
        "updatedAt" = NOW(),
        batch = COALESCE(EXCLUDED.batch, "Student".batch),
        hostel = COALESCE(EXCLUDED.hostel, "Student".hostel),
        "hostelId" = COALESCE(EXCLUDED."hostelId", "Student"."hostelId"),
        email = COALESCE(EXCLUDED.email, "Student".email),
        address = COALESCE(EXCLUDED.address, "Student".address),
        gender = COALESCE(EXCLUDED.gender, "Student".gender),
        "mobileNo" = COALESCE(EXCLUDED."mobileNo", "Student"."mobileNo"),
        "nameInBank" = COALESCE(EXCLUDED."nameInBank", "Student"."nameInBank"),
        "josaaRollNo" = COALESCE(EXCLUDED."josaaRollNo", "Student"."josaaRollNo"),
        department = COALESCE(EXCLUDED.department, "Student".department),
        "parentMobileNo" = COALESCE(EXCLUDED."parentMobileNo", "Student"."parentMobileNo"),
        "dateOfJoining" = COALESCE(EXCLUDED."dateOfJoining", "Student"."dateOfJoining"),
        "dateOfLeaving" = COALESCE(EXCLUDED."dateOfLeaving", "Student"."dateOfLeaving"),
        "messSecurity" = CASE WHEN EXCLUDED."messSecurity" != 0 THEN EXCLUDED."messSecurity" ELSE "Student"."messSecurity" END,
        "courseId" = COALESCE(EXCLUDED."courseId", "Student"."courseId"),
        "bankAccountNo" = CASE WHEN p_include_bank THEN COALESCE(EXCLUDED."bankAccountNo", "Student"."bankAccountNo") ELSE "Student"."bankAccountNo" END,
        "bankName" = CASE WHEN p_include_bank THEN COALESCE(EXCLUDED."bankName", "Student"."bankName") ELSE "Student"."bankName" END,
        ifsc = CASE WHEN p_include_bank THEN COALESCE(EXCLUDED.ifsc, "Student".ifsc) ELSE "Student".ifsc END;

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. bulk_record_fee
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_record_fee(
    p_entry_no TEXT,
    p_session_name TEXT,
    p_amount double precision,
    p_payment_date TIMESTAMP
) RETURNS TEXT AS $$
DECLARE
    v_student_id INT;
    v_session_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN RETURN 'Student not found: ' || p_entry_no; END IF;

    SELECT id INTO v_session_id FROM "Session" WHERE lower(name) = lower(p_session_name);
    IF v_session_id IS NULL THEN RETURN 'Session not found: ' || p_session_name; END IF;

    INSERT INTO "FeesDeposited" ("studentId", "sessionId", amount, "paymentDate")
    VALUES (v_student_id, v_session_id, p_amount, p_payment_date);

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 4. bulk_record_refund
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_record_refund(
    p_entry_no TEXT,
    p_session_name TEXT,
    p_amount double precision,
    p_payment_date TIMESTAMP
) RETURNS TEXT AS $$
DECLARE
    v_student_id INT;
    v_session_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN RETURN 'Student not found: ' || p_entry_no; END IF;

    SELECT id INTO v_session_id FROM "Session" WHERE lower(name) = lower(p_session_name);
    IF v_session_id IS NULL THEN RETURN 'Session not found: ' || p_session_name; END IF;

    INSERT INTO "Refund" ("studentId", "sessionId", amount, "paymentDate")
    VALUES (v_student_id, v_session_id, p_amount, p_payment_date);

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 5. bulk_assign_hostel
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_assign_hostel(
    p_entry_no TEXT,
    p_hostel_name TEXT
) RETURNS TEXT AS $$
DECLARE
    v_student_id INT;
    v_hostel_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN RETURN 'Student not found: ' || p_entry_no; END IF;

    INSERT INTO "Hostel" (name) VALUES (p_hostel_name)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_hostel_id;

    UPDATE "Student" SET "hostelId" = v_hostel_id, hostel = p_hostel_name, "updatedAt" = NOW() WHERE id = v_student_id;

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 6. bulk_assign_mess
-- ============================================================
CREATE OR REPLACE FUNCTION bulk_assign_mess(
    p_entry_no TEXT,
    p_mess_name TEXT,
    p_session_name TEXT
) RETURNS TEXT AS $$
DECLARE
    v_student_id INT;
    v_mess_id INT;
    v_session_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN RETURN 'Student not found: ' || p_entry_no; END IF;

    SELECT id INTO v_session_id FROM "Session" WHERE lower(name) = lower(p_session_name);
    IF v_session_id IS NULL THEN RETURN 'Session not found: ' || p_session_name; END IF;

    INSERT INTO "Mess" (name, "updatedAt") VALUES (p_mess_name, NOW())
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name, "updatedAt" = NOW()
    RETURNING id INTO v_mess_id;

    INSERT INTO "StudentMessAssignment" ("studentId", "messId", "sessionId")
    VALUES (v_student_id, v_mess_id, v_session_id)
    ON CONFLICT ("studentId", "sessionId") DO UPDATE SET "messId" = EXCLUDED."messId";

    RETURN 'ok';
END;
$$ LANGUAGE plpgsql;
