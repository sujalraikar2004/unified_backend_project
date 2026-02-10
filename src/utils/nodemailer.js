import nodemailer from "nodemailer";

// Create transporter
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.error("Email transporter error:", error);
    } else {
        console.log("Email server is ready to send messages");
    }
});

// Send verification email
export const sendVerificationEmail = async (email, fullName, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Verify Your Email - Unified Hub",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .container {
                            background-color: #f9f9f9;
                            border-radius: 10px;
                            padding: 30px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            padding: 20px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .otp-box {
                            background-color: #fff;
                            border: 2px dashed #667eea;
                            border-radius: 8px;
                            padding: 20px;
                            margin: 20px 0;
                            text-align: center;
                        }
                        .otp {
                            font-size: 32px;
                            font-weight: bold;
                            color: #667eea;
                            letter-spacing: 5px;
                        }
                        .footer {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #777;
                            text-align: center;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 10px;
                            margin: 15px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hello <strong>${fullName}</strong>,</p>
                            <p>Thank you for registering with <strong>Unified Hub</strong>! To complete your registration, please verify your email address using the OTP below:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #666; font-size: 14px;">Your verification code is:</p>
                                <div class="otp">${otp}</div>
                            </div>

                            <div class="warning">
                                <strong>⏰ Important:</strong> This OTP will expire in 10 minutes.
                            </div>

                            <p>If you didn't create an account with Unified Hub, please ignore this email.</p>
                            
                            <p>Best regards,<br><strong>Unified Hub Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p>&copy; 2026 Unified Hub. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Verification email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending verification email:", error);
        throw new Error("Failed to send verification email");
    }
};

// Send password reset email
export const sendPasswordResetEmail = async (email, fullName, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Password Reset Request - Unified Hub",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .container {
                            background-color: #f9f9f9;
                            border-radius: 10px;
                            padding: 30px;
                            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
                        }
                        .header {
                            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                            color: white;
                            padding: 20px;
                            border-radius: 10px 10px 0 0;
                            text-align: center;
                        }
                        .otp-box {
                            background-color: #fff;
                            border: 2px dashed #f5576c;
                            border-radius: 8px;
                            padding: 20px;
                            margin: 20px 0;
                            text-align: center;
                        }
                        .otp {
                            font-size: 32px;
                            font-weight: bold;
                            color: #f5576c;
                            letter-spacing: 5px;
                        }
                        .footer {
                            margin-top: 20px;
                            padding-top: 20px;
                            border-top: 1px solid #ddd;
                            font-size: 12px;
                            color: #777;
                            text-align: center;
                        }
                        .warning {
                            background-color: #fff3cd;
                            border-left: 4px solid #ffc107;
                            padding: 10px;
                            margin: 15px 0;
                        }
                        .security-notice {
                            background-color: #f8d7da;
                            border-left: 4px solid #dc3545;
                            padding: 10px;
                            margin: 15px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🔒 Password Reset</h1>
                        </div>
                        <div style="padding: 20px;">
                            <p>Hello <strong>${fullName}</strong>,</p>
                            <p>We received a request to reset your password for your <strong>Unified Hub</strong> account. Use the OTP below to reset your password:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; color: #666; font-size: 14px;">Your password reset code is:</p>
                                <div class="otp">${otp}</div>
                            </div>

                            <div class="warning">
                                <strong>⏰ Important:</strong> This OTP will expire in 10 minutes.
                            </div>

                            <div class="security-notice">
                                <strong>🛡️ Security Notice:</strong> If you didn't request a password reset, please ignore this email and ensure your account is secure.
                            </div>

                            <p>Best regards,<br><strong>Unified Hub Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated email. Please do not reply to this message.</p>
                            <p>&copy; 2026 Unified Hub. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log("Password reset email sent:", info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending password reset email:", error);
        throw new Error("Failed to send password reset email");
    }
};

export default transporter;
