import { importJWK, JWK } from "jose";

// Load from secret manager / env
const PUB_JWK: JWK = JSON.parse(process.env.JWT_ENC_PUBLIC_JWK!);
const PRIV_JWK: JWK = JSON.parse(process.env.JWT_ENC_PRIVATE_JWK!);

export const getEncPublicKey = () => importJWK(PUB_JWK, "RSA-OAEP-256");
export const getEncPrivateKey = () => importJWK(PRIV_JWK, "RSA-OAEP-256");
