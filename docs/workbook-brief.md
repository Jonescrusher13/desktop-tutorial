# Tennessee Region FY27 workbook brief

For Steve Jones. Source file: `Tennessee_Region_Pipeline_Services_Governance_FY27.xlsx` (created 2026-10-01). This is a **services-attach governance pack** for already-flagged pipeline, not a full bookings extract and not a live Salesforce dump. There is **no closed-bookings column**. Services dollars in the file are **Forecasted Services**.

The file has **no Excel tables, no AutoFilter, no freeze panes, and no data-validation dropdowns**. Scope is written in title/subtitle rows, not as filter controls.

---

## Sheets

### 1. `Executive Summary`

What it is: a one-page team snapshot of the flagged slice, plus a two-group quote-integration breakdown.

Grain:

- Rows 1–2 are title and scope (not a table).
- **KPI block (rows 5–6): one row = the Tennessee flagged set as a whole.**
- **Governance table (rows 9–12): one row = a quote-integration category**, plus a **totals row**.

### 2. `Flagged Opportunities`

What it is: the deal list behind the summary. Subtitle: `FY27 Q1 & Q2 Close Dates | Excludes Wireless APs & Meraki`.

Grain: **one row = one opportunity (deal)**. Rows 5–12 are deals. Row 13 is a **totals row** with formulas `=SUM(F5:F12)`, `=SUM(G5:G12)`, `=SUM(H5:H12)`, `=H13/F13`.

### 3. `Remediation Plan`

What it is: next actions for the two quote groups, with partner-facing notes.

Grain: **one row = one action group** (not a deal, not a rep, not a week). Two rows only.

---

## Column names (quote these)

### Bookings

**Not in the file.** Do not treat `Total TCV (USD)` or `Total Pipeline Value (TCV)` as closed bookings. Those are flagged **pipeline** dollars.

### Forecast / services / product amounts

| Sheet | Column | What it actually is |
| --- | --- | --- |
| `Flagged Opportunities` | `Forecasted Services` | Services dollars on the deal (almost all `$0`; one deal is `$2,500`) |
| `Flagged Opportunities` | `Total TCV (USD)` | Deal total contract value |
| `Flagged Opportunities` | `Technology (HW/SW)` | **A dollar amount**, not a product name or SKU |
| `Flagged Opportunities` | `Services Attach %` | Services / TCV on that deal |
| `Executive Summary` | `Total Forecasted Services` | Team rollup of forecasted services (`$2,500`) |
| `Executive Summary` | `Total Flagged Pipeline (TCV)` | Team pipeline (`$16,930,000`) |
| `Executive Summary` | `Total HW/SW Tech Value` | Team hardware/software dollars (`$16,927,500`) |
| `Executive Summary` | `Overall Services Attach Rate` | Team attach (`0.015%`; Excel format `0.02%` displays it as `0.02%`) |
| `Executive Summary` | `Forecasted Services` | Same idea, on the category table |
| `Executive Summary` | `Total Pipeline Value (TCV)` | Category pipeline |
| `Executive Summary` | `Avg Services Attach %` | Category attach |
| `Remediation Plan` | `Total TCV` | Group pipeline |

### Rep

| Sheet | Column |
| --- | --- |
| `Flagged Opportunities` | `Assigned AM` |

There is no quota, attainment, or bookings-vs-forecast-by-rep field.

### Account

| Sheet | Column |
| --- | --- |
| `Flagged Opportunities` | `Account Name` |
| `Flagged Opportunities` | `Opportunity Name` |

`Remediation Plan`.`Target Deals` is a **comma-separated account list with TCV in the same cell**, not an account table.

### Offer / SKU

**No offer, SKU, part number, or bill-of-materials column.** Closest fields:

| Sheet | Column | Notes |
| --- | --- | --- |
| `Flagged Opportunities` | `Primary Workload` | Workload text (e.g. `Enterprise Switching (C9300)`), not a SKU |
| `Flagged Opportunities` | `Technology (HW/SW)` | Dollars, not an offer name |
| `Remediation Plan` | `Step-by-Step Remediation Action` / `Forwardable Partner Guidance` | Mentions CX Standard (L1), CX Signature (L2), SNTC, Solution Support in **prose** |

### Stage

| Sheet | Column | Values in file |
| --- | --- | --- |
| `Flagged Opportunities` | `Stage` | `1 - Qualify`, `2 - Propose`, `3 - Tech Validation` |

### Dates

| Sheet | Column | Notes |
| --- | --- | --- |
| `Flagged Opportunities` | `Close Date` | **Text**, not Excel dates. Mixed formats: `2027-01-13 (Q2)`, `2026-12-18 (Q2)`, `Dec 2026 (Q2)`, `Nov 2026 (Q2)`, `Oct 2026 (Q1)`, `Jan 2027 (Q2)` |

