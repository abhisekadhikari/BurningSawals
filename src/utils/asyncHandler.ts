/**
 * @fileoverview Async handler wrapper for Express route handlers.
 * Provides automatic error handling for async/await functions in Express routes.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Higher-order function that wraps Express route handlers to automatically catch and forward errors
 * Eliminates the need for try-catch blocks in every async route handler
 *
 * @param {RequestHandler} controller - The async Express route handler function
 * @returns {RequestHandler} Wrapped function that automatically handles promise rejections
 *
 * @example
 * // Without asyncHandler (manual error handling):
 * app.get('/users', async (req, res, next) => {
 *   try {
 *     const users = await userService.getAll();
 *     res.json(users);
 *   } catch (error) {
 *     next(error);
 *   }
 * });
 *
 * // With asyncHandler (automatic error handling):
 * app.get('/users', asyncHandler(async (req, res) => {
 *   const users = await userService.getAll();
 *   res.json(users);
 * }));
 *
 * @description
 * This utility function wraps async Express route handlers and automatically catches
 * any thrown errors or rejected promises, then forwards them to Express's error
 * handling middleware using next(error). This prevents unhandled promise rejections
 * and reduces boilerplate code in route handlers.
 */
const asyncHandler =
    (controller: RequestHandler) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await controller(req, res, next);
        } catch (error) {
            next(error);
        }
    };

export default asyncHandler;
