import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  ChartLineUp,
  CheckCircle,
  Database,
  Gauge,
  Lightning,
  Leaf,
  Snowflake,
  TrendDown,
  Warning,
} from '@phosphor-icons/react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useDashboardData } from './hooks/useDashboardData'
import type { DashboardData, TimePoint } from './types'
import './App.css'

const sourceRepository = 'https://github.com/AJ-ing/InfraPulse_2.0'

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)
}

function formatDate(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', options).format(new Date(value))
}

function formatCompactDate(value: string) {
  return formatDate(value, { day: '2-digit', month: 'short' })
}

function formatTimestamp(value: string) {
  return formatDate(value, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Gauge weight="bold" />
    </span>
  )
}

function AppHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={compact ? 'app-header app-header--compact' : 'app-header'}>
      <div className="shell app-header__inner">
        <Link className="brand" to="/" aria-label="InfraPulse home">
          <BrandMark />
          <span>InfraPulse</span>
        </Link>
        <nav className="app-nav" aria-label="Primary navigation">
          <NavLink end to="/">
            Overview
          </NavLink>
          <Link to="/?section=methodology">Methodology</Link>
          <a href={sourceRepository} target="_blank" rel="noreferrer">
            Source <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
        </nav>
        <Link className="button button--primary header-action" to="/dashboard">
          <ChartLineUp weight="bold" aria-hidden="true" />
          Dashboard
        </Link>
      </div>
    </header>
  )
}

