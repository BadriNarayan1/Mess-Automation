-- Phase 1: Billing Stored Functions
-- These functions centralise the billing calculation logic that was
-- previously duplicated across 5 TypeScript API routes.
-- Uses double precision to match Prisma Float → PostgreSQL double precision.

-- ============================================================
-- Function 1: get_session_months(p_session_id)
-- ============================================================
CREATE OR REPLACE FUNCTION get_session_months(p_session_id INT)
RETURNS TABLE (month INT, year INT) AS $$
BEGIN
    RETURN QUERY
    WITH rate_months AS (
        SELECT mr.month,
               CASE WHEN s.semester = 'I'
                    THEN CASE WHEN mr.month >= 7 THEN s."startYear" ELSE s."startYear" + 1 END
                    ELSE CASE WHEN mr.month <= 6 THEN s."startYear" ELSE s."startYear" - 1 END
               END AS year
        FROM "MessRate" mr
        JOIN "Session" s ON s.id = mr."sessionId"
        WHERE mr."sessionId" = p_session_id
    ),
    rebate_months AS (
        SELECT DISTINCT r.month, r.year
        FROM "MonthlyRebate" r
        WHERE r."sessionId" = p_session_id
    )
    SELECT DISTINCT m.month, m.year
    FROM (
        SELECT rm.month, rm.year FROM rate_months rm
        UNION
        SELECT rbm.month, rbm.year FROM rebate_months rbm
    ) m
    ORDER BY m.year, m.month;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- Function 2: calculate_student_billing(p_student_id, p_session_id)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_student_billing(
    p_student_id INT,
    p_session_id INT
) RETURNS TABLE (
    month INT,
    year INT,
    days_in_month INT,
    rebate_days INT,
    chargeable_days INT,
    daily_rate double precision,
    gst_percentage double precision,
    amount double precision
) AS $$
DECLARE
    v_leave_date DATE;
    v_mess_id INT;
BEGIN
    SELECT sma."messId" INTO v_mess_id
    FROM "StudentMessAssignment" sma
    WHERE sma."studentId" = p_student_id AND sma."sessionId" = p_session_id
    LIMIT 1;

    SELECT sl."leaveDate"::date INTO v_leave_date
    FROM "StudentLeft" sl
    WHERE sl."studentId" = p_student_id AND sl."sessionId" = p_session_id
    LIMIT 1;

    RETURN QUERY
    WITH session_months AS (
        SELECT sm.month AS m, sm.year AS y FROM get_session_months(p_session_id) sm
    ),
    computed AS (
        SELECT
            sm.m,
            sm.y,
            CASE
                WHEN v_leave_date IS NOT NULL
                     AND (sm.y > EXTRACT(YEAR FROM v_leave_date)::INT
                          OR (sm.y = EXTRACT(YEAR FROM v_leave_date)::INT
                              AND sm.m > EXTRACT(MONTH FROM v_leave_date)::INT))
                THEN 0
                WHEN v_leave_date IS NOT NULL
                     AND sm.y = EXTRACT(YEAR FROM v_leave_date)::INT
                     AND sm.m = EXTRACT(MONTH FROM v_leave_date)::INT
                THEN EXTRACT(DAY FROM v_leave_date)::INT
                ELSE EXTRACT(DAY FROM
                       (DATE_TRUNC('month', MAKE_DATE(sm.y, sm.m, 1))
                        + INTERVAL '1 month' - INTERVAL '1 day'))::INT
            END AS dim,
            CASE
                WHEN v_leave_date IS NOT NULL
                     AND (sm.y > EXTRACT(YEAR FROM v_leave_date)::INT
                          OR (sm.y = EXTRACT(YEAR FROM v_leave_date)::INT
                              AND sm.m > EXTRACT(MONTH FROM v_leave_date)::INT))
                THEN 0
                ELSE COALESCE(reb."rebateDays", 0)
            END AS rd,
            COALESCE(mr."monthlyRate", 0)::double precision AS rate,
            COALESCE(mr."gstPercentage", 0)::double precision AS gst
        FROM session_months sm
        LEFT JOIN "MonthlyRebate" reb
            ON reb."studentId" = p_student_id
            AND reb."sessionId" = p_session_id
            AND reb.month = sm.m
            AND reb.year = sm.y
        LEFT JOIN "MessRate" mr
            ON mr."messId" = v_mess_id
            AND mr."sessionId" = p_session_id
            AND mr.month = sm.m
    )
    SELECT
        c.m,
        c.y,
        c.dim,
        c.rd,
        GREATEST(0, c.dim - c.rd)::INT,
        c.rate,
        c.gst,
        ROUND((GREATEST(0, c.dim - c.rd) * c.rate * (1 + c.gst / 100))::numeric, 2)::double precision
    FROM computed c
    ORDER BY c.y, c.m;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- Function 3: get_student_bill_summary(p_student_id, p_session_id)
-- ============================================================
CREATE OR REPLACE FUNCTION get_student_bill_summary(
    p_student_id INT,
    p_session_id INT
) RETURNS TABLE (
    mess_name TEXT,
    session_name TEXT,
    month INT,
    year INT,
    days_in_month INT,
    rebate_days INT,
    chargeable_days INT,
    daily_rate double precision,
    gst_percentage double precision,
    amount double precision,
    total_amount double precision,
    total_fees_deposited double precision,
    total_refunds double precision,
    net_balance double precision
) AS $$
DECLARE
    v_mess_name TEXT := 'Not Assigned';
    v_session_name TEXT;
    v_total_amount double precision;
    v_total_fees double precision;
    v_total_refunds double precision;
