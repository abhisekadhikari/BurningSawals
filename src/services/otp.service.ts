/**
 * @fileoverview OTP service for phone number verification
 * Handles OTP generation, hashing, storage, and verification
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import axios from "axios";
import { getSMSConfig, SMS_TEMPLATES } from "../config/sms.config";
import {
    generateOTP,
    isValidOTP,
    isValidIndianPhoneNumber,
} from "../utils/phoneValidation";
import logger from "../utils/logger";
import monitoringService from "./monitoring.service";

const prisma = new PrismaClient();

export interface OTPResult {
    success: boolean;
    message: string;
    otpId?: bigint;
}

export interface VerifyOTPResult {
    success: boolean;
    message: string;
    userId?: bigint;
    isNewUser?: boolean;
}

/**
 * Generates a secure hash for OTP storage
 * @param otp - The OTP to hash
 * @param salt - The salt to use for hashing
 * @returns string - The hashed OTP
 */
function hashOTP(otp: string, salt: Buffer): string {
    return crypto.pbkdf2Sync(otp, salt, 10000, 64, "sha512").toString("hex");
}

/**
 * Generates a random salt for OTP hashing
 * @returns Buffer - Random salt
 */
function generateSalt(): Buffer {
    return crypto.randomBytes(16);
}

/**
 * Sends OTP to phone number via Fast2SMS
 * @param phoneNumber - The phone number to send OTP to
 * @param otp - The OTP to send
 * @returns Promise<boolean> - Success status
 */
async function sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const startTime = Date.now();

    try {
        // Log OTP generation
        logger.otpGenerated(phoneNumber, "", { otp });

        // Try to send via Fast2SMS if API key is available
        const smsConfig = getSMSConfig();
        if (smsConfig.apiKey) {
            try {
                const message = SMS_TEMPLATES.OTP(otp);
                const response = await axios.get(smsConfig.baseUrl, {
                    params: {
                        authorization: smsConfig.apiKey,
                        message: message,
                        numbers: phoneNumber,
                        route: smsConfig.route,
                        sender_id: smsConfig.senderId,
                    },
                });

                if (response.data.return === true) {
                    logger.otpSent(phoneNumber, "sms", {
                        requestId: response.data.request_id,
                    });
                    monitoringService.logPerformance("sms_send", startTime, {
                        phoneNumber,
                    });
                    return true;
                } else {
                    logger.smsError(phoneNumber, response.data.message);
                    logger.otpSent(phoneNumber, "console", {
                        reason: "sms_api_error",
                    });
                }
            } catch (smsError) {
                logger.smsError(phoneNumber, smsError.message);
                logger.otpSent(phoneNumber, "console", {
                    reason: "sms_network_error",
                });
            }
        } else {
            logger.otpSent(phoneNumber, "console", {
                reason: "sms_not_configured",
            });
        }

        return true;
    } catch (error) {
        logger.error("Error sending OTP", {
            phoneNumber,
            error: error.message,
        });
        return false;
    }
}

/**
 * Generates and sends OTP to phone number
 * @param phoneNumber - The phone number to send OTP to
 * @returns Promise<OTPResult> - Result of OTP generation
 */
export async function generateAndSendOTP(
    phoneNumber: string
): Promise<OTPResult> {
    try {
        // Validate phone number format
        if (!isValidIndianPhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: "Invalid phone number format",
            };
        }

        // Generate OTP
        const otp = generateOTP();
        const salt = generateSalt();
        const otpHash = hashOTP(otp, salt);

        // Set expiration time (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store OTP in database
        const otpRecord = await prisma.otps.create({
            data: {
                phone_number: phoneNumber,
                otp_hash: Buffer.from(otpHash, "hex"),
                salt: salt,
                expires_at: expiresAt,
                attempts: 0,
                max_attempts: 5,
            },
        });

        // Send OTP via SMS
        const sent = await sendOTP(phoneNumber, otp);
        if (!sent) {
            // If SMS fails, clean up the OTP record
            await prisma.otps.delete({
                where: { otp_id: otpRecord.otp_id },
            });
            return {
                success: false,
                message: "Failed to send OTP",
            };
        }

        return {
            success: true,
            message: "OTP sent successfully",
            otpId: otpRecord.otp_id,
        };
    } catch (error) {
        console.error("Error generating OTP:", error);
        return {
            success: false,
            message: "Failed to generate OTP",
        };
    }
}

