import type { WorkbookData } from "../data/types";

export type SessionState = {
  workbook: WorkbookData;
  fileName: string;
  loadedAt: string;
};

export function readSession(): SessionState | null;
export function writeSession(workbook: WorkbookData, fileName: string, loadedAt: string): void;
export function clearSession(): void;
