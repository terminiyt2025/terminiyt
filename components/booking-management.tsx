"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Calendar, Clock, User, Building2, DollarSign } from "lucide-react"



const getStatusBadge = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Badge className="bg-emerald-100 text-emerald-700">Confirmed</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700">Cancelled</Badge>
    case "completed":
      return <Badge className="bg-blue-100 text-blue-700">Completed</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function BookingManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.serviceName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking Management</CardTitle>
        <CardDescription>Monitor and manage all platform bookings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search bookings, customers, or businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Booking Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking Details</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Business</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{booking.id}</div>
                      <div className="text-sm text-muted-foreground">{booking.serviceName}</div>
                      <div className="text-xs text-muted-foreground">
                        Booked {new Date(booking.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {booking.customerName}
                      </div>
                      <div className="text-sm text-muted-foreground">{booking.customerEmail}</div>
                      <div className="text-sm text-muted-foreground">{booking.customerPhone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      <span className="font-medium">{booking.businessName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(booking.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {booking.time}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(booking.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium">
                      <DollarSign className="h-3 w-3" />
                      {booking.price}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No bookings found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
