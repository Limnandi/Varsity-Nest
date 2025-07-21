import { getSession } from "@/lib/session"
import { getSessionUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Building, BedDouble } from "lucide-react"
import { getPlatformSettings } from "@/lib/actions/admin.actions"
import { ProductionModeSwitch } from "@/components/ProductionModeSwitch"
import { sql } from "@/lib/database"

const mockStats = {
  totalUsers: 1250,
  totalProviders: 75,
  totalListings: 250,
}

async function getProductionStats() {
  try {
    const usersPromise = sql`SELECT COUNT(*) FROM users`
    const providersPromise = sql`SELECT COUNT(*) FROM users WHERE role = 'provider'`
    const listingsPromise = sql`SELECT COUNT(*) FROM accommodations`

    const [userCount, providerCount, listingCount] = await Promise.all([
      usersPromise,
      providersPromise,
      listingsPromise,
    ])

    return {
      totalUsers: Number(userCount[0].count),
      totalProviders: Number(providerCount[0].count),
      totalListings: Number(listingCount[0].count),
    }
  } catch (error) {
    console.error("Failed to fetch production stats:", error)
    return {
      totalUsers: 0,
      totalProviders: 0,
      totalListings: 0,
    }
  }
}

export default async function AdminDashboard() {
  const session = await getSession()
  const sessionUser = await getSessionUser()
  console.log("Session in dashboard:", { session, sessionUser })
  
  if (!session || !sessionUser) {
    console.log("No valid session found, redirecting to unauthorized")
    redirect("/unauthorized")
  }
  
  if (sessionUser.role !== "admin") {
    console.log(`User role ${sessionUser.role} is not admin, redirecting`)
    redirect("/unauthorized")
  }

  const settings = await getPlatformSettings()
  const isProduction = settings.production_mode

  const stats = isProduction ? await getProductionStats() : mockStats

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <ProductionModeSwitch isProduction={isProduction} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accommodation Providers</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProviders}</div>
            <p className="text-xs text-muted-foreground">Verified providers on the platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
            <BedDouble className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalListings}</div>
            <p className="text-xs text-muted-foreground">Active accommodation listings</p>
          </CardContent>
        </Card>
      </div>
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Platform Status</h3>
        <Card>
          <CardContent className="p-6">
            <p>
              The platform is currently in{" "}
              <span className={`font-bold ${isProduction ? "text-green-600" : "text-yellow-600"}`}>
                {isProduction ? "Production Mode" : "Development Mode"}
              </span>
              .
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {isProduction
                ? "All data displayed is live from the database. Actions are permanent."
                : "Displaying mock data for demonstration purposes. No real data is affected."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
