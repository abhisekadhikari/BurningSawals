/**
 * @fileoverview Zod validation schemas for genre-related endpoints.
 * Provides input validation and transformation for genre API requests.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

// src/validators/genere.validator.ts
import { z } from "zod";

/**
 * Collection of Zod validation schemas for genre operations
 *
 * @namespace genereSchemaValidator
 * @description
 * This object contains all validation schemas used by the genre endpoints.
 * Each schema validates and potentially transforms input data to ensure
 * data integrity and proper formatting.
 */
const genereSchemaValidator = {
    /**
     * Schema for creating or updating a genre
     * Validates the genre_name field in request body
     *
     * @type {z.ZodObject}
     * @property {string} genre_name - Required genre name, trimmed and non-empty
     *
     * @example
     * // Valid input:
     * { "genre_name": "Science Fiction" }
     *
     * // Invalid input (will fail validation):
     * { "genre_name": "" }        // Empty string
     * { "genre_name": "   " }     // Only whitespace
     * {}                          // Missing field
     */
    upsertGenere: z.object({
        genre_name: z.string().trim().min(1, "genre_name is required"),
    }),

    /**
     * Schema for validating genre ID in URL parameters
     * Validates and transforms the id parameter from string to number
     *
     * @type {z.ZodObject}
     * @property {string} id - Must be a valid positive integer string, gets transformed to number
     *
     * @example
     * // Valid input (URL param):
     * "123" -> transforms to 123
     *
     * // Invalid input (will fail validation):
     * "abc"     // Not a number
     * "-1"      // Negative number
     * "0"       // Zero
     * "12.5"    // Decimal number
     */
    idParam: z.object({
        id: z
            .string()
            .regex(/^\d+$/, "id must be a valid number")
            .transform((v) => Number(v)),
    }),
};

/**
 * Export the validation schemas for use in route middleware
 * @type {Object}
 */
export default genereSchemaValidator;
