import { Router } from "express";
import passport from "passport";
import { validator } from "../middlewares/validator.middleware";
import phoneAuthValidator from "../validators/phoneAuth.validator";
import { generateAndSendOTP, verifyOTP } from "../services/otp.service";
import { makeSignedJwt, encryptJwt } from "../utils/tokens";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";

const authRouter = Router();

/**
 * Step 1: Start Google OAuth
 *   - Scopes: profile + email
 */
authRouter.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * Step 2: Handle Google callback
 *   - If success: create JWT, encrypt it, and send to client
 *   - If failure: redirect to home (or error page)
 */
authRouter.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    async (req, res) => {
        try {
            const user = req.user as any; // passport attaches user from verify()

            // --- return as JSON ---
            return res.json({ token: user.token });

            // redirect into your SPA/dashboard
            // res.redirect("/app");
        } catch (err) {
            console.error("Google callback error:", err);
            res.redirect("/?error=auth_failed");
        }
    }
);

/**
 * @route   POST /auth/phone/send-otp
 * @desc    Send OTP to phone number for verification
 * @access  Public
 * @body    {string} phone_number - Indian phone number (10 digits)
 * @returns {Object} Success message
 */
authRouter.post(
    "/auth/phone/send-otp",
    validator(phoneAuthValidator.sendOTPBody),
    asyncHandler(async (req, res) => {
        const { phone_number } = req.body;

        const result = await generateAndSendOTP(phone_number);

        if (!result.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, result.message, null));
        }

        return res.json(
            ApiResponse.success(200, result.message, {
                otp_id: result.otpId?.toString(),
            })
        );
    })
);

/**
 * @route   POST /auth/phone/verify-otp
 * @desc    Verify OTP and create/login user
 * @access  Public
 * @body    {string} phone_number - Indian phone number
 * @body    {string} otp - 6-digit OTP
 * @body    {string} [user_name] - Optional user name
 * @returns {Object} JWT token and user info
 */
authRouter.post(
    "/auth/phone/verify-otp",
    validator(phoneAuthValidator.verifyOTPBody),
    asyncHandler(async (req, res) => {
        const { phone_number, otp, user_name } = req.body;

        const result = await verifyOTP(phone_number, otp, user_name);

        if (!result.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, result.message, null));
        }

        // Create JWT payload
        const payload = {
            sub: result.userId?.toString(),
            phone_number: phone_number,
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
                    phone_number: phone_number,
                    is_new_user: result.isNewUser,
                },
            })
        );
    })
);

/**
 * @route   POST /auth/phone/login
 * @desc    Login with phone number and OTP
 * @access  Public
 * @body    {string} phone_number - Indian phone number
 * @body    {string} otp - 6-digit OTP
 * @returns {Object} JWT token and user info
 */
authRouter.post(
    "/auth/phone/login",
    validator(phoneAuthValidator.phoneLoginBody),
    asyncHandler(async (req, res) => {
        const { phone_number, otp } = req.body;

        const result = await verifyOTP(phone_number, otp);

        if (!result.success) {
            return res
                .status(400)
                .json(ApiResponse.error(400, result.message, null));
        }

        // Create JWT payload
        const payload = {
            sub: result.userId?.toString(),
            phone_number: phone_number,
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
            ApiResponse.success(200, "Login successful", {
                token: jweToken,
                user: {
                    user_id: result.userId?.toString(),
                    phone_number: phone_number,
                },
            })
        );
    })
);

export default authRouter;
