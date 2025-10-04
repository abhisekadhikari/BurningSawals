import { getEncPublicKey, getEncPrivateKey } from "../config/crypto/config";

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
interface JWTPayload {
    [key: string]: any;
}

interface JWK {
    [key: string]: any;
}

// 3.a Sign (JWS)
export async function makeSignedJwt(payload: JWTPayload) {
    const joseLib = await initJose();

    // Debug environment variables
    console.log("JWT_SIGNING_SECRET exists:", !!process.env.JWT_SIGNING_SECRET);
    console.log(
        "JWT_SIGNING_SECRET length:",
        process.env.JWT_SIGNING_SECRET?.length || 0
    );

    if (!process.env.JWT_SIGNING_SECRET) {
        throw new Error("JWT_SIGNING_SECRET environment variable is not set");
    }

    const secret = new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!); // symmetric HMAC (HS256)
    const token = await new joseLib.SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .setIssuer("burning-sawals-api")
        .setAudience("burning-sawals")
        .sign(secret);
    return token; // compact JWS
}

// 3.b Encrypt that JWS into a JWE
export async function encryptJwt(jws: string) {
    try {
        const joseLib = await initJose();
        const publicKey = await getEncPublicKey();

        // Debug: Log key information
        console.log("Public key loaded successfully");

        const jwe = await new joseLib.CompactEncrypt(
            new TextEncoder().encode(jws)
        )
            .setProtectedHeader({
                alg: "RSA-OAEP-256",
                enc: "A256GCM",
                kid: "key-2025-08",
                typ: "JWE",
            })
            .encrypt(publicKey);
        return jwe; // compact JWE string
    } catch (error) {
        console.error("Error in encryptJwt:", error);
        throw new Error(`JWT encryption failed: ${error.message}`);
    }
}

// 3.c Decrypt the JWE back to JWS, then verify
export async function decryptAndVerify(jwe: string) {
    const joseLib = await initJose();
    const privateKey = await getEncPrivateKey();
    const { plaintext } = await joseLib.compactDecrypt(jwe, privateKey);
    const jws = new TextDecoder().decode(plaintext);

    const secret = new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!);
    const { payload, protectedHeader } = await joseLib.jwtVerify(jws, secret, {
        issuer: "burning-sawals-api",
        audience: "burning-sawals",
    });
    return payload; // verified payload
}
