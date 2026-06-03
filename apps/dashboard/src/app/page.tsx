'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Database,
  Gauge,
  Shield,
  Sparkles,
  TrendingUp,
  Key,
  Zap,
  type LucideIcon,
} from 'lucide-react'

interface Stats {
  total_requests: number
  cache_hits: number
  total_tokens: number
  avg_latency_ms: number
  tokens_saved: number
}

interface ChartPoint {
  hour: string
  requests: number
  cache_hits: number
}

interface ProviderBreakdown {
  provider: string
  count: number
}

interface DashboardData {
  stats: Stats
  chart: ChartPoint[]
  providers: ProviderBreakdown[]
}

const providerStyles: Record<string, string> = {
  openai: 'from-cyan-500 to-blue-600',
  groq: 'from-violet-500 to-fuchsia-600',
  anthropic: 'from-amber-500 to-orange-600',
}

// ── STAT CARD ──────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color
}: {
  title: string
  value: string | number
  subtitle: string
  icon: LucideIcon
  color: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-white/40 bg-white/70 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(15,23,42,0.14)]">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-[0.04]`} />
      <div className="relative flex items-center justify-between mb-5">
        <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</p>
        <div className={`rounded-2xl bg-gradient-to-br ${color} p-3 shadow-lg shadow-slate-900/10`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className="relative text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="relative mt-2 text-sm leading-6 text-slate-500">{subtitle}</p>
    </div>
  )
}

