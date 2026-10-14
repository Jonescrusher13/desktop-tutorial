const KEY_V1 = "mbr360.dashboard.v1";
const KEY = "mbr360.dashboard.v2";

function validSlot(slot) {
  return Boolean(slot?.workbook?.lines && slot.fileName && slot.loadedAt);
}

export function readSession() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        fy26: validSlot(parsed.fy26) ? parsed.fy26 : null,
        fy27: validSlot(parsed.fy27) ? parsed.fy27 : null,
        year: parsed.year === "FY26" || parsed.year === "FY27" ? parsed.year : "FY27",
      };
    }
    const legacy = sessionStorage.getItem(KEY_V1);
    if (!legacy) return null;
    const parsed = JSON.parse(legacy);
    if (!validSlot(parsed)) return null;
    return { fy26: null, fy27: parsed, year: "FY27" };
  } catch {
    return null;
  }
}

export function writeSession(state) {
  const payload = JSON.stringify({
    fy26: state.fy26,
    fy27: state.fy27,
    year: state.year,
  });
  sessionStorage.setItem(KEY, payload);
}

export function clearSession() {
  sessionStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY_V1);
}
