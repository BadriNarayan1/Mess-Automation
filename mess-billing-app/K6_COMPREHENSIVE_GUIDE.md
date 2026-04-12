# k6 Load Testing Guide - Complete

## Overview

k6 is a modern load testing tool for testing your system's performance scalability. It tests how your application behaves under different loads, not just if it works.

**What is Tested**:
- ✅ Performance under normal load (baseline)
- ✅ Performance under stress conditions (breaking point)
- ✅ Behavior during traffic spikes
- ✅ Long-term stability (memory leaks)
- ✅ System recovery after overload

**Total Tests**: 6 test scenarios covering all aspects

---

## Installation

### Install k6

**macOS**:
```bash
brew install k6
```

**Linux**:
```bash
sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6-stable.list
sudo apt-get update
sudo apt-get install k6
```

**Windows**:
```bash
choco install k6
```

### Verify Installation

```bash
k6 version
```

Should show: `k6 v0.47.0` or later

---

## Quick Start (5 Minutes)

### Step 1: Run Smoke Test (1 minute)

```bash
cd mess-billing-app
k6 run k6/smoke-test.js
```

**Expected Output**:
```
🔥 Starting Smoke Test - Quick Sanity Check
✅ Testing: Student Billing
   ✓ Student Billing OK (145ms)
✅ Testing: Admin Students
   ✓ Admin Students OK (89ms)
...

    ✓ http_req_duration..............: avg=142ms, p(99)=234ms
    ✓ http_req_failed................: 0.00%
    ✓ http_reqs......................: 5 req/s
```

All 5 critical endpoints working ✅

### Step 2: Run Load Test (7 minutes)

```bash
k6 run k6/load-test.js
```

Gradually increases users from 1 → 20 → 1

### Step 3: Review Results

```
Check
  ✓ Get Student Billing status is 200.............: 98%
  ✓ Get Admin Students status is 200.............: 97%

Metrics
  http_req_duration: p(95)=450ms, p(99)=780ms
  http_req_failed...: 2%
  http_reqs.........: 120 req/s
```

Check if:
- ✅ Response times stay under 500ms (p95)
- ✅ Error rate stays under 10%
- ✅ Throughput is at least 100 req/s

---

## Test Scenarios

### 1. Smoke Test (1 minute)
Quick sanity check before running other tests

```bash
k6 run k6/smoke-test.js
```

**Purpose**: Verify system is working
**Duration**: 1 minute
**Users**: 1
**Expected**: All endpoints respond correctly

---

### 2. Load Test (7 minutes)
Establish baseline performance

```bash
k6 run k6/load-test.js
```

**Test Flow**:
- 0-2min: Ramp from 1 to 20 users
- 2-5min: Hold at 20 users
- 5-7min: Ramp down to 0
- **Users**: 1 → 20 → 1
- **Endpoints**: All critical endpoints tested
- **Purpose**: Get baseline performance metrics

**Success Criteria**:
- p(95) response time < 500ms
- p(99) response time < 1000ms
- Error rate < 10%
- Minimum 100 requests/sec

---

### 3. Stress Test (12 minutes)
Push system to breaking point

```bash
k6 run k6/stress-test.js
```

**Test Flow**:
- 0-2min: Ramp to 50 users
- 2-7min: Ramp to 100 users
- 7-9min: Ramp to 200 users
- 9-14min: Hold at 200 users (stress peak)
- 14-16min: Ramp down
- **Users**: 50 → 100 → 200 users
- **Purpose**: Find breaking point

**Looking For**:
- Where response times increase dramatically
- Where errors start appearing
- Maximum sustainable user count
- Resource exhaustion points

---

### 4. Spike Test (6 minutes)
Sudden traffic surge

```bash
k6 run k6/spike-test.js
```

**Test Flow**:
- 0-1min: Normal traffic (10 users)
- 1-2min: **SPIKE to 100 users**
- 2-5min: Maintain spike
- 5-6min: Return to normal
- **Purpose**: Test spike handling

**Real-world Scenario**: Semester starts, everyone checks billing at once

**Measures**:
- Can system handle spike without crashing?
- Do response times degrade gracefully or catastrophically?
- Does rate limiting work?

---

### 5. Soak Test (30 minutes)
Long duration with moderate load

```bash
k6 run k6/soak-test.js
```

**Test Flow**:
- 0-2min: Ramp to 20 users
- 2-28min: Maintain 20 users consistently
- 28-30min: Ramp down
- **Purpose**: Find memory leaks and stability issues

**Looking For**:
- Memory constantly increasing? (memory leak)
- Response times degrading over time? (resource leak)
- Connection pool exhaustion?
- Gradual system degradation?

---

### 6. Endurance Test (1 hour)
Extended duration with light load

```bash
k6 run k6/endurance-test.js
```

**Test Flow**:
- 0-5min: Ramp to 10 users
- 5-55min: Maintain 10 users
- 55-60min: Ramp down
- **Purpose**: Find issues that only appear over time

