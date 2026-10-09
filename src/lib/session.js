const KEY = "mbr360.dashboard.v1";

export function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.workbook?.lines || !parsed.fileName || !parsed.loadedAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeSession(workbook, fileName, loadedAt) {
  const payload = JSON.stringify({ workbook, fileName, loadedAt });
  sessionStorage.setItem(KEY, payload);
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
}