No week grain. Fiscal period is only in the scope lines (`FY27 H1 (Q1 & Q2)`).

### Other deal fields

| Sheet | Column |
| --- | --- |
| `Flagged Opportunities` | `Salesforce Deal ID` |
| `Flagged Opportunities` | `CCW Quote Status` (`Integrated` / `Non-Integrated`) |
| `Flagged Opportunities` | `Governance & Action Plan` |

`Executive Summary` also has `Non-Integrated Quote Deals` (count `5`), `Integrated Deals (Need Uplift)` (count `3`), `Deal Count`, `Category / Classification`, `Primary Risk / Next Action`.

`Remediation Plan` columns: `Action Group`, `Target Deals`, `Total TCV`, `Key Vulnerability / Gap`, `Step-by-Step Remediation Action`, `Forwardable Partner Guidance`.

---

## Filters already in the file

These are **baked into which deals were included**, via subtitle text — not slicers:

From `Executive Summary` A2:

`Scope: FY27 H1 (Q1 & Q2) | Deals > $100K | Services Forecasted < $10K | Excludes Wireless APs & Meraki`

From `Flagged Opportunities` A2:

`FY27 Q1 & Q2 Close Dates | Excludes Wireless APs & Meraki`

From sheet titles: **Tennessee Region**.

There is **no services-vs-product filter**. The pack is already the low-services slice of HW/SW pipeline. Product vs services only appears as separate amount columns (`Technology (HW/SW)` vs `Forecasted Services`).

---

## Data quality

- **Totals mixed with deals.** `Flagged Opportunities` row 13 (`Total Flagged Opportunities`) and `Executive Summary` row 12 (`Total Flagged Pipeline`) will double-count if summed with detail rows.
- **`Assigned AM` is a placeholder on two deals** (Covenant Health, Cookeville Regional Medical Center). The cell value is the literal string `Assigned AM`, same as the column header.
- **`Salesforce Deal ID` = `None`** on five of eight deals (the Non-Integrated set).
- **`Close Date` formats are mixed** (ISO date + quarter vs month-year + quarter). Cannot chart a real week without parsing/guessing.
- **`Technology (HW/SW)` is money, not a SKU.** Easy to misread as an offer name.
- **Only one deal has forecasted services:** Regional One Health, `Forecasted Services` `$2,500`, `Services Attach %` `0.00649`. Excel format `0.0%` **displays that as `0.0%`**, so the only non-zero attach is hidden in the sheet view.
- On that same deal, `Total TCV (USD)` `$385,000` = `Technology (HW/SW)` `$382,500` + `Forecasted Services` `$2,500`. Every other deal has TCV = Technology and services `$0`.
- **Group labels do not match across sheets.** Summary uses `Group 2: Integrated Quotes (Basic SNTC / Support Uplift)`; remediation uses `Group 2: Support Uplift Backlog`. Group 1 names also differ slightly.
- Empty spacer row 3 on every sheet. Totals row on `Flagged Opportunities` leaves columns A–E and J–M blank.
- Eight deals only. This is a **watch list**, not the region’s full FY27 pipeline.

---

## First dashboard views this file can support

Only from fields that exist. No quota, no closed bookings, no SKU mix, no weekly trend.

1. **Team snapshot (new services forecast, not bookings)**  
   Cards from `Executive Summary`: `Total Flagged Pipeline (TCV)`, `Total HW/SW Tech Value`, `Total Forecasted Services`, `Overall Services Attach Rate`, `Non-Integrated Quote Deals`, `Integrated Deals (Need Uplift)`. This is the only team-level services-dollar view in the file (`$2,500` forecasted on `$16.93M` TCV).

2. **Forecasted services vs pipeline by deal**  
   From `Flagged Opportunities`: `Forecasted Services` next to `Total TCV (USD)` and `Technology (HW/SW)`, with `Services Attach %`. Makes the `$0` services problem visible deal by deal.

3. **Rep performance (`Assigned AM`)**  
   Roll up deal count, `Total TCV (USD)`, `Forecasted Services`, and attach from the deal rows. Team vs rep is this grain: team = all eight deals; rep = one `Assigned AM` (treat the placeholder `Assigned AM` as unassigned).

4. **Flagged pipeline list**  
   Sort/filter the eight opportunities by `Assigned AM`, `Stage`, `CCW Quote Status`, `Close Date` (Q1 vs Q2 text), `Account Name`. Show `Governance & Action Plan`.

5. **Quote-integration / remediation**  
   `Executive Summary` category table plus `Remediation Plan` rows: Group 1 Non-Integrated (`$7,101,000`, 5 deals) vs Group 2 integrated-but-basic-SNTC (`$9,829,000`, 3 deals). This is the governance story the workbook was built for.

Do not add win rate, quota, bookings-vs-forecast, or SKU attach. Those are not in the file.
