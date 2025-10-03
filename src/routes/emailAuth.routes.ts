import express from "express";
import { body } from "express-validator";
import { asyncHandler } from "../middleware/asyncHandler";
import { validator } from "../middleware/validator";
import { ApiResponse } from "../utils/apiResponse";
import {
    generateAndSendEmailOTP,
    verifyEmailOTP,
} from "../services/emailOtp.service";
import { makeSignedJwt, encryptJwt } from "../utils/tokens";
import { PrismaClient } from "@prisma/client";
import { rateLimiter } from "../middleware/rateLimiter";

const emailAuthRouter = express.Router();
const prisma = new PrismaClient();

// Rate limiting for email OTP endpoints
const emailOtpRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per window
    message: "Too many OTP requests. Please try again later.",
});

const verifyOtpRateLimit = rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 verification attempts per window
    message: "Too many verification attempts. Please try again later.",
});

/**
 * @route   POST /auth/email/send-otp
 * @desc    Send OTP to email address
 * @access  Public
 * @body    {string} email - Email address
 * @body    {string} captcha_token - reCAPTCHA token
 * @returns {Object} Success message and user status
 */
emailAuthRouter.post(
    "/auth/email/send-otp",
    emailOtpRateLimit,
    validator([
        body("email")
            .isEmail()
            .withMessage("Valid email address is required")
            .normalizeEmail()
            .isLength({ min: 5, max: 255 })
            .withMessage("Email must be between 5 and 255 characters"),
        body("captcha_token")
            .notEmpty()
            .withMessage("Captcha token is required")
            .isString()
            .withMessage("Captcha token must be a string"),
    ]),
    asyncHandler(async (req, res) => {
        const { email, captcha_token } = req.body;

        // TODO: Verify captcha token here
        // For now, we'll skip captcha verification

        const result = await generateAndSendEmailOTP(email);

        if (!result.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, result.message, null));
        }

        return res.json(
            ApiResponse.success(200, result.message, {
                is_existing_user: result.isExistingUser,
            })
        );
    })
);

/**
 * @route   POST /auth/email/verify-otp
 * @desc    Verify OTP and create/login user (unified endpoint)
 * @access  Public
 * @body    {string} email - Email address
 * @body    {string} otp - 6-digit OTP
 * @body    {string} [user_name] - Required for new users, optional for existing users
 * @returns {Object} JWT token and user info
 */
emailAuthRouter.post(
    "/auth/email/verify-otp",
    verifyOtpRateLimit,
    validator([
        body("email")
            .isEmail()
            .withMessage("Valid email address is required")
            .normalizeEmail()
            .isLength({ min: 5, max: 255 })
            .withMessage("Email must be between 5 and 255 characters"),
        body("otp")
            .isLength({ min: 6, max: 6 })
            .withMessage("OTP must be exactly 6 digits")
            .isNumeric()
            .withMessage("OTP must contain only numbers"),
        body("user_name")
            .optional()
            .isLength({ min: 3, max: 50 })
            .withMessage("Username must be between 3 and 50 characters")
            .matches(/^[a-zA-Z0-9_-]+$/)
            .withMessage(
                "Username can only contain letters, numbers, hyphens, and underscores"
            ),
    ]),
    asyncHandler(async (req, res) => {
        const { email, otp, user_name } = req.body;

        // Check if user exists first
        const existingUser = await prisma.users.findUnique({
            where: { email: email },
        });

        // If user doesn't exist and no username provided, return error
        if (!existingUser && !user_name) {
            return res
                .status(400)
                .json(
                    ApiResponse.error(
                        400,
                        "Username is required for new users",
                        null
                    )
                );
        }

        const result = await verifyEmailOTP(email, otp, user_name);

        if (!result.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, result.message, null));
        }

        // Create JWT payload
        const payload = {
            sub: result.userId?.toString(),
            email: email,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days
            iss: "burning-sawals-api",
            aud: "burning-sawals",
        };

        // Sign JWT
        const jwtToken = await makeSignedJwt(payload);

        // Encrypt JWT to create JWE
        const jweToken = await encryptJwt(jwtToken);

        return res.json(
            ApiResponse.success(200, result.message, {
                token: jweToken,
                user: {
                    user_id: result.userId?.toString(),
                    email: email,
                    is_new_user: result.isNewUser,
                },
            })
        );
    })
);

export default emailAuthRouter;
