import * as XLSX from "xlsx";

export const REQUIRED_COLUMNS = ["Annual Bookings", "Sales Agent Name"];

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

export class WorkbookParseError extends Error {
  constructor(message, missing = []) {
    super(message);
    this.name = "WorkbookParseError";
    this.missing = missing;
  }
}

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

export function parseMbrWorkbook(buffer, sourceFile = "upload.xlsx") {
  let wb;
  try {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    wb = XLSX.read(bytes, { type: "array", cellDates: true });
  } catch {
    throw new WorkbookParseError(
      "Could not read that file as Excel. Drop an .xlsx MBR 360 export.",
    );
  }

  if (!wb.SheetNames?.length) {
    throw new WorkbookParseError("That workbook has no sheets.");
  }

  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], {
    header: 1,
    raw: true,
    defval: null,
  });

  const title = asText(rows[0]?.[0]);

  let headerRow = -1;
  for (let r = 0; r < rows.length; r += 1) {
    const names = (rows[r] || []).map(asText);
    if (REQUIRED_COLUMNS.every((col) => names.includes(col))) {
      headerRow = r;
      break;
    }
  }

  if (headerRow < 0) {
    const scanned = new Set();
    for (const row of rows.slice(0, 20)) {
      for (const cell of row || []) {
        const text = asText(cell);
        if (text) scanned.add(text);
      }
    }
    const missing = REQUIRED_COLUMNS.filter((col) => !scanned.has(col));
    throw new WorkbookParseError(
      `This file is missing required columns: ${missing.join(", ")}. Need an MBR 360 export with Annual Bookings and Sales Agent Name.`,
      missing,
    );
  }

  const bakedFilters = [];
  for (let r = 1; r < headerRow; r += 1) {
    for (const cell of rows[r] || []) {
      const text = asText(cell);
      if (text) bakedFilters.push(text);
    }
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
    sourceFile,
    originalName: sourceFile,
    sheets: wb.SheetNames,
    sheet: sheetName,
    title,
    bakedFilters,
    headers,
    lines,
  };
}
