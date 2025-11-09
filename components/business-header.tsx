"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { 
  User, 
  Settings, 
  LogOut, 
  Calendar,
  Home
} from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface Business {
  id: number
  name: string
  account_email: string
}

export function BusinessHeader() {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Check if business is logged in
    const authData = localStorage.getItem('businessAuth')
    if (authData) {
      try {
        const { businessId } = JSON.parse(authData)
        // Fetch business data
        fetchBusinessData(businessId)
      } catch (error) {
        console.error('Error parsing auth data:', error)
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchBusinessData = async (businessId: number) => {
    try {
      const response = await fetch(`/api/businesses/${businessId}`)
      if (response.ok) {
        const businessData = await response.json()
        setBusiness(businessData)
      }
    } catch (error) {
      console.error('Error fetching business data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear business auth data
    localStorage.removeItem('businessAuth')
    
    // Dispatch logout event
    window.dispatchEvent(new Event('businessLogout'))
    
    toast({
      title: "U shkëputët me sukses",
      description: "Jeni dërguar në faqen kryesore.",
    })
    
    // Redirect to home
    router.push('/')
  }

  // Listen for logout events
  useEffect(() => {
    const handleBusinessLogout = () => {
      setBusiness(null)
    }

    window.addEventListener('businessLogout', handleBusinessLogout)
    return () => window.removeEventListener('businessLogout', handleBusinessLogout)
  }, [])

  if (isLoading) {
    return (
      <header className="bg-transparent backdrop-blur-md border-0 sticky top-0 z-50">
        <div className="container mx-auto px-[15px] md:px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-white/20 rounded animate-pulse"></div>
            </div>
            <div className="h-8 w-8 bg-white/20 rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>
    )
  }

  if (!business) {
    return null
  }

  return (
      <header className="bg-transparent backdrop-blur-md border-0 sticky top-0 z-50">
        <div className="container mx-auto px-[15px] md:px-4">
          <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image 
                src="/logo.png" 
                alt="terminiyt.com" 
                width={200} 
                height={70}
                className="h-18 w-auto"
              />
             
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="relative h-10 w-10 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                >
                  <User className="h-5 w-5 text-white" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm text-black">{business.name}</p>
                    <p className="text-xs text-black">{business.account_email}</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
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
                  onClick={handleLogout}
                  className="text-red-600 focus:text-red-600 hover:!bg-gray-50 focus:!bg-gray-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Dil nga Llogaria
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}
