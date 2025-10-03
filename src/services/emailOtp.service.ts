import { PrismaClient } from "@prisma/client";
import {
    generateOTP,
    generateSalt,
    hashOTP,
    isValidOTP,
} from "../utils/phoneValidation";
import { emailService } from "./email.service";
import { validateEmailForOTP, normalizeEmail } from "../utils/emailValidation";

const prisma = new PrismaClient();

export interface EmailOTPResult {
    success: boolean;
    message: string;
    otpId?: number;
    isExistingUser?: boolean;
}

export interface VerifyEmailOTPResult {
    success: boolean;
    message: string;
    userId?: number;
    isNewUser?: boolean;
}

/**
 * Generates and sends OTP to email address
 * @param email - The email address to send OTP to
 * @returns Promise<EmailOTPResult> - Result of OTP generation
 */
export async function generateAndSendEmailOTP(
    email: string
): Promise<EmailOTPResult> {
    try {
        // Validate email format
        const emailValidation = validateEmailForOTP(email);
        if (!emailValidation.isValid) {
            return {
                success: false,
                message: emailValidation.message,
            };
        }

        const normalizedEmail = normalizeEmail(email);

        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email: normalizedEmail },
        });

        // Generate OTP
        const otp = generateOTP();
        const salt = generateSalt();
        const otpHash = hashOTP(otp, salt);

        // Set expiration time (10 minutes)
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        // Store OTP in database
        const otpRecord = await prisma.otps.create({
            data: {
                email: normalizedEmail,
                otp_hash: Buffer.from(otpHash, "hex"),
                salt: salt,
                expires_at: expiresAt,
                attempts: 0,
                max_attempts: 5,
            },
        });

        // Send OTP via email
        const sent = await emailService.sendOTP(
            normalizedEmail,
            otp,
            existingUser?.user_name
        );
        if (!sent) {
            // If email fails, clean up the OTP record
            await prisma.otps.delete({
                where: { otp_id: otpRecord.otp_id },
            });
            return {
                success: false,
                message: "Failed to send OTP email",
            };
        }

        return {
            success: true,
            message: "OTP sent successfully to your email",
            otpId: otpRecord.otp_id,
            isExistingUser: !!existingUser,
        };
    } catch (error) {
        console.error("Error generating email OTP:", error);
        return {
            success: false,
            message: "Failed to generate OTP",
        };
    }
}

/**
 * Verifies email OTP and creates/updates user
 * @param email - The email address
 * @param otp - The OTP to verify
 * @param userName - Optional user name
 * @returns Promise<VerifyEmailOTPResult> - Result of OTP verification
 */
export async function verifyEmailOTP(
    email: string,
    otp: string,
    userName?: string
): Promise<VerifyEmailOTPResult> {
    try {
        // Validate email format
        const emailValidation = validateEmailForOTP(email);
        if (!emailValidation.isValid) {
            return {
                success: false,
                message: emailValidation.message,
            };
        }

        const normalizedEmail = normalizeEmail(email);

        // Validate OTP format
        if (!isValidOTP(otp)) {
            return {
                success: false,
                message: "Invalid OTP format",
            };
        }

        // Find valid OTP record
        const otpRecord = await prisma.otps.findFirst({
            where: {
                email: normalizedEmail,
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
            where: { email: normalizedEmail },
        });

        let isNewUser = false;

        if (!user) {
            // Create new user - username should be provided for new users
            if (!userName) {
                return {
                    success: false,
                    message: "Username is required for new users",
                };
            }

            // Check if username is already taken
            const existingUsername = await prisma.users.findFirst({
                where: { user_name: userName },
            });

            if (existingUsername) {
                return {
                    success: false,
                    message:
                        "Username is already taken. Please choose a different username.",
                };
            }

            user = await prisma.users.create({
                data: {
                    email: normalizedEmail,
                    user_name: userName,
                    auth_provider: "email",
                    is_email_verified: true,
                },
            });
            isNewUser = true;
        } else {
            // Update existing user
            user = await prisma.users.update({
                where: { user_id: user.user_id },
                data: {
                    is_email_verified: true,
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
        console.error("Error verifying email OTP:", error);
        return {
            success: false,
            message: "Failed to verify OTP",
        };
    }
}

/**
 * Cleans up expired email OTPs
 * @returns Promise<number> - Number of OTPs cleaned up
 */
export async function cleanupExpiredEmailOTPs(): Promise<number> {
    try {
        const result = await prisma.otps.deleteMany({
            where: {
                email: { not: null },
                expires_at: {
                    lt: new Date(),
                },
            },
        });

        console.log(`Cleaned up ${result.count} expired email OTPs`);
        return result.count;
    } catch (error) {
        console.error("Error cleaning up expired email OTPs:", error);
        return 0;
    }
}
