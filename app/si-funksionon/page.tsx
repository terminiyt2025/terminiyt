"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowLeft, Play, ChevronDown, ChevronUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import { useState } from "react"

const faqData = [
  {
    id: 1,
    answer: "Regjistrimi është shumë i thjeshtë! Klikoni në 'Regjistrohu si Biznes' dhe plotësoni formularin me informacionet e biznesit tuaj. Pas regjistrimit dhe verifikimit nga ana jonë, biznesi juaj do të shfaqet në hartë dhe klientët do të mund të rezervojnë shërbimet tuaja.",
    question: "Si mund të regjistrohem si ofrues shërbimesh?",
  },
  {
    id: 2,
    question: "A është falas përdorimi i platformës?",
    answer: "Po, regjistrimi dhe përdorimi bazë i platformës është falas për 30 ditë. Ne ofrojmë edhe plane premium me karakteristika shtesë për bizneset që duan të maksimizojnë praninë e tyre online."
  },
  {
    id: 3,
    question: "Si funksionon sistemi i rezervimeve?",
    answer: "Klientët mund të shohin oraret tuaja të disponueshme dhe të rezervojnë takime direkt përmes platformës. Ju do të merrni njoftime për rezervimet e reja dhe mund të menaxhoni orarin tuaj në kohë reale."
  },
  {
    id: 4,
    question: "A mund të përditësoj informacionet e biznesit tim?",
    answer: "Absolutisht! Mund të përditësoni informacionet, oraret, shërbimet dhe imazhet e biznesit tuaj në çdo kohë përmes panelit tuaj të menaxhimit."
  },
  {
    id: 5,
    question: "Si mund të kontaktoj mbështetjen teknik?",
    answer: "Ekipi ynë i mbështetjes është në dispozicion 24/7 për të ndihmuar me çdo pyetje ose problem teknik. Mund të na kontaktoni përmes email-it në info@terminiyt.com ose telefonisht në +383 44 123 456."
  },
  
]

const services = [
  {
    id: 1,
    name: "Konsultim Mjekësor",
    time: "9:00",
    image: "https://hrwatchdog.calchamber.com/wp-content/uploads/DoctorAppointment.jpg"
  },
  {
    id: 2,
    name: "Salon Bukurie",
    time: "2:30",
    image: "https://www.milkshakehair.com/cdn/shop/articles/Hair-Appointment_0f6eb763-aaa3-4beb-9867-ed698de411ba.jpg?v=1748868494"
  },
  {
    id: 3,
    name: "Berber",
    time: "4:00",
    image: "https://cdn.prod.website-files.com/63bf50c61653d33a5ba6fc86/644f3965642592ce9b1f40a6_mancave-barbershop-franchise-17.jpg"
  },
  {
    id: 4,
    name: "Servis Automejtit",
    time: "10:15",
    image: "https://www.shutterstock.com/image-photo/mechanic-using-wrench-while-working-600nw-2184125681.jpg"
  },
  {
    id: 5,
    name: "Auto Larje",
    time: "11:30",
    image: "https://images.contentstack.io/v3/assets/blt62d40591b3650da3/bltee515d46b1b13f83/658ee585d082f768b425faf9/hero_PN1305_HowOftenWashCar_Header-1.jpg"
  },
  {
    id: 6,
    name: "Termine Fitnesi",
    time: "19:30",
    image: "https://jackcityfitness.com/wp-content/uploads/bigstock-A-Personal-Trainer-Motivates-T-440620910-1250x834.jpg"
  }
]

export default function SiFunksiononPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="py-16 md:py-32 px-4 bg-gradient-to-r  from-gray-800 to-teal-800 text-white">
        <div className="container mx-auto text-center">
          <h1 className="text-2xl md:text-5xl font-heading font-bold mb-3 text-balance leading-tight">
          Platformë rezervimesh për<br className="hidden md:block" /> eksperienca të paharrueshme.          </h1>
          <p className="text-sm md:text-xl mb-3 max-w-4xl mx-auto text-blue-100 text-balance">
          Menaxho termnimet me lehtësi, në mënyrë që të përqendrohesh tek ajo që ka më shumë rëndësi
           – ofrimi i një shërbimi të jashtëzakonshëm në çdo moment.
          </p>
          <Link href="/regjistro-biznesin">
  <Button 
    size="lg" 
    className="text-4xl bg-transparent text-white font-semibold animate-pulse shadow-none hover:bg-transparent hover:shadow-none"
  >
    Provo tani
  </Button>
