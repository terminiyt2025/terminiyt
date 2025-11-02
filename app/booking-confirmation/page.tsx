"use client"

import Link from "next/link"
import { CheckCircle, Calendar, Clock, Mail, Building, User, SwatchBook } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect } from "react"

interface BookingConfirmationProps {
  searchParams: {
    business?: string
    date?: string
    time?: string
    service?: string
    staff?: string
    phone?: string
    notes?: string
    serviceName?: string
    staffName?: string
    bookingId?: string
  }
}

export default function BookingConfirmation({ searchParams }: { searchParams: Promise<BookingConfirmationProps['searchParams']> }) {
  const [params, setParams] = useState<BookingConfirmationProps['searchParams']>({})
  
  useEffect(() => {
    searchParams.then(setParams)
  }, [searchParams])

  // Fetch booking data when bookingId is available
  useEffect(() => {
    const fetchBookingData = async () => {
      if (!params.bookingId) {
        setIsLoadingStatus(false)
        return
      }
      
      try {
        const response = await fetch(`/api/bookings/${params.bookingId}`)
        if (response.ok) {
          const booking = await response.json()
          setBookingData(booking)
          setBookingStatus(booking.status)
        }
      } catch (error) {
        console.error('Error fetching booking data:', error)
      } finally {
        setIsLoadingStatus(false)
      }
    }
    
    fetchBookingData()
  }, [params.bookingId])
  
  const business = params.business
  const date = params.date
  const time = params.time
  const service = params.service
  const staff = params.staff
  const phone = params.phone
  const notes = params.notes
  const bookingId = params.bookingId
  
  // Animation states
  const [showIcon, setShowIcon] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showDetailsCard, setShowDetailsCard] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)
  const [isLoadingStatus, setIsLoadingStatus] = useState(true)
  const [bookingData, setBookingData] = useState<any>(null)
  
  // Booking details from fetched data or URL params
  const displayBusiness = bookingData?.business?.name || business
  const displayDate = bookingData?.appointmentDate || date
  const displayTime = bookingData?.appointmentTime || time
  const displayService = bookingData?.serviceName || service
  const displayStaff = bookingData?.staffName || staff
  const displayNotes = bookingData?.notes || notes

  useEffect(() => {
    // Sequential animation timing
    const timer1 = setTimeout(() => setShowIcon(true), 200)
    const timer2 = setTimeout(() => setShowTitle(true), 600)
    const timer3 = setTimeout(() => setShowDescription(true), 1000)
    const timer4 = setTimeout(() => setShowDetailsCard(true), 1400)
    const timer5 = setTimeout(() => setShowButton(true), 1800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
    }
  }, [])

  // Format date consistently for both server and client
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    // Use a consistent format that works the same on server and client
    const weekdays = ['E diel', 'E hënë', 'E martë', 'E mërkurë', 'E enjte', 'E premte', 'E shtunë']
    const months = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor']
    
    const weekday = weekdays[date.getDay()]
    const day = date.getDate()
    const month = months[date.getMonth()]
    const year = date.getFullYear()
    
    return `${weekday}, ${day} ${month} ${year}`
  }

  // Show cancelled message if booking is cancelled
  if (bookingStatus === 'CANCELLED') {
    return (
      <div className="min-h-screen bg-custom-gradient">
        <div className="container px-4 py-8 md:py-16">
          <div className="max-w-2xl mx-auto">
            <Card className="border-gray-200 shadow-xl bg-white">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Rezervimi U Anulua</CardTitle>
                <span className="text-gray-700">Ky rezervim është anuluar.</span>
              </CardHeader>
              <CardContent className="space-y-6 px-3 md:px-6">
                <div className="text-center">
                  <Button asChild className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white px-8 py-3">
                    <Link href="/">Kthehu në Faqen Kryesore</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-custom-gradient ">
      <div className="container px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="border-gray-200 shadow-xl bg-white">
            <CardHeader className="text-center">
              <div className={`mx-auto w-16 h-16 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center mb-4 transition-all duration-700 ease-out ${
                showIcon ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
              }`}>
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <CardTitle className={`text-2xl font-bold text-gray-900 transition-all duration-700 ease-out ${
                showTitle ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>Ju faleminderit!</CardTitle>
              <span className={`text-gray-700 transition-all duration-700 ease-out ${
                showDescription ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}>Rezervimi juaj është aktiv!</span>

            </CardHeader>
            <CardContent className="space-y-6 px-3 md:px-6">
              {/* Booking Details - Expanded */}
              {isLoadingStatus ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Duke ngarkuar detajet e rezervimit...</p>
                </div>
              ) : (
                <div className={`space-y-4 transition-all duration-700 ease-out ${
                  showDetailsCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
                }`}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Detajet e Rezervimit Tuaj</h3>
                  
                  {displayBusiness && (
                    <div className="flex items-center gap-3 py-1">
                      <Building className="h-5 w-5 text-teal-800" />
                      <span className="text-gray-900 font-medium">{displayBusiness}</span>
                    </div>
                  )}
                  
                  {displayService && (
                    <div className="flex items-center gap-3 py-1">
                      <SwatchBook className="h-5 w-5 text-teal-800"/>
                      <span className="text-gray-900 font-medium">{displayService}</span>
                    </div>
                  )}
                  
                  {displayStaff && (
                    <div className="flex items-center gap-3 py-1">
                      <User className="h-5 w-5 text-teal-800"/>
                      <span className="text-gray-900 font-medium">{displayStaff}</span>
                    </div>
                  )}
                  
                  {displayDate && (
                    <div className="flex items-center gap-3 py-1">
                      <Calendar className="h-5 w-5 text-teal-800" />
                      <span className="font-medium">
                        {formatDate(displayDate)}
                      </span>
                    </div>
                  )}
                  {displayTime && (
                    <div className="flex items-center gap-3 py-1">
                      <Clock className="h-5 w-5 text-teal-800" />
                      <span className="text-gray-900 font-medium">{displayTime}</span>
                    </div>
                  )}
                  
                  {displayNotes && (
                    <div className="py-3 border-t border-gray-200 pt-4">
                      <div className="flex items-start gap-2 mb-2">
                        <svg className="w-5 h-5 text-purple-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span className="text-sm text-gray-500 font-medium">Shënime:</span>
                      </div>
                      <p className="text-gray-900 font-medium italic pl-7">{displayNotes}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-900 mb-4">Çfarë duhet të dini?</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Ju do të pranoni një email konfirmimi me të gjitha detajet e rezervimit.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-blue-700 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">
                      Ju lutem arrini para orarit të caktuar!
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className={`flex flex-col md:flex-row gap-3 justify-center transition-all duration-700 ease-out ${
                showButton ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}>
                <Button asChild className="w-full md:w-auto bg-custom-gradient text-white px-8 py-3">
                  <Link href="/">Kthehu në Faqen Kryesore</Link>
                </Button>
                {bookingId && (
                  <Button 
                    className="w-full md:w-auto bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white px-8 py-3"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Anulo Rezervimin
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Booking Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center mb-6">
              <div className="flex-shrink-0 w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Konfirmo Anulimin
              </h3>
              <p className="text-base text-gray-600 mb-8">
                A jeni të sigurt që doni të anuloni këtë rezervim?
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => setShowCancelDialog(false)}
                  className="px-6 py-2.5 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white text-base font-medium"
                >
                  Anulo
                </Button>
                <Button
                  onClick={async () => {
                    if (!bookingId) {
                      alert('Booking ID is missing')
                      return
                    }
                    
                    try {
                      setCancelling(true)
                      
                      // Update booking status to PENDING
                      const response = await fetch(`/api/bookings/${bookingId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ status: 'CANCELLED' })
                      })
                      
                      if (!response.ok) {
                        throw new Error('Failed to cancel booking')
                      }
                      
                      setShowCancelDialog(false)
                      setShowSuccessMessage(true)
                    } catch (error) {
                      console.error('Error cancelling booking:', error)
                      alert('Ndodhi një gabim gjatë anulimit të rezervimit. Ju lutem provoni përsëri.')
                    } finally {
                      setCancelling(false)
                    }
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white text-base font-medium"
                  disabled={cancelling}
                >
                  {cancelling ? 'Duke anuluar...' : 'Konfirmo Anulimin'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Message Dialog */}
      {showSuccessMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
            <div className="flex flex-col items-center mb-6">
              <div className="flex-shrink-0 w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Rezervimi U Anulua!
              </h3>
              <p className="text-base text-gray-600 mb-8">
                Rezervimi juaj u anulua me sukses.
              </p>
              <Button
                onClick={() => {
                  setShowSuccessMessage(false)
                  window.location.href = '/'
                }}
                className="px-6 py-2.5 bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white text-base font-medium w-full"
              >
                Kthehu në Faqen Kryesore
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
