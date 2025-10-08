"use client"

import { useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Eye, Lock, Database, Mail, Phone, MapPin } from "lucide-react"

export default function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = "Politika e Privatësisë - TerminiYt.com"
  }, [])
  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-800 to-teal-800 relative overflow-hidden">
       <Header transparent={true} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 -mt-16 pt-36">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <Shield className="w-12 h-12 mr-3" style={{ color: '#92BDB4' }} />
              <h1 className="text-2xl md:text-4xl font-bold text-white">Politika e Privatësisë</h1>
            </div>
            <p className="text-sm md:text-xl text-gray-200">
              <span className="block">TerminiYt.com</span>
              <span className="block">Rezervo shërbimet tuaja lokale në Kosovë</span>
            </p>
            <p className="text-sm text-gray-300 mt-2">
              E përditësuar më: 30 Shtator 2025
            </p>
          </div>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                <Eye className="w-6 h-6 text-teal-800 mr-3" />
                1. Informacioni që Mbledhim
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informacioni Personal</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Emri dhe mbiemri</li>
                  <li>Adresa e email-it</li>
                  <li>Numri i telefonit</li>
                  <li>Adresa e shtëpisë ose biznesit</li>
                  <li>Informacione të tjera që jepni vullnetarisht</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informacioni i Biznesit</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Emri i biznesit</li>
                  <li>Përshkrimi i shërbimeve</li>
                  <li>Orari i punës</li>
                  <li>Fotografitë e biznesit</li>
                  <li>Koordinatat GPS (latituda dhe longituda)</li>
                  <li>Informacione për stafin dhe shërbimet</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Informacioni Teknik</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Adresa IP</li>
                  <li>Lloji i shfletuesit dhe pajisjes</li>
                  <li>Faqet e vizituara dhe koha e vizitës</li>
                  <li>Cookies dhe teknologji të ngjashme</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                <Database className="w-6 h-6 text-teal-800 mr-3" />
                2. Si Përdorim Informacionin
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Qëllimet Kryesore</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Për të ofruar dhe përmirësuar shërbimet tona</li>
                  <li>Për të lehtësuar rezervimet dhe komunikimin</li>
                  <li>Për të personalizuar përvojën tuaj</li>
                  <li>Për të dërguar njoftime dhe përditësime</li>
                  <li>Për të analizuar përdorimin e platformës</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Komunikimi</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Konfirmimi i rezervimeve</li>
                  <li>Njoftime për ndryshime në shërbime</li>
                  <li>Përgjigje ndaj pyetjeve tuaja</li>
                  <li>Informacione të rëndësishme për përdorimin e platformës</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                <Lock className="w-6 h-6 text-teal-800 mr-3" />
                3. Siguria e të Dhënave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ne marrim masa të përshtatshme për të mbrojtur informacionin tuaj personal nga aksesi i paautorizuar, 
                ndryshimi, shpërndarja ose shkatërrimi. Kjo përfshin:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Enkriptim të të dhënave në tranzit dhe në pushim</li>
                <li>Kontrollin e aksesit dhe autentifikimin</li>
                <li>Monitorimin e vazhdueshëm të sigurisë</li>
                <li>Backup të rregullt të të dhënave</li>
                <li>Stafin e trajnuar për sigurinë e të dhënave</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                4. Ndarja e Informacionit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ne nuk shesim, nuk marrëm me qira dhe nuk ndajmë informacionin tuaj personal me palë të treta, 
                përveç në rastet e mëposhtme:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Kur keni dhënë pëlqimin tuaj të qartë</li>
                <li>Kur kërkohet nga ligji ose autoritetet kompetente</li>
                <li>Me shërbimet e palëve të treta që na ndihmojnë në funksionimin e platformës (me marrëveshje konfidencialiteti)</li>
                <li>Për të mbrojtur të drejtat, pronën ose sigurinë tonë ose të përdoruesve të tjerë</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                5. Cookies dhe Teknologji të Ngjashme
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ne përdorim cookies dhe teknologji të ngjashme për të:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Mbajtur preferencat tuaja</li>
                <li>Analizuar përdorimin e platformës</li>
                <li>Përmirësuar performancën dhe funksionalitetin</li>
                <li>Ofruar përvojë më të mirë për përdoruesit</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Ju mund të kontrolloni cookies përmes cilësimeve të shfletuesit tuaj.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                6. Të Drejtat Tuaja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ju keni të drejtën e mëposhtme në lidhje me informacionin tuaj personal:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><strong>E drejta e aksesit:</strong> Të kërkoni një kopje të informacionit tuaj personal</li>
                <li><strong>E drejta e ndryshimit:</strong> Të kërkoni ndryshimin e informacionit të pasaktë</li>
                <li><strong>E drejta e fshirjes:</strong> Të kërkoni fshirjen e informacionit tuaj personal</li>
                <li><strong>E drejta e kufizimit:</strong> Të kufizoni përpunimin e informacionit tuaj</li>
                <li><strong>E drejta e portabilitetit:</strong> Të merrni informacionin tuaj në një format të lexueshëm</li>
                <li><strong>E drejta e ankimimit:</strong> Të ankimoni për përpunimin e informacionit tuaj</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                7. Ruajtja e të Dhënave
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ne ruajmë informacionin tuaj personal për aq kohë sa është e nevojshme për të:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Ofruar shërbimet tona</li>
                <li>Përmbushur detyrimet ligjore</li>
                <li>Zgjidhur mosmarrëveshjet</li>
                <li>Përputhur me këtë politikë privatësie</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Në përgjithësi, ne fshijmë informacionin personal pas 3 vjetësh inaktiviteti.
              </p>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                8. Ndryshimet në Këtë Politikë
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Ne mund të përditësojmë këtë politikë privatësie herë pas here. Kur bëjmë ndryshime të rëndësishme, 
                do t'ju njoftojmë përmes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Një njoftim në platformë</li>
                <li>Email në adresën tuaj të regjistruar</li>
                <li>Një përditësim të datës në krye të kësaj faqeje</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="mb-8 bg-white border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center text-lg md:text-2xl font-bold bg-gradient-to-r from-gray-800 to-teal-800 bg-clip-text text-transparent">
                <Mail className="w-6 h-6 text-teal-800 mr-3" />
                9. Kontakti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Nëse keni pyetje, shqetësime ose kërkesa në lidhje me këtë politikë privatësie, 
                ju lutemi na kontaktoni:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="space-y-3">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-teal-800 mr-3" />
                    <span className="text-gray-700">Email: info@terminiyt.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-teal-800 mr-3" />
                    <span className="text-gray-700">Telefon: +383 44 XXX XXX</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-teal-800 mr-3" />
                    <span className="text-gray-700">Adresa: Prishtinë, Kosovë</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center text-sm text-gray-300 mt-8">
            <p>© {new Date().getFullYear()} TerminiYt.com. Të gjitha të drejtat e rezervuara.</p>
            <p className="mt-2">
              Kjo politikë privatësie është në përputhje me Ligjin për Mbrojtjen e të Dhënave Personale të Republikës së Kosovës.
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}
