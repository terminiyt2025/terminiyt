import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, Phone, User } from "lucide-react"

// Mock booking data
const mockBookings = [
  {
    id: "1",
    businessName: "Elite Barbershop",
    serviceName: "Classic Haircut",
    date: "2024-01-15",
    time: "14:00",
    status: "confirmed",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    customerPhone: "+1 (555) 123-4567",
    address: "123 Main St, Downtown",
    price: 35,
  },
  {
    id: "2",
    businessName: "Glow Beauty Salon",
    serviceName: "Hair Cut & Style",
    date: "2024-01-18",
    time: "10:00",
    status: "pending",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    customerPhone: "+1 (555) 987-6543",
    address: "456 Oak Ave, Midtown",
    price: 65,
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-700"
    case "pending":
      return "bg-yellow-100 text-yellow-700"
    case "cancelled":
      return "bg-red-100 text-red-700"
    case "completed":
      return "bg-blue-100 text-blue-700"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

export default function MyBookingsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Bookings</h1>
            <p className="text-slate-600">Manage your upcoming and past appointments</p>
          </div>

          <div className="space-y-6">
            {mockBookings.map((booking) => (
              <Card key={booking.id} className="border-emerald-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl font-semibold text-slate-900">{booking.businessName}</CardTitle>
                      <CardDescription className="text-slate-600 mt-1">{booking.serviceName}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(booking.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Clock className="h-4 w-4" />
                        <span>{booking.time}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span>{booking.address}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-slate-600">
                        <User className="h-4 w-4" />
                        <span>{booking.customerName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="h-4 w-4" />
                        <span>{booking.customerPhone}</span>
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium">Total: ${booking.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    {booking.status === "confirmed" && (
                      <>
                        <Button variant="outline" size="sm">
                          Reschedule
                        </Button>
                        <Button variant="outline" size="sm">
                          Cancel
                        </Button>
                      </>
                    )}
                    {booking.status === "completed" && (
                      <Button variant="outline" size="sm">
                        Leave Review
                      </Button>
                    )}
                    <Button variant="outline" size="sm">
                      Contact Business
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {mockBookings.length === 0 && (
            <Card className="border-emerald-200">
              <CardContent className="text-center py-12">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No bookings yet</h3>
                <p className="text-slate-600 mb-4">Start by finding and booking services near you</p>
                <Button asChild>
                  <a href="/">Find Services</a>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
