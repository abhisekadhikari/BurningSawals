import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Dynamic imports for jose (ES module)
let importJWK: any;

// Initialize jose modules
async function initJose() {
    if (!importJWK) {
        const jose = await import("jose");
        importJWK = jose.importJWK;
    }
}

// Types
interface JWK {
    [key: string]: any;
}

// Load from secret manager / env
const getJWKFromEnv = (envVar: string): JWK => {
    const jwkString = process.env[envVar];
    if (!jwkString) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
    try {
        return JSON.parse(jwkString);
    } catch (error) {
        throw new Error(
            `Invalid JSON in environment variable ${envVar}: ${error}`
        );
    }
};

const PUB_JWK: JWK = getJWKFromEnv("JWT_ENC_PUBLIC_JWK");
const PRIV_JWK: JWK = getJWKFromEnv("JWT_ENC_PRIVATE_JWK");

export const getEncPublicKey = async () => {
    await initJose();
    return importJWK(PUB_JWK, "RSA-OAEP-256");
};

export const getEncPrivateKey = async () => {
    await initJose();
    return importJWK(PRIV_JWK, "RSA-OAEP-256");
};
