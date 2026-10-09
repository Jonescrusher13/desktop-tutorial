import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_XLSX = join(
  __dirname,
  "..",
  "data",
  "mbr360DetailExcel_FY27.xlsx",
);
export const DEFAULT_JSON = join(__dirname, "..", "src", "data", "workbook.json");

const LINE_FIELDS = [
  "Sales Order Number",
  "Deal ID",
  "End Customer Company Name",
  "End Customer Name",
  "Booked Date",
  "Bookings Type",
  "Sales Motion",
  "Annual Bookings",
  "MY Bookings",
  "Total Bookings",
  "Sales Agent Name",
  "L5",
  "Product Classification",
  "Service Category",
  "CX Product",
];

function asNumber(value) {
  if (value == null || value === "" || value === "-") return 0;
  if (typeof value === "number") return value;
  const n = Number(String(value).replace(/[$,]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function asText(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).trim();
}

function excelDate(value) {
  if (value == null || value === "" || value === "-") return "";
  if (value instanceof Date) {
    if (value.getFullYear() <= 1900) return "1900-01-01";
    return value.toISOString().slice(0, 10);
  }
  return asText(value);
}

export function parseWorkbook(filePath = DEFAULT_XLSX) {
  const wb = XLSX.read(readFileSync(filePath), {
    type: "buffer",
    cellDates: true,
  });
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null,
  });

  const title = asText(rows[0]?.[0]);
  const bakedFilters = [];
  for (let r = 1; r < Math.min(rows.length, 8); r += 1) {
    const row = rows[r] || [];
    for (const cell of row) {
      const text = asText(cell);
      if (text) bakedFilters.push(text);
    }
  }

  let headerRow = -1;
  for (let r = 0; r < rows.length; r += 1) {
    const names = (rows[r] || []).map(asText);
    if (names.includes("Annual Bookings") && names.includes("Sales Agent Name")) {
      headerRow = r;
      break;
    }
  }
  if (headerRow < 0) {
    throw new Error("Could not find Annual Bookings / Sales Agent Name headers");
  }

  const headers = (rows[headerRow] || []).map(asText);
  const index = Object.fromEntries(headers.map((name, i) => [name, i]));
  const col = (row, name) => row[index[name]];

  const lines = [];
  for (let r = headerRow + 1; r < rows.length; r += 1) {
    const row = rows[r] || [];
    const order = asText(col(row, "Sales Order Number"));
    if (!order) continue;
    if (order.toLowerCase() === "grand total") continue;

    const record = {};
    for (const name of LINE_FIELDS) {
      if (!(name in index)) continue;
      const raw = col(row, name);
      if (name === "Annual Bookings" || name === "MY Bookings" || name === "Total Bookings") {
        record[name] = asNumber(raw);
      } else if (name === "Booked Date") {
        record[name] = excelDate(raw);
      } else {
        record[name] = asText(raw);
      }
    }
    lines.push(record);
  }

  return {
    sourceFile: "mbr360DetailExcel_FY27.xlsx",
    originalName: "mbr360DetailExcel_2026-10-09T18_15_50Z_14705973296960010704.xlsx",
    sheets: wb.SheetNames,
    sheet: sheetName,
    title,
    bakedFilters,
    headers,
    lines,
  };
}

export function parseAndWrite(filePath = DEFAULT_XLSX, outPath = DEFAULT_JSON) {
  const data = parseWorkbook(filePath);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(data)}\n`);
  return data;
}

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const data = parseAndWrite();
  const annual = data.lines.reduce((s, line) => s + line["Annual Bookings"], 0);
  process.stdout.write(
    `Parsed ${data.lines.length} lines from ${data.sheet}; Annual Bookings ${annual}\n`,
  );
}
