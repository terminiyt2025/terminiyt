import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Building2, Calendar, DollarSign } from "lucide-react"

interface AdminStatsProps {
  stats: {
    totalBusinesses: number
    pendingBusinesses: number
    totalBookings: number
    todayBookings: number
    totalUsers: number
    activeUsers: number
    totalRevenue: number
    monthlyGrowth: number
  }
}

export function AdminStats({ stats }: AdminStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBusinesses}</div>
          <p className="text-xs text-muted-foreground">{stats.pendingBusinesses} pending approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBookings.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{stats.todayBookings} today</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">of {stats.totalUsers} total users</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
          <p className="text-xs text-emerald-600 flex items-center">
            <TrendingUp className="h-3 w-3 mr-1" />+{stats.monthlyGrowth}% from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
