import assert from "node:assert/strict";
import { test } from "node:test";
import * as XLSX from "xlsx";
import { parseMbrWorkbook, WorkbookParseError } from "./parse-workbook.mjs";

function mbrBuffer({
  title = "Bookings 360|TEST|Refreshed",
  filters = [
    "Product Service is equal to Service",
    "Year is equal to 2027",
    "Quarter is equal to Q1 FY2027",
    "Sales Motion is equal to New and Unknown",
  ],
  rows = [
    ["SO-1", "D-1", "Acme", "Loyd,Mack", 100, 10, 110],
    ["SO-2", "D-2", "Beta", "Tassio,Tim", 40, 5, 45],
    ["SO-3", "D-3", "Acme", "Loyd,Mack", 25, 0, 25],
    ["Grand Total", "", "", "", 165, 15, 180],
  ],
} = {}) {
  const header = [
    "Sales Order Number",
    "Deal ID",
    "End Customer Company Name",
    "Sales Agent Name",
    "Annual Bookings",
    "MY Bookings",
    "Total Bookings",
  ];
  const aoa = [[title], ...filters.map((text) => [null, null, text]), header, ...rows];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet0");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

test("reads Sheet0 with Annual Bookings and Sales Agent Name", () => {
  const data = parseMbrWorkbook(mbrBuffer(), "sample.xlsx");
  assert.deepEqual(data.sheets, ["Sheet0"]);
  assert.ok(data.headers.includes("Annual Bookings"));
  assert.ok(data.headers.includes("Sales Agent Name"));
  assert.deepEqual(data.bakedFilters, [
    "Product Service is equal to Service",
    "Year is equal to 2027",
    "Quarter is equal to Q1 FY2027",
    "Sales Motion is equal to New and Unknown",
  ]);
});

test("skips the Grand Total row and keeps detail grain", () => {
  const data = parseMbrWorkbook(mbrBuffer(), "sample.xlsx");
  assert.equal(data.lines.length, 3);
  assert.ok(!data.lines.some((line) => line["Sales Order Number"] === "Grand Total"));
  assert.ok(data.lines.every((line) => line["Sales Agent Name"]));
});

test("sums Annual Bookings and splits by Sales Agent Name", () => {
  const data = parseMbrWorkbook(mbrBuffer(), "sample.xlsx");
  const byAgent = new Map();
  let annual = 0;
  for (const line of data.lines) {
    annual += line["Annual Bookings"];
    const name = line["Sales Agent Name"];
    byAgent.set(name, (byAgent.get(name) ?? 0) + line["Annual Bookings"]);
  }
  assert.equal(annual, 165);
  assert.equal(byAgent.size, 2);
  assert.equal(byAgent.get("Loyd,Mack"), 125);
  assert.equal(byAgent.get("Tassio,Tim"), 40);
});

test("parses a second-year buffer independently", () => {
  const fy26 = parseMbrWorkbook(
    mbrBuffer({
      filters: [
        "Product Service is equal to Service",
        "Year is equal to 2026",
        "Quarter is equal to Q1 FY2026",
        "Sales Motion is equal to New",
      ],
      rows: [
        ["SO-9", "D-9", "Acme", "Loyd,Mack", 50, 0, 50],
        ["Grand Total", "", "", "", 50, 0, 50],
      ],
    }),
    "fy26-sample.xlsx",
  );
  assert.deepEqual(fy26.bakedFilters, [
    "Product Service is equal to Service",
    "Year is equal to 2026",
    "Quarter is equal to Q1 FY2026",
    "Sales Motion is equal to New",
  ]);
  const annual = fy26.lines.reduce((sum, line) => sum + line["Annual Bookings"], 0);
  assert.equal(fy26.lines.length, 1);
  assert.equal(annual, 50);
});

test("rejects a workbook missing Annual Bookings and Sales Agent Name", () => {
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Not an MBR export"],
    ["Account", "Amount"],
    ["Acme", 100],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet0");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  assert.throws(
    () => parseMbrWorkbook(buffer, "wrong.xlsx"),
    (err) => {
      assert.ok(err instanceof WorkbookParseError);
      assert.ok(err.message.includes("Annual Bookings"));
      assert.ok(err.message.includes("Sales Agent Name"));
      return true;
    },
  );
});
