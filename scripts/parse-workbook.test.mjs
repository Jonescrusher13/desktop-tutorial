import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWorkbook } from "./parse-workbook.mjs";

const data = parseWorkbook();

test("reads Sheet0 with Annual Bookings and Sales Agent Name", () => {
  assert.deepEqual(data.sheets, ["Sheet0"]);
  assert.ok(data.headers.includes("Annual Bookings"));
  assert.ok(data.headers.includes("Sales Agent Name"));
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
