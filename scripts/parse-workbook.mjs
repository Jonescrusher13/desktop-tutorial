import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { parseMbrWorkbook } from "../src/lib/parseMbr.js";

export function parseWorkbook(filePath) {
  if (!filePath) {
    throw new Error("Pass a path to an MBR 360 .xlsx (workbooks are not stored in this repo).");
  }
  const buffer = readFileSync(filePath);
  return parseMbrWorkbook(buffer, filePath.split("/").pop() ?? "upload.xlsx");
}

export { parseMbrWorkbook, WorkbookParseError, REQUIRED_COLUMNS } from "../src/lib/parseMbr.js";

const isMain =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const filePath = process.argv[2];
  const data = parseWorkbook(filePath);
  const annual = data.lines.reduce((s, line) => s + line["Annual Bookings"], 0);
  process.stdout.write(
    `Parsed ${data.lines.length} lines from ${data.sheet}; Annual Bookings ${annual}\n`,
  );
}
