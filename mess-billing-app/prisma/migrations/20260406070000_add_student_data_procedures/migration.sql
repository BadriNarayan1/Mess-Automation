-- P1 Student Data Stored Procedures
-- Replaces inline Prisma ORM calls for mess assignments, hostel assignments,
-- student-left records, and student profile/bank updates.

-- ============================================================
-- 1. sp_upsert_mess_assignment
-- ============================================================
CREATE OR REPLACE FUNCTION sp_upsert_mess_assignment(
    p_entry_no TEXT,
    p_mess_id INT,
    p_session_id INT
) RETURNS INT AS $$
DECLARE
    v_student_id INT;
    v_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found: %', p_entry_no;
    END IF;

    INSERT INTO "StudentMessAssignment" ("studentId", "messId", "sessionId")
    VALUES (v_student_id, p_mess_id, p_session_id)
    ON CONFLICT ("studentId", "sessionId")
    DO UPDATE SET "messId" = EXCLUDED."messId"
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 2. sp_delete_mess_assignment
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_mess_assignment(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "StudentMessAssignment" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Assignment not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 3. sp_assign_hostel
-- ============================================================
CREATE OR REPLACE FUNCTION sp_assign_hostel(
    p_entry_no TEXT,
    p_hostel_name TEXT
) RETURNS INT AS $$
DECLARE
    v_student_id INT;
    v_hostel_id INT;
BEGIN
    SELECT id INTO v_student_id FROM "Student" WHERE "entryNo" = p_entry_no;
    IF v_student_id IS NULL THEN
        RAISE EXCEPTION 'Student not found: %', p_entry_no;
    END IF;

    INSERT INTO "Hostel" (name) VALUES (TRIM(p_hostel_name))
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_hostel_id;

    UPDATE "Student"
    SET "hostelId" = v_hostel_id, hostel = TRIM(p_hostel_name), "updatedAt" = NOW()
    WHERE id = v_student_id;

    RETURN v_student_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 4. sp_remove_hostel_assignment
-- ============================================================
CREATE OR REPLACE FUNCTION sp_remove_hostel_assignment(p_student_id INT)
RETURNS VOID AS $$
BEGIN
    UPDATE "Student"
    SET "hostelId" = NULL, hostel = NULL, "updatedAt" = NOW()
    WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found: %', p_student_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 5. sp_upsert_student_left
-- ============================================================
CREATE OR REPLACE FUNCTION sp_upsert_student_left(
    p_student_id INT,
    p_session_id INT,
    p_leave_date TIMESTAMP
) RETURNS INT AS $$
DECLARE
    v_id INT;
BEGIN
    INSERT INTO "StudentLeft" ("studentId", "sessionId", "leaveDate")
    VALUES (p_student_id, p_session_id, p_leave_date)
    ON CONFLICT ("studentId", "sessionId")
    DO UPDATE SET "leaveDate" = EXCLUDED."leaveDate"
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 6. sp_delete_student_left
-- ============================================================
CREATE OR REPLACE FUNCTION sp_delete_student_left(p_id INT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM "StudentLeft" WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Record not found: %', p_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 7. sp_update_student_bank
-- ============================================================
CREATE OR REPLACE FUNCTION sp_update_student_bank(
    p_student_id INT,
    p_bank_account_no TEXT,
    p_bank_name TEXT,
    p_ifsc TEXT
) RETURNS VOID AS $$
BEGIN
    UPDATE "Student"
    SET "bankAccountNo" = p_bank_account_no,
        "bankName" = p_bank_name,
        ifsc = p_ifsc,
        "updatedAt" = NOW()
    WHERE id = p_student_id AND "isBankEditable" = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found or bank editing disabled';
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- 8. sp_update_student_profile
-- ============================================================
CREATE OR REPLACE FUNCTION sp_update_student_profile(
    p_student_id INT,
    p_address TEXT DEFAULT NULL,
    p_mess_security double precision DEFAULT NULL,
    p_course_id INT DEFAULT NULL,
    p_hostel TEXT DEFAULT NULL,
    p_batch TEXT DEFAULT NULL,
    p_email TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE "Student"
    SET address = COALESCE(p_address, address),
        "messSecurity" = COALESCE(p_mess_security, "messSecurity"),
        "courseId" = COALESCE(p_course_id, "courseId"),
        hostel = COALESCE(p_hostel, hostel),
        batch = COALESCE(p_batch, batch),
        email = COALESCE(p_email, email),
        "updatedAt" = NOW()
    WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Student not found: %', p_student_id;
    END IF;
END;
$$ LANGUAGE plpgsql;
