# Tennessee FY27 services governance dashboard

Web dashboard for Steve Jones’ Tennessee Region Pipeline Services Governance FY27 workbook.

The spreadsheet is a flagged-pipeline / services-attach pack. It has **no closed-bookings column**. Services dollars come from **Forecasted Services**.

Workbook brief: `docs/workbook-brief.md`

## Run

```bash
npm install
npm start
```

Then open http://localhost:5173

`npm start` parses `data/Tennessee_Region_Pipeline_Services_Governance_FY27.xlsx` into JSON on boot. There is no manual Excel step.

## Other commands

```bash
npm test    # parser checks against the xlsx
npm run build
```

## Views

- Team snapshot — Executive Summary KPIs
- Forecasted services — deal-level Forecasted Services vs Technology (HW/SW)
- Rep performance — rollup by Assigned AM
- Flagged opportunities — deal list
- Remediation plan — the two action groups

Filters: Assigned AM, Stage, CCW Quote Status, Close Date quarter (from the text in the file).
