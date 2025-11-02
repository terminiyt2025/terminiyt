"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  Facebook, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Shield
} from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <>
      {/* HR Line above footer */}
      <hr className="border-gray-500" />
      
      <footer className="bg-custom-gradient text-white">
        <div className="container mx-auto px-4 py-12">
          {/* Main Footer Content */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-8">
            {/* Logo - Centered */}
            <div className="flex flex-col md:w-auto w-full">
              <Image
                src="/logo.png"
                alt="TerminiYt.com"
                width={60}
                height={35}
                className="h-20 w-48 mb-4"
              />
              <p className="text-slate-300 text-sm leading-relaxed max-w-md">
                Platforma më e mirë për rezervimin e shërbimeve lokale në Kosovë. 
                Gjej, rezervo dhe shijo shërbimet më cilësore në afërsi.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-3 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  asChild
                >
                  <Link href="https://facebook.com" target="_blank" rel="noopener noreferrer">
                    <Facebook className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  asChild
                >
                  <Link href="https://instagram.com" target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4" />
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-transparent border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                  asChild
                >
                
                </Button>
              </div>
            </div>

            {/* Contact Info - Full width left on mobile, right on desktop */}
            <div className="text-right md:text-right text-left w-full md:w-auto">
              <h3 className="text-lg font-semibold mb-4 text-white text-left md:text-right">Kontakto</h3>
              <div className="space-y-3">
                {/* Desktop: icon right, text left | Mobile: icon left, text right, same line */}
                <div className="flex items-start gap-3 justify-end md:justify-end justify-start">
                  <div className="text-right md:text-right text-left">
                    <p className="text-slate-300 text-sm text-left md:text-right">
                      Qendra e Prishtinës<br />
                      Rruga e Qytetit, Kosovë
                    </p>
                  </div>
                  <MapPin className="w-4 h-4 text-white mt-1 flex-shrink-0 md:order-last order-first" />
                </div>
                
                <div className="flex items-center gap-3 justify-end md:justify-end justify-start">
                  <Link 
                    href="tel:+38344123456" 
                    className="text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    +383 44 123 456
                  </Link>
                  <Phone className="w-4 h-4 text-white flex-shrink-0 md:order-last order-first" />
                </div>
                
                <div className="flex items-center gap-3 justify-end md:justify-end justify-start">
                  <Link 
                    href="mailto:info@terminiyt.com" 
                    className="text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    info@terminiyt.com
                  </Link>
                  <Mail className="w-4 h-4 text-white flex-shrink-0 md:order-last order-first" />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-8 bg-slate-500" />

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-sm">
              © {currentYear} terminiyt.com. Të gjitha të drejtat e rezervuara.
            </div>
            
            <div className="flex items-center gap-2">
              <Link 
                href="/politika-e-privatesise" 
                className="text-slate-300 hover:text-white transition-colors text-sm flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Politika e Privatësisë
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
