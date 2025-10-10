const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function debugReminders() {
  try {
    console.log('=== DEBUGGING REMINDER SYSTEM ===')
    
    const now = new Date()
    console.log('Current time:', now.toISOString())
    console.log('Current time (local):', now.toLocaleString())
    
    // Calculate 30 minutes from now
    const reminderTime = new Date(now.getTime() + 30 * 60 * 1000)
    console.log('Reminder time (30 min from now):', reminderTime.toISOString())
    console.log('Reminder time (local):', reminderTime.toLocaleString())
    
    // Find bookings that start in 30 minutes (today only)
    const today = new Date()
    const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const localTomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
    
    console.log('Local today start:', localToday.toISOString())
    console.log('Local tomorrow start:', localTomorrow.toISOString())
    
    const allBookings = await prisma.booking.findMany({
      include: {
        business: true
      }
    })
    
    console.log('\n=== ALL BOOKINGS ===')
    allBookings.forEach(booking => {
      const bookingDate = new Date(booking.appointmentDate)
      const isToday = bookingDate >= localToday && bookingDate < localTomorrow
      
      console.log(`ID: ${booking.id}`)
      console.log(`Date: ${booking.appointmentDate}`)
      console.log(`Time: ${booking.appointmentTime}`)
      console.log(`Status: ${booking.status}`)
      console.log(`Is today: ${isToday}`)
      console.log(`Booking date UTC: ${bookingDate.toISOString()}`)
      console.log('---')
    })
    
    // Test the API query logic
    const { format } = require('date-fns')
    
    const bookingsToRemind = await prisma.booking.findMany({
      where: {
        appointmentDate: {
          gte: localToday,
          lt: localTomorrow
        },
        appointmentTime: {
          gte: format(reminderTime, 'HH:mm'),
          lt: format(new Date(reminderTime.getTime() + 5 * 60 * 1000), 'HH:mm')
        },
        status: 'CONFIRMED'
      },
      include: {
        business: true
      }
    })
    
    console.log('\n=== BOOKINGS THAT WOULD GET REMINDERS ===')
    console.log(`Found ${bookingsToRemind.length} bookings to remind`)
    
    bookingsToRemind.forEach(booking => {
      console.log(`ID: ${booking.id}, Time: ${booking.appointmentTime}, Customer: ${booking.customerName}`)
    })
    
    // Test the API endpoint
    console.log('\n=== TESTING API ENDPOINT ===')
    const https = require('https')
    const http = require('http')
    
    const API_URL = 'https://terminiyt.com'
    const ENDPOINT = '/api/send-reminders'
    
    const url = new URL(ENDPOINT, API_URL)
    const client = url.protocol === 'https:' ? https : http
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }

    const result = await new Promise((resolve, reject) => {
      const req = client.request(url, options, (res) => {
        let data = ''
        
        res.on('data', (chunk) => {
          data += chunk
        })
        
        res.on('end', () => {
          try {
            const result = JSON.parse(data)
            resolve(result)
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      req.setTimeout(30000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
    
    console.log('API Response:', JSON.stringify(result, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugReminders()
