/**
 * @fileoverview Zod validation schemas for question type related endpoints.
 * Provides input validation and transformation for question type API requests.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { z } from "zod";

/**
 * Schema for validating question type ID in URL parameters
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
 * "abc", "-1", "0", "12.5"
 */
const idParam = z.object({
    id: z.string().regex(/^\d+$/, "id must be a number").transform(Number),
});

/**
 * Schema for creating a new question type
 * Validates type_name and optional genre_ids array
 *
 * @type {z.ZodObject}
 * @property {string} type_name - Required question type name, trimmed and non-empty
 * @property {number[]} [genre_ids] - Optional array of positive integer genre IDs
 *
 * @example
 * // Valid input:
 * {
 *   "type_name": "Multiple Choice",
 *   "genre_ids": [1, 2, 3]
 * }
 *
 * // Also valid (genre_ids is optional):
 * {
 *   "type_name": "True or False"
 * }
 */
const create = z.object({
    type_name: z.string().trim().min(1, "type_name is required"),
    genre_ids: z.array(z.number().int().positive()).optional(),
});

/**
 * Schema for renaming a question type
 * Validates only the type_name field for update operations
 *
 * @type {z.ZodObject}
 * @property {string} type_name - Required question type name, trimmed and non-empty
 *
 * @example
 * // Valid input:
 * {
 *   "type_name": "Updated Question Type Name"
 * }
 */
const rename = z.object({
    type_name: z.string().trim().min(1, "type_name is required"),
});

/**
 * Schema for bulk genre operations (add/remove genres from question types)
 * Validates genre_ids array for bulk link/unlink operations
 *
 * @type {z.ZodObject}
 * @property {number[]} genre_ids - Required non-empty array of positive integer genre IDs
 *
 * @example
 * // Valid input:
 * {
 *   "genre_ids": [1, 2, 3, 4]
 * }
 *
 * // Invalid input (will fail validation):
 * { "genre_ids": [] }           // Empty array
 * { "genre_ids": [-1, 0] }      // Negative or zero values
 * { "genre_ids": [1.5, 2.7] }   // Decimal numbers
 */
const genreIdsBody = z.object({
    genre_ids: z
        .array(z.number().int().positive())
        .nonempty("genre_ids must be a non-empty array"),
});

/**
 * Collection of question type validation schemas
 * Export object containing all validation schemas for question type operations
 *
 * @namespace questionTypesValidator
 * @type {Object}
 * @property {z.ZodObject} idParam - Validates question type ID in URL parameters
 * @property {z.ZodObject} create - Validates question type creation data
 * @property {z.ZodObject} rename - Validates question type rename data
 * @property {z.ZodObject} genreIdsBody - Validates genre IDs for bulk operations
 */
export default { idParam, create, rename, genreIdsBody };
