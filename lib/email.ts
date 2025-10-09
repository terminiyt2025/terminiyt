import nodemailer from 'nodemailer'

// Create transporter for Hostinger SMTP
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

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
    subject: `Rezervimi u Konfirmua - ${bookingData.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0;">TerminiYt.com</h1>
          <p style="color: #6b7280; margin: 5px 0;">Rezervimet tuaja lokale</p>
        </div>
        
        <h2 style="color: #1f2937; text-align: center;">✅ Rezervimi u Konfirmua!</h2>
        
        <p style="font-size: 16px;">Përshëndetje <strong>${bookingData.customerName}</strong>,</p>
        <p style="font-size: 16px;">Rezervimi juaj me <strong>${bookingData.businessName}</strong> është konfirmuar me sukses.</p>
        
        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0f766e;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">📅 Detajet e Rezervimit:</h3>
          <div style="display: grid; gap: 10px;">
            <p style="margin: 5px 0;"><strong>🏢 Biznesi:</strong> ${bookingData.businessName}</p>
            <p style="margin: 5px 0;"><strong>🛠️ Shërbimi:</strong> ${bookingData.serviceName}</p>
            <p style="margin: 5px 0;"><strong>👤 Stafi:</strong> ${bookingData.staffName}</p>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${bookingData.date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Ora:</strong> ${bookingData.time}</p>
            <p style="margin: 5px 0;"><strong>💰 Çmimi:</strong> ${bookingData.price}€</p>
            ${bookingData.notes ? `<p style="margin: 5px 0;"><strong>📝 Shënime:</strong> ${bookingData.notes}</p>` : ''}
          </div>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #1e40af; margin-top: 0;">ℹ️ Informacione të Rëndësishme:</h4>
          <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
            <li>Ju lutemi arrini 5-10 minuta para orës së caktuar</li>
            <li>Nëse nuk mund të arrini, ju lutemi na kontaktoni sa më parë</li>
            <li>Rezervimi juaj është i garantuar për orën e zgjedhur</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Faleminderit që zgjodhët TerminiYt.com!</p>
          <p style="color: #6b7280; font-size: 14px;">Ekipi i TerminiYt.com</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">
            <a href="mailto:info@terminiyt.com" style="color: #0f766e;">info@terminiyt.com</a> | 
            <a href="https://terminiyt.com" style="color: #0f766e;">terminiyt.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
      TerminiYt.com - Rezervimet tuaja lokale
      
      ✅ Rezervimi u Konfirmua!
      
      Përshëndetje ${bookingData.customerName},
      
      Rezervimi juaj me ${bookingData.businessName} është konfirmuar me sukses.
      
      📅 Detajet e Rezervimit:
      🏢 Biznesi: ${bookingData.businessName}
      🛠️ Shërbimi: ${bookingData.serviceName}
      👤 Stafi: ${bookingData.staffName}
      📅 Data: ${bookingData.date}
      🕐 Ora: ${bookingData.time}
      💰 Çmimi: ${bookingData.price}€
      ${bookingData.notes ? `📝 Shënime: ${bookingData.notes}` : ''}
      
      ℹ️ Informacione të Rëndësishme:
      • Ju lutemi arrini 5-10 minuta para orës së caktuar
      • Nëse nuk mund të arrini, ju lutemi na kontaktoni sa më parë
      • Rezervimi juaj është i garantuar për orën e zgjedhur
      
      Faleminderit që zgjodhët TerminiYt.com!
      Ekipi i TerminiYt.com
      
      info@terminiyt.com | terminiyt.com
    `
  }),

  // Email sent to staff member about their new booking
  staffNotification: (bookingData: any) => ({
    subject: `Rezervim i Ri për Ju - ${bookingData.businessName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1f2937; margin: 0;">TerminiYt.com</h1>
          <p style="color: #6b7280; margin: 5px 0;">Sistemi i rezervimeve</p>
        </div>
        
        <h2 style="color: #1f2937; text-align: center;">📋 Rezervim i Ri për Ju</h2>
        
        <p style="font-size: 16px;">Përshëndetje <strong>${bookingData.staffName}</strong>,</p>
        <p style="font-size: 16px;">Ju keni një rezervim të ri në <strong>${bookingData.businessName}</strong>.</p>
        
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #f59e0b;">
          <h3 style="color: #92400e; margin-top: 0; font-size: 18px;">👤 Informacionet e Klientit:</h3>
          <div style="display: grid; gap: 10px;">
            <p style="margin: 5px 0;"><strong>Emri:</strong> ${bookingData.customerName}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${bookingData.customerEmail}</p>
            <p style="margin: 5px 0;"><strong>Telefon:</strong> ${bookingData.customerPhone}</p>
          </div>
        </div>
        
        <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); padding: 25px; border-radius: 12px; margin: 25px 0; border-left: 4px solid #0f766e;">
          <h3 style="color: #1f2937; margin-top: 0; font-size: 18px;">📅 Detajet e Rezervimit:</h3>
          <div style="display: grid; gap: 10px;">
            <p style="margin: 5px 0;"><strong>🛠️ Shërbimi:</strong> ${bookingData.serviceName}</p>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${bookingData.date}</p>
            <p style="margin: 5px 0;"><strong>🕐 Ora:</strong> ${bookingData.time}</p>
            <p style="margin: 5px 0;"><strong>⏱️ Kohëzgjatja:</strong> ${bookingData.duration} minuta</p>
            <p style="margin: 5px 0;"><strong>💰 Çmimi:</strong> ${bookingData.price}€</p>
            ${bookingData.notes ? `<p style="margin: 5px 0;"><strong>📝 Shënime nga klienti:</strong> ${bookingData.notes}</p>` : ''}
          </div>
        </div>
        
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
          <h4 style="color: #1e40af; margin-top: 0;">📋 Çfarë duhet të bëni:</h4>
          <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
            <li>Kontrolloni kalendarin tuaj për këtë rezervim</li>
            <li>Sigurohuni që jeni i disponueshëm në kohën e caktuar</li>
            <li>Kontaktoni klientin nëse ka nevojë për ndonjë informacion shtesë</li>
            <li>Përgatituni për shërbimin e rezervuar</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px;">Ky email u dërgua automatikisht nga sistemi i rezervimeve.</p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 15px;">
            <a href="mailto:info@terminiyt.com" style="color: #0f766e;">info@terminiyt.com</a> | 
            <a href="https://terminiyt.com" style="color: #0f766e;">terminiyt.com</a>
          </p>
        </div>
      </div>
    `,
    text: `
      TerminiYt.com - Sistemi i rezervimeve
      
      📋 Rezervim i Ri për Ju
      
      Përshëndetje ${bookingData.staffName},
      
      Ju keni një rezervim të ri në ${bookingData.businessName}.
      
      👤 Informacionet e Klientit:
      Emri: ${bookingData.customerName}
      Email: ${bookingData.customerEmail}
      Telefon: ${bookingData.customerPhone}
      
      📅 Detajet e Rezervimit:
      🛠️ Shërbimi: ${bookingData.serviceName}
      📅 Data: ${bookingData.date}
      🕐 Ora: ${bookingData.time}
      ⏱️ Kohëzgjatja: ${bookingData.duration} minuta
      💰 Çmimi: ${bookingData.price}€
      ${bookingData.notes ? `📝 Shënime nga klienti: ${bookingData.notes}` : ''}
      
      📋 Çfarë duhet të bëni:
      • Kontrolloni kalendarin tuaj për këtë rezervim
      • Sigurohuni që jeni i disponueshëm në kohën e caktuar
      • Kontaktoni klientin nëse ka nevojë për ndonjë informacion shtesë
      • Përgatituni për shërbimin e rezervuar
      
      Ky email u dërgua automatikisht nga sistemi i rezervimeve.
      
      info@terminiyt.com | terminiyt.com
    `
  })
}
