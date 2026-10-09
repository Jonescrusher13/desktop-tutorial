# FY27 workbook brief

Steve Jones. Current dashboard source is the Bookings 360 MBR extract, not the earlier attach-governance pack.

---

## Current source: `mbr360DetailExcel_FY27.xlsx`

Uploaded as `mbr360DetailExcel_2026-10-09T18_15_50Z_14705973296960010704.xlsx`.

### Sheets

One sheet: **`Sheet0`**.

- **A1** (merged A1:E1): `Bookings 360|WK11 / OCT FY2027 / Q1 FY2027|Refreshed on 2026-10-08 08:00:00 PM`
- **C3–C6** are already-applied report filters (not Excel AutoFilter):
  - `Product Service is equal to Service`
  - `Year is equal to 2027`
  - `Quarter is equal to Q1 FY2027`
  - `Sales Motion is equal to New and Unknown`
- **Row 8** is the column header row (82 columns, A–CD).
- **Rows 9–1967** are detail lines.
- **Row 1968** is a **`Grand Total`** row. `Sales Agent Name` is blank. `Annual Bookings` on that row is `337160`. **Exclude this row** from sums or it double-counts.

### Grain

**One row = one bookings line** on `Sheet0`. Not one deal, not one rep, not one week.

The same `Sales Order Number` / `Deal ID` can appear on many lines (different product/service split, dates, or adjustments). Negative `Annual Bookings` values are in the file (adjustments); they are part of the column.

### Sales Agent field

| Sheet | Column | Notes |
| --- | --- | --- |
| `Sheet0` | **`Sales Agent Name`** | Agent filter. Values look like `Loyd,Mack`, `Tassio,Tim`, `Bailes,Andy`. |
| `Sheet0` | `Sales Agent Number` | Numeric agent ID (not used as the filter). |
| `Sheet0` | `Email Address` | Short name such as `ttassio` (not a mailbox password; still not shown on the dashboard). |

Ten named agents on the detail rows. The Grand Total row has a blank `Sales Agent Name` — that is not an agent.

### Annual Bookings header

| Sheet | Column | What it is |
| --- | --- | --- |
| `Sheet0` | **`Annual Bookings`** | The bookings dollars to display. Line-level amount. |
| `Sheet0` | `MY Bookings` | Also in the file, next to Annual Bookings. |
| `Sheet0` | `Total Bookings` | Also in the file, next to Annual Bookings. |

**How the dashboard calculates Annual Bookings:** sum of `Sheet0`.`Annual Bookings` on detail rows (9–1967), after dropping `Grand Total`. Optional filter: `Sales Agent Name` equals the selected agent, or all agents.

Detail-line sum is **$337,154**. The sheet’s `Grand Total` cell is **$337,160** ($6 difference). The live filter uses the line sum so agent amounts add up.

All-agents and the ten `Sales Agent Name` values (line sum of `Annual Bookings`):

| Sales Agent Name | Annual Bookings |
| --- | ---: |
| Loyd,Mack | $77,624 |
| Smith,Mark | $57,897 |
| Cotton,Buddy | $48,561 |
| Yarbrough,Jesica | $40,654 |
| Tassio,Tim | $26,394 |
| Moseley,Broc | $26,262 |
| Davis,Michael | $23,044 |
| Knight,James | $22,145 |
| Bailes,Andy | $13,131 |
| Kelley,Steven | $1,442 |
| **All agents (detail sum)** | **$337,154** |

### Other columns on `Sheet0` (row 8 names)

`Sales Order Number`, `Deal ID`, `End Customer Company Name`, `End Customer Name`, `Booked Date`, `Bookings Type`, `Sales Motion`, `Transaction Date`, `AI Flag`, `AI Intent`, `AI Customer Class`, `AI Customer Subclass`, `Annual Bookings`, `MY Bookings`, `Total Bookings`, `Sales Agent Name`, `Quarter ID`, `Month ID`, `Week ID`, `L1`–`L6` (`L5` is `TENNESSEE REGION` on detail rows), `Country`, `SCMS`, `Sub SCMS`, `Email Address`, `Sales Agent Number`, `Service Category`, `Allocated Service Group`, `Service Level`, `Product Classification`, `Software Type`, `Software Stack`, `Monetization Type`, `Offer Type`, `Buying Program`, `Product Sub Group`, `CX Upsell Group`, `CX Product Portfolio`, `CX Product Category`, `CX Product`, `Bookings Adjustment Code`, `Bookings Adjustment Description`, `Path`, `CBN Flag`, `Bookings Channels Flag`, `Recurring Offer Flag`, `SaaS Flag`, `Buying Program Flag`, `Splunk Flag`, `AppD Flag`, `Purchase Order Number`, `Partner Name`, `Partner Certification`, `Partner Type`, `Business Entity ID`, `Partner Country`, `Registered Partner Flag`, `BE GEO ID`, `BE GEO Name`, `Sold To Company Name`, `Bill To Global Ultimate Name`, `Bill To Company Name`, `GU Party ID`, `HQ Party ID`, `End Customer Global Ultimate (Account)`, `End Customer Headquarters (HQ)`, `End Customer Branch (BR)`, `End Customer Site City`, `End Customer Site Postal Code`, `Ship To Site City`, `Ship To Site Postal Code`, `Branch Party ID`, `Master Distributor Name`, `Distributor Name`, `Service Contract Start Date`, `Service Contract End Date`, `Service Contract Term`, `Service Contract Number`.

### Data quality

- Totals row mixed with detail (`Grand Total`).
- 619 detail lines have **negative** `Annual Bookings`.
- Some `Booked Date` values are `1900-01-01` (placeholder).
- No Excel table / AutoFilter on the sheet; scope is the C3–C6 predicates plus L5 Tennessee on the lines.
- **No forecast column** in this extract. Do not reuse the old `Forecasted Services` metrics here.

---

## Prior upload (not used by the dashboard)

`Tennessee_Region_Pipeline_Services_Governance_FY27.xlsx` — three sheets (`Executive Summary`, `Flagged Opportunities`, `Remediation Plan`). That file is a services-attach watch list. It has **`Assigned AM`**, not `Sales Agent Name`, and **no `Annual Bookings` column**. Steve asked the dashboard to use the MBR extract instead.