// ── MAIN DASHBOARD ─────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchStats() {
    try {
      const response = await fetch('/api/stats')
      const json = await response.json()
      setData(json)
      setError(null)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void fetchStats()
    }, 0)
    const interval = setInterval(() => {
      void fetchStats()
    }, 30000)
    return () => {
      window.clearTimeout(initialLoad)
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.2),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_28%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:64px_64px] opacity-60" />
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[2rem] border border-white/60 bg-white/80 px-8 py-10 text-center shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
              <Sparkles className="h-7 w-7 animate-pulse" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sky-600">Proxara</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Loading dashboard</p>
            <p className="mt-3 text-sm text-slate-500">Refreshing usage metrics and provider data.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(244,114,182,0.16),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-950">
        <div className="relative flex min-h-screen items-center justify-center px-6">
          <div className="max-w-lg rounded-[2rem] border border-rose-200/70 bg-white/85 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <div className="mb-5 inline-flex rounded-2xl bg-rose-50 p-3 text-rose-600 ring-1 ring-rose-100">
              <Shield className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Connection issue</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Dashboard data could not load</p>
            <p className="mt-3 text-sm leading-6 text-slate-500">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const stats = data?.stats
  const totalRequests = stats?.total_requests || 0
  const cacheHitRate = stats?.total_requests
    ? Math.round((stats.cache_hits / stats.total_requests) * 100)
    : 0
  const avgLatencySeconds = (stats?.avg_latency_ms || 0) / 1000
  const topProvider = data?.providers?.[0]
  const uptimeLabel = totalRequests > 0 ? 'Live telemetry active' : 'Awaiting fresh metrics'

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.16),_transparent_26%),linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] text-slate-950">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
      <div className="absolute left-[-8rem] top-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="absolute right-[-6rem] top-[26rem] h-80 w-80 rounded-full bg-fuchsia-400/15 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        <header className="rounded-[2rem] border border-white/60 bg-white/65 px-6 py-5 shadow-[0_25px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-500 to-indigo-600 text-white shadow-lg shadow-sky-500/30">
                <Zap className="h-7 w-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Proxara</h1>
                  <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                    Live
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                  The intelligent gateway for your AI agents, with caching, provider visibility, and response telemetry in one command center.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/keys"
                className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:border-sky-300 hover:text-sky-700"
              >
                <Key className="h-4 w-4" />
                API Keys
              </Link>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                Gateway online
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
                <BadgeCheck className="h-4 w-4 text-sky-500" />
                {uptimeLabel}
              </div>
            </div>
          </div>
        </header>

        <main className="mt-8 space-y-8">
          <section className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-slate-950 px-8 py-8 text-white shadow-[0_30px_100px_rgba(15,23,42,0.22)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.38),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.28),_transparent_30%)]" />
              <div className="relative flex flex-col gap-8">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                    <Sparkles className="h-4 w-4 text-sky-300" />
                    Real-time analytics
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 backdrop-blur">
                    <Shield className="h-4 w-4 text-emerald-300" />
                    Cached requests tracked
                  </span>
                </div>

                <div className="max-w-2xl">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-200/80">Dashboard overview</p>
                  <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                    Monitor traffic, latency, and provider usage from a single polished view.
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
                    See how many requests are flowing through the gateway, which providers are carrying the load, and how much work your cache is saving.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Requests</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{totalRequests.toLocaleString()}</p>
                    <p className="mt-1 text-sm text-slate-300">All-time gateway traffic</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Cache hit rate</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{cacheHitRate}%</p>
                    <p className="mt-1 text-sm text-slate-300">{stats?.cache_hits || 0} cached responses</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Avg latency</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{avgLatencySeconds.toFixed(2)}s</p>
                    <p className="mt-1 text-sm text-slate-300">Response timing across providers</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Top provider</p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                      {topProvider?.provider ?? 'No data yet'}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-slate-950 p-3 text-white shadow-lg">
                    <ArrowUpRight className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Request volume</p>
                    <p className="text-lg font-semibold text-slate-950">{topProvider?.count ? `${topProvider.count} requests` : 'Waiting for fresh stats'}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/60 bg-white/75 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-600 ring-1 ring-sky-100">
                    <Gauge className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Efficiency</p>
                    <h3 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{stats?.tokens_saved?.toLocaleString() || 0} saved</h3>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  Cache reuse reduces repeated token usage and keeps agent traffic faster.
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <StatCard
              title="Total Requests"
              value={stats?.total_requests?.toLocaleString() || 0}
              subtitle="All-time traffic through the gateway"
              icon={Activity}
              color="from-sky-500 to-cyan-600"
            />
            <StatCard
              title="Cache Hit Rate"
              value={`${cacheHitRate}%`}
              subtitle={`${stats?.cache_hits || 0} requests served from cache`}
              icon={Database}
              color="from-emerald-500 to-teal-600"
            />
            <StatCard
              title="Tokens Saved"
              value={stats?.tokens_saved?.toLocaleString() || 0}
              subtitle="Tokens saved by cached responses"
              icon={TrendingUp}
              color="from-violet-500 to-fuchsia-600"
            />
            <StatCard
              title="Avg Latency"
              value={`${stats?.avg_latency_ms || 0}ms`}
              subtitle="Average response time across providers"
              icon={Zap}
              color="from-amber-500 to-orange-600"
            />
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Traffic</p>
                  <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Requests over the last 24 hours</h2>
                </div>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600">
                  {data?.chart?.length || 0} data points
                </div>
              </div>
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.chart || []} barCategoryGap={16}>
                    <XAxis
                      dataKey="hour"
                      tickFormatter={(val: string) => new Date(val).getHours() + ':00'}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(14,165,233,0.08)' }}
                      contentStyle={{
                        borderRadius: 16,
                        border: '1px solid rgba(148,163,184,0.24)',
                        boxShadow: '0 20px 50px rgba(15,23,42,0.15)',
                        background: 'rgba(255,255,255,0.95)',
                      }}
                      labelFormatter={(val) => new Date(val).toLocaleTimeString()}
                    />
                    <Bar
                      dataKey="requests"
                      fill="url(#requestsGradient)"
                      name="Requests"
                      radius={[12, 12, 4, 4]}
                    />
                    <Bar
                      dataKey="cache_hits"
                      fill="url(#cacheGradient)"
                      name="Cache Hits"
                      radius={[12, 12, 4, 4]}
                    />
                    <defs>
                      <linearGradient id="requestsGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" />
                        <stop offset="100%" stopColor="#2563eb" />
                      </linearGradient>
                      <linearGradient id="cacheGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="mb-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Provider mix</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Breakdown by provider</h2>
              </div>
              <div className="space-y-4">
                {data?.providers?.map((provider) => {
                  const percentage = totalRequests
                    ? Math.round((provider.count / totalRequests) * 100)
                    : 0
                  const gradient = providerStyles[provider.provider] ?? 'from-slate-500 to-slate-700'

                  return (
                    <div
                      key={provider.provider}
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-3 w-3 rounded-full bg-gradient-to-r ${gradient}`} />
                          <span className="text-sm font-semibold capitalize text-slate-800">
                            {provider.provider}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-slate-950">
                          {provider.count} requests
                        </span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-200">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${gradient}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        {percentage}% of total traffic
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>

        </main>
      </div>
    </div>
  )
}
