import nodemailer from 'nodemailer'

// Create transporter for Hostinger SMTP
let transporter: any = null

try {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
} catch (error) {
  console.error('Failed to create email transporter:', error)
}

// Email sending function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html?: string
  text?: string
}) {
  try {
    if (!transporter) {
      console.log('Email transporter not configured')
      return { success: false, error: 'Email transporter not configured' }
    }

    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME || 'TerminiYt.com'}" <${process.env.FROM_EMAIL || 'info@terminiyt.com'}>`,
      to,
      subject,
      html,
      text,
    })
    
    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Email sending failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Email templates
export const emailTemplates = {
  // Email sent to customer confirming their booking
  customerConfirmation: (bookingData: any) => ({
    subject: `✅ Rezervimi juaj u konfirmua me sukses! - TerminiYt.com`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
        
        <p style="font-size: 16px; margin-bottom: 20px;">Përshëndetje <strong>${bookingData.customerName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 30px;">Rezervimi juaj me biznesin <strong>${bookingData.businessName}</strong> është konfirmuar me sukses.</p>
        
        <h3 style="font-size: 18px; margin-bottom: 20px;">📅 Detajet e Rezervimit:</h3>
        <p style="margin: 10px 0;"><strong> Biznesi:</strong> ${bookingData.businessName}</p>
        <p style="margin: 10px 0;"><strong> Shërbimi:</strong> ${bookingData.serviceName}</p>
        <p style="margin: 10px 0;"><strong> Stafi:</strong> ${bookingData.staffName}</p>
        <p style="margin: 10px 0;"><strong> Data:</strong> ${bookingData.date}</p>
        <p style="margin: 10px 0;"><strong> Ora:</strong> ${bookingData.time}</p>
          <p style="margin: 10px 0;"><strong> Kohëzgjatja:</strong> ${bookingData.duration} minuta</p>
        ${bookingData.notes ? `<p style="margin: 10px 0;"><strong> Shënime:</strong> ${bookingData.notes}</p>` : ''}
        
        <h4 style="font-size: 16px;">ℹ️ Informacione të Rëndësishme:</h4>
        <ul style="margin: 0;">
          <li style="margin: 8px 0;">Ju lutemi arrini 5-10 minuta para orës së caktuar</li>
            <li style="margin: 8px 0;">Nëse dëshironi të bëni ndryshime apo ta anuloni këtë terminin, ju lutemi kontaktoni në numrin: ${bookingData.staffPhone}</li>
        </ul>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p style="font-size: 14px; margin: 10px 0;">Faleminderit që zgjodhët TerminiYt.com!</p>
          <p style="font-size: 12px; margin-top: 20px;">
            <a href="mailto:info@terminiyt.com">info@terminiyt.com</a> | 
            <a href="https://terminiyt.com">terminiyt.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
      
      Përshëndetje ${bookingData.customerName},
      
      Rezervimi juaj me biznesin ${bookingData.businessName} është konfirmuar me sukses.
      
      📅 Detajet e Rezervimit:
      Biznesi: ${bookingData.businessName}
      Shërbimi: ${bookingData.serviceName}
      Stafi: ${bookingData.staffName}
      Data: ${bookingData.date}
      Ora: ${bookingData.time}
      Kohëzgjatja: ${bookingData.duration} minuta
      ${bookingData.notes ? `Shënime: ${bookingData.notes}` : ''}
      
      ℹ️ Informacione të Rëndësishme:
      • Ju lutemi arrini 5-10 minuta para orës së caktuar
       • Nëse dëshironi ndryshime apo anulime, ju lutemi kontaktoni në numrin: ${bookingData.staffPhone}
      
      Faleminderit që zgjodhët TerminiYt.com!
      info@terminiyt.com | terminiyt.com
    `
  }),

  // Email sent to staff member about their new booking
  staffNotification: (bookingData: any) => ({
    subject: `Rezervim i Ri - ${bookingData.businessName}`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
        
        <p style="font-size: 16px; margin-bottom: 20px;">Përshëndetje <strong>${bookingData.staffName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 30px;">Ju keni një rezervim të ri në <strong>${bookingData.businessName}</strong>.</p>
        
        <h3 style="font-size: 18px; margin-bottom: 20px;">👤 Informacionet e Klientit:</h3>
        <p style="margin: 10px 0;"><strong> Emri:</strong> ${bookingData.customerName}</p>
        <p style="margin: 10px 0;"><strong> Email:</strong> ${bookingData.customerEmail}</p>
        <p style="margin: 10px 0;"><strong> Telefon:</strong> ${bookingData.customerPhone}</p>
        
        <h3 style="font-size: 18px; margin: 30px 0 20px 0;">📅 Detajet e Rezervimit:</h3>
        <p style="margin: 10px 0;"><strong> Shërbimi:</strong> ${bookingData.serviceName}</p>
        <p style="margin: 10px 0;"><strong> Data:</strong> ${bookingData.date}</p>
        <p style="margin: 10px 0;"><strong> Ora:</strong> ${bookingData.time}</p>
        <p style="margin: 10px 0;"><strong> Kohëzgjatja:</strong> ${bookingData.duration} minuta</p>
        ${bookingData.notes ? `<p style="margin: 10px 0;"><strong> Shënime nga klienti:</strong> ${bookingData.notes}</p>` : ''}
        
        <h4 style="font-size: 16px;">📋 Çfarë duhet të bëni:</h4>
        <ul style="margin: 0;">
          <li style="margin: 8px 0;">Kontrolloni kalendarin tuaj për këtë rezervim</li>
          <li style="margin: 8px 0;">Sigurohuni që jeni i disponueshëm në kohën e caktuar</li>
          <li style="margin: 8px 0;">Kontaktoni klientin nëse ka nevojë për ndonjë informacion shtesë</li>
        </ul>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p style="font-size: 14px; margin: 10px 0;">Ky email u dërgua automatikisht nga sistemi i rezervimeve.</p>
          <p style="font-size: 12px; margin-top: 20px;">
            <a href="mailto:info@terminiyt.com">info@terminiyt.com</a> | 
            <a href="https://terminiyt.com">terminiyt.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Përshëndetje ${bookingData.staffName},
      
      Ju keni një rezervim të ri në ${bookingData.businessName}.
      
      👤 Informacionet e Klientit:
      Emri: ${bookingData.customerName}
      Email: ${bookingData.customerEmail}
      Telefon: ${bookingData.customerPhone}
      
      📅 Detajet e Rezervimit:
      Shërbimi: ${bookingData.serviceName}
      Data: ${bookingData.date}
      Ora: ${bookingData.time}
      Kohëzgjatja: ${bookingData.duration} minuta
      ${bookingData.notes ? `Shënime nga klienti: ${bookingData.notes}` : ''}
      
      📋 Çfarë duhet të bëni:
      • Kontrolloni kalendarin tuaj për këtë rezervim
      • Sigurohuni që jeni i disponueshëm në kohën e caktuar
      • Kontaktoni klientin nëse ka nevojë për ndonjë informacion shtesë

      
      Ky email u dërgua automatikisht nga sistemi i rezervimeve.
      
      info@terminiyt.com | terminiyt.com
    `
  }),

  // Email sent to customer as reminder 30 minutes before appointment
  bookingReminder: (bookingData: any) => ({
    subject: `⏰ Rikujtim: Rezervimi juaj fillon në 30 minuta - TerminiYt.com`,
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto;">
        
        <p style="font-size: 16px; margin-bottom: 20px;">Përshëndetje <strong>${bookingData.customerName}</strong>,</p>
        <p style="font-size: 16px; margin-bottom: 30px;">Ky është një rikujtim që rezervimi juaj me <strong>${bookingData.businessName}</strong> fillon në <strong>30 minuta</strong>.</p>
        
        <h3 style="font-size: 18px; margin-bottom: 20px;">📅 Detajet e Rezervimit:</h3>
        <p style="margin: 10px 0;"><strong> Biznesi:</strong> ${bookingData.businessName}</p>
        <p style="margin: 10px 0;"><strong> Shërbimi:</strong> ${bookingData.serviceName}</p>
        <p style="margin: 10px 0;"><strong> Stafi:</strong> ${bookingData.staffName}</p>
        <p style="margin: 10px 0;"><strong> Data:</strong> ${bookingData.date}</p>
        <p style="margin: 10px 0;"><strong> Ora:</strong> ${bookingData.time}</p>
        <p style="margin: 10px 0;"><strong> Kohëzgjatja:</strong> ${bookingData.duration} minuta</p>
        ${bookingData.notes ? `<p style="margin: 10px 0;"><strong> Shënime:</strong> ${bookingData.notes}</p>` : ''}
        
        <h4 style="font-size: 16px;">⏰ Rikujtim i Rëndësishëm:</h4>
        <ul style="margin: 0;">
          <li style="margin: 8px 0;">Ju lutemi arrini 5-10 minuta para orës së caktuar</li>
          <li style="margin: 8px 0;">Sigurohuni që keni marrë me vete dokumentet e nevojshme</li>
          <li style="margin: 8px 0;">Nëse nuk mund të arrini, ju lutemi kontaktoni në numrin: ${bookingData.staffPhone}</li>
        </ul>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>💡 Këshillë:</strong> Nëse keni pyetje apo nevojë për ndryshime, kontaktoni biznesin sa më shpejt që të jetë e mundur.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc;">
          <p style="font-size: 14px; margin: 10px 0;">Faleminderit që zgjodhët TerminiYt.com!</p>
          <p style="font-size: 12px; margin-top: 20px;">
            <a href="mailto:info@terminiyt.com">info@terminiyt.com</a> | 
            <a href="https://terminiyt.com">terminiyt.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
      Përshëndetje ${bookingData.customerName},
      
      Ky është një rikujtim që rezervimi juaj me ${bookingData.businessName} fillon në 30 minuta.
      
      📅 Detajet e Rezervimit:
      Biznesi: ${bookingData.businessName}
      Shërbimi: ${bookingData.serviceName}
      Stafi: ${bookingData.staffName}
      Data: ${bookingData.date}
      Ora: ${bookingData.time}
      Kohëzgjatja: ${bookingData.duration} minuta
      ${bookingData.notes ? `Shënime: ${bookingData.notes}` : ''}
      
      ⏰ Rikujtim i Rëndësishëm:
      • Ju lutemi arrini 5-10 minuta para orës së caktuar
      • Sigurohuni që keni marrë me vete dokumentet e nevojshme
      • Nëse nuk mund të arrini, ju lutemi kontaktoni në numrin: ${bookingData.staffPhone}
      
      💡 Këshillë: Nëse keni pyetje apo nevojë për ndryshime, kontaktoni biznesin sa më shpejt që të jetë e mundur.
      
      Faleminderit që zgjodhët TerminiYt.com!
      
      info@terminiyt.com | terminiyt.com
    `
  })
}
