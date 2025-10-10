const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkBookings() {
  try {
    console.log('=== CHECKING ALL BOOKINGS ===')
    
    const now = new Date()
    console.log('Current time:', now.toISOString())
    console.log('Current time (local):', now.toLocaleString())
    
    // Calculate reminder window
    const reminderWindowStart = new Date(now.getTime() + 25 * 60 * 1000) // 25 minutes from now
    const reminderWindowEnd = new Date(now.getTime() + 35 * 60 * 1000)   // 35 minutes from now
    
    console.log('Reminder window start (25 min):', reminderWindowStart.toISOString())
    console.log('Reminder window end (35 min):', reminderWindowEnd.toISOString())
    
    const allBookings = await prisma.booking.findMany({
      include: {
        business: true
      }
    })
    
    console.log(`\nTotal bookings: ${allBookings.length}`)
    
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
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBookings()
