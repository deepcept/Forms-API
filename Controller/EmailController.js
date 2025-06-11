import nodemailer from 'nodemailer';

export const sendEmail = async (req, res) => {
  const { name, email, phone, collegeName, domain, message } = req.body;
  
  // 🔒 Validate required fields
  if (!name || !email || !phone || !collegeName || !domain || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required.',
    });
  }

  try {
    // 📬 Create Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Verify connection to Gmail SMTP
    await transporter.verify();

    // 🎨 Create styled HTML email template
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Contact Form Submission</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
      <div style="max-width: 600px; margin: 20px auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 600;">📩 New Contact Inquiry</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9; font-size: 16px;">You have received a new message</p>
        </div>

        <!-- Content -->
        <div style="padding: 40px 30px;">
          <!-- Contact Information -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #e0e6ed; padding-bottom: 10px;">👤 Contact Information</h2>
            
            <div style="display: flex; flex-wrap: wrap; gap: 20px;">
              <div style="flex: 1; min-width: 250px;">
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #667eea;">
                  <div style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Full Name</div>
                  <div style="font-size: 16px; color: #2d3748; margin-top: 5px;">${name}</div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #48bb78;">
                  <div style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</div>
                  <div style="font-size: 16px; color: #2d3748; margin-top: 5px;">
                    <a href="mailto:${email}" style="color: #48bb78; text-decoration: none;">${email}</a>
                  </div>
                </div>
              </div>
              
              <div style="flex: 1; min-width: 250px;">
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #ed8936;">
                  <div style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</div>
                  <div style="font-size: 16px; color: #2d3748; margin-top: 5px;">
                    <a href="tel:${phone}" style="color: #ed8936; text-decoration: none;">${phone}</a>
                  </div>
                </div>
                
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #9f7aea;">
                  <div style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">College/Institution</div>
                  <div style="font-size: 16px; color: #2d3748; margin-top: 5px;">${collegeName}</div>
                </div>
              </div>
            </div>
            
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; border-left: 4px solid #38b2ac;">
              <div style="font-weight: 600; color: #4a5568; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Area of Interest</div>
              <div style="font-size: 16px; color: #2d3748; margin-top: 5px;">
                <span style="background-color: #38b2ac; color: white; padding: 5px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">${domain}</span>
              </div>
            </div>
          </div>

          <!-- Message Section -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 20px; border-bottom: 2px solid #e0e6ed; padding-bottom: 10px;">💬 Message</h2>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea;">
              <p style="margin: 0; color: #4a5568; line-height: 1.6; font-size: 15px; white-space: pre-wrap;">${message}</p>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="text-align: center; margin-top: 30px;">
            <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 0 10px; box-shadow: 0 3px 10px rgba(102, 126, 234, 0.3);">
              📧 Reply via Email
            </a>
            <a href="tel:${phone}" style="display: inline-block; background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; margin: 0 10px; box-shadow: 0 3px 10px rgba(72, 187, 120, 0.3);">
              📞 Call Now
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f7fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="margin: 0; color: #718096; font-size: 14px;">
            📅 Received on ${new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
          <p style="margin: 8px 0 0 0; color: #a0aec0; font-size: 12px;">
            This email was automatically generated from your contact form.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // 📧 Plain text fallback
    const textContent = `
🔔 NEW CONTACT FORM SUBMISSION
═══════════════════════════════

👤 CONTACT INFORMATION
──────────────────────
Name: ${name}
Email: ${email}
Phone: ${phone}
College: ${collegeName}
Domain: ${domain}

💬 MESSAGE
──────────
${message}

📅 RECEIVED
────────────
${new Date().toLocaleString()}

────────────────────────────────
This email was generated via the contact form API.
    `;

    // ✉️ Define email options with HTML and text
    const mailOptions = {
      from: `"${name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `📩 New Inquiry from ${name} - ${domain}`,
      text: textContent,
      html: htmlContent,
    };

    // 🚀 Send the email
    const info = await transporter.sendMail(mailOptions);

    // 🟢 Respond to client
    res.status(200).json({
      success: true,
      message: 'Email sent successfully!',
    });

  } catch (error) {
    // 🔴 Log and return error
    console.error('❌ Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'Something went wrong while sending the email.',
    });
  }
};