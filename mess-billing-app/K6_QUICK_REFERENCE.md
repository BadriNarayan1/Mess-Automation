# k6 Load Testing Command Reference

## Installation

```bash
brew install k6          # macOS
sudo apt-get install k6  # Linux
choco install k6         # Windows
k6 version              # Verify
```

---

## Running Tests

```bash
# Smoke test (1 min)
k6 run k6/smoke-test.js

# Load test (7 min)
k6 run k6/load-test.js

# Stress test (12 min)
k6 run k6/stress-test.js

# Spike test (6 min)
k6 run k6/spike-test.js

# Soak test (30 min)
k6 run k6/soak-test.js

# Endurance test (1 hour)
k6 run k6/endurance-test.js
```

---

## Advanced Options

```bash
# Save output to JSON
k6 run k6/load-test.js --output json=results.json

# Set virtual users (override test config)
k6 run k6/load-test.js --vus 50

# Set duration (override test config)
k6 run k6/load-test.js --duration 10m

# Run with custom environment variable
k6 run k6/load-test.js --env BASE_URL=https://prod.com

# Verbose output
k6 run k6/load-test.js -v

# No summary at end
k6 run k6/load-test.js --no-summary

# Set max log level detail
k6 run k6/load-test.js --loglevel=debug
```

---

## Test Progression

**Before Every Deployment**:
```bash
k6 run k6/smoke-test.js         # Quick check (1 min)
k6 run k6/load-test.js          # Baseline (7 min)
k6 run k6/soak-test.js          # Stability (30 min)
```

**When Scaling Up**:
```bash
k6 run k6/load-test.js          # Establish baseline
k6 run k6/stress-test.js        # Find breaking point
k6 run k6/spike-test.js         # Test surge handling
```

**Weekly/Monthly**:
```bash
k6 run k6/endurance-test.js     # Long-term stability
```

---

## Key Metrics to Watch

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| p(95) response | <500ms | >800ms | >2000ms |
| p(99) response | <1000ms | >1500ms | >3000ms |
| error_rate | <5% | >10% | >30% |
| throughput | >100req/s | >50req/s | <10req/s |

---

## Understanding Output

```
Check ✓
  ✓ Response status is 200.............: 98%
  ✓ Billing response acceptable........: 97%

Metrics
  http_req_duration [duration]
    avg=150ms
    p(90)=200ms
    p(95)=450ms
    p(99)=850ms
  http_req_failed [rate]
    0.00%
  http_reqs [rate]
    121.5 req/s
  vus_max [value]
    20
```

---

## Common Issues

**Connection refused**
- Start your app: `npm run dev`

**Too many open files**
- Increase limits: `ulimit -n 10000`

**High error rate**
- Check server logs
- Reduce VUs
- Check database connections

**Memory growing in soak test**
- Potential memory leak
- Check Node.js heap size
- Profile application

---

## Test File Locations

```
k6/
├── helpers.js       # Utilities
├── smoke-test.js    # 1-min sanity check
├── load-test.js     # 7-min baseline
├── stress-test.js   # 12-min breaking point
├── spike-test.js    # 6-min surge handling
├── soak-test.js     # 30-min stability
└── endurance-test.js # 1-hour endurance
```

---

## Quick Decision Tree

**New deployment?**
→ `k6 run k6/smoke-test.js` (1 min)

**Performance regression?**
→ `k6 run k6/load-test.js` (7 min)

**Need to scale?**
→ `k6 run k6/stress-test.js` (12 min)

**Production ready?**
→ `k6 run k6/soak-test.js` (30 min)

**Weekly check?**
→ `k6 run k6/endurance-test.js` (1 hour)

---

## Benchmark for 5,000 Students

| Stage | Users | p(95) | Errors | Throughput |
|-------|-------|-------|--------|-----------|
| Smoke | 1 | <200ms | 0% | 5 req/s |
| Load | 20 | <500ms | <5% | 100 req/s |
| Stress | 200 | <1000ms | <10% | 500 req/s |
| Peak | 500+ | Varies | <20% | 1000 req/s |

---

Run tests now: `k6 run k6/smoke-test.js` 🚀

