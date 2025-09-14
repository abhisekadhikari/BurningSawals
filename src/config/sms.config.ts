/**
 * @fileoverview SMS service configuration for Fast2SMS
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

export interface SMSConfig {
    apiKey: string;
    baseUrl: string;
    route: string;
    senderId?: string;
}

export const getSMSConfig = (): SMSConfig => {
    return {
        apiKey: process.env.FAST2SMS_API_KEY || "",
        baseUrl: "https://www.fast2sms.com/dev/bulkV2",
        route: "q", // Use 'q' route for simple OTP without DLT
        senderId: process.env.FAST2SMS_SENDER_ID || "BURNING",
    };
};

export const SMS_TEMPLATES = {
    OTP: (otp: string, appName: string = "Burning Sawals") =>
        `Your OTP for ${appName} is: ${otp}. Valid for 10 minutes.`,

    WELCOME: (userName: string, appName: string = "Burning Sawals") =>
        `Welcome to ${appName}, ${userName}! Your account has been created successfully.`,

    LOGIN_SUCCESS: (userName: string, appName: string = "Burning Sawals") =>
        `Login successful! Welcome back to ${appName}, ${userName}.`,
} as const;