/**
 * Verifies OTP and creates/updates user
 * @param phoneNumber - The phone number
 * @param otp - The OTP to verify
 * @param userName - Optional user name
 * @returns Promise<VerifyOTPResult> - Result of OTP verification
 */
export async function verifyOTP(
    phoneNumber: string,
    otp: string,
    userName?: string
): Promise<VerifyOTPResult> {
    const startTime = Date.now();

    try {
        // Check for suspicious activity
        const isSuspicious = await monitoringService.checkSuspiciousActivity(
            phoneNumber
        );
        if (isSuspicious) {
            logger.warn(
                "Suspicious activity detected during OTP verification",
                { phoneNumber }
            );
        }

        // Validate OTP format
        if (!isValidOTP(otp)) {
            logger.otpFailed(phoneNumber, "Invalid OTP format");
            return {
                success: false,
                message: "Invalid OTP format",
            };
        }

        // Find valid OTP record
        const otpRecord = await prisma.otps.findFirst({
            where: {
                phone_number: phoneNumber,
                expires_at: {
                    gt: new Date(),
                },
                consumed_at: null,
            },
            orderBy: {
                created_at: "desc",
            },
        });

        if (!otpRecord) {
            return {
                success: false,
                message: "Invalid or expired OTP",
            };
        }

        // Check if max attempts exceeded
        if (otpRecord.attempts >= otpRecord.max_attempts) {
            return {
                success: false,
                message: "Maximum OTP attempts exceeded",
            };
        }

        // Verify OTP
        const providedHash = hashOTP(otp, Buffer.from(otpRecord.salt));
        const storedHash = Buffer.from(otpRecord.otp_hash).toString("hex");

        if (providedHash !== storedHash) {
            // Increment attempts
            await prisma.otps.update({
                where: { otp_id: otpRecord.otp_id },
                data: {
                    attempts: otpRecord.attempts + 1,
                    updated_at: new Date(),
                },
            });

            return {
                success: false,
                message: "Invalid OTP",
            };
        }

        // Mark OTP as consumed
        await prisma.otps.update({
            where: { otp_id: otpRecord.otp_id },
            data: {
                consumed_at: new Date(),
                updated_at: new Date(),
            },
        });

        // Check if user exists
        let user = await prisma.users.findUnique({
            where: { phone_number: phoneNumber },
        });

        let isNewUser = false;

        if (!user) {
            // Create new user
            user = await prisma.users.create({
                data: {
                    phone_number: phoneNumber,
                    user_name: userName || `User_${phoneNumber}`,
                    auth_provider: "phone",
                    is_phone_verified: true,
                },
            });
            isNewUser = true;
        } else {
            // Update existing user
            user = await prisma.users.update({
                where: { user_id: user.user_id },
                data: {
                    is_phone_verified: true,
                    last_login_at: new Date(),
                    updated_at: new Date(),
                },
            });
        }

        return {
            success: true,
            message: isNewUser
                ? "User created and verified successfully"
                : "User verified successfully",
            userId: user.user_id,
            isNewUser,
        };
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return {
            success: false,
            message: "Failed to verify OTP",
        };
    }
}

/**
 * Cleans up expired OTPs
 * @returns Promise<number> - Number of OTPs cleaned up
 */
export async function cleanupExpiredOTPs(): Promise<number> {
    try {
        const result = await prisma.otps.deleteMany({
            where: {
                expires_at: {
                    lt: new Date(),
                },
            },
        });

        return result.count;
    } catch (error) {
        console.error("Error cleaning up expired OTPs:", error);
        return 0;
    }
}
