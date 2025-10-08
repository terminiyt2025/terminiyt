"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Home, Calendar, Menu } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface HeaderProps {
  transparent?: boolean
  className?: string
}

interface Business {
  id: number
  name: string
  account_email: string
}

interface Admin {
  id: number
  email: string
}

export function Header({ transparent = false, className = "" }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [isBusinessLoggedIn, setIsBusinessLoggedIn] = useState(false)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // Check business auth
      const businessAuthData = localStorage.getItem('businessAuth')
      if (businessAuthData) {
        try {
          const parsedData = JSON.parse(businessAuthData)
          const { businessId } = parsedData
          const isLoggedIn = !!businessId
          setIsBusinessLoggedIn(isLoggedIn)
          
          if (isLoggedIn) {
            // Fetch business data
            try {
              const response = await fetch(`/api/businesses/${businessId}`)
              if (response.ok) {
                const businessData = await response.json()
                setBusiness(businessData)
              }
            } catch (error) {
              console.error('Error fetching business data:', error)
            }
          } else {
            setBusiness(null)
          }
        } catch (error) {
          setIsBusinessLoggedIn(false)
          setBusiness(null)
        }
      } else {
        setIsBusinessLoggedIn(false)
        setBusiness(null)
      }

      // Check admin auth
      const adminAuthData = localStorage.getItem('adminAuth')
      if (adminAuthData) {
        try {
          const parsedData = JSON.parse(adminAuthData)
          const { adminId, email } = parsedData
          const isLoggedIn = !!adminId
          setIsAdminLoggedIn(isLoggedIn)
          
          if (isLoggedIn) {
            setAdmin({ id: adminId, email })
          } else {
            setAdmin(null)
          }
        } catch (error) {
          setIsAdminLoggedIn(false)
          setAdmin(null)
        }
      } else {
        setIsAdminLoggedIn(false)
        setAdmin(null)
      }
    }

    checkAuth()
    
    // Listen for storage changes and custom events
    window.addEventListener('storage', checkAuth)
    window.addEventListener('businessLogin', checkAuth)
    window.addEventListener('businessLogout', checkAuth)
    window.addEventListener('adminLogin', checkAuth)
    window.addEventListener('adminLogout', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('businessLogin', checkAuth)
      window.removeEventListener('businessLogout', checkAuth)
      window.removeEventListener('adminLogin', checkAuth)
      window.removeEventListener('adminLogout', checkAuth)
    }
  }, [])

  const handleBusinessLogout = () => {
    // Clear business auth data
    localStorage.removeItem('businessAuth')
    
    // Dispatch logout event
    window.dispatchEvent(new Event('businessLogout'))
    
    // Clear business state
    setBusiness(null)
    setIsBusinessLoggedIn(false)
    
    toast({
      title: "U shkëputët me sukses",
      description: "Jeni dërguar në faqen kryesore.",
    })
    
    // Redirect to home
    router.push('/')
  }

  const handleAdminLogout = () => {
    // Clear admin auth data
    localStorage.removeItem('adminAuth')
    
    // Dispatch logout event
    window.dispatchEvent(new Event('adminLogout'))
    
    // Clear admin state
    setAdmin(null)
    setIsAdminLoggedIn(false)
    
    toast({
      title: "U shkëputët me sukses",
      description: "Jeni dërguar në faqen kryesore.",
    })
    
    // Redirect to home
    router.push('/')
  }

  return (
    <header 
      className={`top-0 z-50 w-full ${
        transparent 
          ? 'absolute top-0 left-0 right-0 bg-transparent' 
          : 'bg-card/50 backdrop-blur-sm border-b'
      } ${className}`}
    >
      <div className="container mx-auto px-[15px] md:px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="TerminiYt.com"
              width={200}
              height={70}
              className="h-12 md:h-18 w-auto"
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link 
              href="/si-funksionon" 
              className={`text-lg transition-colors ${
                transparent 
                  ? 'text-blue-200 hover:text-white' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Si Funksionon
            </Link>
            {isAdminLoggedIn ? (
              <div className="flex items-center space-x-4">
                {/* Admin dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`relative h-10 w-10 rounded-full transition-colors ${
                        transparent 
                          ? 'bg-white/20 hover:bg-white/30' 
                          : 'bg-red-100 hover:bg-red-200'
                      }`}
                    >
                      <User className={`h-5 w-5 ${transparent ? 'text-white' : 'text-red-600'}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{admin?.email}</p>
                        <p className="text-xs text-gray-600">Administrator</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center hover:!bg-gray-100 hover:!text-black focus:!bg-gray-100 focus:!text-black">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center hover:!bg-gray-100 hover:!text-black focus:!bg-gray-100 focus:!text-black">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleAdminLogout}
                      className="text-red-600 focus:text-red-600 hover:!bg-gray-100  focus:!bg-gray-100"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dil nga Llogaria
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : isBusinessLoggedIn ? (
              <div className="flex items-center space-x-4">
                {/* Business dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`relative h-10 w-10 rounded-full transition-colors ${
                        transparent 
                          ? 'bg-white/20 hover:bg-white/30' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <User className={`h-5 w-5 ${transparent ? 'text-white' : 'text-gray-600'}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-black">{business?.name}</p>
                        <p className="text-xs text-black">{business?.account_email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/rezervimet" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Rezervimet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/menaxho-biznesin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Menaxho Biznesin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleBusinessLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dil nga Llogaria
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Profile dropdown for authenticated users */}
                <div className="relative group">
                  <button className={`flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors ${
                    transparent ? 'text-white hover:bg-white/10' : 'text-muted-foreground hover:text-foreground'
                  }`}>
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">{user?.name}</span>
                    {user?.role === "admin" && (
                      <Badge variant="secondary" className="text-xs">
                        Admin
                      </Badge>
                    )}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Dropdown menu */}
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    {user?.role === "admin" && (
                      <Link 
                        href="/admin" 
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Paneli i Adminit
                      </Link>
                    )}
                    <hr className="my-1" />
                    <button
                      onClick={logout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <LogOut className="w-4 h-4 inline mr-2" />
                      Dilni
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button size="lg" variant="outline" asChild className="text-lg text-white bg-transparent hover:bg-transparent"
                >
                  <Link href="/identifikohu">Kycu</Link>
                </Button>
                <Button 
                  asChild
                  className={transparent ? "bg-white border-white text-teal-800 text-lg hover:bg-white hover:text-teal-800" : ""}
                >
                  <Link href="/regjistro-biznesin">Regjistrohu si Biznes</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-start justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-transparent flex items-start justify-center"
                >
                  <Menu className="h-18 w-18 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                {isAdminLoggedIn ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{admin?.email}</p>
                        <p className="text-xs text-gray-600">Administrator</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleAdminLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dil nga Llogaria
                    </DropdownMenuItem>
                  </>
                ) : isBusinessLoggedIn ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{business?.name}</p>
                        <p className="text-xs text-gray-600">{business?.account_email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/rezervimet" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Rezervimet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/menaxho-biznesin" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        Menaxho Biznesin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleBusinessLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dil nga Llogaria
                    </DropdownMenuItem>
                  </>
                ) : isAuthenticated ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{user?.name}</p>
                        {user?.role === "admin" && (
                          <p className="text-xs text-gray-600">Admin</p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Paneli i Adminit
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dilni
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/si-funksionon" className="flex items-center">
                        Si Funksionon
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/identifikohu" className="flex items-center">
                        Kycu
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/regjistro-biznesin" className="flex items-center">
                        Regjistrohu si Biznes
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
