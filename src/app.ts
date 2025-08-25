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
import "./services/auth.service";
import { AuthClaims, requireAuth } from "./middlewares/auth.middleware";

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// passport init.
app.use(passport.initialize());

// API Routes
app.use("/api/genres", genereRouter);
app.use("/api/question-types", questionTypeRouter);
app.use("/api/questions", questionRouer);
app.use("/api", authRouter);

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

app.listen(PORT, () => {
    console.log("🚀 Server started successfully");
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
});