**Real-world Scenario**: System running all day without restart

**Detects**:
- Long-term memory leaks
- Database connection pool issues
- Gradual performance degradation
- Cache invalidation problems

---

## Understanding k6 Results

### Key Metrics

```
http_req_duration........: Response time
  avg=150ms          - Average response time
  p(90)=200ms        - 90% of requests under 200ms
  p(95)=450ms        - 95% of requests under 450ms
  p(99)=800ms        - 99% of requests under 800ms
  min=45ms           - Fastest request
  max=2000ms         - Slowest request

http_req_failed..........: Error rate
  rate=0.05          - 5% of requests failed
  count=50           - 50 requests failed out of 1000

http_reqs................: Throughput
  rate=150req/s      - 150 requests per second
  count=9000         - Total 9000 requests

vus_max..................: Peak concurrent users
  value=200          - Reached 200 concurrent users
```

### Interpreting Results

**Good Results** ✅
```
p(95)<500ms          - Acceptable performance
p(99)<1000ms         - Good performance
error_rate<5%        - Stable system
throughput>100req/s  - Adequate capacity
```

**Warning Signs** ⚠️
```
p(95)>800ms          - System struggling
error_rate>10%       - Significant errors
throughput<50req/s   - Insufficient capacity
errors during spike  - Poor spike handling
gradual slowdown     - Memory leak suspected
```

**Critical Issues** 🚨
```
p(95)>2000ms         - System overloaded
error_rate>30%       - Major problems
timeouts occurring   - Requests failing to complete
crashes              - System breaking
```

---

## Running Tests

### Sequential Execution

Run all tests in order:

```bash
echo "🔥 Starting k6 Load Test Suite"
k6 run k6/smoke-test.js && echo "✅ Smoke test passed" && \
k6 run k6/load-test.js && echo "✅ Load test passed" && \
k6 run k6/stress-test.js && echo "⚠️ Stress test complete" && \
echo "🎉 All tests completed"
```

### With Output Files

```bash
k6 run k6/load-test.js --output json=results.json
```

Analyze results later:

```bash
cat results.json | jq '.metrics'  # Parse JSON results
```

### With Environment Variables

```bash
# Set custom think time
k6 run k6/load-test.js --env THINK_TIME=2

# Set base URL
k6 run k6/load-test.js --env BASE_URL=https://production.com
```

---

## Performance Targets for Your App

Based on 5,000 students, recommended targets:

| Metric | Target | Benchmark |
|--------|--------|-----------|
| Concurrent Users | 500+ | Production |
| p(95) Response Time | < 500ms | Load test |
| p(99) Response Time | < 1000ms | Load test |
| Error Rate | < 5% | All tests |
| Throughput | > 500 req/s | Production |
| Peak Load | 1,000 users | Stress test breaking point |

---

## Load Test Workflow

### 1. Smoke Test (Before Every Run)
```bash
k6 run k6/smoke-test.js
```
Quick sanity check ✓

### 2. Load Test (Development)
```bash
k6 run k6/load-test.js
```
Baseline performance ✓

### 3. Stress Test (When Ready to Scale)
```bash
k6 run k6/stress-test.js
```
Find breaking point ✓

### 4. Soak Test (Before Production)
```bash
k6 run k6/soak-test.js
```
Check stability ✓

### 5. Spike Test (Periodically)
```bash
k6 run k6/spike-test.js
```
Validate surge handling ✓

### 6. Endurance Test (Weekly or Before Major Release)
```bash
k6 run k6/endurance-test.js
```
Check long-term stability ✓

---

## Troubleshooting

### "Connection refused"
Ensure your application is running:
```bash
npm run dev        # Start Next.js app
# In another terminal:
k6 run k6/smoke-test.js
```

### "Too many open files"
Increase system limits:
```bash
ulimit -n 10000    # Increase file descriptors
k6 run k6/load-test.js
```

### High error rate
```bash
# Check API logs
# Look for: timeouts, 500 errors, validation errors
# Reduce VUs in test and retry
```

### Memory leak suspected
```bash
# Monitor system during soak test
# Check for:
#   - Process memory growing
#   - Database connections increasing
#   - Gradual response time increase
```

---

## File Structure

```
k6/
├── helpers.js           # Shared utilities
├── smoke-test.js        # 1-minute sanity check
├── load-test.js         # 7-minute baseline
├── stress-test.js       # 12-minute breaking point
├── spike-test.js        # 6-minute surge test
├── soak-test.js         # 30-minute stability
└── endurance-test.js    # 1-hour long-duration
```

---

## Summary

You now have:
- ✅ 6 comprehensive load test scenarios
- ✅ 550+ lines of k6 test code
- ✅ Performance metrics and thresholds
- ✅ Realistic user behavior simulation
- ✅ Results interpretation guide

All tests are ready to run:
```bash
k6 run k6/smoke-test.js
```

**Start testing performance!** 🚀

