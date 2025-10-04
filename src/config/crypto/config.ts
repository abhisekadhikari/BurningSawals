import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import jose with proper error handling
let jose: any = null;

// Initialize jose modules
async function initJose() {
    if (!jose) {
        try {
            // Try dynamic import first
            jose = await eval('import("jose")');
        } catch (error) {
            console.error("Dynamic import failed:", error);
            try {
                // Fallback to require
                jose = require("jose");
            } catch (requireError) {
                console.error("Require also failed:", requireError);
                throw new Error(
                    "Failed to load jose library. Please ensure it is installed."
                );
            }
        }
    }
    return jose;
}

// Types
interface JWK {
    [key: string]: any;
}

// Load from secret manager / env
const getJWKFromEnv = (envVar: string): JWK => {
    const jwkString = process.env[envVar];

    // Debug environment variables
    console.log(`${envVar} exists:`, !!jwkString);
    console.log(`${envVar} length:`, jwkString?.length || 0);

    if (!jwkString) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }

    if (jwkString.length === 0) {
        throw new Error(`Environment variable ${envVar} is empty`);
    }

    try {
        const parsed = JSON.parse(jwkString);
        // Additional validation for JWK structure
        if (!parsed.kty || !parsed.n || !parsed.e) {
            throw new Error(
                `Invalid JWK structure in ${envVar}: missing required fields`
            );
        }
        return parsed;
    } catch (error) {
        throw new Error(
            `Invalid JSON in environment variable ${envVar}: ${error}`
        );
    }
};

// Initialize JWKs with error handling
let PUB_JWK: JWK;
let PRIV_JWK: JWK;

try {
    PUB_JWK = getJWKFromEnv("JWT_ENC_PUBLIC_JWK");
    PRIV_JWK = getJWKFromEnv("JWT_ENC_PRIVATE_JWK");
} catch (error) {
    console.error("Failed to load JWK environment variables:", error);
    throw error;
}

export const getEncPublicKey = async () => {
    try {
        const joseLib = await initJose();

        // Debug: Log JWK information
        console.log("PUB_JWK keys:", Object.keys(PUB_JWK));
        console.log("PUB_JWK kty:", PUB_JWK.kty);
        console.log("PUB_JWK n length:", PUB_JWK.n?.length || 0);
        console.log("PUB_JWK e:", PUB_JWK.e);

        return joseLib.importJWK(PUB_JWK, "RSA-OAEP-256");
    } catch (error) {
        console.error("Error importing public key:", error);
        throw new Error(`Failed to import public key: ${error.message}`);
    }
};

export const getEncPrivateKey = async () => {
    const joseLib = await initJose();
    return joseLib.importJWK(PRIV_JWK, "RSA-OAEP-256");
};
