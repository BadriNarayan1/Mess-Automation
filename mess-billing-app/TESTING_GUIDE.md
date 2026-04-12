# 🚀 Pre-Deployment Testing Guide

## Quick Start

### 1. Run Automated Tests
```bash
# Make scripts executable
chmod +x ../test-deployment.sh ../test-passwords.sh

# Run deployment verification tests
../test-deployment.sh

# Run password validation tests
../test-passwords.sh
```

### 2. Manual Testing (Critical Flows)

#### Login & Authentication
```
1. Go to http://localhost:3000
2. Admin Login:
   - Username: badrinarayan4445@gmail.com (or "admin")
   - Password: (your new strong admin password)
   - Expected: ✅ Dashboard loads

3. Try wrong password:
   - Expected: ❌ Login fails with error

4. Google OAuth (if configured):
   - Click "Sign in with Google"
   - Expected: ✅ Works with registered email
```

#### Password Reset Flow
```
1. Go to Password Reset page
2. Enter entry number → Email sent ✅

3. Check email for reset key (should look like random string)

4. Try weak password (e.g., "weak"):
   - Expected: ❌ Error message shows requirements

5. Try strong password (e.g., "MyNewPass123!"):
   - Expected: ✅ Reset successful

6. Login with new password:
   - Expected: ✅ Should work
```

#### Docker Security
```bash
# Test read-only filesystem
docker exec mess_billing_app touch /test.txt
# Expected: ❌ Read-only file system (this is good!)

# Test non-root user
docker exec mess_billing_app whoami
# Expected: uid=1001 (not root)

# Check container status
docker-compose ps
# Expected: Both containers show (healthy)
```

---

## Testing Checklist

### 🔴 CRITICAL (Must Pass Every Time)
- [ ] `./test-deployment.sh` outputs all ✅
- [ ] `./test-passwords.sh` outputs all ✅
- [ ] Admin login works with strong password
- [ ] Student password reset works
- [ ] Docker: `docker-compose ps` shows both healthy
- [ ] App responds: `curl http://localhost:3000`
- [ ] Database works: Can query students

### 🟡 IMPORTANT (Should Test Before Prod)
- [ ] Weak passwords are rejected in UI
- [ ] Strong passwords are accepted
- [ ] Admin hash prefix is $2b$13$
- [ ] Email sends on password reset
- [ ] Student views own billing only
- [ ] Admin sees all students
- [ ] Logout clears session

### 🟢 NICE TO TEST
- [ ] Page load < 3 seconds
- [ ] Mobile responsive layout
- [ ] Works on Chrome, Firefox, Safari
- [ ] 10 concurrent logins
- [ ] Bulk CSV upload

---

## What Each Test Checks

### test-deployment.sh Results
```
✅ Containers running → Both app and db containers alive
✅ App healthy → Has passed health check
✅ DB healthy → Database responsive
✅ Read-only FS → Cannot write to root (security feature)
✅ Non-root user → Running as UID 1001
✅ App responding → Port 3000 returns HTML
✅ Bcrypt 13 rounds → Hash starts with $2b$13$
✅ Password validation → Code uses validatePasswordStrength()
✅ Docker hardening → Has read-only, caps dropped, limits
✅ No debug logs → [auth-debug] statements removed
```

### test-passwords.sh Results
```
Weak passwords rejected:
  ❌ "pass" (too short)
  ❌ "Password123" (no special char)
  ❌ "Admin@123" (contains "admin")

Strong passwords accepted:
  ✅ "MyPassword123!"
  ✅ "Secure@Pass2024"
  ✅ "StrongPwd#99"

Edge cases tested:
  ✅ 12 char minimum enforced
  ✅ Special characters recognized
  ✅ Weak patterns blocked
```

---

## Common Issues & Quick Fixes

### Container won't start
```bash
# Check why
docker-compose logs app
docker-compose logs db

# Rebuild everything
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### "Read-only file system" showing in logs
```
✅ This is EXPECTED and GOOD!
The hardening is working.
Files can only be written to /tmp and /app/.next/cache
```

### Password reset not working
```bash
# Verify password lib is loaded
ls -l src/lib/password.ts
grep "bcryptRounds: 13" src/lib/password.ts

# Check reset endpoint uses it
grep "validatePasswordStrength" src/app/api/auth/reset-password/route.ts

