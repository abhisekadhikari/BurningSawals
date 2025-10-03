import express from "express";
import asyncHandler from "../utils/asyncHandler";
import { validator } from "../middlewares/validator.middleware";
import { ApiResponse } from "../utils/ApiResponse";
import {
    generateAndSendEmailOTP,
    verifyEmailOTP,
} from "../services/emailOtp.service";
import { makeSignedJwt, encryptJwt } from "../utils/tokens";
import { prisma } from "../utils/prisma";
import { otpRateLimit, verifyOtpRateLimit } from "../middleware/rateLimiter";
import emailAuthValidator from "../validators/emailAuth.validator";
import { verifyCaptcha } from "../services/captcha.service";

const emailAuthRouter = express.Router();

// Rate limiting for email OTP endpoints - using existing rate limiters

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
    otpRateLimit,
    validator(emailAuthValidator.sendOTPBody),
    asyncHandler(async (req, res) => {
        const { email, captcha_token } = req.body;

        // Verify reCAPTCHA token
        const captchaResult = await verifyCaptcha(captcha_token);
        if (!captchaResult.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, captchaResult.message, null));
        }

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
    validator(emailAuthValidator.verifyOTPBody),
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
