# Café Ops

A private, local café consulting dashboard built with Next.js and SQLite. Create cafés, switch between them, and keep each restaurant's team, menu costs, payroll, sales, wastage, and SOP records isolated.

## Run

```powershell
npm install
npm run dev
```

Open http://localhost:3000 and create or select a café. Adding or editing records automatically saves them to the local SQLite database. The active café and its records are shared across ports and app restarts on this Windows user account.

## Database location

By default the SQLite file lives at `%LOCALAPPDATA%\CafeOps\cafe-ops.sqlite`. You can override this with `CAFE_OPS_DB_PATH`. An earlier project-folder database is migrated on first run when present. The database stays on this computer; it is not synced between devices or protected by user sign-in.

## Café economics

- Menu costing separates wholesale raw material, wastage, prep-time labour allocation, packaging, service cost, per-sale staff incentive, selling price, full build cost, and profit per serving.
- Prep-time labour is estimated from the café team's average hourly base wage. It is shown in item costing; the owner-benefit calculation deducts payroll once to avoid double counting.
- Monthly contribution is compared with monthly base payroll. The dashboard labels payroll coverage as Healthy (1.5× or more), Tight (1× to under 1.5×), or At risk (below 1×).
- Daily base pay is monthly salary divided by work days.
- SOP checks record the staff member, shift, procedure, result, and corrective notes. Grades use the recorded checks: Good (85%+), Middle (65–84%), Needs improvement (below 65%).

Import an Excel/CSV workbook from an operations section and export the selected café's records as an Excel backup. Confirm imported values and formulas against the original sheets.
