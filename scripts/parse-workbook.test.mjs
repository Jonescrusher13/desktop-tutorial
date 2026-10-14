import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import * as XLSX from "xlsx";
import { parseWorkbook, parseMbrWorkbook, WorkbookParseError } from "./parse-workbook.mjs";

const fy26Path = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "mbr360DetailExcel_FY26.xlsx");

const data = parseWorkbook();

test("reads Sheet0 with Annual Bookings and Sales Agent Name", () => {
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
  assert.equal(data.lines.length, 1959);
  assert.ok(!data.lines.some((line) => line["Sales Order Number"] === "Grand Total"));
  assert.ok(data.lines.every((line) => line["Sales Agent Name"]));
});

test("sums Annual Bookings and splits by Sales Agent Name", () => {
  const byAgent = new Map();
  let annual = 0;
  for (const line of data.lines) {
    annual += line["Annual Bookings"];
    const name = line["Sales Agent Name"];
    byAgent.set(name, (byAgent.get(name) ?? 0) + line["Annual Bookings"]);
  }
  assert.equal(annual, 337154);
  assert.equal(byAgent.size, 10);
  assert.equal(byAgent.get("Loyd,Mack"), 77624);
  assert.equal(byAgent.get("Tassio,Tim"), 26394);
  assert.equal(byAgent.get("Kelley,Steven"), 1442);
});

test("sums FY26 Annual Bookings from the Q1 extract", () => {
  const fy26 = parseWorkbook(fy26Path);
  assert.ok(fy26.headers.includes("Annual Bookings"));
  assert.ok(fy26.headers.includes("Sales Agent Name"));
  assert.deepEqual(fy26.bakedFilters, [
    "Product Service is equal to Service",
    "Year is equal to 2026",
    "Quarter is equal to Q1 FY2026",
    "Sales Motion is equal to New",
  ]);
  const annual = fy26.lines.reduce((sum, line) => sum + line["Annual Bookings"], 0);
  assert.equal(fy26.lines.length, 1765);
  assert.equal(annual, 524474);
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
