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

        const response = await axios.post(verificationURL, null, {
            params: {
                secret: secretKey,
                response: captchaToken,
                remoteip: userIP,
            },
        });

        const {
            success,
            score,
            action,
            "error-codes": errorCodes,
        } = response.data;

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
