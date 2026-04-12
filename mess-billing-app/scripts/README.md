# Developer Scripts

This folder contains one-off utility scripts used during development and setup.
These are **never** run by the application itself — they are admin tools only.

---

## `generate-admin-hash.mjs` ⭐ IMPORTANT
**Purpose:** Generates a bcrypt password hash for the admin account.

This is the script you **must** run when setting up the application for the first time or changing the admin password. The output hash goes directly into your `.env` file as `ADMIN_PASSWORD_HASH`.

```bash
node scripts/generate-admin-hash.mjs
```

Enforces the same strong password policy as student passwords (min 12 chars, uppercase, lowercase, number, special character).

---

## `apply-fix.mjs`
**Purpose:** One-time script that manually applied a specific database migration during development when the normal `prisma migrate deploy` was not working.

> **Do not run this on a fresh install.** Running `npx prisma migrate deploy` handles all migrations automatically. This script was only needed as a one-time emergency fix.

---

## `test-student.js`
**Purpose:** Quick database connectivity check — fetches the first student record from the database and prints it to the terminal.

Used during development to verify that Prisma was correctly connecting to the database and that all model relationships (mess assignments, rebates, fees) were working.

```bash
node scripts/test-student.js
```

> **Note:** This prints raw student data to your terminal. Only run on a local/dev database.

---

## `inspect_months.ts`
**Purpose:** Debug script that queries a specific session from the database and prints all the month numbers associated with its mess rates and monthly rebates.

Was used to verify that the billing month/year logic was storing the correct values after the semester calculation changes.

```bash
npx ts-node scripts/inspect_months.ts
```
