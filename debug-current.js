const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugCurrent() {
  try {
    console.log('=== DEBUGGING CURRENT STATE ===')
    
    const now = new Date()
    console.log('Current time:', now.toISOString())
    console.log('Current time (local):', now.toLocaleString())
    
    // Calculate reminder window (same as API)
    const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000) // 25 minutes from now
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60 * 1000)   // 35 minutes from now
    
    console.log('Reminder window start (25 min):', reminderWindowStart.toISOString())
    console.log('Reminder window end (35 min):', reminderWindowEnd.toISOString())
    
    // Get all bookings
    const allBookings = await prisma.booking.findMany({
      include: {
        business: true
      }
    })
    
    console.log(`\nTotal bookings: ${allBookings.length}`)
    
    // Check each booking
    allBookings.forEach(booking => {
      const bookingDate = new Date(booking.appointmentDate)
      const bookingTime = booking.appointmentTime
      
      // Create a full datetime for the booking
      const bookingDateTime = new Date(bookingDate)
      const [hours, minutes] = bookingTime.split(':')
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const diffMinutes = (bookingDateTime - now) / (1000 * 60)
      
      console.log(`\nID: ${booking.id}`)
      console.log(`Date: ${booking.appointmentDate}`)
      console.log(`Time: ${booking.appointmentTime}`)
      console.log(`Status: ${booking.status}`)
      console.log(`Booking DateTime: ${bookingDateTime.toISOString()}`)
      console.log(`Minutes until booking: ${Math.round(diffMinutes)}`)
      console.log(`Should get reminder: ${diffMinutes >= 25 && diffMinutes <= 35 ? 'YES' : 'NO'}`)
      console.log(`Customer: ${booking.customerName}`)
      console.log(`Email: ${booking.customerEmail}`)
    })
    
    // Test the exact API query
    const { format } = require('date-fns')
    
    const today = new Date()
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const localTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    console.log('\n=== TESTING API QUERY ===')
    console.log('Local today:', localToday.toISOString())
    console.log('Local tomorrow:', localTomorrow.toISOString())
    console.log('Time window:', format(reminderWindowStart, 'HH:mm'), 'to', format(reminderWindowEnd, 'HH:mm'))
    
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: localToday,
          lt: localTomorrow
        },
        appointmentTime: {
          gte: format(reminderWindowStart, 'HH:mm'),
          lt: format(reminderWindowEnd, 'HH:mm')
        },
        status: 'CONFIRMED'
      },
      include: {
        business: true
      }
    })
    
    console.log(`\nBookings found by API query: ${bookingsToRemind.length}`)
    bookingsToRemind.forEach(booking => {
      console.log(`- ID: ${booking.id}, Time: ${booking.appointmentTime}, Customer: ${booking.customerName}`)
    })
    
    // Check if test booking exists
    const testBooking = await prisma.booking.findUnique({
      where: { id: 1013 }
    })
    
    if (testBooking) {
      console.log('\n=== TEST BOOKING EXISTS ===')
      console.log('ID:', testBooking.id)
      console.log('Date:', testBooking.appointmentDate)
      console.log('Time:', testBooking.appointmentTime)
      console.log('Status:', testBooking.status)
      
      // Check if it's in the window
      const bookingDate = new Date(testBooking.appointmentDate)
      const bookingDateTime = new Date(bookingDate)
      const [hours, minutes] = testBooking.appointmentTime.split(':')
      bookingDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      const diffMinutes = (bookingDateTime - now) / (1000 * 60)
      console.log('Minutes until booking:', Math.round(diffMinutes))
      console.log('In reminder window:', diffMinutes >= 25 && diffMinutes <= 35)
    } else {
      console.log('\n=== TEST BOOKING NOT FOUND ===')
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugCurrent()
