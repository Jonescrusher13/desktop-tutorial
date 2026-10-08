import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_XLSX = join(
  __dirname,
  "..",
  "data",
  "Tennessee_Region_Pipeline_Services_Governance_FY27.xlsx",
);
export const DEFAULT_JSON = join(__dirname, "..", "src", "data", "workbook.json");

const TOTAL_LABELS = new Set([
  "Total Flagged Pipeline",
  "Total Flagged Opportunities",
]);

function sheetRows(wb, name) {
  const sheet = wb.Sheets[name];
  if (!sheet) {
    throw new Error(`Missing sheet: ${name}`);
  }
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: true,
    defval: null,
  });
}

function asNumber(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    if (value.startsWith("=")) return null;
    const n = Number(String(value).replace(/[$,]/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function asText(value) {
  if (value == null) return "";
  return String(value).trim();
}

function closeQuarter(closeDate) {
  const match = asText(closeDate).match(/\((Q[12])\)/i);
  return match ? match[1].toUpperCase() : "";
}

function salesforceId(value) {
  const text = asText(value);
  if (!text || text.toLowerCase() === "none") return null;
  return text;
}

export function parseWorkbook(filePath = DEFAULT_XLSX) {
  const wb = XLSX.read(readFileSync(filePath), { type: "buffer", cellFormula: true });
  const sheetNames = wb.SheetNames;

  const execRows = sheetRows(wb, "Executive Summary");
  const dealRows = sheetRows(wb, "Flagged Opportunities");
  const planRows = sheetRows(wb, "Remediation Plan");

  const kpiLabels = (execRows[4] || []).map(asText);
  const kpiValues = execRows[5] || [];
  const kpis = kpiLabels.map((label, i) => ({
    label,
    value: asNumber(kpiValues[i]),
  }));

  const breakdownHeaders = (execRows[8] || []).map(asText);
  const breakdown = [];
  for (let r = 9; r < execRows.length; r += 1) {
    const row = execRows[r] || [];
    const category = asText(row[0]);
    if (!category) continue;
    breakdown.push({
      "Category / Classification": category,
      "Deal Count": asNumber(row[1]),
      "Total Pipeline Value (TCV)": asNumber(row[2]),
      "Forecasted Services": asNumber(row[3]),
      "Avg Services Attach %": asNumber(row[4]),
      "Primary Risk / Next Action": asText(row[5]),
      isTotal: TOTAL_LABELS.has(category),
    });
  }

  const dealHeaders = (dealRows[3] || []).map(asText);
  const headerIndex = Object.fromEntries(dealHeaders.map((h, i) => [h, i]));
  const col = (row, name) => row[headerIndex[name]];

  const deals = [];
  for (let r = 4; r < dealRows.length; r += 1) {
    const row = dealRows[r] || [];
    const opportunityName = asText(col(row, "Opportunity Name"));
    if (!opportunityName) continue;
    if (TOTAL_LABELS.has(opportunityName)) continue;

    const assignedAm = asText(col(row, "Assigned AM"));
    const closeDate = asText(col(row, "Close Date"));
    deals.push({
      "Opportunity Name": opportunityName,
      "Account Name": asText(col(row, "Account Name")),
      "Assigned AM": assignedAm,
      Stage: asText(col(row, "Stage")),
      "Close Date": closeDate,
      "Total TCV (USD)": asNumber(col(row, "Total TCV (USD)")),
      "Technology (HW/SW)": asNumber(col(row, "Technology (HW/SW)")),
      "Forecasted Services": asNumber(col(row, "Forecasted Services")),
      "Services Attach %": asNumber(col(row, "Services Attach %")),
      "Salesforce Deal ID": salesforceId(col(row, "Salesforce Deal ID")),
      "CCW Quote Status": asText(col(row, "CCW Quote Status")),
      "Primary Workload": asText(col(row, "Primary Workload")),
      "Governance & Action Plan": asText(col(row, "Governance & Action Plan")),
      _closeQuarter: closeQuarter(closeDate),
      _amPlaceholder: assignedAm === "Assigned AM",
    });
  }

  const planHeaders = (planRows[3] || []).map(asText);
  const planIndex = Object.fromEntries(planHeaders.map((h, i) => [h, i]));
  const groups = [];
  for (let r = 4; r < planRows.length; r += 1) {
    const row = planRows[r] || [];
    const actionGroup = asText(row[planIndex["Action Group"]]);
    if (!actionGroup) continue;
    groups.push({
      "Action Group": actionGroup,
      "Target Deals": asText(row[planIndex["Target Deals"]]),
      "Total TCV": asNumber(row[planIndex["Total TCV"]]),
      "Key Vulnerability / Gap": asText(row[planIndex["Key Vulnerability / Gap"]]),
      "Step-by-Step Remediation Action": asText(
        row[planIndex["Step-by-Step Remediation Action"]],
      ),
      "Forwardable Partner Guidance": asText(
        row[planIndex["Forwardable Partner Guidance"]],
      ),
    });
  }

  return {
    sourceFile: "Tennessee_Region_Pipeline_Services_Governance_FY27.xlsx",
    sheets: sheetNames,
    executiveSummary: {
      title: asText(execRows[0]?.[0]),
      scope: asText(execRows[1]?.[0]),
      kpis,
      breakdownTitle: asText(execRows[7]?.[0]),
      breakdownHeaders,
      breakdown,
    },
    flaggedOpportunities: {
      title: asText(dealRows[0]?.[0]),
      scope: asText(dealRows[1]?.[0]),
      headers: dealHeaders,
      deals,
    },
    remediationPlan: {
      title: asText(planRows[0]?.[0]),
      subtitle: asText(planRows[1]?.[0]),
      groups,
    },
  };
}

export function parseAndWrite(filePath = DEFAULT_XLSX, outPath = DEFAULT_JSON) {
  const data = parseWorkbook(filePath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(data, null, 2)}\n`);
  return data;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const data = parseAndWrite();
  process.stdout.write(
    `Parsed ${data.flaggedOpportunities.deals.length} deals from ${data.sheets.join(", ")}\n`,
  );
}
