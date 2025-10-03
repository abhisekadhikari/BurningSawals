/**
 * @fileoverview Zod validation schemas for email authentication endpoints
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { z } from "zod";

/**
 * Schema for email validation
 */
export const emailSchema = z
    .string()
    .min(1, "Email address is required")
    .email("Valid email address is required")
    .max(255, "Email address too long")
    .transform((email) => email.toLowerCase().trim());

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
    email: emailSchema,
    captcha_token: z.string().min(1, "CAPTCHA token is required"),
});

/**
 * Schema for verifying OTP request (unified for login/registration)
 */
export const verifyOTPBody = z.object({
    email: emailSchema,
    otp: otpSchema,
    user_name: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(50, "Username must be less than 50 characters")
        .regex(
            /^[a-zA-Z0-9_-]+$/,
            "Username can only contain letters, numbers, hyphens, and underscores"
        )
        .optional(),
});

/**
 * Schema for email login request
 */
export const emailLoginBody = z.object({
    email: emailSchema,
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
    emailSchema,
    otpSchema,
    sendOTPBody,
    verifyOTPBody,
    emailLoginBody,
    checkUsernameBody,
};
