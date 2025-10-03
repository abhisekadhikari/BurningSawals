/**
 * Email validation utilities
 */

/**
 * Validates email format using regex
 * @param email - Email address to validate
 * @returns boolean - True if email is valid
 */
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Normalizes email address (lowercase, trim)
 * @param email - Email address to normalize
 * @returns string - Normalized email address
 */
export function normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
}

/**
 * Checks if email domain is from a common provider
 * @param email - Email address to check
 * @returns boolean - True if email is from common provider
 */
export function isCommonEmailProvider(email: string): boolean {
    const commonProviders = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "icloud.com",
        "aol.com",
        "protonmail.com",
        "yandex.com",
        "mail.com",
        "zoho.com",
    ];

    const domain = email.split("@")[1]?.toLowerCase();
    return commonProviders.includes(domain || "");
}

/**
 * Validates email for OTP sending
 * @param email - Email address to validate
 * @returns {isValid: boolean, message: string}
 */
export function validateEmailForOTP(email: string): {
    isValid: boolean;
    message: string;
} {
    if (!email) {
        return { isValid: false, message: "Email address is required" };
    }

    if (!isValidEmail(email)) {
        return { isValid: false, message: "Invalid email format" };
    }

    const normalizedEmail = normalizeEmail(email);

    // Check for suspicious patterns
    if (
        normalizedEmail.includes("+") &&
        normalizedEmail.split("+")[0].length < 3
    ) {
        return {
            isValid: false,
            message: "Email address appears to be invalid",
        };
    }

    return { isValid: true, message: "Valid email address" };
}
