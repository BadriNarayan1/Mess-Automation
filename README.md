# 🏢 IIT Ropar Mess Billing Automation System (IMAS)

🔗 **Live Portal:** [hostel.iitrpr.ac.in](https://hostel.iitrpr.ac.in)
only Accessible with iit ropar network 


![Next.js](https://img.shields.io/badge/Next.js-15%2B-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)

---

## 🚀 Quick Start / Installation

### 1. Clone the Repository
Clone the project and switch to the production branch in one command:
```bash
git clone https://github.com/Ayush-1574/DEP26-D21-Mess-Billing-Automation-System.git -b stored_procedure
cd DEP26-D21-Mess-Billing-Automation-System
```

### 2. Database Setup
1. Ensure PostgreSQL is running and a database named `mess_billing` exists.
2. Generate Prisma Client:
   ```bash
   npx prisma generate
   ```
3. Run Prisma migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. **Critical:** Execute the permission and stored procedure script as superuser:
   ```bash
   sudo -u postgres psql -d mess_billing < scripts/setup-db-users.sql
   ```

### 3. Local Development
1. Navigate to the app directory:
   ```bash
   cd mess-billing-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure `.env` file with your `DATABASE_URL` and Auth secrets.
4. Start development server:
   ```bash
   npm run dev
   ```
5. Access at: `http://localhost:3000`

---

## 💻 System Requirements & OS Info

- **Operating Systems:** 
  - 🖥️ **Development:** Windows 10/11
  - 🌐 **Production:** Ubuntu 22.04 LTS (Optimized for internal VM `172.30.8.177`)
- **Node.js:** v20.x or higher
- **Package Manager:** npm v10.x or higher
- **Database:** PostgreSQL v15+
- **Process Manager:** PM2 (for production deployment)

---

## 📖 Project Overview

### 🌟 Executive Summary
> **Team ID:** D21 | **Group Number:** 21

The Mess Billing Automation System (IMAS) is a comprehensive, secure, and highly scalable full-stack web application designed for the hostel administration at IIT Ropar. It digitizes and automates the manual mess billing process, ensuring transparency and accuracy for thousands of students.

### 🛠️ Technology Stack
| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15+ (App Router), React Server Components, TypeScript |
| **Styling** | Tailwind CSS v4, Framer Motion, Lucide React |
| **Database** | PostgreSQL v15+ (Stored Procedures & SECURITY DEFINER) |
| **Auth** | NextAuth.js v5 (Google OAuth restricted to `@iitrpr.ac.in`) |
| **Infrastructure** | Docker, Nginx, PM2, SSL via Institutional Certificates |

### ✨ Core Features
- **Administrator Portal:** Dashboard Analytics, Bulk CSV Uploads, Financial Management, Audit Logs.
- **Student Portal:** Personal Dashboards, Billing Transparency, Secure Bank Detail Management.
- **Public Portal:** Dynamic info on Hostels, Messes, and Administration.

### 🔒 Security & Optimization
- **Stored Procedures:** Logic executed at the DB level for performance and integrity.
- **Least Privilege:** Restricted `mess_app` role with controlled access.
- **Audit Trails:** Enforced at the database level, impossible to bypass.

---

## 📌 Branch Information
The latest production-ready code is in the **`stored_procedure`** branch.

```bash
git checkout stored_procedure
```

---

© 2026 IIT Ropar Mess Billing Automation Team (Group 21)
