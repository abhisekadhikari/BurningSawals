/**
 * @fileoverview Utilities for Indian phone number validation and formatting
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

/**
 * Validates if a phone number is a valid Indian mobile number
 * @param phoneNumber - The phone number to validate
 * @returns boolean - True if valid Indian mobile number
 */
export function isValidIndianPhoneNumber(phoneNumber: string): boolean {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, "");

    // Indian mobile numbers should be 10 digits
    if (cleaned.length !== 10) {
        return false;
    }

    // Check if it starts with valid Indian mobile prefixes
    const validPrefixes = [
        "6",
        "7",
        "8",
        "9", // Valid starting digits for Indian mobile numbers
    ];

    return validPrefixes.includes(cleaned[0]);
}

/**
 * Formats a phone number to Indian format (+91XXXXXXXXXX)
 * @param phoneNumber - The phone number to format
 * @returns string - Formatted phone number with country code
 */
export function formatIndianPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // If it's already 12 digits and starts with 91, return as is
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
        return `+${cleaned}`;
    }

    // If it's 10 digits, add country code
    if (cleaned.length === 10) {
        return `+91${cleaned}`;
    }

    // If it's 11 digits and starts with 0, remove the 0 and add country code
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
        return `+91${cleaned.substring(1)}`;
    }

    return phoneNumber; // Return original if can't format
}

/**
 * Normalizes a phone number to 10-digit format for storage
 * @param phoneNumber - The phone number to normalize
 * @returns string - 10-digit phone number
 */
export function normalizePhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\D/g, "");

    // If it's 12 digits and starts with 91, remove country code
    if (cleaned.length === 12 && cleaned.startsWith("91")) {
        return cleaned.substring(2);
    }

    // If it's 11 digits and starts with 0, remove the 0
    if (cleaned.length === 11 && cleaned.startsWith("0")) {
        return cleaned.substring(1);
    }

    // If it's 10 digits, return as is
    if (cleaned.length === 10) {
        return cleaned;
    }

    return cleaned; // Return cleaned version
}

/**
 * Generates a 6-digit OTP
 * @returns string - 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Validates OTP format (6 digits)
 * @param otp - The OTP to validate
 * @returns boolean - True if valid OTP format
 */
export function isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp);
}
