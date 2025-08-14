/**
 * @fileoverview Main Express application entry point for the Burning Sawals Node.js API.
 * This file sets up the Express server with middleware, routes, and error handling.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import express, { NextFunction, Request, Response } from "express";
import genereRouter from "./routes/genere.routes";
import questionTypeRouter from "./routes/questionTypes.routes";
import { ApiResponse } from "./utils/ApiResponse";
import questionRouer from "./routes/question.routes";

/**
 * Express application instance
 * @type {express.Application}
 */
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes
app.use("/api/genres", genereRouter);
app.use("/api/question-types", questionTypeRouter);
app.use("/api/questions", questionRouer);

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
app.listen(8080, () => {
    console.log("Server Started.");
});
