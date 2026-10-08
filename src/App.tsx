import { Fragment, useMemo, useState } from "react";
import data from "./data/workbook.json";
import type { Deal } from "./data/types";
import { amLabel, attachFromAmounts, attachPct, money, unique } from "./lib/format";

const VIEWS = [
  { id: "team", label: "Team snapshot" },
  { id: "services", label: "Forecasted services" },
  { id: "reps", label: "Rep performance" },
  { id: "deals", label: "Flagged opportunities" },
  { id: "remediation", label: "Remediation plan" },
] as const;

type ViewId = (typeof VIEWS)[number]["id"];
type Mode = "team" | "rep";

const ALL = "all";

function scopeChips(scope: string): string[] {
  return scope
    .replace(/^Scope:\s*/i, "")
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
}

function rollup(deals: Deal[]) {
  const tcv = deals.reduce((sum, deal) => sum + deal["Total TCV (USD)"], 0);
  const tech = deals.reduce((sum, deal) => sum + deal["Technology (HW/SW)"], 0);
  const services = deals.reduce((sum, deal) => sum + deal["Forecasted Services"], 0);
  const nonIntegrated = deals.filter((d) => d["CCW Quote Status"] === "Non-Integrated").length;
  const integrated = deals.filter((d) => d["CCW Quote Status"] === "Integrated").length;
  return {
    tcv,
    tech,
    services,
    attach: attachFromAmounts(services, tcv),
    nonIntegrated,
    integrated,
    count: deals.length,
  };
}

