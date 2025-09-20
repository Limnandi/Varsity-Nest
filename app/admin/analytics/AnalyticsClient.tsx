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

export default function AnalyticsClient() {
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
      const [overview, chart, performers, health] = await Promise.all([
        AnalyticsService.getOverviewData(),
        AnalyticsService.getRevenueChart("30d"),
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
        <div className="space-y-8">
          <h1 className="text-2xl font-bold">Admin Analytics</h1>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}


