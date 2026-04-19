"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import dynamic from "next/dynamic"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { Activity, LayoutDashboard, Database, Zap, ArrowLeft, ArrowUpRight, ArrowDownRight, Clock, Trash2, Thermometer, Wind, BarChart3, Cpu, RotateCcw } from "lucide-react"

// Dynamic import for ApexCharts
const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false })

const fetcher = (url: string) => fetch(url).then(res => res.json())

const COLORS = {
  upload: "#f97316",
  download: "#8b5cf6",
  distribute: "#fbbf24",
  cool: "#06b6d4",
  heat: "#ef4444",
  delete: "#64748b"
}

// Preset Fallback data if DB returns nothing or fails
const FALLBACK_NODES = [
  { nodeId: "ORBIT-1", used: 120 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-2", used: 85 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-3", used: 10 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-4", used: 45 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-5", used: 160 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-6", used: 45 * 1024 * 1024, capacity: 1000 },
  { nodeId: "ORBIT-7", used: 10 * 1024 * 1024, capacity: 1000 }
]

export default function AnalyticsPage() {
  const router = useRouter()

  // Real-time events (SWR with polling)
  const { data: dynamicData, isLoading: eventsLoading, mutate } = useSWR("/api/analytics", fetcher, {
    refreshInterval: 15000,
    revalidateOnFocus: false
  })

  // Static node capacity (Load ONLY once on mount)
  const [staticNodes, setStaticNodes] = useState<any[]>([])
  const [isClient, setIsClient] = useState(false)
  const [chartMounted, setChartMounted] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Tiny delay to ensure DOM dimensions are calculated
    setTimeout(() => setChartMounted(true), 250)

    const userId = localStorage.getItem("userId")
    if (!userId) {
      router.replace("/login")
      return
    }

    // Fetch node data once upon mount/refresh
    fetch("/api/analytics")
      .then(res => res.json())
      .then(result => {
        if (result.nodes && result.nodes.length > 0) {
          setStaticNodes(result.nodes)
        } else {
          setStaticNodes(FALLBACK_NODES) // Use preset fallback
        }
      })
      .catch(() => setStaticNodes(FALLBACK_NODES))
  }, [router])

  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all system logs? This cannot be undone.")) return
    await fetch("/api/analytics", { method: "DELETE" })
    mutate()
  }

  if (eventsLoading || !isClient || staticNodes.length === 0) return (
    <div className="h-screen flex items-center justify-center bg-background text-foreground">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-accent"></div>
    </div>
  )

  const events = dynamicData?.events || []

  // Transform Data for Pie Chart
  const eventDistribution = Object.entries(
    events.reduce((acc: any, curr: any) => {
      acc[curr.type] = (acc[curr.type] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value: value as number }))

  // Performance History Logic
  const performanceEvents = [...events]
    .reverse()
    .filter((e: any) => e.type === "upload" || e.type === "download")
    .map((e: any) => ({
      time: new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      uploadSpeed: e.type === "upload" ? parseFloat(((e.speed || 0) / 1024 / 1024).toFixed(2)) : null,
      downloadSpeed: e.type === "download" ? parseFloat(((e.speed || 0) / 1024 / 1024).toFixed(2)) : null,
      latency: e.latency || 0
    }))

  // Node Capacities for ApexCharts (Static Data)
  const apexBarOptions: any = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
      background: 'transparent',
      foreColor: '#71717a',
      animations: { enabled: false } // Disable animations to keep it static and stable
    },
    plotOptions: {
      bar: {
        borderRadius: 6,
        horizontal: false,
        columnWidth: '45%',
        distributed: true // Gives each bar a unique color if desired, or just fills nicely
      }
    },
    colors: [
      function ({ value, seriesIndex, w }: any) {
        const max = Math.max(...w.globals.series[0]) // highest bar
        const min = Math.min(...w.globals.series[0]) // lowest bar
        const intensity = (value - min) / (max - min || 1)
        const lightness = 75 - intensity * 40

        return `hsl(25, 90%, ${lightness}%)`
      }
    ],
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ['transparent'] },
    xaxis: {
      categories: staticNodes.map((n: any) => n.nodeId),
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      title: { text: 'MB Used', style: { color: '#71717a', fontWeight: 500 } }
    },
    tooltip: {
      theme: 'dark',
      y: { formatter: (val: number) => `${val} MB` }
    },
    grid: {
      borderColor: '#27272a',
      strokeDashArray: 4,
      xaxis: { lines: { show: false } }
    },
    legend: { show: false }
  }

  const apexBarSeries = [{
    name: 'Used Capacity',
    data: staticNodes.map((n: any) => Math.max(0, parseFloat(((n.used || 0) / 1024 / 1024).toFixed(2))))
  }]

  const stats = [
    { label: "Total Events", value: events.length, icon: <Activity className="w-5 h-5" />, color: "text-blue-400" },
    { label: "Uploads", value: events.filter((e: any) => e.type === "upload").length, icon: <ArrowUpRight className="w-5 h-5" />, color: "text-orange-400" },
    { label: "Downloads", value: events.filter((e: any) => e.type === "download").length, icon: <ArrowDownRight className="w-5 h-5" />, color: "text-violet-400" },
    { label: "Avg Latency", value: `${events.length ? (events.reduce((a: any, b: any) => a + (b.latency || 0), 0) / events.length).toFixed(1) : 0}ms`, icon: <Clock className="w-5 h-5" />, color: "text-emerald-400" }
  ]

  const tableLogs = events.slice(0, 100)

  return (
    <main className="min-h-screen min-w- bg-background text-foreground p-8 overflow-y-auto">
      {/* Header */}
      <header className="max-w-10xl mx-auto flex items-center justify-between mb-12">
        <div>
          <h1 id="analytics-title" className="text-5xl font-black text-white tracking-tighter mb-2">COSMEON
            <span className="text-accent underline decoration-white/10 underline-offset-8"> Analytics</span></h1>
          <p className="text-zinc-500">Real-time system performance and event tracking</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            id="back-to-dashboard"
            onClick={() => router.push("/dashboard")}
            className="glass-panel px-6 py-3 rounded-2xl border-white/10 text-zinc-400 hover:text-white transition-all flex items-center gap-2 text-sm font-bold uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={clearLogs}
            className="glass-card px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium text-red-400 hover:bg-red-400/10 transition-colors"
            title="Clear All Logs"
          >
            <RotateCcw className="w-4 h-4" />
            Clear Logs
          </button>
        </div>
      </header>

      <div className="max-w-10xl mx-auto space-y-8">
        {/* Stats Grid */}
        <section id="system-stats" className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="glass-panel p-6 rounded-2xl border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg bg-zinc-900 ${stat.color}`}>{stat.icon}</div>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">Live</div>
              </div>
              <p className="text-2xl font-mono font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Distribution (Recharts) */}
          <section id="event-distribution" className="glass-panel p-8 rounded-3xl border-white/5 flex flex-col min-h-[500px]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Database className="w-5 h-5 text-accent" />
              Event Distribution
            </h3>
            <div className="flex-1 flex items-center justify-center min-h-[350px]">
              {isClient && chartMounted && (
                <PieChart width={400} height={350}>
                  <Pie
                    data={eventDistribution}
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              )}
            </div>
          </section>

          {/* Orbit Capacities (Custom Stable Bar Graph) */}
          <section id="node-capacities" className="glass-panel p-8 rounded-3xl border-white/5 flex flex-col min-h-[500px]">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <LayoutDashboard className="w-5 h-5 text-emerald-400" />
              Orbit Storage Capacities (MB)
            </h3>

            <div className="flex-1 flex items-end justify-between gap-4 px-4 pb-12 relative min-h-[300px]">
              {(() => {
                const nodes = dynamicData?.nodes || staticNodes
                const maxUsedInCluster = Math.max(...nodes.map((n: any) => (n.used || 0) / 1024 / 1024))
                // Ceiling: either the actual max usage or at least 50MB so it doesn't look empty
                const chartCeiling = Math.max(50, maxUsedInCluster * 1.2)

                return nodes.map((node: any, i: number) => {
                  const usedMB = (node.used || 0) / 1024 / 1024
                  const percent = Math.min(100, (usedMB / chartCeiling) * 100)

                  return (
                    <div key={node.nodeId} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10">
                        <div className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap shadow-2xl">
                          <p className="text-[10px] font-black text-accent uppercase">{node.nodeId}</p>
                          <p className="text-xs font-bold text-white">{usedMB.toFixed(1)} MB</p>
                        </div>
                      </div>

                      {/* The Bar Container */}
                      <div className="w-full max-w-[44px] flex flex-col items-center gap-2">
                        <div className="w-full rounded-t-xl relative overflow-hidden h-[250px] transition-colors shadow-inner">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: usedMB > 0 ? `calc(${percent}% + 4px)` : "0%" }}
                            transition={{ duration: 1.5, ease: "circOut" }}
                            style={{
                              backgroundColor: percent > 75 ? "#ea580c" : percent > 40 ? "#f97316" : "#fbbf24",
                              boxShadow: `0 0 30px ${percent > 75 ? "rgba(234, 88, 12, 0.4)" : "rgba(249, 115, 22, 0.2)"}`
                            }}
                            className="absolute bottom-0 left-0 w-full rounded-t-md border-t border-white/20 min-h-[4px]"
                          />
                        </div>
                        {/* RAW NUMBER DISPLAY */}
                        <div className="text-center">
                          <p className="text-[10px] font-mono font-bold text-accent">{usedMB.toFixed(1)}</p>
                          <p className="text-[8px] font-mono text-zinc-600 uppercase">MB</p>
                        </div>
                      </div>

                      {/* Label */}
                      <div className="absolute -bottom-8 text-center">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">{node.nodeId.replace('ORBIT-', '')}</p>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </section>
        </div>

        {/* Performance Graph (Recharts) */}
        <section id="performance-history" className="glass-panel p-8 rounded-3xl border-white/5 flex flex-col min-h-[500px]">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-violet-400" />
            Performance History (Throughput & Latency)
          </h3>
          <div className="flex-1 flex items-center justify-center min-h-[350px]">
            {isClient && chartMounted && (
              <LineChart width={800} height={350} data={performanceEvents}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="time" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} minTickGap={30} />
                <YAxis yAxisId="left" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="uploadSpeed" name="Upload Speed" stroke="#f97316" strokeWidth={3} dot={true} connectNulls={true} />
                <Line yAxisId="left" type="monotone" dataKey="downloadSpeed" name="Download Speed" stroke="#8b5cf6" strokeWidth={3} dot={true} connectNulls={true} />
                <Line yAxisId="right" type="monotone" dataKey="latency" name="Latency" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} connectNulls={true} />
              </LineChart>
            )}
          </div>
        </section>

        {/* Activity Log */}
        <section id="activity-log" className="glass-panel rounded-3xl border-white/5 overflow-hidden">
          <div className="p-8 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-zinc-400" />
              Recent Activities (Showing 100)
            </h3>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full">{events.length} logs stored</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900/50">
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Time</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Action</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Target</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Size</th>
                  <th className="p-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Latency</th>
                </tr>
              </thead>
              <tbody>
                {tableLogs.map((e: any, i: number) => (
                  <tr key={i} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-sm font-mono text-zinc-400">{new Date(e.timestamp).toLocaleTimeString()}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-2 text-sm font-semibold capitalize" style={{ color: COLORS[e.type as keyof typeof COLORS] || "#fff" }}>
                        {e.type === 'upload' && <ArrowUpRight className="w-4 h-4" />}
                        {e.type === 'download' && <ArrowDownRight className="w-4 h-4" />}
                        {e.type === 'distribute' && <Wind className="w-4 h-4" />}
                        {e.type === 'cool' && <Thermometer className="w-4 h-4" />}
                        {e.type === 'heat' && <Zap className="w-4 h-4" />}
                        {e.type === 'delete' && <Trash2 className="w-4 h-4" />}
                        {e.type}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-zinc-300 font-medium">{e.filename || e.fileId || "-"}</td>
                    <td className="p-4 text-sm text-zinc-400 font-mono">{e.size ? `${(e.size / 1024).toFixed(1)} KB` : "-"}</td>
                    <td className="p-4 text-sm text-emerald-400 font-mono">{e.latency ? `${e.latency.toFixed(0)}ms` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}
