"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/DashboardLayout"
import AuthGuard from "@/components/AuthGuard"
import {
  AnalyticsService,
  type AnalyticsData,
  type ChartData,
  type TopPerformer,
  type SystemHealth,
} from "@/lib/analytics"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building,
  Users,
  Eye,
  CalendarIcon,
  Download,
  Zap,
  AlertTriangle,
  Database,
  ShieldCheck,
} from "lucide-react"
import jsPDF from "jspdf"
import "jspdf-autotable"
import { cn, formatZar } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF
}

export default function AdminAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [revenueChart, setRevenueChart] = useState<ChartData | null>(null)
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 29)),
    to: new Date(),
  })

  useEffect(() => {
    loadAnalyticsData()
  }, [date])

  const loadAnalyticsData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would pass the date range to the service
      const [overview, chart, performers, health] = await Promise.all([
        AnalyticsService.getOverviewData(),
        AnalyticsService.getRevenueChart("30d"), // This would use the date range
        AnalyticsService.getTopPerformers(),
        AnalyticsService.getSystemHealth(),
      ])

      setAnalyticsData(overview)
      setRevenueChart(chart)
      setTopPerformers(performers)
      setSystemHealth(health)
    } catch (error) {
      console.error("Failed to load analytics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const exportToPDF = () => {
    if (!analyticsData || !topPerformers || !systemHealth) return

    const doc = new jsPDF() as jsPDFWithAutoTable
    const dateRangeString =
      date?.from && date?.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}` : "All Time"

    doc.setFontSize(18)
    doc.text("Varsity Nest - Analytics Report", 14, 22)
    doc.setFontSize(11)
    doc.text(`Date Range: ${dateRangeString}`, 14, 28)

    doc.autoTable({
      startY: 35,
      head: [["Metric", "Value", "Growth"]],
      body: [
        [
          "Total Revenue",
          formatZar(analyticsData.revenue.total, true),
          `${analyticsData.revenue.growth.toFixed(1)}%`,
        ],
        ["Accommodations", analyticsData.accommodations.total, `${analyticsData.accommodations.growth.toFixed(1)}%`],
      ],
    })

    doc.save(`varsity-nest-analytics-${format(new Date(), "yyyy-MM-dd")}.pdf`)
  }

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
  }: { title: string; value: string | number; change: number; icon: any; color: string }) => (
    <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-300">{title}</p>
          <p className="text-2xl font-bold text-white mt-1 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent">{value}</p>
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-neutral-400 ml-1">vs last month</span>
          </div>
        </div>
        <div className={`${color} p-3 rounded-lg shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )

  const HealthCard = ({
    title,
    value,
    status,
    icon: Icon,
  }: {
    title: string
    value: string
    status: "good" | "average" | "poor" | "online" | "degraded" | "offline"
    icon: any
  }) => {
    const statusColors = {
      good: "bg-green-500/20 text-green-400 border-green-500/50",
      average: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      poor: "bg-red-500/20 text-red-400 border-red-500/50",
      online: "bg-green-500/20 text-green-400 border-green-500/50",
      degraded: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      offline: "bg-red-500/20 text-red-400 border-red-500/50",
    }
    return (
      <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-xl p-4 text-white shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] flex items-center space-x-4">
        <div className="p-2 border border-white/20 bg-white/10 rounded-lg">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <p className="text-sm text-neutral-300">{title}</p>
          <p className="text-lg font-bold text-white">{value}</p>
        </div>
        <span className={cn("text-xs font-medium ml-auto px-2.5 py-0.5 rounded-full border", statusColors[status])}>
          {status}
        </span>
      </div>
    )
  }

  if (isLoading || !analyticsData || !systemHealth) {
    return (
      <AuthGuard requiredRole="admin">
        <DashboardLayout userRole="admin">
          <div className="space-y-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                ))}
              </div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requiredRole="admin">
      <DashboardLayout userRole="admin">
        <div className="space-y-8 p-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Analytics Dashboard</h1>
              <p className="text-neutral-300">Track your platform&apos;s performance and growth</p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-[300px] justify-start text-left font-normal border-white/20 bg-black/20 text-white hover:bg-white/10", !date && "text-neutral-400")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <Button onClick={exportToPDF} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={formatZar(analyticsData.revenue.total, true)}
              change={analyticsData.revenue.growth}
              icon={DollarSign}
              color="bg-green-500"
            />
            <StatCard
              title="Accommodations"
              value={analyticsData.accommodations.total}
              change={analyticsData.accommodations.growth}
              icon={Building}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Providers"
              value={analyticsData.providers.active}
              change={analyticsData.providers.growth}
              icon={Users}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Views"
              value={analyticsData.views.total.toLocaleString()}
              change={analyticsData.views.growth}
              icon={Eye}
              color="bg-orange-500"
            />
          </div>

          {/* System Health */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">System Health</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <HealthCard
                title="API Latency"
                value={`${systemHealth.apiLatency.average}ms`}
                status={systemHealth.apiLatency.status}
                icon={Zap}
              />
              <HealthCard
                title="Error Rate"
                value={`${systemHealth.errorRate.rate}%`}
                status={systemHealth.errorRate.status}
                icon={AlertTriangle}
              />
              <HealthCard
                title="Database"
                value={systemHealth.database.status}
                status={systemHealth.database.status}
                icon={Database}
              />
              <HealthCard
                title="Uptime (30d)"
                value={`${systemHealth.uptime.percentage}%`}
                status={systemHealth.uptime.status}
                icon={ShieldCheck}
              />
            </div>
          </div>

          {/* Revenue Chart & Top Performers */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Revenue Trends</h2>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-sm text-neutral-300">
                    {date?.from && date?.to
                      ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                      : "All Time"}
                  </span>
                </div>
              </div>
              <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg p-4">
                {revenueChart?.datasets[0].data && revenueChart.datasets[0].data.length > 0 ? (
                  <div className="h-full flex items-end justify-between space-x-1">
                    {revenueChart.datasets[0].data.map((value, index) => {
                      const maxValue = Math.max(...revenueChart.datasets[0].data)
                      const heightPercentage = maxValue > 0 ? (value / maxValue) * 100 : 0
                      const label = revenueChart.labels[index] || `Day ${index + 1}`
                      
                      return (
                        <div key={index} className="flex flex-col items-center h-full flex-1 group">
                          {/* Tooltip */}
                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                            {formatZar(value)}
                          </div>
                          
                          {/* Bar */}
                          <div
                            className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm w-full relative group-hover:from-blue-500 group-hover:to-blue-300 transition-all duration-200 min-h-[2px]"
                            style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                          />
                          
                          {/* Date Label */}
                          <div className="text-xs text-neutral-400 mt-2 text-center transform -rotate-45 origin-left whitespace-nowrap">
                            {label}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <DollarSign className="w-8 h-8 text-blue-400" />
                      </div>
                      <p className="text-neutral-400 text-lg">No Revenue Data</p>
                      <p className="text-neutral-500 text-sm">Revenue data will appear here once payments are processed</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="group relative border border-white/10 bg-black/20 backdrop-blur-xl rounded-2xl p-6 text-white shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300">
              <h2 className="text-xl font-semibold mb-4 text-white">Top Performers</h2>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div
                    key={performer.id}
                    className="flex items-center justify-between p-3 border border-white/10 bg-white/5 rounded-lg hover:bg-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/50 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-400">#{index + 1}</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-white truncate">{performer.name}</p>
                        <p className="text-sm text-neutral-300 capitalize">{performer.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="font-semibold text-white">
                        {formatZar(performer.value)}
                      </p>
                      <div className="flex items-center justify-end">
                        <TrendingUp className="w-3 h-3 text-green-400 mr-1" />
                        <span className="text-sm text-green-400">+{performer.change}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
