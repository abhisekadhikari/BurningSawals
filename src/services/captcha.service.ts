import axios from "axios";

interface CaptchaVerificationResult {
    success: boolean;
    message: string;
    score?: number;
    action?: string;
}

export async function verifyCaptcha(
    captchaToken: string,
    userIP?: string
): Promise<CaptchaVerificationResult> {
    try {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;

        if (!secretKey) {
            return {
                success: false,
                message: "CAPTCHA verification not configured",
            };
        }

        const verificationURL =
            "https://www.google.com/recaptcha/api/siteverify";

        const formData = new URLSearchParams();
        formData.append("secret", secretKey);
        formData.append("response", captchaToken);
        if (userIP) {
            formData.append("remoteip", userIP);
        }

        const response = await axios.post(verificationURL, formData, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
        });

        const {
            success,
            score,
            action,
            "error-codes": errorCodes,
        } = response.data;

        console.log("reCAPTCHA API Response:", {
            success,
            score,
            action,
            errorCodes,
            responseData: response.data,
        });

        // Log token info for debugging
        console.log("reCAPTCHA Token Info:", {
            tokenLength: captchaToken?.length,
            tokenPrefix: captchaToken?.substring(0, 10) + "...",
            userIP: userIP || "not provided",
        });

        // Check if the response indicates an error
        if (response.status !== 200) {
            console.error(
                "reCAPTCHA API returned non-200 status:",
                response.status
            );
            return {
                success: false,
                message: `CAPTCHA verification failed with status ${response.status}`,
            };
        }

        if (!success) {
            const errorMessage =
                errorCodes?.length > 0
                    ? `CAPTCHA verification failed: ${errorCodes.join(", ")}`
                    : "CAPTCHA verification failed";

            return {
                success: false,
                message: errorMessage,
            };
        }

        // For reCAPTCHA v3, use score to determine if it's likely a bot
        // Score ranges from 0.0 (likely bot) to 1.0 (likely human)
        const minScore = 0.5; // Adjust this threshold as needed

        if (score !== undefined && score < minScore) {
            return {
                success: false,
                message:
                    "CAPTCHA verification failed - suspicious activity detected",
                score,
                action,
            };
        }

        return {
            success: true,
            message: "CAPTCHA verified successfully",
            score: score || 1.0,
            action,
        };
    } catch (error) {
        console.error("CAPTCHA verification error:", error);

        // If it's an axios error, try to get the response data
        if (error.response && error.response.data) {
            console.error("reCAPTCHA API Error Response:", error.response.data);

            // If we have error codes, return them
            if (error.response.data["error-codes"]) {
                return {
                    success: false,
                    message: `CAPTCHA verification failed: ${error.response.data[
                        "error-codes"
                    ].join(", ")}`,
                };
            }
        }

        return {
            success: false,
            message: "Failed to verify CAPTCHA",
        };
    }
}

export function generateCaptchaChallenge(): {
    question: string;
    answer: number;
} {
    // Simple math challenge as fallback
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operation = Math.random() > 0.5 ? "+" : "-";

    let question: string;
    let answer: number;

    if (operation === "+") {
        question = `${num1} + ${num2} = ?`;
        answer = num1 + num2;
    } else {
        // Ensure positive result
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        question = `${larger} - ${smaller} = ?`;
        answer = larger - smaller;
    }

    return { question, answer };
}
