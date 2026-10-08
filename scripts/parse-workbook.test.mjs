import assert from "node:assert/strict";
import { test } from "node:test";
import { parseWorkbook } from "./parse-workbook.mjs";

const data = parseWorkbook();

test("reads the three workbook sheets", () => {
  assert.deepEqual(data.sheets, [
    "Executive Summary",
    "Flagged Opportunities",
    "Remediation Plan",
  ]);
});

test("skips the Flagged Opportunities totals row", () => {
  const names = data.flaggedOpportunities.deals.map((d) => d["Opportunity Name"]);
  assert.equal(names.length, 8);
  assert.ok(!names.some((n) => n.startsWith("Total ")));
});

test("sums deal TCV and Forecasted Services to the Executive Summary KPIs", () => {
  const deals = data.flaggedOpportunities.deals;
  const tcv = deals.reduce((s, d) => s + d["Total TCV (USD)"], 0);
  const services = deals.reduce((s, d) => s + d["Forecasted Services"], 0);
  const kpis = Object.fromEntries(
    data.executiveSummary.kpis.map((k) => [k.label, k.value]),
  );
  assert.equal(tcv, 16_930_000);
  assert.equal(services, 2500);
  assert.equal(kpis["Total Flagged Pipeline (TCV)"], 16_930_000);
  assert.equal(kpis["Total Forecasted Services"], 2500);
  assert.equal(kpis["Non-Integrated Quote Deals"], 5);
  assert.equal(kpis["Integrated Deals (Need Uplift)"], 3);
});

test("keeps Assigned AM placeholder and missing Salesforce Deal ID as in the file", () => {
  const covenant = data.flaggedOpportunities.deals.find((d) =>
    d["Account Name"].includes("Covenant"),
  );
  assert.equal(covenant["Assigned AM"], "Assigned AM");
  assert.equal(covenant._amPlaceholder, true);
  assert.equal(covenant["Salesforce Deal ID"], null);
});

test("parses Close Date quarter text without inventing a date", () => {
  const firstHorizon = data.flaggedOpportunities.deals.find((d) =>
    d["Account Name"].includes("First Horizon"),
  );
  assert.equal(firstHorizon["Close Date"], "Oct 2026 (Q1)");
  assert.equal(firstHorizon._closeQuarter, "Q1");
});