</Link>


          <p className="text-md text-teal-200 mt-4 mb-8">
            30 ditë falas.
          </p>
        </div>
         <div className="relative overflow-hidden">
            <div className="flex animate-scroll" style={{ width: `${services.length * 2 * 640}px` }}>
              {/* First set of services */}
              {services.map((service, index) => (
                <div key={`first-${service.id}`} className="flex-shrink-0 px-3">
                  <div className="relative md:w-160 w-80 h-48 md:h-80 rounded-2xl overflow-hidden transition-transform duration-300 cursor-pointer">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg'
                      }}
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Time in top left */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-teal-800/40 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white font-semibold text-sm">{service.time}</span>
                      </div>
                    </div>
                    
                    {/* Service name in top right */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-teal-800/40 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white font-semibold text-sm">{service.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Duplicate set for seamless loop */}
              {services.map((service, index) => (
                <div key={`second-${service.id}`} className="flex-shrink-0 px-3">
                  <div className="relative md:w-160 w-80 h-48 md:h-80 rounded-2xl overflow-hidden transition-transform duration-300 cursor-pointer">
                    <Image
                      src={service.image}
                      alt={service.name}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg'
                      }}
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Time in top left */}
                    <div className="absolute top-4 left-4">
                      <div className="bg-teal-800/40 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white font-semibold text-sm">{service.time}</span>
                      </div>
                    </div>
                    
                    {/* Service name in top right */}
                    <div className="absolute top-4 right-4">
                      <div className="bg-teal-800/40 backdrop-blur-sm rounded-full px-3 py-1">
                        <span className="text-white font-semibold text-sm">{service.name}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
      </section>

     
      {/* How It Works Steps */}
      <section className="py-16 px-[15px] md:px-4">
        <div className="container mx-auto">
          <div className="text-left md:text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-heading font-bold md:mb-6 mb-3 text-balance">
              Pse ta përdorni <span className="bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">TerminiYt.com</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gjetja dhe rezervimi i shërbimeve lokale nuk ka qenë kurrë më e lehtë
            </p>
          </div>

          {/* Three boxes section */}
          <div className="space-y-6">
            {/* First box - 100% width with video */}
            <div 
              className="w-full px-2 py-4 md:px-16 md:py-16 rounded-2xl"
              style={{ 
                backgroundColor: '#F4F4F4 ',
                borderRadius: '12px'
              }}
            >
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-balance bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                    Termine Online
                  </h3>
                  <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Klientët mund të zgjedhin ditën dhe orën që i përshtatet më shumë, duke marrë parasysh orarin e punës së biznesit, pa nevojën për telefonata ose pritje në vend.                  </p>
                </div>
                <div className="relative">
                  <video 
                    className="w-full h-64 md:h-80 rounded-xl object-cover"
                    poster="/placeholder.jpg"
                    autoPlay
                    loop
                    muted
                    playsInline
                    preload="auto"
                    webkit-playsinline="true"
                  >
                    <source src="/Book.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>

            {/* Second and third boxes - 50% width each */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Second box */}
              <div 
  className="md:px-20 md:py-20 px-2 py-4 rounded-xl"
  style={{ 
    backgroundColor: '#F4F4F4',
    borderRadius: '12px'
  }}
>
  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-balance bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
    Shërbimet e Biznesit
  </h3>
  <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
  Biznesi mund të shtojë lehtësisht shërbimet e ndryshme, ndërsa klientët kanë mundësinë të zgjedhin atë që i përshtatet më mirë nevojave të tyre.  </p>
 <img 
  src="/sherbimet.png" 
  alt="Shërbimet tuaja" 
  className=" pt-5 rounded-xl object-cover"
/>
</div>


              {/* Third box */}
              <div 
                className="md:px-20 md:py-20 px-2 py-4 rounded-xl"
                style={{ 
                  backgroundColor: '#F4F4F4',
                  borderRadius: '12px'
                }}
              >
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-balance bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                Shto anëtarë të ekipit
                </h3>
                <p className="text-sm md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Çdo anëtar ka kalendarin e vet për të menaxhuar rezervimet dhe njoftimet, duke mbajtur ekipin gjithmonë të sinkronizuar. </p>
                <div className="flex justify-center items-center">
  <img 
    src="/stafi.png" 
    alt="Shërbimet tuaja" 
    className="pt-10 mx-auto rounded-xl object-cover"
  />
</div>         
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r  from-gray-800 to-teal-800 text-white">
        <div className="container mx-auto text-left md:text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-6 text-balance">
            Gati për të Filluar?
          </h2>
          <p className="text-xl text-white text-muted-foreground max-w-2xl mx-auto mb-8">
            Bashkohu me klientët tanë të kënaqur që besojnë Terminiyt.com për nevojat e tyre të shërbimeve lokale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" asChild className="text-lg text-white bg-transparent hover:bg-transparent">
              <Link href="/">Gjej Shërbime Pranë Meje</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white border-white text-teal-800 text-lg hover:bg-white hover:text-teal-800"
              asChild
            >
              <Link href="/regjistro-biznesin">Listo Biznesin Tënd</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-left md:text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-800 mb-6">
              Pyetje të Shpeshta
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Gjeni përgjigjet për pyetjet më të shpeshta rreth platformës sonë
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqData.map((faq) => (
                <div key={faq.id} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(faq.id)}
                    className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <h3 className="text-xl font-semibold text-gray-800 pr-4">
                      {faq.question}
                    </h3>
                    <div className="flex-shrink-0">
                      {openFAQ === faq.id ? (
                        <ChevronUp className="w-6 h-6 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                  </button>
                  
                  {openFAQ === faq.id && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-gray-100 pt-4">
                        <p className="text-gray-600 leading-relaxed">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Contact CTA */}
            <div className="text-center mt-12">
              <div className="bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-semibold mb-4">
                  Nuk gjetët përgjigjen që kërkoni?
                </h3>
                <p className="text-white/80 mb-6">
                  Ekipi ynë është këtu për t'ju ndihmuar me çdo pyetje
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="text-lg text-white bg-transparent hover:bg-transparent"
                    asChild
                  >
                    <Link href="mailto:info@terminiyt.com">
                      Na Dërgoni Email
                    </Link>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-white border-white text-teal-800 text-lg hover:bg-white hover:text-teal-800"
                    asChild
                  >
                    <Link href="tel:+38344123456">
                      Na Telefononi
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