function MetricValue({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <article className="metric-value">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function LandingMetrics({ data }: { data: DashboardData | null }) {
  if (!data) {
    return (
      <section className="signal-strip shell" aria-label="Loading sample metrics">
        {[0, 1, 2, 3].map((index) => (
          <div className="metric-value skeleton" key={index} />
        ))}
      </section>
    )
  }

  const { kpis, dataQuality } = data
  return (
    <section className="signal-strip shell" aria-label="Observed sample metrics">
      <MetricValue
        label="Average IT load"
        value={`${formatNumber(kpis.averageItKw)} kW`}
        detail="ULC meter group"
      />
      <MetricValue
        label="Average cooling load"
        value={`${formatNumber(kpis.averageCoolingKw)} kW`}
        detail="CRAC meter group"
      />
      <MetricValue
        label="Observed PUE proxy"
        value={formatNumber(kpis.averagePueProxy, 3)}
        detail="Not true facility PUE"
      />
      <MetricValue
        label="Hourly observations"
        value={formatNumber(dataQuality.hourlyPoints, 0)}
        detail="Processed from source data"
      />
    </section>
  )
}

function LandingPage() {
  const state = useDashboardData()
  const location = useLocation()
  const data = state.status === 'ready' ? state.data : null

  useEffect(() => {
    if (new URLSearchParams(location.search).get('section') !== 'methodology') return
    document.getElementById('methodology')?.scrollIntoView()
  }, [location.search])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <AppHeader />
      <main id="main-content">
        <section className="hero-section">
          <img
            className="hero-section__image"
            src={`${import.meta.env.BASE_URL}assets/data-center-hero.png`}
            alt="Server racks and cooling infrastructure in a modern data center"
          />
          <div className="hero-section__scrim" aria-hidden="true" />
          <div className="shell hero-section__content">
            <p className="eyebrow">Data center energy intelligence</p>
            <h1>Know your cooling cost.</h1>
            <p className="hero-section__lead">
              InfraPulse turns verified meter readings into clear, explainable energy decisions for data center teams.
            </p>
            <div className="hero-section__actions">
              <Link className="button button--primary" to="/dashboard">
                Open dashboard <ArrowRight weight="bold" aria-hidden="true" />
              </Link>
              <a className="button button--secondary" href="#methodology">
                Read methodology
              </a>
            </div>
          </div>
        </section>

        <LandingMetrics data={data} />

        <section className="section shell decision-section">
          <div className="section-heading section-heading--narrow">
            <h2>Move from raw readings to operational decisions.</h2>
            <p>
              Meter data becomes useful when IT and cooling loads can be compared in the same view, with the assumptions visible.
            </p>
          </div>
          <div className="decision-grid">
            <article className="decision-block">
              <div className="decision-block__icon" aria-hidden="true">
                <Lightning weight="bold" />
              </div>
              <h3>Trace the load</h3>
              <p>Compare ULC IT meters with CRAC cooling meters across the same observation window.</p>
            </article>
            <article className="decision-block decision-block--feature">
              <div className="decision-block__icon" aria-hidden="true">
                <TrendDown weight="bold" />
              </div>
              <h3>Test savings assumptions</h3>
              <p>Adjust a cooling-reduction scenario and keep the estimate grounded in the processed sample window.</p>
            </article>
          </div>
        </section>

        <section className="section shell evidence-section">
          <div className="evidence-section__image-wrap">
            <img
              src={`${import.meta.env.BASE_URL}assets/metering-infrastructure.png`}
              alt="Electrical metering and cooling utility infrastructure inside a technical facility"
            />
          </div>
          <div className="evidence-section__copy">
            <p className="eyebrow">A real dataset, stated limits</p>
            <h2>Designed around the meters you actually have.</h2>
            <p>
              The first release processes public university data center readings from ULC rack load and CRAC cooling meters. That makes the output inspectable from input to chart.
            </p>
            <a className="text-link" href="https://doi.org/10.57760/sciencedb.10792" target="_blank" rel="noreferrer">
              View dataset record <ArrowUpRight weight="bold" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section id="methodology" className="section methodology-section">
          <div className="shell methodology-section__inner">
            <div className="section-heading section-heading--narrow">
              <h2>Transparent by design.</h2>
              <p>Every headline number is tied to a documented formula, source field, and processing window.</p>
            </div>
            <div className="formula-grid">
              <article className="formula-block">
                <span>Current efficiency signal</span>
                <strong>(IT load + cooling load) / IT load</strong>
                <p>PUE proxy uses only the public sample's ULC and CRAC meters.</p>
              </article>
              <article className="formula-block">
                <span>Future facility metric</span>
                <strong>Total facility energy / IT energy</strong>
                <p>True PUE becomes available when an aggregate facility meter is added.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="section shell roadmap-section">
          <div className="section-heading section-heading--narrow">
            <h2>Built to grow with the facility.</h2>
            <p>The application starts with public CSV data, then leaves a clean path to full facility meters and live integrations.</p>
          </div>
          <ol className="roadmap-list">
            <li>
              <CheckCircle weight="fill" aria-hidden="true" />
              <div>
                <strong>Meter-backed dashboard</strong>
                <span>Published with reproducible processed sample data.</span>
              </div>
            </li>
            <li>
              <Database weight="bold" aria-hidden="true" />
              <div>
                <strong>Aggregate facility data</strong>
                <span>Add DB meter readings to calculate true PUE.</span>
              </div>
            </li>
            <li>
              <Leaf weight="bold" aria-hidden="true" />
              <div>
                <strong>Operational and carbon planning</strong>
                <span>Connect tariffs, emissions factors, and live data sources.</span>
              </div>
            </li>
          </ol>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ color: string; name: string; value: number }>
  label?: string
}) {
  if (!active || !payload?.length || !label) return null
  return (
    <div className="chart-tooltip">
      <strong>{formatTimestamp(label)}</strong>
      {payload.map((entry) => (
        <span key={entry.name} style={{ color: entry.color }}>
          {entry.name}: {formatNumber(entry.value)}
        </span>
      ))}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <main className="dashboard-main shell" aria-label="Loading dashboard">
      <div className="dashboard-title skeleton skeleton--title" />
      <div className="kpi-grid">
        {[0, 1, 2, 3, 4].map((index) => (
          <div className="kpi-card skeleton" key={index} />
        ))}
      </div>
      <div className="chart-grid">
        <div className="chart-panel skeleton skeleton--chart" />
        <div className="chart-panel skeleton skeleton--chart" />
      </div>
    </main>
  )
}

function DashboardError({ error }: { error: string }) {
  return (
    <main className="dashboard-main shell">
      <section className="error-state" role="alert">
        <Warning weight="bold" aria-hidden="true" />
        <div>
          <h1>Processed data is unavailable.</h1>
          <p>{error} Regenerate it with <code>python3 pipeline/build_sample.py</code>.</p>
        </div>
      </section>
    </main>
  )
}

