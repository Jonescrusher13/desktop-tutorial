import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseMbrWorkbook } from "../src/lib/parseMbr.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_XLSX = join(
  __dirname,
  "..",
  "data",
  "mbr360DetailExcel_FY27.xlsx",
);

export function parseWorkbook(filePath = DEFAULT_XLSX) {
  const buffer = readFileSync(filePath);
  return parseMbrWorkbook(buffer, filePath.split("/").pop() ?? "mbr360DetailExcel_FY27.xlsx");
}

export { parseMbrWorkbook, WorkbookParseError, REQUIRED_COLUMNS } from "../src/lib/parseMbr.js";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const data = parseWorkbook();
  const annual = data.lines.reduce((s, line) => s + line["Annual Bookings"], 0);
  process.stdout.write(
    `Parsed ${data.lines.length} lines from ${data.sheet}; Annual Bookings ${annual}\n`,
  );
}
