const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createTestBooking() {
  try {
    console.log('=== CREATING TEST BOOKING ===')
    
    const now = new Date()
    const testTime = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes from now
    
    console.log('Current time:', now.toISOString())
    console.log('Test booking time:', testTime.toISOString())
    
    // Format time for database
    const timeString = testTime.toTimeString().slice(0, 5) // HH:MM format
    const dateString = testTime.toISOString().split('T')[0] // YYYY-MM-DD format
    
    console.log('Time string:', timeString)
    console.log('Date string:', dateString)
    
    // Find an existing business
    const business = await prisma.business.findFirst()
    if (!business) {
      console.log('No business found')
      return
    }
    
    console.log('Using business:', business.name)
    
    // Create test booking
    const testBooking = await prisma.booking.create({
      data: {
        customerName: 'Test Customer',
        customerEmail: 'test@example.com',
        customerPhone: '+1234567890',
        serviceName: 'Test Service',
        serviceDuration: 30,
        staffName: 'Test Staff',
        appointmentDate: new Date(dateString),
        appointmentTime: timeString,
        status: 'CONFIRMED',
        businessId: business.id,
        notes: 'Test booking for reminder system',
        totalPrice: 50
      }
    })
    
    console.log('Test booking created:', testBooking.id)
    console.log('Appointment date:', testBooking.appointmentDate)
    console.log('Appointment time:', testBooking.appointmentTime)
    console.log('Customer email:', testBooking.customerEmail)
    
    console.log('\n=== WAIT FOR REMINDER ===')
    console.log('The reminder should be sent in about 5 minutes when the cron job runs.')
    console.log('Check your email at:', testBooking.customerEmail)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestBooking()
