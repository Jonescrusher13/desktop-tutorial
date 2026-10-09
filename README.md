# Tennessee FY27 Annual Bookings dashboard

Web dashboard for Steve Jones’ Bookings 360 MBR extract (`mbr360DetailExcel_FY27.xlsx`).

The dashboard sums the **Annual Bookings** column and filters by **Sales Agent Name**. Dark theme.

Workbook brief: `docs/workbook-brief.md`

## Run

```bash
npm install
npm start
```

Then open http://localhost:5173

`npm start` parses `data/mbr360DetailExcel_FY27.xlsx` on boot. There is no manual Excel step.

## Other commands

```bash
npm test
npm run build
```
