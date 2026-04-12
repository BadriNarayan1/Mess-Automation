# k6 Quick Start Guide

## Install k6 (2 minutes)

```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Verify
k6 version
```

---

## Run Your First Test (3 minutes)

### Step 1: Start Your App
```bash
npm run dev
```

### Step 2: Run Smoke Test (Quick Check)
```bash
k6 run k6/smoke-test.js
```

**Expected Output**:
```
✓ http_req_failed.............: 0.00%
✓ http_reqs...................: 5 req/s
✓ Student Billing status is 200: 100%
```

All endpoints working? ✅

### Step 3: Run Load Test (7 minutes)
```bash
k6 run k6/load-test.js
```

**Result shows**:
- How system performs with 1-20 users
- Average response time
- Error rate
- Throughput

---

## Test Types at a Glance

| Test | Duration | Purpose | Command |
|------|----------|---------|---------|
| Smoke | 1 min | Quick check | `k6 run k6/smoke-test.js` |
| Load | 7 min | Baseline performance | `k6 run k6/load-test.js` |
| Stress | 12 min | Breaking point | `k6 run k6/stress-test.js` |
| Spike | 6 min | Traffic surge | `k6 run k6/spike-test.js` |
| Soak | 30 min | Stability | `k6 run k6/soak-test.js` |
| Endurance | 1 hour | Long-term stability | `k6 run k6/endurance-test.js` |

---

## Reading Results

### Critical Metrics

```
p(95) response time < 500ms     ✅ Good
p(95) response time > 1000ms    ⚠️ Warning
error_rate < 5%                 ✅ Good
error_rate > 20%                🚨 Critical
```

### What to Watch

```
Load Test
├─ Response times should be stable
├─ Error rate should stay low
└─ Throughput should be consistent

Stress Test
├─ Find where errors start
├─ Note response time increase
└─ Identify breaking point (max users)

Soak Test
├─ Response times should NOT increase
├─ Error rate should NOT increase
└─ Look for memory growing continuously
```

---

## Quick Commands

```bash
# Smoke test (always run first)
k6 run k6/smoke-test.js

# Load test (get baseline)
k6 run k6/load-test.js

# Stress test (find limits)
k6 run k6/stress-test.js

# Spike test (surge handling)
k6 run k6/spike-test.js

# Soak test (memory leaks)
k6 run k6/soak-test.js

# Endurance (all-day stability)
k6 run k6/endurance-test.js

# Save results to file
k6 run k6/load-test.js --output json=results.json

# Run with custom parameters
k6 run k6/load-test.js --vus 50 --duration 5m
```

---

## Typical Workflow

1. **Before development**: `k6 run k6/smoke-test.js`
2. **During development**: `k6 run k6/load-test.js`
3. **Before scaling**: `k6 run k6/stress-test.js`
4. **Before production**: `k6 run k6/soak-test.js`
5. **Weekly**: `k6 run k6/endurance-test.js`

---

## Interpreting Results

### Good Load Test Result ✅
```
p(95)=450ms          ← Good
p(99)=800ms          ← Good
error_rate=2%        ← Good (below 5%)
throughput=150req/s  ← Good (above 100)
```
System is healthy for production!

### Poor Load Test Result ⚠️
```
p(95)=1200ms         ← Slow
p(99)=2500ms         ← Very slow
error_rate=15%       ← Too high
throughput=40req/s   ← Too low
```
System needs optimization before scaling.

### Stress Test Breaking Point 📊
```
At 200 users:
├─ p(95)=800ms       ← Starts degrading
├─ error_rate=5%     ← Errors appear
└─ Conclusion: System breaks around 250+ users
```

---

## Next Steps

1. **Start**: `k6 run k6/smoke-test.js`
2. **Understand baseline**: `k6 run k6/load-test.js`
3. **Find limits**: `k6 run k6/stress-test.js`
4. **Read full guide**: `K6_COMPREHENSIVE_GUIDE.md`

That's it! You're load testing! 🚀

