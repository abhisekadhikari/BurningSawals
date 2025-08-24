/**
 * @fileoverview Zod validation middleware for Express routes.
 * Provides request validation using Zod schemas for body, params, and query parameters.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { ZodObject } from "zod";

/**
 * Middleware factory function that creates Zod validation middleware for Express routes
 *
 * @param {ZodObject<any>} schema - Zod schema object to validate against
 * @param {"body" | "params" | "query"} [source="body"] - The part of the request to validate
 * @returns {Function} Express middleware function
 *
 * @example
 * // Validate request body
 * router.post('/users', validator(userCreateSchema), createUser);
 *
 * // Validate URL parameters
 * router.get('/users/:id', validator(userIdSchema, 'params'), getUserById);
 *
 * // Validate query parameters
 * router.get('/users', validator(userSearchSchema, 'query'), searchUsers);
 *
 * @description
 * This middleware validates the specified part of the request (body, params, or query)
 * against the provided Zod schema. If validation fails, it returns a 400 error with
 * detailed validation error messages. If validation succeeds, it calls next() to
 * continue to the next middleware or route handler.
 *
 * The validated and potentially transformed data is available in req[source] after
 * successful validation (Zod can transform data during validation).
 */
import { ZodError } from "zod";
import { Request, Response, NextFunction } from "express";

export const validator =
    (schema: ZodObject<any>, source: "body" | "params" | "query" = "body") =>
    (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req[source]);
            next();
        } catch (err: unknown) {
            if (err instanceof ZodError) {
                const formattedErrors = err.issues.map((e) => ({
                    path: e.path.join("."), // e.g. "user.email"
                    message: e.message,
                }));

                res.status(400).json({
                    status: 400,
                    message: "Validation error",
                    errors: formattedErrors,
                });
            } else {
                res.status(400).json({
                    status: 400,
                    message: "Validation error",
                    errors: [{ path: "", message: "Unknown validation error" }],
                });
            }
        }
    };
