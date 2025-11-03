"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, ArrowLeft, Play, ChevronDown, ChevronUp } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const faqData = [
  {
    id: 1,
    answer: "Regjistrimi është shumë i thjeshtë! Klikoni në 'Regjistrohu si Biznes' dhe plotësoni formularin me informacionet e biznesit tuaj. Pas regjistrimit, të dhënat verifikohen nga stafi ynë që zakonisht nuk zgjat më shumë se një ditë pune, pas verifikimit të suksesshëm biznesi juaj do të shfaqet në hartë dhe klientët do të mund të rezervojnë shërbimet tuaja.",
    question: "Si mund të regjistrohem si ofrues shërbimesh?",
  },
  {
    id: 2,
    question: "A është falas përdorimi i platformës?",
    answer: "Po, ju mund të përdorni platformën falas për 30 ditë dhe të njiheni me të gjitha mundësitë që ajo ofron. Pas periudhës së provës, ju mund të vazhdoni me një plan premium me çmim shumë të volitshëm për të përfituar të gjitha funksionet dhe mbështetje të dedikuar 24/7."
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
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const [currentSlide, setCurrentSlide] = useState(0) // Start from position 0 to center Slider1
  const [isMdScreen, setIsMdScreen] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  const toggleFAQ = (id: number) => {
    setOpenFAQ(openFAQ === id ? null : id)
  }

  // Check screen size
  useEffect(() => {
    setIsClient(true)
    const checkScreenSize = () => {
      setIsMdScreen(window.innerWidth < 1024)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get screen size info
  const getScreenInfo = () => {
    if (!isClient) return { isMobile: false, isMd: false, isLg: true }
    const width = window.innerWidth
    return {
      isMobile: width < 768,
      isMd: width >= 768 && width < 1024,
      isLg: width >= 1024
    }
  }

  // Slider images with proper empty spaces for each breakpoint
  const sliderImages = [
    '/Slider-1.png',
    '/Slider-2.png',
    '/Slider-3.png',
    '/Slider-4.png',
    '/Slider-5.png',
    '/Slider-6.png',
    '/Slider-7.png',
    '/Slider-8.png'
  ]

  // Slider descriptions
  const sliderDescriptions = [
    'Zgjidhni biznesin',
    'Zgjidhni shërbimin',
    'Zgjidhni personelin',
    'Zgjidhni datën',
    'Zgjidhni orën',
    'Plotësoni të dhënat tuaja personale',
    'Konfirmimi i rezervimit tuaj',
    'Pranimi i njoftimit për rezervimin tuaj'
  ]

  // Get the actual images to display based on screen size
  const getDisplayImages = () => {
    const screenInfo = getScreenInfo()
    
    if (screenInfo.isMobile) {
      // Mobile: just the images, no empty spaces
      return sliderImages.map((image, index) => ({ image, description: sliderDescriptions[index] }))
    } else if (screenInfo.isMd) {
      // MD: 1 empty space on each side + all 7 images
      return [
        { image: '', description: '' },
        ...sliderImages.map((image, index) => ({ image, description: sliderDescriptions[index] })),
        { image: '', description: '' }
      ]
    } else {
      // LG+: 2 empty spaces on each side + all 7 images
      return [
        { image: '', description: '' },
        { image: '', description: '' },
        ...sliderImages.map((image, index) => ({ image, description: sliderDescriptions[index] })),
        { image: '', description: '' },
        { image: '', description: '' }
      ]
    }
  }

  const nextSlide = () => {
    // Calculate max slide based on total images and visible images
    const screenInfo = getScreenInfo()
    const visibleImages = screenInfo.isMobile ? 1 : (screenInfo.isMd ? 3 : 5)
    const displayImages = getDisplayImages()
    const maxSlide = Math.max(0, displayImages.length - visibleImages)
    setCurrentSlide((prev) => Math.min(prev + 1, maxSlide))
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0))
  }

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = cardRefs.current.indexOf(entry.target as HTMLDivElement)
            if (cardIndex !== -1 && !visibleCards.includes(cardIndex)) {
              setVisibleCards(prev => [...prev, cardIndex])
            }
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      }
    )

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card)
    })

    return () => {
      cardRefs.current.forEach((card) => {
        if (card) observer.unobserve(card)
      })
    }
  }, [visibleCards])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header transparent={true} />

      {/* Hero Section */}
      <section className="py-16 md:py-32 px-4 bg-custom-gradient
 text-white">
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

      {/* How It Works Section */}
      <section className="py-16 px-[15px] md:px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 gap-1 lg:gap-12 items-center">
            {/* Left Side - Steps */}
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-8 text-balance">
                <span className="bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                  Si funksionon?
                </span>
              </h1>
              
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Kompleto regjistrimin e biznesit
                    </h3>
                    <p className="text-gray-600">
                      në vetëm katër hapa të thjeshtë.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Vendos lokacionin e saktë
                    </h3>
                    <p className="text-gray-600">
                      përmes Google Maps që klientët të ju gjejnë lehtë.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Pasi të përfundosh regjistrimin
                    </h3>
                    <p className="text-gray-600">
                      prit verifikimin nga stafi ynë – zakonisht nuk zgjat më shumë se një ditë pune.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Kyçu në panelin tënd
                    </h3>
                    <p className="text-gray-600">
                      për të menaxhuar të dhënat, shërbimet dhe kalendarin e veçantë për secilin anëtar të ekipit.
                    </p>
                  </div>
                </div>

                {/* Step 5 */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    5
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      Biznesi yt bëhet i dukshëm në hartë
                    </h3>
                    <p className="text-gray-600">
                      dhe merr një <strong className="text-teal-800">link unik</strong> për pranimin e rezervimeve online.
                    </p>
                  </div>
                </div>
              </div>
            </div>

              {/* Right Side - Image */}
            <div className="relative">
              <div className="relative w-full h-96 md:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden ">
                <Image
                  src="/mergeimages.png"
                  alt="Si funksionon platforma"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Image Slider Section */}
      <section className="py-16 px-[15px] md:px-4">
        <div className="container mx-auto">
          {/* Slider Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-balance">
              <span className="bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                Si funksionon procesi i rezervimit?
              </span>
            </h1>
          </div>
          
          <div className="relative">
            {/* Slider Container */}
            <div className="relative overflow-hidden rounded-2xl bg-white- " style={{ height: '85vh' }}>
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * (100 / (getScreenInfo().isMobile ? 1 : (getScreenInfo().isMd ? 3 : 5)))}%)` }}
              >
                {getDisplayImages().map((item, index) => {
                  const screenInfo = getScreenInfo()
                  const centerOffset = screenInfo.isMobile ? 0 : (screenInfo.isMd ? 1 : 2)
                  const isCenter = screenInfo.isMobile ? true : (index === currentSlide + centerOffset)
                  const visibleImages = screenInfo.isMobile ? 1 : (screenInfo.isMd ? 3 : 5)
                  const isVisible = index >= currentSlide && index < currentSlide + visibleImages
                  return (
                    <div key={index} className={`${screenInfo.isMobile ? 'w-full' : (screenInfo.isMd ? 'w-1/3' : 'w-1/5')} flex-shrink-0`}>
                      <div 
                        className="relative w-full transition-all duration-300" 
                        style={{ 
                          height: '85vh',
                          transform: screenInfo.isMobile ? 'scale(1)' : (isCenter ? 'scale(1.08)' : 'scale(1)'),
                          opacity: isCenter ? 1 : (isVisible ? 0.5 : 1)
                        }}
                      >
                        {item.image ? (
                          <>
                            <Image
                              src={item.image}
                              alt={`Slider ${index}`}
                              fill
                              className="object-contain"
                              priority={index === 2}
                            />
                            {/* Gradient overlay with text - only show when scaled (center) */}
                            {isCenter && (
                              <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-white via-white/95 to-transparent flex items-center">
                                <div className="p-6 w-full">
                                  <p className="text-gray-800 font-medium text-base text-center leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full bg-white flex items-center justify-center">
                            
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Navigation Arrows positioned below on the right */}
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={prevSlide}
                className="bg-custom-gradient hover:from-gray-700 hover:to-teal-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              
              <button
                onClick={nextSlide}
                className="bg-custom-gradient hover:from-gray-700 hover:to-teal-700 text-white rounded-full p-3 shadow-lg transition-all duration-200 hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </section>

     
      {/* How It Works Steps */}
      <section className="py-16 px-[15px] md:px-4">
        <div className="container mx-auto">
          <div className="text-left md:text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold md:mb-6 mb-0 text-balance">
            <span className="bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent"> Pse ta përdorni TerminiYt.com?</span>
            </h1>
            
          </div>

          {/* Three boxes section - HIDDEN */}
          {/* 
          <div className="space-y-6">
            {/* First box - 100% width with video */}
            {/* 
            <div 
              ref={(el) => (cardRefs.current[0] = el)}
              className={`w-full px-6 py-8 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-8 lg:py-10 xl:px-12 xl:py-16 2xl:px-14 2xl:py-18 rounded-2xl transition-all duration-1500 ease-out transform ${
                visibleCards.includes(0) 
                  ? 'translate-y-0 opacity-100' 
                  : 'translate-y-8 opacity-0'
              }`}
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
                  <p className="text-sm md:text-xl text-muted-foreground max-w-2xl ">
                  Klientët mund të zgjedhin ditën dhe orën që i përshtatet më shumë, duke marrë parasysh orarin e punës së biznesit, pa nevojën për telefonata ose pritje në vend.                  </p>
                </div>
                <div className="relative">
                  <video 
                    className="w-full h-64 md:h-80 2xl:h-[480px] rounded-xl object-cover"
                  
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
            {/* 
            <div className="grid md:grid-cols-2 gap-6">
              {/* Second box */}
              {/* 
              <div 
    ref={(el) => (cardRefs.current[1] = el)}
    className={`px-6 py-8 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-8 lg:py-10 xl:px-12 xl:py-16 2xl:px-14 2xl:py-18 rounded-xl transition-all duration-1500 ease-out transform delay-200 ${
      visibleCards.includes(1) 
        ? 'translate-y-0 opacity-100' 
        : 'translate-y-8 opacity-0'
    }`}
    style={{ 
      backgroundColor: '#F4F4F4',
      borderRadius: '12px'
    }}
>
  <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-balance bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
    Shërbimet e Biznesit
  </h3>
  <p className="text-sm md:text-xl text-muted-foreground max-w-2xl ">
  Biznesi mund të shtojë lehtësisht shërbimet e ndryshme, ndërsa klientët kanë mundësinë të zgjedhin atë që i përshtatet më mirë nevojave të tyre.  </p>
 <img 
  src="/sherbimet.png" 
  alt="Shërbimet tuaja" 
  className=" pt-5 rounded-xl object-cover"
/>
</div>


              {/* Third box */}
              {/* 
              <div 
                ref={(el) => (cardRefs.current[2] = el)}
                className={`px-6 py-8 sm:px-6 sm:py-8 md:px-8 md:py-10 lg:px-8 lg:py-10 xl:px-12 xl:py-16 2xl:px-14 2xl:py-18 rounded-xl transition-all duration-1500 ease-out transform delay-400 ${
                  visibleCards.includes(2) 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-8 opacity-0'
                }`}
                style={{ 
                  backgroundColor: '#F4F4F4',
                  borderRadius: '12px'
                }}
              >
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold mb-6 text-balance bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                Shto anëtarë të ekipit
                </h3>
                <p className="text-sm md:text-xl text-muted-foreground max-w-2xl ">
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
          */}
          
          {/* New Features List */}
          <div className="mt-0 max-w-4xl mx-auto md:mt-16">
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Menaxhoni të gjitha të dhënat e biznesit tuaj në një vend.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Krijoni dhe organizoni shërbimet që ofroni.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Shtoni anëtarë të stafit dhe caktoni oraret e tyre individuale.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Menaxhoni kalendarin për secilin anëtar, bllokoni slotet dhe vendosni pushimet.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Shikoni, pranoni ose anuloni terminet me vetëm disa klikime.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Merrni njoftime automatike për çdo rezervim, anulim apo ndryshim në kohë reale.
                  </p>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    ✓
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    Kurseni kohë dhe punoni më me efikasitet me një sistem të thjeshtë e të zgjuar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-custom-gradient text-white">
        <div className="container mx-auto text-left md:text-center">
          <h2 className="text-3xl md:text-5xl font-heading font-bold mb-3 text-balance">
            Gati për të Filluar?
          </h2>
          <p className="text-sm md:text-xl text-white text-muted-foreground max-w-2xl mx-auto mb-8">
            Bashkohu me klientët tanë të kënaqur që besojnë Terminiyt.com për nevojat e tyre të shërbimeve lokale.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="outline" asChild className="text-lg text-white bg-transparent hover:bg-transparent">
              <Link href="/">Gjej Shërbime Pranë Meje</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white border-white text-zinc-800 text-lg hover:bg-white hover:text-zinc-800"
              asChild
            >
              <Link href="/regjistro-biznesin">Listo Biznesin Tënd</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Q&A Section */}
      <section className="py-10 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-left md:text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-gray-800 mb-3">
            <span className="bg-custom-gradientt bg-clip-text text-transparent">Pyetje të Shpeshta</span>
            </h2>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-heading font-bold md:mb-6 mb-0 text-balance">
            <span className="bg-teal-950 bg-clip-text text-transparent">  Gjeni përgjigjet për pyetjet më të shpeshta rreth platformës sonë</span>
            </h3>

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
              <div className="bg-custom-gradient rounded-2xl p-8 text-white">
                <h3 className="text-lg md:text-2xl font-semibold mb-4">
                  Nuk gjetët përgjigjen që kërkoni?
                </h3>
                <p className="text-sm md:text-white/80 mb-6">
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
                    className="bg-white border-white text-zinc-800 text-lg hover:bg-white hover:text-zinc-800"
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
