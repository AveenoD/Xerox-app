import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({ 
    from: `"XeroxConnect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your XeroxConnect Verification Code",
    html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f4f4; font-family: 'Segoe UI', Arial, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center" style="padding: 40px 20px;">

                <!-- Email Container -->
                <table width="600" cellpadding="0" cellspacing="0" 
                       style="background:#ffffff; border-radius:12px; 
                              overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td style="background-color:#0A2342; padding:30px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:28px; 
                                       letter-spacing:1px;">XeroxConnect</h1>
                            <p style="margin:6px 0 0 0; color:#a0b4c8; 
                                      font-size:13px;">Print Shop Marketplace</p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 40px 20px 40px;">
                            <h2 style="color:#0A2342; margin:0 0 12px 0; font-size:22px;">
                                Email Verification
                            </h2>
                            <p style="color:#64748B; line-height:1.7; margin:0 0 28px 0;">
                                Thank you for registering with XeroxConnect. 
                                Use the OTP below to verify your email address.
                            </p>

                            <!-- OTP Box -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" 
                                        style="background:#f0f4f8; border-radius:10px; 
                                               padding:28px; border: 1px dashed #0A2342;">
                                        <p style="margin:0 0 8px 0; font-size:13px; 
                                                  color:#64748B; text-transform:uppercase; 
                                                  letter-spacing:2px;">
                                            Your Verification Code
                                        </p>
                                        <p style="margin:0; font-size:42px; 
                                                  font-weight:800; color:#0A2342; 
                                                  letter-spacing:10px;">
                                            ${otp}
                                        </p>
                                    </td>
                                </tr>
                            </table>

                            <!-- Expiry -->
                            <p style="color:#64748B; font-size:14px; 
                                      margin:24px 0 0 0; text-align:center;">
                                ⏱ This OTP expires in 
                                <strong style="color:#0A2342;">10 minutes</strong>
                            </p>
                        </td>
                    </tr>

                    <!-- Warning -->
                    <tr>
                        <td style="padding:0 40px 40px 40px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="background:#fff8f0; border-left:4px solid #F97316; 
                                               border-radius:6px; padding:16px 20px;">
                                        <p style="margin:0; color:#333; font-size:13px; 
                                                  line-height:1.6;">
                                            ⚠️ <strong>Do not share this OTP</strong> with anyone. 
                                            XeroxConnect will never ask for your OTP via call or message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f8f9fa; padding:20px; 
                                   text-align:center; border-top:1px solid #eee;">
                            <p style="margin:0; color:#94a3b8; font-size:12px;">
                                © 2026 XeroxConnect. All rights reserved.
                            </p>
                            <p style="margin:6px 0 0 0; color:#94a3b8; font-size:12px;">
                                If you did not request this, please ignore this email.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>

</body>
</html>`
 })

export const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "XeroxConnect — Verify Your Email",
        html: `...${otp}...`   
    }

    await transporter.sendMail(mailOptions)
    return true
}