# Rebuild
docker-compose build --no-cache app
```

### Admin login fails
```bash
# Verify admin hash set
echo $ADMIN_PASSWORD_HASH

# Should start with $2b$13$
# If not, regenerate:
node generate-admin-hash.mjs

# Copy the output to .env
# Restart:
docker-compose up -d
```

### Tests show failures
```bash
# Check specific error
./test-deployment.sh 2>&1 | grep "❌"

# Fix that specific area
# Re-run test
./test-deployment.sh

# All tests should pass before deploying
```

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Admin hash generation | 30-60 sec | Intentional (bcrypt 13 rounds) |
| Password reset submit | 1-2 sec | User sees spinner |
| Student login | < 500ms | Fast verification |
| Dashboard load | < 3 sec | Including DB query |
| Student file download | Variable | Depends on file size |

**If slower than expected:**
```bash
# Check resource usage
docker stats mess_billing_app

# Should show CPU < 400% and Memory < 4GB
# If higher, container is under load or has issue
```

---

## Pre-Production Deployment Checklist

```bash
# 1. RUN ALL TESTS
./test-deployment.sh        # All ✅
./test-passwords.sh         # All ✅

# 2. MANUAL VERIFICATION
# - Login as admin ✅
# - Reset password as student ✅
# - Receive email ✅
# - Check read-only FS ✅

# 3. VIDEO/SCREENSHOT
# - Screenshot test results
# - Document date and tester

# 4. GIT STATUS
git status                  # No secrets visible
git ls-files | grep .env    # Should be empty

# 5. FINAL CHECKS
cat .env | wc -l            # Should have values
docker-compose ps           # Both healthy
curl http://localhost:3000  # Responds

# 6. BACKUP READY
# - Database can be backed up
# - Rollback plan documented
# - Previous version can be restored

# 7. MONITORING READY
# - Health checks configured
# - Alerts set up
# - Logs being collected
```

Once all checks pass:
✅ **READY FOR DEPLOYMENT**

---

## Post-Deployment Verification

After deploying to production:

```bash
# 1. Check app is responding
curl https://mess.iitrpr.ac.in

# 2. Try admin login
# (Open browser, test manually)

# 3. Check logs for errors
docker-compose logs app

# 4. Verify HTTPS working
# Open in browser, check for padlock icon

# 5. Test password reset
# Send yourself a test email

# 6. Monitor for 24 hours
# Check CPU, memory, errors
docker stats mess_billing_app
```

If any issue: **ROLLBACK IMMEDIATELY**

```bash
# Revert to previous version
git checkout previous-commit
docker-compose build --no-cache
docker-compose up -d
```

---

## Test Results Document Template

Keep this for records:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-DEPLOYMENT TEST REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Date: _______________
Tester: _______________
Build Version: _______________

AUTOMATED TESTS:
┌─────────────────────────────────────┐
│ test-deployment.sh                  │
│ Result: ✅ PASS / ❌ FAIL            │
│ Total: ___ Pass, ___ Fail           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ test-passwords.sh                   │
│ Result: ✅ PASS / ❌ FAIL            │
│ Total: ___ Pass, ___ Fail           │
└─────────────────────────────────────┘

MANUAL TESTS:
┌─────────────────────────────────────┐
│ Admin Login: ✅ / ❌                 │
│ Student Login: ✅ / ❌              │
│ Password Reset: ✅ / ❌             │
│ Email Sending: ✅ / ❌              │
│ Docker Security: ✅ / ❌            │
└─────────────────────────────────────┘

PERFORMANCE:
  Page Load: ____ ms
  Login: ____ ms
  Reset: ____ ms

ISSUES FOUND:
  1. _______________________
  2. _______________________

RESOLUTION:
  1. _______________________
  2. _______________________

APPROVAL:
  ✅ Ready to deploy
  ❌ Not ready (issues remain)

Signed: _________________ Date: _______
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Questions About Tests?

- **Why bcrypt takes 30-60 seconds?** - 13 rounds is intentionally slow to prevent brute-force attacks
- **Why read-only filesystem error?** - It's a security feature, not a bug
- **Why non-root user?** - Limits damage if container is compromised
- **Why network isolated?** - Prevents infected container from accessing external services
- **Why these specific tests?** - They verify all security and functionality changes

All good? You're ready to deploy! 🚀
