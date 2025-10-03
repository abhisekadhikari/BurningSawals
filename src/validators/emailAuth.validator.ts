import { body } from "express-validator";

export const emailAuthValidator = {
    sendOTPBody: [
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
    ],

    verifyOTPBody: [
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
    ],
};
