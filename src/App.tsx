import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingLine, WorkbookData } from "./data/types";
import { money, unique } from "./lib/format";
import { parseMbrWorkbook, WorkbookParseError } from "./lib/parseMbr.js";
import { readSession, writeSession, type FiscalYear, type YearSlotState } from "./lib/session.js";

const ALL = "all";
const YEARS: FiscalYear[] = ["FY26", "FY27"];

type Slot = {
  workbook: WorkbookData | null;
  fileName: string;
  loadedAt: string;
  error: string;
  status: string;
  dragOver: boolean;
};

const EMPTY_SLOT: Slot = {
  workbook: null,
  fileName: "",
  loadedAt: "",
  error: "",
  status: "",
  dragOver: false,
};

function rollup(lines: BookingLine[]) {
  return {
    annual: lines.reduce((sum, line) => sum + line["Annual Bookings"], 0),
    my: lines.reduce((sum, line) => sum + line["MY Bookings"], 0),
    total: lines.reduce((sum, line) => sum + line["Total Bookings"], 0),
    count: lines.length,
  };
}

function groupSum(
  lines: BookingLine[],
  key: keyof BookingLine,
): { label: string; annual: number; count: number }[] {
  const groups = new Map<string, { annual: number; count: number }>();
  for (const line of lines) {
    const label = String(line[key] || "(blank)");
    const current = groups.get(label) ?? { annual: 0, count: 0 };
    current.annual += line["Annual Bookings"];
    current.count += 1;
    groups.set(label, current);
  }
  return [...groups.entries()]
    .map(([label, value]) => ({ label, ...value }))
    .sort((a, b) => b.annual - a.annual);
}

function formatLoadedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function parseFile(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  return parseMbrWorkbook(buffer, file.name);
}

function persistable(slot: Slot): YearSlotState | null {
  if (!slot.workbook || !slot.fileName || !slot.loadedAt) return null;
  return { workbook: slot.workbook, fileName: slot.fileName, loadedAt: slot.loadedAt };
}

function fromSaved(saved: YearSlotState | null | undefined): Slot {
  if (!saved) return { ...EMPTY_SLOT };
  return {
    ...EMPTY_SLOT,
    workbook: saved.workbook,
    fileName: saved.fileName,
    loadedAt: saved.loadedAt,
  };
}

