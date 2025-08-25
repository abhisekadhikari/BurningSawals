import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { decryptAndVerify } from "../utils/tokens";

export type AuthClaims = {
    sub: string;
    email?: string;
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
    role?: string | string[];
};

declare global {
    namespace Express {
        interface Request {
            auth?: AuthClaims;
        }
    }
}

/** Extract JWE from Authorization header or cookie `et` */
export function getTokenFromRequest(req: Request): string | undefined {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith("Bearer ")) return auth.slice(7);
    return undefined;
}

/** Core auth middleware: decrypt JWE, verify JWT, attach claims */
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const jwe = getTokenFromRequest(req);
        if (!jwe) return res.status(401).json({ error: "Missing token" });

        // 1) Decrypt JWE -> original signed JWT
        const signedJwt = await decryptAndVerify(jwe);

        // 2) Verify JWT (HS256). Add issuer/audience if you set them when signing.
        const claims = jwt.verify(signedJwt, process.env.JWT_SIGNING_SECRET!, {
            audience: "burning-sawals",
            issuer: "burning-sawals-api",
        }) as AuthClaims;

        req.auth = claims;
        return next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

/** role guard */
export function requireRole(allowed: string | string[]) {
    const allowedSet = new Set(Array.isArray(allowed) ? allowed : [allowed]);
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.auth?.role;
        const roles = Array.isArray(role) ? role : role ? [role] : [];
        const ok = roles.some((r) => allowedSet.has(r));
        if (!ok) return res.status(403).json({ error: "Forbidden" });
        return next();
    };
}
