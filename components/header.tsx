"use client"

import Link from "next/link"
import Image from "next/image"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings, Home, Calendar, Menu, Lock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
  const [isStaffLoggedIn, setIsStaffLoggedIn] = useState(false)
  const [business, setBusiness] = useState<Business | null>(null)
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [staff, setStaff] = useState<{ name: string; email: string; role: string; businessName: string; businessId?: number } | null>(null)
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false)
  const [showAdminPasswordChangeModal, setShowAdminPasswordChangeModal] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [adminPasswordChangeData, setAdminPasswordChangeData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isChangingAdminPassword, setIsChangingAdminPassword] = useState(false)
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

      // Check staff auth
      const staffAuthData = localStorage.getItem('staffAuth')
      if (staffAuthData) {
        try {
          const parsedData = JSON.parse(staffAuthData)
          const { staffName, staffEmail, role, businessName, businessId } = parsedData
          const isLoggedIn = !!(staffName && businessName)
          setIsStaffLoggedIn(isLoggedIn)
          
          if (isLoggedIn) {
            setStaff({ name: staffName, email: staffEmail, role: role || 'STAFF', businessName, businessId })
          } else {
            setStaff(null)
          }
        } catch (error) {
          setIsStaffLoggedIn(false)
          setStaff(null)
        }
      } else {
        setIsStaffLoggedIn(false)
        setStaff(null)
      }
    }

    checkAuth()
    
    // Listen for storage changes and custom events
    window.addEventListener('storage', checkAuth)
    window.addEventListener('businessLogin', checkAuth)
    window.addEventListener('businessLogout', checkAuth)
    window.addEventListener('adminLogin', checkAuth)
    window.addEventListener('adminLogout', checkAuth)
    window.addEventListener('staffLogin', checkAuth)
    window.addEventListener('staffLogout', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      window.removeEventListener('businessLogin', checkAuth)
      window.removeEventListener('businessLogout', checkAuth)
      window.removeEventListener('adminLogin', checkAuth)
      window.removeEventListener('adminLogout', checkAuth)
      window.removeEventListener('staffLogin', checkAuth)
      window.removeEventListener('staffLogout', checkAuth)
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

  const handleStaffLogout = () => {
    // Clear staff auth data
    localStorage.removeItem('staffAuth')
    
    // Dispatch logout event
    window.dispatchEvent(new Event('staffLogout'))
    
    // Clear staff state
    setStaff(null)
    setIsStaffLoggedIn(false)
    
    toast({
      title: "U shkëputët me sukses",
      description: "Jeni dërguar në faqen kryesore.",
    })
    
    // Redirect to home
    router.push('/')
  }

  const handleAdminPasswordChange = async () => {
    if (!admin || !admin.id) {
      toast({
        title: "Gabim",
        description: "Të dhënat e adminit nuk u gjetën.",
        variant: "destructive",
      })
      return
    }

    // Validate passwords
    if (!adminPasswordChangeData.currentPassword || !adminPasswordChangeData.newPassword || !adminPasswordChangeData.confirmPassword) {
      toast({
        title: "Gabim",
        description: "Ju lutemi plotësoni të gjitha fushat.",
        variant: "destructive",
      })
      return
    }

    if (adminPasswordChangeData.newPassword.length < 8) {
      toast({
        title: "Gabim",
        description: "Fjalëkalimi i ri duhet të jetë të paktën 8 karaktere.",
        variant: "destructive",
      })
      return
    }

    if (adminPasswordChangeData.newPassword !== adminPasswordChangeData.confirmPassword) {
      toast({
        title: "Gabim",
        description: "Fjalëkalimet e rinj nuk përputhen.",
        variant: "destructive",
      })
      return
    }

    setIsChangingAdminPassword(true)

    try {
      // Call API to change password
      const response = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminId: admin.id,
          currentPassword: adminPasswordChangeData.currentPassword,
          newPassword: adminPasswordChangeData.newPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast({
        title: "Sukses!",
        description: "Fjalëkalimi u ndryshua me sukses.",
      })

      // Reset form and close modal
      setAdminPasswordChangeData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowAdminPasswordChangeModal(false)

    } catch (error: any) {
      console.error('Error changing admin password:', error)
      toast({
        title: "Gabim",
        description: error.message || "Ndodhi një gabim gjatë ndryshimit të fjalëkalimit.",
        variant: "destructive",
      })
    } finally {
      setIsChangingAdminPassword(false)
    }
  }

  const handleStaffPasswordChange = async () => {
    // Get businessId from state or localStorage
    let businessId = staff?.businessId
    
    if (!businessId) {
      // Try to get from localStorage
      try {
        const staffAuthData = localStorage.getItem('staffAuth')
        if (staffAuthData) {
          const parsedData = JSON.parse(staffAuthData)
          businessId = parsedData.businessId
        }
      } catch (error) {
        console.error('Error reading staffAuth from localStorage:', error)
      }
    }

    if (!staff || !staff.email) {
      toast({
        title: "Gabim",
        description: "Të dhënat e stafit nuk u gjetën.",
        variant: "destructive",
      })
      return
    }

    // If businessId is still not found, try to find it by searching businesses
    if (!businessId && staff.email) {
      try {
        // Search for business that contains this staff member
        const businessesResponse = await fetch('/api/businesses')
        if (businessesResponse.ok) {
          const businesses = await businessesResponse.json()
          // Find business that has staff with this email
          for (const biz of businesses) {
            if (biz.staff && Array.isArray(biz.staff)) {
              const staffMember = biz.staff.find((s: any) => s.email === staff.email)
              if (staffMember) {
                businessId = biz.id
                // Update localStorage with businessId
                try {
                  const staffAuthData = localStorage.getItem('staffAuth')
                  if (staffAuthData) {
                    const parsedData = JSON.parse(staffAuthData)
                    parsedData.businessId = businessId
                    localStorage.setItem('staffAuth', JSON.stringify(parsedData))
                    // Update state
                    setStaff(prev => prev ? { ...prev, businessId } : null)
                  }
                } catch (error) {
                  console.error('Error updating staffAuth:', error)
                }
                break
              }
            }
          }
        }
      } catch (error) {
        console.error('Error searching for business:', error)
      }
    }

    if (!businessId) {
      toast({
        title: "Gabim",
        description: "ID e biznesit nuk u gjet. Ju lutemi identifikohuni përsëri.",
        variant: "destructive",
      })
      return
    }

    // Validate passwords
    if (!passwordChangeData.currentPassword || !passwordChangeData.newPassword || !passwordChangeData.confirmPassword) {
      toast({
        title: "Gabim",
        description: "Ju lutemi plotësoni të gjitha fushat.",
        variant: "destructive",
      })
      return
    }

    if (passwordChangeData.newPassword.length < 8) {
      toast({
        title: "Gabim",
        description: "Fjalëkalimi i ri duhet të jetë të paktën 8 karaktere.",
        variant: "destructive",
      })
      return
    }

    if (passwordChangeData.newPassword !== passwordChangeData.confirmPassword) {
      toast({
        title: "Gabim",
        description: "Fjalëkalimet e rinj nuk përputhen.",
        variant: "destructive",
      })
      return
    }

    setIsChangingPassword(true)

    try {
      // Call API to change password
      const response = await fetch('/api/staff/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId,
          staffEmail: staff.email,
          currentPassword: passwordChangeData.currentPassword,
          newPassword: passwordChangeData.newPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast({
        title: "Sukses!",
        description: "Fjalëkalimi u ndryshua me sukses.",
      })

      // Reset form and close modal
      setPasswordChangeData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setShowPasswordChangeModal(false)

    } catch (error: any) {
      console.error('Error changing password:', error)
      toast({
        title: "Gabim",
        description: error.message || "Ndodhi një gabim gjatë ndryshimit të fjalëkalimit.",
        variant: "destructive",
      })
    } finally {
      setIsChangingPassword(false)
    }
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
                      onSelect={(e) => {
                        e.preventDefault()
                        setShowAdminPasswordChangeModal(true)
                      }}
                      className="hover:!bg-gray-100 hover:!text-black focus:!bg-gray-100 focus:!text-black"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Ndrysho Fjalëkalimin
                    </DropdownMenuItem>
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
            ) : isStaffLoggedIn ? (
              <div className="flex items-center space-x-4">
                {/* Staff dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`relative h-10 w-10 rounded-full transition-colors ${
                        transparent 
                          ? 'bg-white/20 hover:bg-white/30' 
                          : 'bg-blue-100 hover:bg-blue-200'
                      }`}
                    >
                      <User className={`h-5 w-5 ${transparent ? 'text-white' : 'text-blue-600'}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{staff?.name}</p>
                        <p className="text-xs text-gray-600">{staff?.email}</p>
                        <p className="text-xs text-gray-500">{staff?.businessName}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {staff?.role === 'MANAGER' ? 'Menaxher' : 'Staf'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/rezervimet" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                        <Calendar className="mr-2 h-4 w-4" />
                        Rezervimet
                      </Link>
                    </DropdownMenuItem>
                    {staff?.role === 'MANAGER' && (
                      <DropdownMenuItem asChild>
                        <Link href="/menaxho-biznesin" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                          <Settings className="mr-2 h-4 w-4" />
                          Menaxho Biznesin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault()
                        setShowPasswordChangeModal(true)
                      }}
                      className="hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Ndrysho Fjalëkalimin
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleStaffLogout}
                      className="text-red-600 focus:text-red-600 hover:!bg-gray-50 focus:!bg-gray-50"
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
                      <Link href="/rezervimet" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                        <Calendar className="mr-2 h-4 w-4" />
                        Rezervimet
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/menaxho-biznesin" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                        <Settings className="mr-2 h-4 w-4" />
                        Menaxho Biznesin
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center hover:!bg-gray-50 hover:!text-black focus:!bg-gray-50 focus:!text-black">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleBusinessLogout}
                      className="text-red-600 focus:text-red-600 hover:!bg-gray-50 focus:!bg-gray-50"
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
                <Link 
                  href="/identifikohu"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "outline" }),
                    "text-lg text-white bg-transparent hover:bg-transparent"
                  )}
                >
                  Kyçu
                </Link>
                <Link 
                  href="/regjistro-biznesin"
                  className={cn(
                    buttonVariants(),
                    transparent ? "bg-white border-white text-zinc-800 text-lg hover:bg-white hover:text-teal-800" : ""
                  )}
                >
                  Regjistrohu si Biznes
                </Link>
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
                      onSelect={(e) => {
                        e.preventDefault()
                        setShowAdminPasswordChangeModal(true)
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Ndrysho Fjalëkalimin
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleAdminLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Dil nga Llogaria
                    </DropdownMenuItem>
                  </>
                ) : isStaffLoggedIn ? (
                  <>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-gray-900">{staff?.name}</p>
                        <p className="text-xs text-gray-600">{staff?.email}</p>
                        <p className="text-xs text-gray-500">{staff?.businessName}</p>
                        <p className="text-xs text-blue-600 font-medium">
                          {staff?.role === 'MANAGER' ? 'Menaxher' : 'Staf'}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/rezervimet" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        Rezervimet
                      </Link>
                    </DropdownMenuItem>
                    {staff?.role === 'MANAGER' && (
                      <DropdownMenuItem asChild>
                        <Link href="/menaxho-biznesin" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Menaxho Biznesin
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/" className="flex items-center">
                        <Home className="mr-2 h-4 w-4" />
                        Faqja Kryesore
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onSelect={(e) => {
                        e.preventDefault()
                        setShowPasswordChangeModal(true)
                      }}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Ndrysho Fjalëkalimin
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleStaffLogout}
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
                        Kyçu
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
      {/* Password Change Dialog */}
      <Dialog open={showPasswordChangeModal} onOpenChange={setShowPasswordChangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ndrysho Fjalëkalimin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="current-password">Fjalëkalimi Aktual</Label>
              <Input
                id="current-password"
                type="password"
                value={passwordChangeData.currentPassword}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Shkruani fjalëkalimin aktual"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-password">Fjalëkalimi i Ri (min. 8 karaktere)</Label>
              <Input
                id="new-password"
                type="password"
                value={passwordChangeData.newPassword}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Shkruani fjalëkalimin e ri"
                className="mt-1"
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Konfirmo Fjalëkalimin</Label>
              <Input
                id="confirm-password"
                type="password"
                value={passwordChangeData.confirmPassword}
                onChange={(e) => setPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Konfirmoni fjalëkalimin e ri"
                className="mt-1"
                minLength={8}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordChangeModal(false)
                  setPasswordChangeData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                disabled={isChangingPassword}
              >
                Anulo
              </Button>
              <Button
                onClick={handleStaffPasswordChange}
                disabled={isChangingPassword}
                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
              >
                {isChangingPassword ? 'Duke ndryshuar...' : 'Ndrysho Fjalëkalimin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Admin Password Change Dialog */}
      <Dialog open={showAdminPasswordChangeModal} onOpenChange={setShowAdminPasswordChangeModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ndrysho Fjalëkalimin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="admin-current-password">Fjalëkalimi Aktual</Label>
              <Input
                id="admin-current-password"
                type="password"
                value={adminPasswordChangeData.currentPassword}
                onChange={(e) => setAdminPasswordChangeData(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Shkruani fjalëkalimin aktual"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-new-password">Fjalëkalimi i Ri (min. 8 karaktere)</Label>
              <Input
                id="admin-new-password"
                type="password"
                value={adminPasswordChangeData.newPassword}
                onChange={(e) => setAdminPasswordChangeData(prev => ({ ...prev, newPassword: e.target.value }))}
                placeholder="Shkruani fjalëkalimin e ri"
                className="mt-1"
                minLength={8}
              />
            </div>
            <div>
              <Label htmlFor="admin-confirm-password">Konfirmo Fjalëkalimin</Label>
              <Input
                id="admin-confirm-password"
                type="password"
                value={adminPasswordChangeData.confirmPassword}
                onChange={(e) => setAdminPasswordChangeData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Konfirmoni fjalëkalimin e ri"
                className="mt-1"
                minLength={8}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAdminPasswordChangeModal(false)
                  setAdminPasswordChangeData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  })
                }}
                disabled={isChangingAdminPassword}
              >
                Anulo
              </Button>
              <Button
                onClick={handleAdminPasswordChange}
                disabled={isChangingAdminPassword}
                className="bg-gradient-to-r from-gray-800 to-teal-800 hover:from-gray-700 hover:to-teal-700 text-white"
              >
                {isChangingAdminPassword ? 'Duke ndryshuar...' : 'Ndrysho Fjalëkalimin'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}
