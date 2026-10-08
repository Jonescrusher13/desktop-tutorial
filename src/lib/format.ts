import type { Deal } from "../data/types";

export function money(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function attachPct(value: number): string {
  if (!value) return "0.00%";
  const pct = value * 100;
  if (pct < 0.1) return `${pct.toFixed(3)}%`;
  return `${pct.toFixed(2)}%`;
}

export function amLabel(deal: Pick<Deal, "Assigned AM" | "_amPlaceholder">): string {
  return deal._amPlaceholder ? "Unassigned (file says Assigned AM)" : deal["Assigned AM"];
}

export function unique(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function attachFromAmounts(services: number, tcv: number): number {
  if (!tcv) return 0;
  return services / tcv;
}
