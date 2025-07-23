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
import { cn } from "@/lib/utils"
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
          `R${analyticsData.revenue.total.toLocaleString()}`,
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
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          <div className="flex items-center mt-2">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${change >= 0 ? "text-green-600" : "text-red-600"}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
          </div>
        </div>
        <div className={`${color} p-3 rounded-lg`}>
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
      good: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      average: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      poor: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      online: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      degraded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      offline: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    }
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border dark:border-gray-700 flex items-center space-x-4">
        <Icon className="w-8 h-8 text-gray-500" />
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <span className={cn("text-xs font-medium ml-auto px-2.5 py-0.5 rounded-full", statusColors[status])}>
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
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics Dashboard</h1>
              <p className="text-gray-600 dark:text-gray-400">Track your platform's performance and growth</p>
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn("w-[300px] justify-start text-left font-normal", !date && "text-muted-foreground")}
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
              <Button onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={`R${analyticsData.revenue.total.toLocaleString()}`}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">System Health</h2>
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
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold">Revenue Trends</h2>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {date?.from && date?.to
                      ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                      : "All Time"}
                  </span>
                </div>
              </div>
              <div className="h-64 bg-gradient-to-t from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg flex items-end justify-around p-4">
                {revenueChart?.datasets[0].data.map((value, index) => (
                  <div key={index} className="w-full flex justify-center">
                    <div
                      className="bg-blue-500 rounded-t-sm w-3/4 relative group"
                      style={{ height: `${(value / Math.max(...revenueChart.datasets[0].data)) * 100}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        R{value.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border dark:border-gray-700">
              <h2 className="text-lg font-semibold mb-4">Top Performers</h2>
              <div className="space-y-4">
                {topPerformers.map((performer, index) => (
                  <div
                    key={performer.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-300">#{index + 1}</span>
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{performer.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{performer.type}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 pl-2">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">
                        R{performer.value.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-end">
                        <TrendingUp className="w-3 h-3 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">+{performer.change}%</span>
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