BEGIN
    SELECT m.name INTO v_mess_name
    FROM "StudentMessAssignment" sma
    JOIN "Mess" m ON m.id = sma."messId"
    WHERE sma."studentId" = p_student_id AND sma."sessionId" = p_session_id
    LIMIT 1;

    SELECT s.name INTO v_session_name
    FROM "Session" s WHERE s.id = p_session_id;

    SELECT COALESCE(SUM(b.amount), 0) INTO v_total_amount
    FROM calculate_student_billing(p_student_id, p_session_id) b;

    SELECT COALESCE(SUM(fd.amount), 0) INTO v_total_fees
    FROM "FeesDeposited" fd
    WHERE fd."studentId" = p_student_id AND fd."sessionId" = p_session_id;

    SELECT COALESCE(SUM(r.amount), 0) INTO v_total_refunds
    FROM "Refund" r
    WHERE r."studentId" = p_student_id AND r."sessionId" = p_session_id;

    RETURN QUERY
    SELECT
        COALESCE(v_mess_name, 'Not Assigned'),
        v_session_name,
        b.month, b.year,
        b.days_in_month, b.rebate_days, b.chargeable_days,
        b.daily_rate, b.gst_percentage, b.amount,
        v_total_amount,
        v_total_fees,
        v_total_refunds,
        v_total_fees - (v_total_amount + v_total_refunds)
    FROM calculate_student_billing(p_student_id, p_session_id) b;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================
-- Function 4: calculate_session_billing(p_session_id)
-- ============================================================
CREATE OR REPLACE FUNCTION calculate_session_billing(p_session_id INT)
RETURNS TABLE (
    student_id INT,
    month INT,
    year INT,
    days_in_month INT,
    rebate_days INT,
    chargeable_days INT,
    daily_rate double precision,
    gst_percentage double precision,
    amount double precision
) AS $$
BEGIN
    RETURN QUERY
    WITH session_months AS (
        SELECT sm.month AS m, sm.year AS y FROM get_session_months(p_session_id) sm
    ),
    assignments AS (
        SELECT sma."studentId", sma."messId"
        FROM "StudentMessAssignment" sma
        WHERE sma."sessionId" = p_session_id
    ),
    leaves AS (
        SELECT sl."studentId", sl."leaveDate"::date AS leave_date
        FROM "StudentLeft" sl
        WHERE sl."sessionId" = p_session_id
    ),
    all_students AS (
        SELECT DISTINCT s.id AS sid
        FROM "Student" s
    ),
    cross_data AS (
        SELECT
            ast.sid,
            sm.m,
            sm.y,
            CASE
                WHEN lv.leave_date IS NOT NULL
                     AND (sm.y > EXTRACT(YEAR FROM lv.leave_date)::INT
                          OR (sm.y = EXTRACT(YEAR FROM lv.leave_date)::INT
                              AND sm.m > EXTRACT(MONTH FROM lv.leave_date)::INT))
                THEN 0
                WHEN lv.leave_date IS NOT NULL
                     AND sm.y = EXTRACT(YEAR FROM lv.leave_date)::INT
                     AND sm.m = EXTRACT(MONTH FROM lv.leave_date)::INT
                THEN EXTRACT(DAY FROM lv.leave_date)::INT
                ELSE EXTRACT(DAY FROM
                       (DATE_TRUNC('month', MAKE_DATE(sm.y, sm.m, 1))
                        + INTERVAL '1 month' - INTERVAL '1 day'))::INT
            END AS dim,
            CASE
                WHEN lv.leave_date IS NOT NULL
                     AND (sm.y > EXTRACT(YEAR FROM lv.leave_date)::INT
                          OR (sm.y = EXTRACT(YEAR FROM lv.leave_date)::INT
                              AND sm.m > EXTRACT(MONTH FROM lv.leave_date)::INT))
                THEN 0
                ELSE COALESCE(reb."rebateDays", 0)
            END AS rd,
            COALESCE(mr."monthlyRate", 0)::double precision AS rate,
            COALESCE(mr."gstPercentage", 0)::double precision AS gst
        FROM all_students ast
        CROSS JOIN session_months sm
        LEFT JOIN assignments a ON a."studentId" = ast.sid
        LEFT JOIN leaves lv ON lv."studentId" = ast.sid
        LEFT JOIN "MonthlyRebate" reb
            ON reb."studentId" = ast.sid
            AND reb."sessionId" = p_session_id
            AND reb.month = sm.m
            AND reb.year = sm.y
        LEFT JOIN "MessRate" mr
            ON mr."messId" = a."messId"
            AND mr."sessionId" = p_session_id
            AND mr.month = sm.m
    )
    SELECT
        cd.sid,
        cd.m,
        cd.y,
        cd.dim,
        cd.rd,
        GREATEST(0, cd.dim - cd.rd)::INT,
        cd.rate,
        cd.gst,
        ROUND((GREATEST(0, cd.dim - cd.rd) * cd.rate * (1 + cd.gst / 100))::numeric, 2)::double precision
    FROM cross_data cd
    ORDER BY cd.sid, cd.y, cd.m;
END;
$$ LANGUAGE plpgsql STABLE;
