# Café Ops

A local-first café operations app built with Next.js, TypeScript, and SQLite (`cafe-ops.sqlite`). It brings together the provided menu costing, staff/payroll, sales, wastage, and prevention SOP workbooks.

## Start

```powershell
npm install
npm run dev
```

Open http://localhost:3000. Records are stored in the SQLite database in this project folder. Import an `.xlsx`/`.xls` workbook from any operations page; supported sheets are mapped into the corresponding registers. Use **Export backup** to download all app data as a multi-sheet Excel workbook.

## Included

- Dashboard with menu revenue/contribution estimates, sales log totals, wastage loss and team snapshot
- Menu item contribution costing using cost, wastage, fees, serving charges, and daily volume
- Staff responsibilities and salary information, ingredient stock/reorder data, recipe lines, sales log, monthly payroll, wastage/corrective actions, and SOP library
- Search, add, edit, delete, workbook import, and full workbook export
- SQLite data remains local to the running app; no hosted service is required

Workbook import maps common English sheet names and column headings. Check imported records after bringing in source workbooks, especially sheets with custom headings or formulas.
