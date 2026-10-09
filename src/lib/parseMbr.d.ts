import type { WorkbookData } from "../data/types";

export const REQUIRED_COLUMNS: string[];

export class WorkbookParseError extends Error {
  missing: string[];
  constructor(message: string, missing?: string[]);
}

export function parseMbrWorkbook(buffer: ArrayBuffer | Uint8Array, sourceFile?: string): WorkbookData;
