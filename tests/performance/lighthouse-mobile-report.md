# Lighthouse Mobile Performance Audit

- Date: February 11, 2026
- Target URL: `http://127.0.0.1:4173/`
- Command:
  - `npx --yes lighthouse http://127.0.0.1:4173 --only-categories=performance --chrome-flags='--headless --no-sandbox' --output=json --output-path=tests/performance/lighthouse-mobile.json`

## Results

- Performance score: **97 / 100**
- First Contentful Paint (FCP): **1.8 s**
- Largest Contentful Paint (LCP): **2.3 s**
- Speed Index: **1.8 s**
- Total Blocking Time (TBT): **0 ms**
- Cumulative Layout Shift (CLS): **0**

## Outcome

- Phase 12.12 target (90+ mobile performance score): **Met**