export default function App() {
  const [mode, setMode] = useState<Mode>("team");
  const [view, setView] = useState<ViewId>("team");
  const [am, setAm] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [quote, setQuote] = useState(ALL);
  const [quarter, setQuarter] = useState(ALL);

  const deals = data.flaggedOpportunities.deals;
  const amOptions = unique(deals.map((d) => d["Assigned AM"]));
  const stageOptions = unique(deals.map((d) => d.Stage));
  const quoteOptions = unique(deals.map((d) => d["CCW Quote Status"]));
  const quarterOptions = unique(deals.map((d) => d._closeQuarter).filter(Boolean));

  const filtersActive =
    (mode === "rep" && am !== ALL) ||
    (mode === "team" && am !== ALL) ||
    stage !== ALL ||
    quote !== ALL ||
    quarter !== ALL;

  const filtered = useMemo(() => {
    return deals.filter((deal) => {
      if (mode === "rep" && am === ALL) return false;
      if (am !== ALL && deal["Assigned AM"] !== am) return false;
      if (stage !== ALL && deal.Stage !== stage) return false;
      if (quote !== ALL && deal["CCW Quote Status"] !== quote) return false;
      if (quarter !== ALL && deal._closeQuarter !== quarter) return false;
      return true;
    });
  }, [deals, mode, am, stage, quote, quarter]);

  const stats = rollup(filtered);
  const chips = [
    "Tennessee Region",
    ...scopeChips(data.executiveSummary.scope),
  ];

  const published = Object.fromEntries(
    data.executiveSummary.kpis.map((kpi) => [kpi.label, kpi.value]),
  );

  const repRows = useMemo(() => {
    const groups = new Map<string, Deal[]>();
    for (const deal of filtered) {
      const key = deal["Assigned AM"];
      groups.set(key, [...(groups.get(key) ?? []), deal]);
    }
    return [...groups.entries()]
      .map(([name, rows]) => ({ name, placeholder: rows[0]._amPlaceholder, ...rollup(rows) }))
      .sort((a, b) => b.tcv - a.tcv);
  }, [filtered]);

  const sourceNote = mode === "rep" && am === ALL
    ? "Pick an Assigned AM to see that rep’s flagged deals."
    : filtersActive
      ? `From Flagged Opportunities (${stats.count} deal${stats.count === 1 ? "" : "s"} after filters).`
      : "From Flagged Opportunities (all 8 deals). Matches Executive Summary when unfiltered.";

  return (
    <>
      <header className="masthead">
        <p className="kicker">Pipeline governance · FY27 H1</p>
        <h1>{data.executiveSummary.title}</h1>
        <p className="lede">
          Web view of the uploaded workbook. Dollars are flagged pipeline and{" "}
          <strong>Forecasted Services</strong> — the file has no closed-bookings column.
        </p>
        <p className="notice">
          Already limited in the spreadsheet to deals over $100K with Forecasted Services
          under $10K, FY27 Q1–Q2 close dates, excluding Wireless APs and Meraki.
        </p>
        <div className="chips">
          {chips.map((chip) => (
            <span className="chip" key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </header>

      <section className="toolbar" aria-label="Filters">
        <div className="mode" role="group" aria-label="Team or rep">
          <button
            type="button"
            aria-pressed={mode === "team"}
            onClick={() => {
              setMode("team");
              if (view === "reps") setView("team");
            }}
          >
            Team
          </button>
          <button
            type="button"
            aria-pressed={mode === "rep"}
            onClick={() => {
              setMode("rep");
              setView("reps");
            }}
          >
            Rep
          </button>
        </div>
        <div className="filters">
          <label>
            Assigned AM
            <select
              value={am}
              onChange={(event) => {
                setAm(event.target.value);
                if (event.target.value !== ALL) setMode("rep");
                if (event.target.value === ALL) setMode("team");
              }}
            >
              <option value={ALL}>{mode === "rep" ? "Select a rep…" : "All reps"}</option>
              {amOptions.map((name) => (
                <option key={name} value={name}>
                  {name === "Assigned AM" ? "Unassigned (file says Assigned AM)" : name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Stage
            <select value={stage} onChange={(event) => setStage(event.target.value)}>
              <option value={ALL}>All stages</option>
              {stageOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            CCW Quote Status
            <select value={quote} onChange={(event) => setQuote(event.target.value)}>
              <option value={ALL}>All statuses</option>
              {quoteOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Close Date (quarter in file)
            <select value={quarter} onChange={(event) => setQuarter(event.target.value)}>
              <option value={ALL}>Q1 and Q2</option>
              {quarterOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <nav className="views" aria-label="Views">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={view === item.id}
              onClick={() => setView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </section>

      {view === "team" && (
        <section>
          <h2>Team snapshot</h2>
          <p className="section-help">{sourceNote}</p>
          <Kpis stats={stats} />
          {!filtersActive && (
            <p className="published">
              Published Executive Summary: Total Flagged Pipeline (TCV){" "}
              {money(Number(published["Total Flagged Pipeline (TCV)"]))}, Total Forecasted
              Services {money(Number(published["Total Forecasted Services"]))}, Overall
              Services Attach Rate {attachPct(Number(published["Overall Services Attach Rate"]))}
              .
            </p>
          )}
          <div className="grid-2">
            <article className="panel">
              <h3>Governance Breakdown by Quote Integration Status (as published; not filtered)</h3>
              <table>
                <thead>
                  <tr>
                    <th>Category / Classification</th>
                    <th className="num">Deal Count</th>
                    <th className="num">Total Pipeline Value (TCV)</th>
                    <th className="num">Forecasted Services</th>
                    <th className="num">Avg Services Attach %</th>
                  </tr>
                </thead>
                <tbody>
                  {data.executiveSummary.breakdown
                    .filter((row) => !row.isTotal)
                    .map((row) => (
                      <tr key={row["Category / Classification"]}>
                        <td>{row["Category / Classification"]}</td>
                        <td className="num">{row["Deal Count"]}</td>
                        <td className="num">{money(row["Total Pipeline Value (TCV)"])}</td>
                        <td className="num">{money(row["Forecasted Services"])}</td>
                        <td className="num">{attachPct(row["Avg Services Attach %"])}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </article>
            <article className="panel">
              <h3>Total TCV (USD) by Assigned AM</h3>
              <MoneyBars
                rows={repRows.map((row) => ({
                  label: row.placeholder ? "Unassigned" : row.name,
                  value: row.tcv,
                }))}
              />
            </article>
          </div>
        </section>
      )}

      {view === "services" && (
        <section>
          <h2>Forecasted services</h2>
          <p className="section-help">
            Field name in the file is <strong>Forecasted Services</strong>, not bookings.{" "}
            {sourceNote}
          </p>
          <Kpis stats={stats} />
          {filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="grid-2">
              <article className="panel">
                <h3>Forecasted Services by opportunity</h3>
                <MoneyBars
                  variant="services"
                  rows={filtered.map((deal) => ({
                    label: deal["Account Name"],
                    value: deal["Forecasted Services"],
                  }))}
                />
              </article>
              <article className="panel">
                <h3>Technology (HW/SW) vs Forecasted Services</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Account Name</th>
                      <th className="num">Technology (HW/SW)</th>
                      <th className="num">Forecasted Services</th>
                      <th className="num">Services Attach %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((deal) => (
                      <tr key={deal["Opportunity Name"]}>
                        <td>{deal["Account Name"]}</td>
                        <td className="num">{money(deal["Technology (HW/SW)"])}</td>
                        <td className="num">{money(deal["Forecasted Services"])}</td>
                        <td className="num">{attachPct(deal["Services Attach %"])}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            </div>
          )}
        </section>
      )}

      {view === "reps" && (
        <section>
          <h2>Rep performance</h2>
          <p className="section-help">
            Grain is <strong>Assigned AM</strong> on Flagged Opportunities. No quota or
            closed bookings in the file. {sourceNote}
          </p>
          {mode === "rep" && am === ALL ? (
            <Empty message="Select an Assigned AM in Rep mode." />
          ) : (
            <>
              <Kpis stats={stats} />
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Assigned AM</th>
                      <th className="num">Deal Count</th>
                      <th className="num">Total TCV (USD)</th>
                      <th className="num">Technology (HW/SW)</th>
                      <th className="num">Forecasted Services</th>
                      <th className="num">Services Attach %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repRows.map((row) => (
                      <tr
                        key={row.name}
                        className="rep-row"
                        aria-selected={am === row.name}
                        onClick={() => {
                          setAm(row.name);
                          setMode("rep");
                        }}
                      >
                        <td className={row.placeholder ? "placeholder" : undefined}>
                          {row.placeholder ? "Unassigned (file says Assigned AM)" : row.name}
                        </td>
                        <td className="num">{row.count}</td>
                        <td className="num">{money(row.tcv)}</td>
                        <td className="num">{money(row.tech)}</td>
                        <td className="num">{money(row.services)}</td>
                        <td className="num">{attachPct(row.attach)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      {view === "deals" && (
        <section>
          <h2>Flagged opportunities</h2>
          <p className="section-help">
            One row = one opportunity. Totals row from the sheet is excluded. {sourceNote}
          </p>
          {filtered.length === 0 ? (
            <Empty />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Opportunity Name</th>
                    <th>Account Name</th>
                    <th>Assigned AM</th>
                    <th>Stage</th>
                    <th>Close Date</th>
                    <th className="num">Total TCV (USD)</th>
                    <th className="num">Forecasted Services</th>
                    <th>CCW Quote Status</th>
                    <th>Salesforce Deal ID</th>
                    <th>Primary Workload</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((deal) => (
                    <Fragment key={deal["Opportunity Name"]}>
                      <tr>
                        <td>{deal["Opportunity Name"]}</td>
                        <td>{deal["Account Name"]}</td>
                        <td className={deal._amPlaceholder ? "placeholder" : undefined}>
                          {amLabel(deal)}
                        </td>
                        <td>{deal.Stage}</td>
                        <td>{deal["Close Date"]}</td>
                        <td className="num">{money(deal["Total TCV (USD)"])}</td>
                        <td className="num">{money(deal["Forecasted Services"])}</td>
                        <td>
                          <span
                            className={`tag ${deal["CCW Quote Status"] === "Integrated" ? "integrated" : "non"}`}
                          >
                            {deal["CCW Quote Status"]}
                          </span>
                        </td>
                        <td className={deal["Salesforce Deal ID"] ? undefined : "missing"}>
                          {deal["Salesforce Deal ID"] ?? "None"}
                        </td>
                        <td>{deal["Primary Workload"]}</td>
                      </tr>
                      <tr className="action-row">
                        <td colSpan={10}>
                          <strong>Governance & Action Plan:</strong> {deal["Governance & Action Plan"]}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {view === "remediation" && (
        <section>
          <h2>{data.remediationPlan.title}</h2>
          <p className="section-help">{data.remediationPlan.subtitle}. Grain is action group, not deal.</p>
          <div className="cards">
            {data.remediationPlan.groups.map((group) => (
              <article className="panel action-card" key={group["Action Group"]}>
                <h3>
                  {group["Action Group"]} · {money(group["Total TCV"])}
                </h3>
                <p>
                  <strong>Target Deals:</strong> {group["Target Deals"]}
                </p>
                <p>
                  <strong>Key Vulnerability / Gap:</strong> {group["Key Vulnerability / Gap"]}
                </p>
                <p>
                  <strong>Step-by-Step Remediation Action:</strong>
                  {"\n"}
                  {group["Step-by-Step Remediation Action"]}
                </p>
                <p className="guidance">
                  <strong>Forwardable Partner Guidance:</strong> {group["Forwardable Partner Guidance"]}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <p className="footnote">
        Source: {data.sourceFile}. Sheets: {data.sheets.join(", ")}. No offer/SKU column;
        closest field is Primary Workload. Close Date is text in the file.
      </p>
    </>
  );
}

function Kpis({
  stats,
}: {
  stats: ReturnType<typeof rollup>;
}) {
  const items = [
    { label: "Total Flagged Pipeline (TCV)", value: money(stats.tcv) },
    { label: "Total HW/SW Tech Value", value: money(stats.tech) },
    { label: "Total Forecasted Services", value: money(stats.services) },
    { label: "Overall Services Attach Rate", value: attachPct(stats.attach) },
    { label: "Non-Integrated Quote Deals", value: String(stats.nonIntegrated) },
    { label: "Integrated Deals (Need Uplift)", value: String(stats.integrated) },
  ];
  return (
    <dl className="kpis">
      {items.map((item) => (
        <div className="kpi" key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function MoneyBars({
  rows,
  variant = "tcv",
}: {
  rows: { label: string; value: number }[];
  variant?: "tcv" | "services";
}) {
  const max = Math.max(...rows.map((row) => row.value), 1);
  return (
    <ul className={`bars ${variant}`}>
      {rows.map((row) => (
        <li key={row.label}>
          <span>{row.label}</span>
          <div className="track">
            <span style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
          <span>{money(row.value)}</span>
        </li>
      ))}
    </ul>
  );
}

function Empty({ message = "No flagged opportunities match these filters." }: { message?: string }) {
  return <p className="empty">{message}</p>;
}
