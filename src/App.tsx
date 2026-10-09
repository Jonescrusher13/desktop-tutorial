import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookingLine, WorkbookData } from "./data/types";
import { money, unique } from "./lib/format";
import { parseMbrWorkbook, WorkbookParseError } from "./lib/parseMbr.js";
import { readSession, writeSession } from "./lib/session.js";

const ALL = "all";
const BUNDLED_FILE = "mbr360DetailExcel_FY27.xlsx";

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

export default function App() {
  const [workbook, setWorkbook] = useState<WorkbookData | null>(null);
  const [fileName, setFileName] = useState("");
  const [loadedAt, setLoadedAt] = useState("");
  const [agent, setAgent] = useState(ALL);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState("Loading workbook…");

  const applyWorkbook = useCallback((data: WorkbookData, name: string, when: string, persist: boolean) => {
    setWorkbook(data);
    setFileName(name);
    setLoadedAt(when);
    setAgent(ALL);
    setError("");
    setStatus("");
    if (persist) {
      try {
        writeSession(data, name, when);
      } catch {
        // Session storage is best-effort; the file stays in this tab's memory.
      }
    }
  }, []);

  useEffect(() => {
    const existing = readSession();
    if (existing) {
      applyWorkbook(existing.workbook, existing.fileName, existing.loadedAt, false);
      return;
    }

    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}${BUNDLED_FILE}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${BUNDLED_FILE}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (cancelled) return;
        const data = parseMbrWorkbook(buffer, BUNDLED_FILE);
        applyWorkbook(data, BUNDLED_FILE, new Date().toISOString(), false);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("");
        setError(err instanceof Error ? err.message : "Could not load the bundled workbook.");
      });
    return () => {
      cancelled = true;
    };
  }, [applyWorkbook]);

  const onFiles = useCallback(
    async (list: FileList | null) => {
      const file = list?.[0];
      if (!file) return;
      setError("");
      setStatus(`Reading ${file.name}…`);
      try {
        const data = await parseFile(file);
        applyWorkbook(data, file.name, new Date().toISOString(), true);
      } catch (err) {
        setStatus("");
        if (err instanceof WorkbookParseError) {
          setError(err.message);
        } else {
          setError("Could not parse that file in the browser. Use an .xlsx MBR 360 export.");
        }
      }
    },
    [applyWorkbook],
  );

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
        <p className="kicker">Bookings 360 · {titleParts[1] || "FY27"}</p>
        <h1>Annual Bookings</h1>
        <p className="lede">
          Amounts are the <strong>Annual Bookings</strong> column, summed across booking lines.
          Filter by <strong>Sales Agent Name</strong>. Drop a new MBR 360 .xlsx to refresh — parsed
          in this browser only.
        </p>
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

      <section
        className={`dropzone${dragOver ? " is-drag" : ""}`}
        data-testid="upload-box"
        onDragEnter={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          void onFiles(event.dataTransfer.files);
        }}
      >
        <p className="dropzone-title">Drop the latest MBR 360 workbook here</p>
        <p className="dropzone-help">
          .xlsx only. Parsed locally — nothing is uploaded to a server or third-party API.
        </p>
        <label className="file-button">
          Choose file
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            aria-label="Upload MBR 360 workbook"
            onChange={(event) => {
              void onFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
        {fileName ? (
          <p className="file-meta" data-testid="loaded-file">
            Loaded <strong>{fileName}</strong>
            {loadedAt ? ` · Refreshed ${formatLoadedAt(loadedAt)}` : ""}
            {workbook ? ` · ${workbook.sheet}` : ""}
          </p>
        ) : (
          <p className="file-meta">{status || "No workbook loaded."}</p>
        )}
        {error ? (
          <p className="upload-error" role="alert" data-testid="upload-error">
            {error}
          </p>
        ) : null}
      </section>

      <section className="toolbar" aria-label="Filters">
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
              One row = one line in the file. Same Sales Order Number / Deal ID can appear more than once.
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
        <p className="empty">{status || "Load an MBR 360 .xlsx to see Annual Bookings."}</p>
      )}

      <p className="footnote">
        Source stays in this browser tab. Last loaded file is kept in session storage until the tab
        closes. No login and no third-party upload.
      </p>
    </>
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
