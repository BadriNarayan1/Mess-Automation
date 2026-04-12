# Neon Database User Setup Guide

Neon manages users differently from a self-hosted Postgres.
You cannot use `psql` commands directly — everything goes through
the Neon dashboard or SQL Editor.

---

## Step 1: Create the `mess_app` Role in Neon Dashboard

1. Go to [neon.tech](https://neon.tech) → your project
2. Click **Roles** in the left sidebar (under your branch)
3. Click **Add role**
4. Name it: `mess_app`
5. Copy the generated password — **save it somewhere safe**, you'll use it in Step 4

> Neon automatically creates a secure random password for new roles.
> The `mess_owner` role is your existing default role (usually `neondb_owner`)
> which your DATABASE_URL already uses.

---

## Step 2: Run the Grant SQL in Neon SQL Editor

1. In your Neon project, click **SQL Editor**
2. Make sure you are connected as your **owner role** (the default — usually `neondb_owner`)
3. Paste and run the SQL from `scripts/neon-setup-app-role.sql`

---

## Step 3: Build the `mess_app` Connection String

Your new low-privilege connection string will look like:

```
postgresql://mess_app:PASSWORD_FROM_STEP1@ep-your-endpoint.region.aws.neon.tech/neondb?sslmode=require
```

Replace:
- `PASSWORD_FROM_STEP1` — the password Neon generated in Step 1
- `ep-your-endpoint.region.aws.neon.tech` — same host as your existing DATABASE_URL

---

## Step 4: Set in Render Environment Variables

In your Render service **Environment** tab, you currently have:
- `DATABASE_URL` = your owner connection string (keep this — it's needed for migrations)

Add a new variable:
- `DATABASE_APP_URL` = the `mess_app` connection string from Step 3

---

## Step 5: Update prisma/schema.prisma

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // owner — used for prisma migrate deploy
  directUrl = env("DATABASE_APP_URL")   // mess_app — used at runtime by the app
}
```

---

## Result

```
At deploy time:
  prisma migrate deploy → uses DATABASE_URL (owner role) → can CREATE TABLE etc. ✅

At runtime (every API call):
  Prisma queries → uses DATABASE_APP_URL (mess_app role) → SELECT + stored procs only ✅
  Cannot DROP TABLE, ALTER TABLE, direct financial writes ❌
```