export default function App() {
  const [year, setYear] = useState<FiscalYear>("FY27");
  const [slots, setSlots] = useState<Record<FiscalYear, Slot>>({
    FY26: { ...EMPTY_SLOT, status: "No FY26 file yet." },
    FY27: { ...EMPTY_SLOT, status: "No FY27 file yet." },
  });
  const [agent, setAgent] = useState(ALL);
  const [ready, setReady] = useState(false);

  const persist = useCallback((nextYear: FiscalYear, nextSlots: Record<FiscalYear, Slot>) => {
    try {
      writeSession({
        year: nextYear,
        fy26: persistable(nextSlots.FY26),
        fy27: persistable(nextSlots.FY27),
      });
    } catch {
      // Session storage is best-effort; files stay in this tab's memory.
    }
  }, []);

  useEffect(() => {
    const existing = readSession();
    if (existing) {
      setYear(existing.year);
      setSlots({
        FY26: existing.fy26
          ? fromSaved(existing.fy26)
          : { ...EMPTY_SLOT, status: "No FY26 file yet." },
        FY27: existing.fy27
          ? fromSaved(existing.fy27)
          : { ...EMPTY_SLOT, status: "No FY27 file yet." },
      });
    } else {
      setSlots({
        FY26: { ...EMPTY_SLOT, status: "No FY26 file yet." },
        FY27: { ...EMPTY_SLOT, status: "No FY27 file yet." },
      });
    }
    setReady(true);
  }, []);

  const onFiles = useCallback(
    async (target: FiscalYear, list: FileList | null) => {
      const file = list?.[0];
      if (!file) return;
      setSlots((current) => ({
        ...current,
        [target]: { ...current[target], error: "", status: `Reading ${file.name}…`, dragOver: false },
      }));
      try {
        const data = await parseFile(file);
        const loadedAt = new Date().toISOString();
        setSlots((current) => {
          const next = {
            ...current,
            [target]: {
              workbook: data,
              fileName: file.name,
              loadedAt,
              error: "",
              status: "",
              dragOver: false,
            },
          };
          persist(target, next);
          return next;
        });
        setYear(target);
        setAgent(ALL);
      } catch (err) {
        const message =
          err instanceof WorkbookParseError
            ? err.message
            : "Could not parse that file in the browser. Use an .xlsx MBR 360 export.";
        setSlots((current) => ({
          ...current,
          [target]: { ...current[target], status: "", error: message, dragOver: false },
        }));
      }
    },
    [persist],
  );

  const selectYear = useCallback((next: FiscalYear) => {
    setYear(next);
    setAgent(ALL);
    setSlots((current) => {
      persist(next, current);
      return current;
    });
  }, [persist]);

  const active = slots[year];
  const workbook = active.workbook;
  const lines = workbook?.lines ?? [];
  const agents = unique(lines.map((line) => line["Sales Agent Name"]));
  const filtered = useMemo(() => {
    if (agent === ALL) return lines;
    return lines.filter((line) => line["Sales Agent Name"] === agent);
  }, [lines, agent]);

  const stats = rollup(filtered);
  const byAgent = groupSum(filtered, "Sales Agent Name");
  const byCustomer = groupSum(filtered, "End Customer Company Name").slice(0, 12);
  const titleParts = (workbook?.title ?? "").split("|").map((part) => part.trim());

  return (
    <>
      <header className="masthead">
        <p className="kicker">Bookings 360 · {year}</p>
        <h1>Annual Bookings</h1>
        <p className="lede">
          Amounts are the <strong>Annual Bookings</strong> column from the selected year’s MBR 360
          file. Filter by <strong>Sales Agent Name</strong>. Each year’s .xlsx is parsed in this
          browser only.
        </p>
        {titleParts[2] ? <p className="notice">{titleParts[2]}</p> : null}
        {workbook?.bakedFilters?.length ? (
          <div className="chips">
            {workbook.bakedFilters.map((chip) => (
              <span className="chip" key={chip}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </header>

      <div className="dropzones">
        {YEARS.map((slotYear) => (
          <YearDropzone
            key={slotYear}
            year={slotYear}
            slot={slots[slotYear]}
            selected={year === slotYear}
            onDrag={(over) =>
              setSlots((current) => ({
                ...current,
                [slotYear]: { ...current[slotYear], dragOver: over },
              }))
            }
            onFiles={(files) => void onFiles(slotYear, files)}
          />
        ))}
      </div>

      <section className="toolbar" aria-label="Filters">
        <div className="mode" role="group" aria-label="Fiscal year">
          {YEARS.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={year === item}
              data-testid={`year-${item.toLowerCase()}`}
              onClick={() => selectYear(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label>
          Sales Agent Name
          <select
            value={agent}
            onChange={(event) => setAgent(event.target.value)}
            aria-label="Sales Agent Name"
            disabled={!workbook}
          >
            <option value={ALL}>All agents</option>
            {agents.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </section>

      {workbook ? (
        <>
          <section>
            <h2>Annual Bookings</h2>
            <p className="section-help">
              {year}.{" "}
              {agent === ALL
                ? `All ${agents.length} Sales Agent Name values. ${stats.count} lines.`
                : `${agent}. ${stats.count} lines.`}{" "}
              Sum of the Annual Bookings field on each detail row (Grand Total row excluded).
            </p>
            <p className="hero-metric" data-testid="annual-bookings">
              {money(stats.annual)}
            </p>
            <dl className="kpis">
              <div className="kpi">
                <dt>Annual Bookings</dt>
                <dd>{money(stats.annual)}</dd>
              </div>
              <div className="kpi">
                <dt>MY Bookings</dt>
                <dd>{money(stats.my)}</dd>
              </div>
              <div className="kpi">
                <dt>Total Bookings</dt>
                <dd>{money(stats.total)}</dd>
              </div>
              <div className="kpi">
                <dt>Lines</dt>
                <dd>{stats.count.toLocaleString("en-US")}</dd>
              </div>
            </dl>

            <div className="grid-2">
              <article className="panel">
                <h3>Annual Bookings by Sales Agent Name</h3>
                <MoneyBars rows={byAgent.map((row) => ({ label: row.label, value: row.annual }))} />
                <div className="table-wrap" style={{ marginTop: 12 }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Sales Agent Name</th>
                        <th className="num">Lines</th>
                        <th className="num">Annual Bookings</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byAgent.map((row) => (
                        <tr
                          key={row.label}
                          className="rep-row"
                          aria-selected={agent === row.label}
                          onClick={() => setAgent(row.label)}
                        >
                          <td>{row.label}</td>
                          <td className="num">{row.count.toLocaleString("en-US")}</td>
                          <td className="num">{money(row.annual)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
              <article className="panel">
                <h3>Annual Bookings by End Customer Company Name</h3>
                <MoneyBars rows={byCustomer.map((row) => ({ label: row.label, value: row.annual }))} />
              </article>
            </div>
          </section>

          <section style={{ marginTop: 28 }}>
            <h2>Booking lines</h2>
            <p className="section-help">
              One row = one line in the {year} file. Same Sales Order Number / Deal ID can appear more
              than once.
            </p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Sales Agent Name</th>
                    <th>End Customer Company Name</th>
                    <th>Deal ID</th>
                    <th>Sales Order Number</th>
                    <th>Booked Date</th>
                    <th>Sales Motion</th>
                    <th>Bookings Type</th>
                    <th className="num">Annual Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 80).map((line, i) => (
                    <tr key={`${line["Sales Order Number"]}-${line["Deal ID"]}-${i}`}>
                      <td>{line["Sales Agent Name"]}</td>
                      <td>{line["End Customer Company Name"]}</td>
                      <td>{line["Deal ID"]}</td>
                      <td>{line["Sales Order Number"]}</td>
                      <td>{line["Booked Date"]}</td>
                      <td>{line["Sales Motion"]}</td>
                      <td>{line["Bookings Type"]}</td>
                      <td className="num">{money(line["Annual Bookings"])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 80 ? (
              <p className="footnote">
                Showing first 80 of {filtered.length.toLocaleString("en-US")} lines.
              </p>
            ) : null}
          </section>
        </>
      ) : (
        <p className="empty" data-testid="empty-year">
          {ready
            ? `No ${year} workbook loaded. Drop an MBR 360 .xlsx in the ${year} slot — this view will not use the other year’s Annual Bookings.`
            : active.status || `Loading ${year}…`}
        </p>
      )}

      <p className="footnote">
        FY26 and FY27 stay in this browser tab (session storage) until the tab closes. No login and no
        third-party upload.
      </p>
    </>
  );
}

function YearDropzone({
  year,
  slot,
  selected,
  onDrag,
  onFiles,
}: {
  year: FiscalYear;
  slot: Slot;
  selected: boolean;
  onDrag: (over: boolean) => void;
  onFiles: (files: FileList | null) => void;
}) {
  return (
    <section
      className={`dropzone${slot.dragOver ? " is-drag" : ""}${selected ? " is-selected" : ""}`}
      data-testid={`upload-box-${year.toLowerCase()}`}
      onDragEnter={(event) => {
        event.preventDefault();
        onDrag(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDrag(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <p className="dropzone-title">{year} MBR 360</p>
      <p className="dropzone-help">Drop an .xlsx or choose a file. Parsed in this browser only.</p>
      <label className="file-button">
        Choose {year} file
        <input
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          aria-label={`Upload ${year} MBR 360 workbook`}
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
        />
      </label>
      {slot.fileName ? (
        <p className="file-meta" data-testid={`loaded-file-${year.toLowerCase()}`}>
          Loaded <strong>{slot.fileName}</strong>
          {slot.loadedAt ? ` · Refreshed ${formatLoadedAt(slot.loadedAt)}` : ""}
          {slot.workbook ? ` · ${slot.workbook.sheet}` : ""}
        </p>
      ) : (
        <p className="file-meta">{slot.status || `No ${year} workbook loaded.`}</p>
      )}
      {slot.error ? (
        <p className="upload-error" role="alert" data-testid={`upload-error-${year.toLowerCase()}`}>
          {slot.error}
        </p>
      ) : null}
    </section>
  );
}

function MoneyBars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(...rows.map((row) => Math.abs(row.value)), 1);
  return (
    <ul className="bars">
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <div className="track">
            <span
              style={{
                width: `${(Math.abs(row.value) / max) * 100}%`,
                background: row.value < 0 ? "var(--open)" : undefined,
              }}
            />
          </div>
          <span>{money(row.value)}</span>
        </li>
      ))}
    </ul>
  );
}
