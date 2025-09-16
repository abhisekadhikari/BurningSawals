/**
 * @fileoverview Zod validation schemas for phone authentication endpoints
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { z } from "zod";

/**
 * Schema for phone number validation
 */
export const phoneNumberSchema = z
    .string()
    .min(1, "Phone number is required")
    .refine(
        (phone) => {
            const cleaned = phone.replace(/\D/g, "");
            return (
                cleaned.length === 10 &&
                ["6", "7", "8", "9"].includes(cleaned[0])
            );
        },
        {
            message:
                "Invalid Indian phone number format. Must be 10 digits starting with 6, 7, 8, or 9",
        }
    );

/**
 * Schema for OTP validation
 */
export const otpSchema = z
    .string()
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits");

/**
 * Schema for sending OTP request
 */
export const sendOTPBody = z.object({
    phone_number: phoneNumberSchema,
});

/**
 * Schema for verifying OTP request (unified for login/registration)
 */
export const verifyOTPBody = z.object({
    phone_number: phoneNumberSchema,
    otp: otpSchema,
    user_name: z
        .string()
        .min(1, "User name is required")
        .max(200, "User name too long")
        .optional(),
});

/**
 * Schema for phone login request
 */
export const phoneLoginBody = z.object({
    phone_number: phoneNumberSchema,
    otp: otpSchema,
});

/**
 * Schema for checking username availability
 */
export const checkUsernameBody = z.object({
    user_name: z
        .string()
        .min(1, "Username is required")
        .max(200, "Username too long")
        .regex(
            /^[a-zA-Z0-9_]+$/,
            "Username can only contain letters, numbers, and underscores"
        ),
});

export default {
    phoneNumberSchema,
    otpSchema,
    sendOTPBody,
    verifyOTPBody,
    phoneLoginBody,
    checkUsernameBody,
};
