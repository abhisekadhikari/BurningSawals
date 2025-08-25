import {
    SignJWT,
    CompactEncrypt,
    jwtVerify,
    importJWK,
    JWTPayload,
    JWK,
} from "jose";
import { getEncPublicKey, getEncPrivateKey } from "../config/crypto/config";

// 3.a Sign (JWS)
export async function makeSignedJwt(payload: JWTPayload) {
    const secret = new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!); // symmetric HMAC (HS256)
    const token = await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .setIssuer("your-api")
        .setAudience("your-web")
        .sign(secret);
    return token; // compact JWS
}

// 3.b Encrypt that JWS into a JWE
export async function encryptJwt(jws: string) {
    const publicKey = await getEncPublicKey();
    const jwe = await new CompactEncrypt(new TextEncoder().encode(jws))
        .setProtectedHeader({
            alg: "RSA-OAEP-256",
            enc: "A256GCM",
            kid: "key-2025-08",
            typ: "JWE",
        })
        .encrypt(publicKey);
    return jwe; // compact JWE string
}

// 3.c Decrypt the JWE back to JWS, then verify
export async function decryptAndVerify(jwe: string) {
    const privateKey = await getEncPrivateKey();
    const { plaintext } = await (
        await import("jose")
    ).compactDecrypt(jwe, privateKey);
    const jws = new TextDecoder().decode(plaintext);

    const secret = new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!);
    const { payload, protectedHeader } = await jwtVerify(jws, secret, {
        issuer: "burning-sawals-api",
        audience: "burning-sawals",
    });
    return payload; // verified payload
}
