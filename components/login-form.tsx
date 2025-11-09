"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

const loginSchema = z.object({
  email: z.string().email("Emaili nuk egziston!"),
  password: z.string().min(1, "Emaili ose Fjalëkalimi i gabuar!"),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [loginError, setLoginError] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  // Load saved credentials on component mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('rememberedCredentials')
    if (savedCredentials) {
      try {
        const { email, password } = JSON.parse(savedCredentials)
        form.setValue('email', email)
        form.setValue('password', password)
        setRememberMe(true)
      } catch (error) {
        console.error('Error loading saved credentials:', error)
        localStorage.removeItem('rememberedCredentials')
      }
    }
  }, [form])

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setLoginError("") // Clear any previous errors

    try {
      // Handle remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberedCredentials', JSON.stringify({
          email: data.email,
          password: data.password
        }))
      } else {
        localStorage.removeItem('rememberedCredentials')
      }
      // First try admin login
      const adminResponse = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      })

      if (adminResponse.ok) {
        const { admin } = await adminResponse.json()
        
        // Store admin auth data
        const authData = {
          adminId: admin.id,
          email: admin.email
        }
        localStorage.setItem('adminAuth', JSON.stringify(authData))
        
        // Trigger custom event to update header
        window.dispatchEvent(new Event('adminLogin'))

        toast({
          title: "Mirë se vini në panelin e adminit!",
          description: "Jeni identifikuar me sukses si administrator.",
        })

        // Redirect to admin dashboard
        router.push("/admin")
        return
      }

      // If admin login failed, try business login
      const businessResponse = await fetch('/api/businesses/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      })

      if (businessResponse.ok) {
        const { business } = await businessResponse.json()
        
        // Store business auth data
        const authData = {
          businessId: business.id,
          email: business.account_email,
          role: 'BUSINESS_OWNER'
        }
        localStorage.setItem('businessAuth', JSON.stringify(authData))
        
        // Trigger custom event to update header
        window.dispatchEvent(new Event('businessLogin'))

        toast({
          title: "Mirë se vini përsëri!",
          description: "Jeni identifikuar me sukses në panelin e biznesit.",
        })

        // Redirect to reservations page
        router.push("/rezervimet")
        return
      }

      // If business login failed, try staff login
      const staffResponse = await fetch('/api/staff/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      })

      if (staffResponse.ok) {
        const { staff, business } = await staffResponse.json()
        
        // Store staff auth data
        const authData = {
          staffName: staff.name,
          staffEmail: staff.email,
          businessId: business.id,
          businessName: business.name,
          role: staff.role || 'STAFF'
        }
        localStorage.setItem('staffAuth', JSON.stringify(authData))
        
        // Trigger custom event to update header
        window.dispatchEvent(new Event('staffLogin'))

        toast({
          title: "Mirë se vini!",
          description: `Jeni identifikuar si ${staff.name}`,
        })

        // Redirect to reservations page
        router.push("/rezervimet")
        return
      }

      // All logins failed
      const error = await businessResponse.json().catch(() => ({ error: "Emaili ose Fjalëkalimi i gabuar!" }))
      setLoginError(error.error || "Emaili ose Fjalëkalimi i gabuar!")
      toast({
        title: "Identifikimi dështoi",
        description: error.error || "Emaili ose Fjalëkalimi i gabuar!",
        variant: "destructive",
      })

    } catch (error) {
      console.error('Login error:', error)
      setLoginError("Ndodhi një gabim gjatë kyçjes. Ju lutemi provoni përsëri.")
      toast({
        title: "Identifikimi dështoi",
        description: "Ndodhi një gabim gjatë kyçjes. Ju lutemi provoni përsëri.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 font-medium">{loginError}</p>
              </div>
            </div>
          </div>
        )}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-800 font-semibold text-base md:text-lg">Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="email" 
                    placeholder="Shkruani email-in tuaj" 
                    className="pl-10 bg-white border-gray-300 focus:border-gray-800 focus:ring-gray-800 text-base md:text-lg py-5" 
                    {...field} 
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-800 font-semibold text-base md:text-lg data-[error]:text-gray-800 !text-gray-800">Fjalëkalimi</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Shkruani fjalëkalimin tuaj"
                    className="pl-10 pr-10 bg-white border-gray-300 focus:border-gray-800 focus:ring-gray-800 text-base md:text-lg py-5"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center justify-start">
          <label className="flex items-center space-x-2 text-sm md:text-base">
            <input 
              type="checkbox" 
              className="mr-1 w-4 h-4 text-teal-800 bg-white rounded focus:ring-teal-800 focus:ring-2 accent-teal-800 border-0 focus:border-0 active:border-0 hover:border-0"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="text-gray-600">Më mbaj mend</span>
          </label>
        </div>

        <Button type="submit" className="w-full bg-custom-gradient text-white font-semibold py-3 md:py-4 text-base md:text-lg" disabled={isLoading}>
          {isLoading ? "Duke u identifikuar..." : "Hyr në Llogari"}
        </Button>
      </form>
    </Form>
  )
}
