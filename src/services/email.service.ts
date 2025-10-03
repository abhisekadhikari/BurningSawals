import * as nodemailer from "nodemailer";

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    auth: {
        user: string;
        pass: string;
    };
}

class EmailService {
    private transporter: nodemailer.Transporter | null = null;
    private config: EmailConfig | null = null;

    constructor() {
        this.initializeTransporter();
    }

    private initializeTransporter() {
        try {
            // Get email configuration from environment variables
            const emailHost = process.env.EMAIL_HOST || "smtp.gmail.com";
            const emailPort = parseInt(process.env.EMAIL_PORT || "587");
            const emailUser = process.env.EMAIL_USER;
            const emailPass = process.env.EMAIL_PASS;

            if (!emailUser || !emailPass) {
                console.warn(
                    "Email configuration not found. Email service will be disabled."
                );
                return;
            }

            this.config = {
                host: emailHost,
                port: emailPort,
                secure: emailPort === 465, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            };

            this.transporter = nodemailer.createTransport(this.config);
            console.log("Email service initialized successfully");
        } catch (error) {
            console.error("Failed to initialize email service:", error);
        }
    }

    /**
     * Send OTP via email
     * @param email - The email address to send OTP to
     * @param otp - The OTP code
     * @param userName - Optional user name for personalization
     * @returns Promise<boolean> - Success status
     */
    async sendOTP(
        email: string,
        otp: string,
        userName?: string
    ): Promise<boolean> {
        if (!this.transporter) {
            console.error("Email service not initialized");
            return false;
        }

        try {
            const mailOptions = {
                from: `"Burning Sawals" <${this.config?.auth.user}>`,
                to: email,
                subject: "Your OTP for Burning Sawals",
                html: this.generateOTPEmailHTML(otp, userName),
                text: this.generateOTPEmailText(otp, userName),
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log("OTP email sent successfully:", info.messageId);
            return true;
        } catch (error) {
            console.error("Failed to send OTP email:", error);
            return false;
        }
    }

    /**
     * Generate HTML email template for OTP
     */
    private generateOTPEmailHTML(otp: string, userName?: string): string {
        const greeting = userName ? `Hi ${userName}` : "Hi there";

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your OTP for Burning Sawals</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f4f4f4;
                }
                .container {
                    background-color: #ffffff;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #E63946;
                    margin-bottom: 10px;
                }
                .otp-container {
                    background: linear-gradient(135deg, #E63946, #F77F00);
                    color: white;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                    margin: 30px 0;
                }
                .otp-code {
                    font-size: 32px;
                    font-weight: bold;
                    letter-spacing: 8px;
                    margin: 10px 0;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                    color: #666;
                    font-size: 14px;
                }
                .warning {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    color: #856404;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="logo">🔥 Burning Sawals</div>
                    <p>Your questions, our answers!</p>
                </div>
                
                <h2>${greeting}!</h2>
                
                <p>You're almost there! Use the OTP below to complete your authentication:</p>
                
                <div class="otp-container">
                    <div style="font-size: 18px; margin-bottom: 10px;">Your OTP Code</div>
                    <div class="otp-code">${otp}</div>
                    <div style="font-size: 14px; opacity: 0.9;">Valid for 10 minutes</div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
                </div>
                
                <p>If you didn't request this OTP, please ignore this email.</p>
                
                <div class="footer">
                    <p>This is an automated message from Burning Sawals.</p>
                    <p>© 2024 Burning Sawals. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    /**
     * Generate plain text email for OTP
     */
    private generateOTPEmailText(otp: string, userName?: string): string {
        const greeting = userName ? `Hi ${userName}` : "Hi there";

        return `
${greeting}!

Welcome to Burning Sawals - Your questions, our answers!

Your OTP Code: ${otp}
Valid for: 10 minutes

Security Notice: Never share this OTP with anyone. Our team will never ask for your OTP.

If you didn't request this OTP, please ignore this email.

---
This is an automated message from Burning Sawals.
© 2024 Burning Sawals. All rights reserved.
        `;
    }

    /**
     * Test email configuration
     */
    async testConnection(): Promise<boolean> {
        if (!this.transporter) {
            return false;
        }

        try {
            await this.transporter.verify();
            console.log("Email service connection verified");
            return true;
        } catch (error) {
            console.error("Email service connection failed:", error);
            return false;
        }
    }
}

export const emailService = new EmailService();
export default emailService;
