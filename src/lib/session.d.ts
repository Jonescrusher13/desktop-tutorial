import type { WorkbookData } from "../data/types";

export type FiscalYear = "FY26" | "FY27";

export type YearSlotState = {
  workbook: WorkbookData;
  fileName: string;
  loadedAt: string;
};

export type SessionState = {
  fy26: YearSlotState | null;
  fy27: YearSlotState | null;
  year: FiscalYear;
};

export function readSession(): SessionState | null;
export function writeSession(state: SessionState): void;
export function clearSession(): void;
