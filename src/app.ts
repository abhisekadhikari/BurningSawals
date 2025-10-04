/**
 * @fileoverview Main Express application entry point for the Burning Sawals Node.js API.
 * This file sets up the Express server with middleware, routes, and error handling.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import express, { NextFunction, Request, Response } from "express";
import passport from "passport";
import genereRouter from "./routes/genere.routes";
import questionTypeRouter from "./routes/questionTypes.routes";
import { ApiResponse } from "./utils/ApiResponse";
import questionRouer from "./routes/question.routes";
import authRouter from "./routes/auth.routes";
import emailAuthRouter from "./routes/emailAuth.routes";
import analyticsRouter from "./routes/analytics.routes";
import monitoringRouter from "./routes/monitoring.routes";
import "./services/auth.service";
import { AuthClaims, requireAuth } from "./middlewares/auth.middleware";
import cors from "cors";

// Validate required environment variables at startup
const validateEnvironmentVariables = () => {
    const requiredVars = [
        "JWT_SIGNING_SECRET",
        "JWT_ENC_PUBLIC_JWK",
        "JWT_ENC_PRIVATE_JWK",
        "DATABASE_URL",
    ];

    const missingVars = requiredVars.filter((varName) => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error("Missing required environment variables:", missingVars);
        throw new Error(
            `Missing required environment variables: ${missingVars.join(", ")}`
        );
    }

    console.log("✅ All required environment variables are present");
};

// Validate environment variables at startup
validateEnvironmentVariables();

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Burning Sawals API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// Debug endpoint for environment variables (remove in production)
app.get("/api/debug/env", (req, res) => {
    const envInfo = {
        JWT_SIGNING_SECRET: {
            exists: !!process.env.JWT_SIGNING_SECRET,
            length: process.env.JWT_SIGNING_SECRET?.length || 0,
        },
        JWT_ENC_PUBLIC_JWK: {
            exists: !!process.env.JWT_ENC_PUBLIC_JWK,
            length: process.env.JWT_ENC_PUBLIC_JWK?.length || 0,
            hasKty: process.env.JWT_ENC_PUBLIC_JWK?.includes('"kty"') || false,
        },
        JWT_ENC_PRIVATE_JWK: {
            exists: !!process.env.JWT_ENC_PRIVATE_JWK,
            length: process.env.JWT_ENC_PRIVATE_JWK?.length || 0,
            hasKty: process.env.JWT_ENC_PRIVATE_JWK?.includes('"kty"') || false,
        },
        DATABASE_URL: {
            exists: !!process.env.DATABASE_URL,
            length: process.env.DATABASE_URL?.length || 0,
        },
    };

    res.status(200).json({
        message: "Environment variables debug info",
        envInfo,
    });
});

// passport init.
app.use(passport.initialize());

// API Routes
app.use("/api/genres", genereRouter);
app.use("/api/question-types", questionTypeRouter);
app.use("/api/questions", questionRouer);
app.use("/api/analytics", analyticsRouter);
app.use("/api/monitoring", monitoringRouter);
app.use("/api", authRouter);
app.use("/api", emailAuthRouter);

app.get("/test", requireAuth, (req, res) => {
    return res.status(200).json({
        user: req.user,
    });
});

/**
 * Global error handling middleware
 * Catches any unhandled errors and returns a standardized error response
 *
 * @param {any} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {Response} JSON error response
 */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    return res
        .status(500)
        .json(ApiResponse.error(500, "Unchaced Exception", err.message));
});

/**
 * Start the Express server
 * Listens on port 8080 and logs a startup message
 */
const PORT = process.env.PORT ?? 8080;
const NODE_ENV = process.env.NODE_ENV ?? "development";

// Only start server if not in Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log("🚀 Server started successfully");
        console.log(`📡 Listening on: http://localhost:${PORT}`);
        console.log(`🌍 Environment: ${NODE_ENV}`);
    });
}

// Export for Vercel
export default app;
