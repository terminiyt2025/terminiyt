"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Search, Star, Clock, Phone, MapPin, User, LogOut, Filter, X, Navigation } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import { useLocation } from "@/hooks/use-location"
import { GoogleMapsWrapper } from "@/components/google-maps-wrapper"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useBusinesses } from "@/hooks/use-businesses"

interface Category {
  id: number
  name: string
  slug: string
  icon?: string
  color?: string
  created_at: string
  updated_at: string
}




export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null)
  const [modalType, setModalType] = useState<'staff-sherbimet' | 'orari' | null>(null)
  const [showAllCards, setShowAllCards] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { calculateDistance, getCurrentLocation, setLocationToPrishtina } = useLocation()
  const { businesses, loading } = useBusinesses()

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories')
        if (response.ok) {
          const categoriesData = await response.json()
          setCategories(categoriesData)
        } else {
          console.error('Failed to fetch categories')
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      } finally {
        setCategoriesLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Get user location on component mount
  React.useEffect(() => {
    getCurrentLocation()
  }, [])

  // Predefined Kosovo cities
  const cities = [
    "Deçan",
    "Dragash", 
    "Drenas",
    "F.Kosovë",
    "Ferizaj",
    "Gjakovë",
    "Gjilan",
    "Graçanic",
    "Hani Elezit",
    "Istog",
    "Junik",
    "Kaçanik",
    "Kamenicë",
    "Klinë",
    "Kllokot",
    "Lipjan",
    "Malishevë",
    "Mamushë",
    "Mitrovicë",
    "Novobërdë",
    "Obiliq",
    "Partesh",
    "Pejë",
    "Podujevë",
    "Prishtinë",
    "Prizren",
    "Rahovec",
    "Ranillug",
    "Shtërpce",
    "Shtime",
    "Skenderaj",
    "Therandë",
    "Viti",
    "Vushtrri",
    "Mitrovicë E Veriut",
    "Zubin Potok",
    "Zveçan",
    "Leposaviq"
  ]

  const filteredProviders = businesses
    .map((provider) => {
      // Calculate real distance if location is available
      const distance =
        provider.latitude && provider.longitude ? calculateDistance(provider.latitude, provider.longitude) : null

      return {
        ...provider,
        calculatedDistance: distance,
        displayDistance: distance ? `${distance} km` : "Distance unavailable",
      };
    })
    .filter((provider) => {
      const matchesCategory = selectedCategory === "all" || String(provider.category_id) === selectedCategory
      const matchesCity = selectedCity === "all" || provider.city === selectedCity
      const matchesSearch =
        provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ((provider as any).category_name && (provider as any).category_name.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCategory && matchesCity && matchesSearch;
    })
    .sort((a, b) => {
      // Sort by calculated distance if available, otherwise by name
      if (a.calculatedDistance && b.calculatedDistance) {
        return a.calculatedDistance - b.calculatedDistance;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Transparent on top of first section */}
      <Header transparent={true} />

      {/* Interactive Map Section - Full Width - First After Navbar */}
      <section className="w-full bg-gradient-to-r  from-gray-800 to-teal-800 text-white py-10 pt-18 md:pt-24 map-section">
        <div className="w-full">
          {/* Map Title and Slogan */}
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3 text-white text-balance">
            Gjej Shërbime Lokale sipas Interesit tënd
            </h2>
            <p className="text-md md:text-xl text-muted-foreground text-white">
              Zbuloni dhe rezervoni shërbime cilësore në afërsi
            </p>
          </div>
          
          {/* Map Filters - Centered and Redesigned */}
     
          
          {/* Full Width Map - Dynamic Height */}
          <div className="w-full flex justify-center">
            <div className="map-container" style={{ width: '1536px', maxWidth: '100%' }}>
              <GoogleMapsWrapper
                businesses={businesses}
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                onBusinessSelect={(business) => {
                  console.log("[v0] Business selected on map:", business.name)
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Section */}
      <section className="py-8 px-[15px] md:px-4 bg-white">
        <div className="container mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                    {/* Category and City Selection */}
                    <div className="text-center lg:text-left">
                      {/* Mobile Layout: Filtro sipas on own line, filters below */}
                      <div className="flex flex-col items-center gap-3 lg:hidden">
                        <p className="text-lg text-gray-700">
                          Filtro sipas:
                        </p>
                        <div className="flex items-center gap-4 justify-center">
                          {/* Category Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Kategorisë:</span>
                            {selectedCategory !== "all" ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                  {categories.find(cat => String(cat.id) === selectedCategory)?.name || "Unknown"}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCategory("all")}
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                  <X className="w-4 h-4 text-gray-500" />
                                </Button>
                              </div>
                            ) : (
                              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="w-28 md:w-40">
                                  <SelectValue placeholder="Kategoria" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">Të Gjitha</SelectItem>
                                  {categories
                                    .sort((a, b) => {
                                      if (a.name === "Të tjera" || a.name === "Të Tjera") return 1;
                                      if (b.name === "Të tjera" || b.name === "Të Tjera") return -1;
                                      return a.name.localeCompare(b.name);
                                    })
                                    .map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)} className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          {/* City Filter */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Qytetit:</span>
                            {selectedCity !== "all" ? (
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                  {selectedCity}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedCity("all")}
                                  className="h-6 w-6 p-0 hover:bg-gray-200"
                                >
                                  <X className="w-4 h-4 text-gray-500" />
                                </Button>
                              </div>
                            ) : (
                              <Select value={selectedCity} onValueChange={setSelectedCity}>
                                <SelectTrigger className="w-24 md:w-32">
                                  <SelectValue placeholder="Qyteti" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">Të Gjitha</SelectItem>
                                  {cities.map((city) => (
                                    <SelectItem key={city} value={city} className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">
                                      {city}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Desktop Layout: Original horizontal layout */}
                      <div className="hidden lg:flex items-center gap-3 justify-start">
                        <p className="text-lg text-gray-700">
                          Filtro sipas:
                        </p>
                        
                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Kategorisë:</span>
                          {selectedCategory !== "all" ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                {categories.find(cat => String(cat.id) === selectedCategory)?.name || "Unknown"}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCategory("all")}
                                className="h-6 w-6 p-0 hover:bg-gray-200"
                              >
                                <X className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          ) : (
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                              <SelectTrigger className="w-40">
                                <SelectValue placeholder="Kategoria" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">Të Gjitha</SelectItem>
                                {categories
                                  .sort((a, b) => {
                                    if (a.name === "Të tjera" || a.name === "Të Tjera") return 1;
                                    if (b.name === "Të tjera" || b.name === "Të Tjera") return -1;
                                    return a.name.localeCompare(b.name);
                                  })
                                  .map((category) => (
                                    <SelectItem key={category.id} value={String(category.id)} className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        {/* City Filter */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Qytetit:</span>
                          {selectedCity !== "all" ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">
                                {selectedCity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedCity("all")}
                                className="h-6 w-6 p-0 hover:bg-gray-200"
                              >
                                <X className="w-4 h-4 text-gray-500" />
                              </Button>
                            </div>
                          ) : (
                            <Select value={selectedCity} onValueChange={setSelectedCity}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Qyteti" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all" className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">Të Gjitha</SelectItem>
                                {cities.map((city) => (
                                  <SelectItem key={city} value={city} className="hover:bg-gray-100 focus:bg-gray-100 hover:text-black focus:text-black">
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
                    </div>

            {/* Search Bar */}
            <div className="w-full lg:w-80">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Kërko për shërbime ose ofrues..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Provider Cards Section */}
      <section className="px-[15px] md:px-4 bg-white">
        <div className="container mx-auto">
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-gray-300 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Duke ngarkuar bizneset...</p>
              </div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 text-lg">Nuk ka biznese në këtë kategori!</p>
                <p className="text-gray-500 text-sm mt-2">Provoni të ndryshoni kategorinë ose kërkimin</p>
              </div>
            </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {(showAllCards ? filteredProviders : filteredProviders.slice(0, 12)).map((provider) => (
              <Card key={provider.id} className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white border-0 shadow-lg overflow-hidden py-0 px-0">
                <div className="flex flex-col">
                  {/* Image Section */}
                  <div className="relative w-full h-64 overflow-hidden">
                    {provider.business_images && typeof provider.business_images === 'string' ? (
                      <img
                        src={provider.business_images}
                        alt={provider.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : provider.logo ? (
                      <img
                        src={provider.logo}
                        alt={provider.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-800 to-teal-800 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                            <span className="text-2xl font-bold">{provider.name.charAt(0)}</span>
                          </div>
                          <p className="text-sm opacity-80">Nuk ka imazh</p>
                        </div>
                      </div>
                    )}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-teal-800/40 backdrop-blur-sm rounded-full border-0 shadow-sm">
                        {(provider as any).category_name || "Unknown Category"}
                      </Badge>
                    </div>
                    {provider.rating && provider.rating > 0 && (
                      <div className="absolute top-4 right-4">
                        <Badge className="bg-teal-800/40 backdrop-blur-sm rounded-full border-0 shadow-sm">
                          <Star className="w-3 h-3 fill-transparent text-white-400 mr-1" />
                          <span className="text-white text-xs">
                            {provider.rating.toFixed(1)}
                          </span>
                          <span className="text-slate-300 text-xs ml-1">
                            ({provider.total_reviews || 0})
                          </span>
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col h-full">
                      {/* Header */}
                      <div>
                        <h3 className="text-2xl font-heading font-bold text-slate-800 mb-1 group-hover:bg-gradient-to-r group-hover:from-gray-800 group-hover:to-teal-800 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                          {provider.name}
                        </h3>
                      </div>

                      {/* Contact Info - Compact */}
                      <div className="py-3 px-4 bg-gray-50 rounded-lg flex-1">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            <span className="text-slate-600 text-xs truncate">
                              {provider.address || "Address not provided"} - {provider.city}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                            <span className="text-slate-600 text-xs">
                              {provider.phone || "Phone not provided"}
                            </span>
                          </div>
                          {provider.displayDistance && (
                            <div className="flex items-center gap-3">
                              <Navigation className="w-4 h-4 text-gray-600 flex-shrink-0" />
                              <span className="text-slate-600 text-xs">{provider.displayDistance}</span>
                              {provider.calculatedDistance && (
                                <Badge variant="outline" className="text-xs bg-teal-800/40 backdrop-blur-sm text-transparent bg-clip-text bg-gradient-to-br from-gray-800 to-teal-800 border-gradient-to-br border-from-gray-800 border-to-teal-800">
                                  GPS
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-3 pt-4 border-t border-slate-100">
                        <Button 
                          size="lg" 
                          className="w-full bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white font-semibold py-3"
                          asChild
                        >
                          <Link href={`/${(provider as any).slug}`}>
                            <Calendar className="w-5 h-5 mr-2" />
                            Rezervo Tani
                          </Link>
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs py-2 border-slate-300 hover:bg-white focus:bg-white hover:text-slate-700 focus:text-slate-700 text-slate-700 hover:border-teal-800 focus:border-teal-800 transition-all duration-300"
                            onClick={() => {
                              setSelectedBusiness(provider)
                              setModalType('staff-sherbimet')
                            }}
                          >
                            Stafi & Shërbimet
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs py-2 border-slate-300 hover:bg-white focus:bg-white hover:text-slate-700 focus:text-slate-700 text-slate-700 hover:border-teal-800 focus:border-teal-800 transition-all duration-300"
                            onClick={() => {
                              setSelectedBusiness(provider)
                              setModalType('orari')
                            }}
                          >
                            Orari
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
                        ))}
                      </div>
                      
                      {/* Show More/Less Button */}
                      {filteredProviders.length > 12 && (
                        <div className="flex justify-center mt-8">
                          <Button
                            onClick={() => setShowAllCards(!showAllCards)}
                            variant="outline"
                            className="px-8 py-2 border-slate-300 hover:border-teal-800 focus:border-teal-800 transition-all duration-300"
                          >
                            {showAllCards ? 'Show Less' : `Show More (${filteredProviders.length - 12} more)`}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

      {/* How It Works Section */}
      <section className="py-24 px-[15px] md:px-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-r from-teal-800 to-gray-800 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-gray-800 to-teal-800 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Si Funksionon
            </div>
            <h2 className="text-5xl md:text-6xl font-heading font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent mb-6">
              TerminiYt.com
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Gjetja dhe rezervimi i shërbimeve lokale nuk ka qenë kurrë më e lehtë
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3 gap-8 lg:gap-12">
            {/* Step 1 */}
            <div className="group relative flex mx-[15px] md:mx-0">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col w-full">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  1
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-800 mb-4 text-center">
                  Kërko & Zbulo
                </h3>
                <p className="text-gray-600 leading-relaxed text-center flex-1">
                  Gjej ofrues të shërbimeve lokale duke përdorur hartën tonë interaktive ose kërko sipas kategorisë dhe vendndodhjes.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="group relative flex mx-[15px] md:mx-0">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col w-full">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  2
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-800 mb-4 text-center">
                  Rezervo Menjëherë
                </h3>
                <p className="text-gray-600 leading-relaxed text-center flex-1">
                  Shiko oraret e disponueshme dhe rezervo takime direkt përmes platformës sonë.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="group relative flex mx-[15px] md:mx-0">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col w-full">
                <div className="absolute -top-4 -left-4 w-8 h-8 bg-gradient-to-r from-gray-800 to-teal-800 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  3
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-gray-800 to-teal-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-gray-800 mb-4 text-center">
                  Vlerëso
                </h3>
                <p className="text-gray-600 leading-relaxed text-center flex-1">
                  Merr shërbim cilësor dhe ndaj eksperiencën tënde për të ndihmuar të tjerët në komunitet.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Lines */}
        </div>
      </section>

  

      {/* Footer */}
      <Footer />

      {/* Modals */}
      {selectedBusiness && modalType && (
        <Dialog open={!!modalType} onOpenChange={() => setModalType(null)}>
          <DialogContent className="w-[95%] md:max-w-2xl max-h-[80vh] overflow-y-auto mx-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                <div className="block">
                  {modalType === 'staff-sherbimet' && 'Staff & Shërbimet'}
                  {modalType === 'orari' && 'Orari i Punës'}
                </div>
                <div className="block text-lg font-medium text-gray-600 mt-1">
                  {selectedBusiness.name}
                </div>
              </DialogTitle>
            </DialogHeader>
            
            <div className="mt-4">
              {modalType === 'staff-sherbimet' && (
                <div className="space-y-6">
                  {/* Staff Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-800 to-teal-800 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      Stafi:
                    </h3>
                    {selectedBusiness.staff && selectedBusiness.staff.length > 0 ? (
                      <div className="space-y-2">
                        {selectedBusiness.staff
                          .filter((member: any) => member.isActive !== false)
                          .map((member: any, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-600 w-6">{index + 1}.</span>
                              <span className="text-gray-900">{member.name || 'Staff Member'}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Nuk ka informacion për stafin</p>
                      </div>
                    )}
                  </div>

                  {/* Services Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-800 to-teal-800 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                      Shërbimet:
                    </h3>
                    {selectedBusiness.services && selectedBusiness.services.length > 0 ? (
                      <div className="space-y-3">
                        {selectedBusiness.services.map((service: any, index: number) => (
                          <div key={index} className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{service.name} ({service.duration})</h4>
                              {service.price && service.price > 0 && (
                                <span className="bg-gradient-to-br from-gray-800 to-teal-800 bg-clip-text text-transparent font-bold">
                                  {service.price}€
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-gray-600 mb-2">{service.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              {service.category && (
                                <span className="bg-gray-100 px-2 py-1 rounded">
                                  {service.category}
                                </span>
                              )}
                            </div>
                            {/* Staff badges for this service */}
                            {selectedBusiness.staff && selectedBusiness.staff.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {selectedBusiness.staff
                                  .filter((staffMember: any) => {
                                    // First check if staff member is active
                                    if (staffMember.isActive === false) {
                                      return false
                                    }
                                    
                                    // Check if staff member has this service in their assigned services
                                    const assignedServices = staffMember.services
                                    if (Array.isArray(assignedServices)) {
                                      return assignedServices.some((assignedService: any) => {
                                        // Handle both string and object formats
                                        const serviceName = typeof assignedService === 'string' 
                                          ? assignedService 
                                          : assignedService?.name || ''
                                        // Use exact match instead of includes for more precise filtering
                                        return serviceName.toLowerCase() === service.name.toLowerCase()
                                      })
                                    }
                                    // If no assigned services, don't show this staff member for any service
                                    return false
                                  })
                                  .map((staffMember: any, staffIndex: number) => (
                                    <span key={staffIndex} className="bg-gradient-to-br from-gray-800 to-teal-800 text-white text-xs px-2 py-1 rounded-full">
                                      {staffMember.name || 'Staff Member'}
                                    </span>
                                  ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <Star className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Nuk ka shërbime të disponueshme</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {modalType === 'orari' && (
                <div className="space-y-4">
                  {selectedBusiness.operating_hours ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
                        const hours = selectedBusiness.operating_hours[day]
                        // Handle different data structures
                        const isClosed = hours && (hours.closed === true || hours.closed === 'true' || hours.closed === 1)
                        const hasHours = hours && hours.open && hours.close && !isClosed
                        
                        return (
                          <div key={day} className="flex justify-between items-center p-3 border rounded-lg">
                            <span className="font-medium text-gray-900 capitalize">{day}:</span>
                            <span className={`text-sm ${isClosed ? 'text-red-600' : hasHours ? 'text-green-600' : 'text-red-600'}`}>
                              {isClosed ? 'Mbyllur' : hasHours ? `${hours.open} - ${hours.close}` : 'Mbyllur'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <p>Nuk ka informacion për orarin e punës</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
