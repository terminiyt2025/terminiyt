import { Suspense } from "react"
import Link from "next/link"
import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { ArrowLeft, UserPlus, Building2 } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-teal-800 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-white rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-white rounded-full blur-3xl"></div>
      </div>

      <Header transparent={true} />
      
      <div className="flex items-center justify-center px-[15px] md:px-4 py-16 md:py-20 relative z-10">
        <div className="w-full max-w-md">
        

          {/* Welcome Section */}
          <div className="text-center mb-4 md:mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium mb-4 md:mb-6">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              Mirë se vini përsëri
            </div>
           
            
          </div>

          {/* Login Form Card */}
          <Card className="bg-[#f4f4f4] border-0 shadow-2xl backdrop-blur-sm max-w-lg mx-auto">
            <CardHeader className="text-center pb-4 md:pb-6">
              <CardTitle className="text-3xl md:text-3xl font-heading font-extrabold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                Identifikohu
              </CardTitle>
              <CardDescription className="text-gray-600 text-sm md:text-lg">
                Shkruani të dhënat tuaja për të hyrë në llogari
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <Suspense fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-800 rounded-full animate-spin"></div>
                </div>
              }>
                <LoginForm />
              </Suspense>
            </CardContent>
          </Card>

          {/* Additional Links */}
          <div className="mt-4 md:mt-8 space-y-4">
            
            {/* Business registration link */}
            <div className="text-center">
              <p className="text-white/80 text-sm md:text-base">
                Dëshironi të listoni biznesin tuaj?
              </p>
              <p className="text-center mt-2">
                <Link 
                  href="/regjistro-biznesin" 
                  className="text-white hover:text-white/80 font-semibold underline underline-offset-4 transition-colors"
                >
                  Regjistrohuni si ofrues
                </Link>
              </p>
            </div>
          </div>

        
        </div>
      </div>
    </div>
  )
}
