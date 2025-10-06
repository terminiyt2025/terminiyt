"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, MapPin, Phone, Mail, CheckCircle, XCircle, Eye } from "lucide-react"

// Mock business data
const mockBusinesses = [
  {
    id: "1",
    name: "Elite Barbershop",
    owner: "John Smith",
    email: "john@elitebarbershop.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main Street, Downtown",
    category: "Barber Shops",
    status: "verified",
    rating: 4.8,
    totalBookings: 234,
    joinedDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Glamour Beauty Studio",
    owner: "Sarah Johnson",
    email: "sarah@glamourbeauty.com",
    phone: "+1 (555) 234-5678",
    address: "456 Beauty Avenue, Uptown",
    category: "Beauty Salons",
    status: "pending",
    rating: 0,
    totalBookings: 0,
    joinedDate: "2024-01-20",
  },
  {
    id: "3",
    name: "HealthFirst Medical Center",
    owner: "Dr. Michael Brown",
    email: "info@healthfirstmc.com",
    phone: "+1 (555) 345-6789",
    address: "789 Medical Plaza, Healthcare District",
    category: "Medical Services",
    status: "active",
    rating: 4.7,
    totalBookings: 156,
    joinedDate: "2024-01-10",
  },
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case "verified":
      return <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
    case "active":
      return <Badge className="bg-blue-100 text-blue-700">Active</Badge>
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
    case "suspended":
      return <Badge className="bg-red-100 text-red-700">Suspended</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function BusinessManagement() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredBusinesses = mockBusinesses.filter((business) => {
    const matchesSearch =
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.owner.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || business.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Business Management</CardTitle>
        <CardDescription>Manage registered businesses and their verification status</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search businesses or owners..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Business Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBusinesses.map((business) => (
                <TableRow key={business.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{business.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {business.address}
                      </div>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {business.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{business.owner}</div>
                      <div className="text-sm text-muted-foreground">
                        Joined {new Date(business.joinedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {business.email}
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {business.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(business.status)}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">
                        Rating: {business.rating > 0 ? `${business.rating}/5` : "No ratings"}
                      </div>
                      <div className="text-sm text-muted-foreground">{business.totalBookings} bookings</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      {business.status === "pending" && (
                        <>
                          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                      {business.status === "active" && (
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No businesses found matching your criteria</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