function DashboardPage() {
  const state = useDashboardData()

  return (
    <div className="dashboard-shell">
      <a className="skip-link" href="#dashboard-content">
        Skip to dashboard
      </a>
      <AppHeader compact />
      {state.status === 'loading' && <DashboardSkeleton />}
      {state.status === 'error' && <DashboardError error={state.error} />}
      {state.status === 'ready' && <Dashboard data={state.data} />}
      <SiteFooter compact />
    </div>
  )
}

function KpiCard({
  label,
  value,
  note,
  icon,
}: {
  label: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <article className="kpi-card">
      <div className="kpi-card__top">
        <span>{label}</span>
        <span className="kpi-card__icon" aria-hidden="true">
          {icon}
        </span>
      </div>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  )
}

function Dashboard({ data }: { data: DashboardData }) {
  const [range, setRange] = useState<'7d' | 'all'>('7d')
  const [reduction, setReduction] = useState(10)
  const points = useMemo<TimePoint[]>(
    () => (range === '7d' ? data.timeSeries.slice(-168) : data.timeSeries),
    [data.timeSeries, range],
  )
  const daily = useMemo(() => (range === '7d' ? data.daily.slice(-7) : data.daily), [data.daily, range])
  const savings = data.kpis.costIndex * data.kpis.coolingShare * (reduction / 100)
  const peakDate = formatTimestamp(data.kpis.peakTimestamp)

  return (
    <main id="dashboard-content" className="dashboard-main shell">
      <section className="dashboard-intro">
        <div>
          <p className="eyebrow">Sample facility view</p>
          <h1>Energy performance, made legible.</h1>
          <p>{data.metadata.facilityName}. Timestamps are shown as recorded in the source sample.</p>
        </div>
        <label className="control-field">
          <span>Observation window</span>
          <select value={range} onChange={(event) => setRange(event.target.value as '7d' | 'all')}>
            <option value="7d">Last 7 days</option>
            <option value="all">Full sample</option>
          </select>
        </label>
      </section>

      <section className="kpi-grid" aria-label="Key performance indicators">
        <KpiCard
          label="Average IT load"
          value={`${formatNumber(data.kpis.averageItKw)} kW`}
          note="Combined ULC readings"
          icon={<Lightning weight="bold" />}
        />
        <KpiCard
          label="Average cooling load"
          value={`${formatNumber(data.kpis.averageCoolingKw)} kW`}
          note="Combined CRAC readings"
          icon={<Snowflake weight="bold" />}
        />
        <KpiCard
          label="PUE proxy"
          value={formatNumber(data.kpis.averagePueProxy, 3)}
          note="IT and cooling meters only"
          icon={<Gauge weight="bold" />}
        />
        <KpiCard
          label="Total sample energy"
          value={`${formatNumber(data.kpis.totalEnergyKwh, 0)} kWh`}
          note="Hourly average aggregation"
          icon={<Database weight="bold" />}
        />
        <KpiCard
          label="Peak total demand"
          value={`${formatNumber(data.kpis.peakTotalKw)} kW`}
          note={peakDate}
          icon={<ChartLineUp weight="bold" />}
        />
      </section>

      <section className="chart-grid">
        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>IT load and cooling load</h2>
              <p>Average active power by hour.</p>
            </div>
            <span className="unit-label">kW</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points} margin={{ top: 12, right: 4, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  minTickGap={42}
                  tickFormatter={formatCompactDate}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} unit=" kW" width={50} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="itKw" name="IT load" stroke="#0d8a82" strokeWidth={2.25} dot={false} />
                <Line type="monotone" dataKey="coolingKw" name="Cooling load" stroke="#778786" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-panel">
          <div className="panel-heading">
            <div>
              <h2>PUE proxy behaviour</h2>
              <p>Cooling overhead relative to IT load.</p>
            </div>
            <span className="unit-label">ratio</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 12, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="pueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d8a82" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0d8a82" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  minTickGap={42}
                  tickFormatter={formatCompactDate}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="pueProxy" name="PUE proxy" stroke="#0d8a82" strokeWidth={2.25} fill="url(#pueFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-panel chart-panel--daily">
          <div className="panel-heading">
            <div>
              <h2>Daily energy demand</h2>
              <p>Total hourly average energy across each observed day.</p>
            </div>
            <span className="unit-label">kWh</span>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={daily} margin={{ top: 12, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="dailyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d8a82" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#0d8a82" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" minTickGap={34} tickFormatter={formatCompactDate} tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} unit=" kWh" width={58} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="totalEnergyKwh"
                  name="Daily energy"
                  stroke="#0d8a82"
                  strokeWidth={2.25}
                  fill="url(#dailyFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="insight-grid">
        <article className="savings-panel">
          <div className="panel-heading">
            <div>
              <h2>Cooling reduction scenario</h2>
              <p>Estimate the impact across this processed sample window.</p>
            </div>
            <TrendDown weight="bold" aria-hidden="true" />
          </div>
          <div className="savings-panel__body">
            <label className="range-field">
              <span>Cooling-load reduction</span>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={reduction}
                onChange={(event) => setReduction(Number(event.target.value))}
              />
              <output>{reduction}%</output>
            </label>
            <div className="savings-result">
              <span>Estimated saving</span>
              <strong>{formatNumber(savings)} cost units</strong>
              <small>At {data.metadata.sampleTariffPerKwh} cost units per kWh.</small>
            </div>
          </div>
        </article>

        <article className="quality-panel">
          <div className="panel-heading">
            <div>
              <h2>Data confidence</h2>
              <p>Source coverage and processing checks.</p>
            </div>
            <CheckCircle weight="bold" aria-hidden="true" />
          </div>
          <dl className="quality-list">
            <div>
              <dt>Recognised records</dt>
              <dd>{formatNumber(data.dataQuality.recognizedRows, 0)}</dd>
            </div>
            <div>
              <dt>Meter groups</dt>
              <dd>{data.dataQuality.deviceCount}</dd>
            </div>
            <div>
              <dt>Complete rows</dt>
              <dd>{formatNumber(data.dataQuality.completeness)}%</dd>
            </div>
            <div>
              <dt>Coverage ends</dt>
              <dd>{formatCompactDate(data.dataQuality.coverageEnd)}</dd>
            </div>
          </dl>
        </article>
      </section>

      <section className="table-panel">
        <div className="panel-heading panel-heading--table">
          <div>
            <h2>Meter group comparison</h2>
            <p>Hourly aggregate behaviour by observed device.</p>
          </div>
          <a className="text-link" href={`${import.meta.env.BASE_URL}data/device_summary.csv`} download>
            Download CSV <ArrowRight weight="bold" aria-hidden="true" />
          </a>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Meter</th>
                <th scope="col">Group</th>
                <th scope="col">Average load</th>
                <th scope="col">Peak load</th>
                <th scope="col">Estimated energy</th>
                <th scope="col">Observed hours</th>
              </tr>
            </thead>
            <tbody>
              {data.devices.map((device) => (
                <tr key={device.device}>
                  <th scope="row">{device.device}</th>
                  <td>{device.role === 'it_load' ? 'IT load' : 'Cooling'}</td>
                  <td>{formatNumber(device.averageKw)} kW</td>
                  <td>{formatNumber(device.peakKw)} kW</td>
                  <td>{formatNumber(device.estimatedEnergyKwh, 0)} kWh</td>
                  <td>{formatNumber(device.observedHours, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="methodology-note">
        <Gauge weight="bold" aria-hidden="true" />
        <div>
          <h2>How to read this view</h2>
          <p>{data.metadata.pueNote} {data.metadata.timeZoneNote}</p>
        </div>
        <a href={data.metadata.sourceUrl} target="_blank" rel="noreferrer">
          Source sample <ArrowUpRight weight="bold" aria-hidden="true" />
        </a>
      </section>
    </main>
  )
}

function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={compact ? 'site-footer site-footer--compact' : 'site-footer'}>
      <div className="shell site-footer__inner">
        <div className="brand">
          <BrandMark />
          <span>InfraPulse</span>
        </div>
        <p>Data center energy intelligence built from public meter readings.</p>
        {!compact && (
          <a href={sourceRepository} target="_blank" rel="noreferrer">
            View project source <ArrowUpRight weight="bold" aria-hidden="true" />
          </a>
        )}
      </div>
    </footer>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  )
}

export default App
