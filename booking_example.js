// Example: How to load services and staff for bookings with JSON storage

// 1. Get business with all services and staff in one query
async function getBusinessForBooking(businessId) {
  const business = await db.getBusinessById(businessId)
  
  // Services are now directly available as JSON array
  const services = business.services || []
  const staff = business.staff || []
  
  return {
    business,
    services,
    staff
  }
}

// 2. Example of how services data looks in JSON
const exampleServices = [
  {
    name: "Haircut",
    description: "Professional haircut service",
    price: 25.00,
    duration: "30 min",
    durationMinutes: 30,
    isActive: true
  },
  {
    name: "Hair Coloring",
    description: "Full hair coloring service",
    price: 80.00,
    duration: "2 orë",
    durationMinutes: 120,
    isActive: true
  }
]

// 3. Example of how staff data looks in JSON
const exampleStaff = [
  {
    name: "John Doe",
    email: "john@salon.com",
    phone: "+383 44 123 456",
    isActive: true
  },
  {
    name: "Jane Smith",
    email: "jane@salon.com", 
    phone: "+383 44 789 012",
    isActive: true
  }
]

// 4. Creating a booking with service name (not ID)
async function createBooking(bookingData) {
  const booking = await prisma.booking.create({
    data: {
      businessId: bookingData.businessId,
      serviceName: bookingData.serviceName, // Store service name directly
      appointmentDate: bookingData.appointmentDate,
      appointmentTime: bookingData.appointmentTime,
      customerName: bookingData.customerName,
      customerEmail: bookingData.customerEmail,
      customerPhone: bookingData.customerPhone,
      totalPrice: bookingData.totalPrice
    }
  })
  
  return booking
}

// 5. Loading booking with business info
async function getBookingWithBusiness(bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      business: true // This includes services and staff as JSON
    }
  })
  
  // Access services and staff directly
  const availableServices = booking.business.services || []
  const availableStaff = booking.business.staff || []
  
  return {
    booking,
    availableServices,
    availableStaff
  }
}

console.log("✅ JSON storage makes bookings much simpler!")
console.log("✅ No complex joins needed")
console.log("✅ All business data loaded in one query")
console.log("✅ Services and staff are arrays ready to use")

