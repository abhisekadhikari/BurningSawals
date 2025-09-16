import rateLimit from "express-rate-limit";

// Rate limiter for OTP requests
export const otpRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 3 OTP requests per windowMs
    message: {
        success: false,
        message: "Too many OTP requests. Please try again in 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Use IP + phone number for more specific rate limiting
        const phone = req.body?.phone_number || "";
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        return `${ip}-${phone}`;
    },
});

// Rate limiter for username checks
export const usernameRateLimit = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 20, // Limit each IP to 20 username checks per windowMs
    message: {
        success: false,
        message: "Too many username checks. Please try again in 5 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
});

// Rate limiter for OTP verification
export const verifyOtpRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 verification attempts per windowMs
    message: {
        success: false,
        message:
            "Too many verification attempts. Please try again in 10 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: (req) => {
        // Use IP + phone number for more specific rate limiting
        const phone = req.body?.phone_number || "";
        const ip = req.ip || req.connection.remoteAddress || "unknown";
        return `${ip}-${phone}`;
    },
});

// General API rate limiter
export const generalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: "Too many requests. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
