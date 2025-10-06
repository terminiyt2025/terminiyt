"use client"

import Link from "next/link"
import { CheckCircle, Calendar, Clock, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, use } from "react"

interface BookingConfirmationProps {
  searchParams: {
    business?: string
    date?: string
    time?: string
    service?: string
    phone?: string
  }
}

export default function BookingConfirmation({ searchParams }: BookingConfirmationProps) {
  const resolvedSearchParams = use(searchParams)
  const { business, date, time, service, phone } = resolvedSearchParams
  
  // Animation states
  const [showIcon, setShowIcon] = useState(false)
  const [showTitle, setShowTitle] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const [showDetailsCard, setShowDetailsCard] = useState(false)
  const [showNextStepsCard, setShowNextStepsCard] = useState(false)
  const [showContactCard, setShowContactCard] = useState(false)
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // Sequential animation timing
    const timer1 = setTimeout(() => setShowIcon(true), 200)
    const timer2 = setTimeout(() => setShowTitle(true), 600)
    const timer3 = setTimeout(() => setShowDescription(true), 1000)
    const timer4 = setTimeout(() => setShowDetailsCard(true), 1400)
    const timer5 = setTimeout(() => setShowNextStepsCard(true), 1800)
    const timer6 = setTimeout(() => setShowContactCard(true), 2200)
    const timer7 = setTimeout(() => setShowButton(true), 2600)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
      clearTimeout(timer5)
      clearTimeout(timer6)
      clearTimeout(timer7)
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-teal-800  ">
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
              }`}>Rezervimi juaj u krye me sukses!</span>

            </CardHeader>
            <CardContent className="space-y-6 px-3 md:px-6">
              {/* Booking Details */}
              <div className={`bg-gray-50 p-3 md:p-6 rounded-lg border border-gray-200 transition-all duration-700 ease-out ${
                showDetailsCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}>
                <h3 className="font-semibold text-gray-900 mb-4">Detajet e Terminit</h3>
                <div className="space-y-3">
                  {business && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-teal-800" />
                      <span className="text-gray-700">{business}</span>
                    </div>
                  )}
                  {service && (
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 bg-teal-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <span className="text-gray-700">{service}</span>
                    </div>
                  )}
                  {date && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-teal-800" />
                      <span className="text-gray-700 text-lg ">
                        {formatDate(date)}
                      </span>
                    </div>
                  )}
                  {time && (
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-teal-800" />
                      <span className="text-gray-700">{time}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Next Steps */}
              <div className={`bg-gray-50 p-3 md:p-6 rounded-lg border border-gray-200 transition-all duration-700 ease-out ${
                showNextStepsCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}>
                <h3 className="font-semibold text-gray-900 mb-3">Çfarë duket të kemi parasysh?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full mt-2 flex-shrink-0"></span>
                    Ju do të pranoni një email konfirmimi me të gjitha detajet e rezervimit.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full mt-2 flex-shrink-0"></span>
                    Biznesi do t'ju kontaktojë në numrin tuaj te telefonit nëse duhen ndryshime!
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full mt-2 flex-shrink-0"></span>
                    Ju lutemi arrini 5-10 minuta para orës së rezervimit!
                  </li>
                </ul>
              </div>

              {/* Contact Information */}
              <div className={`bg-gray-50 p-3 md:p-6 rounded-lg border border-gray-200 transition-all duration-700 ease-out ${
                showContactCard ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}>
                <h3 className="font-semibold text-gray-900 mb-3">Duhet të Bëni Ndryshime?</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Nëse duhet të riprogramoni ose të anuloni terminin tuaj, ju lutemi kontaktoni biznesin direkt.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    <span>Informacioni i kontaktit u dërgua në email-in tuaj</span>
                  </div>
                  {phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      <span>Numri i telefonit: {phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className={`flex justify-center transition-all duration-700 ease-out ${
                showButton ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
              }`}>
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
