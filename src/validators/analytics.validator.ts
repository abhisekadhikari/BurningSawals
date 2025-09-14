import { z } from "zod";

/**
 * @fileoverview Zod validation schemas for analytics-related endpoints.
 * Provides input validation and transformation for analytics API requests.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

/**
 * Schema for validating question ID in URL parameters
 * Validates and transforms the question_id parameter from string to number
 *
 * @type {z.ZodObject}
 * @property {string} question_id - Must be a valid positive integer string, gets transformed to number
 *
 * @example
 * // Valid input (URL param):
 * "123" -> transforms to 123
 *
 * // Invalid input (will fail validation):
 * "abc", "-1", "0", "12.5"
 */
const questionIdParam = z.object({
    question_id: z
        .string()
        .regex(/^\d+$/, "question_id must be a valid number")
        .transform((v) => Number(v)),
});

/**
 * Schema for creating or updating question interactions
 * Validates the interaction_type field in request body
 *
 * @type {z.ZodObject}
 * @property {string} interaction_type - Must be one of: 'like', 'super_like', 'dislike'
 *
 * @example
 * // Valid input:
 * { "interaction_type": "like" }
 * { "interaction_type": "super_like" }
 * { "interaction_type": "dislike" }
 *
 * // Invalid input (will fail validation):
 * { "interaction_type": "love" }     // Invalid type
 * { "interaction_type": "" }         // Empty string
 * {}                                  // Missing field
 */
const interactionBody = z.object({
    interaction_type: z.enum(["like", "super_like", "dislike"], {
        message: "interaction_type must be one of: like, super_like, dislike",
    }),
});

/**
 * Schema for validating pagination query parameters
 * Validates page and limit parameters for paginated endpoints
 *
 * @type {z.ZodObject}
 * @property {string} [page] - Optional page number (defaults to 1)
 * @property {string} [limit] - Optional limit per page (defaults to 20)
 *
 * @example
 * // Valid input:
 * { "page": "1", "limit": "10" }
 * { "page": "2" }                    // limit will use default
 * {}                                  // both will use defaults
 *
 * // Invalid input (will fail validation):
 * { "page": "0" }                    // Page must be positive
 * { "limit": "-5" }                  // Limit must be positive
 * { "page": "abc" }                  // Must be a number
 */
const paginationQuery = z.object({
    page: z
        .string()
        .regex(/^\d+$/, "page must be a valid number")
        .transform((v) => Number(v))
        .refine((n) => n > 0, "page must be positive")
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, "limit must be a valid number")
        .transform((v) => Number(v))
        .refine((n) => n > 0, "limit must be positive")
        .optional(),
});

/**
 * Schema for validating sorting parameters
 * Validates sort_by and sort_order parameters for sorted endpoints
 *
 * @type {z.ZodObject}
 * @property {string} [sort_by] - Optional field to sort by
 * @property {string} [sort_order] - Optional sort order (asc/desc)
 *
 * @example
 * // Valid input:
 * { "sort_by": "likes", "sort_order": "desc" }
 * { "sort_by": "total_interactions" }  // sort_order will use default
 * {}                                    // both will use defaults
 */
const sortingQuery = z.object({
    sort_by: z
        .enum(
            [
                "likes",
                "super_likes",
                "dislikes",
                "total_interactions",
                "created_at",
            ],
            {
                message:
                    "sort_by must be one of: likes, super_likes, dislikes, total_interactions, created_at",
            }
        )
        .optional(),
    sort_order: z
        .enum(["asc", "desc"], {
            message: "sort_order must be one of: asc, desc",
        })
        .optional(),
});

/**
 * Schema for validating top questions query parameters
 * Validates type and limit parameters for top questions endpoint
 *
 * @type {z.ZodObject}
 * @property {string} [type] - Optional type of interaction to sort by
 * @property {string} [limit] - Optional limit for number of results
 *
 * @example
 * // Valid input:
 * { "type": "likes", "limit": "5" }
 * { "type": "super_likes" }           // limit will use default
 * {}                                  // both will use defaults
 */
const topQuestionsQuery = z.object({
    type: z
        .enum(["likes", "super_likes", "dislikes", "total"], {
            message: "type must be one of: likes, super_likes, dislikes, total",
        })
        .optional(),
    limit: z
        .string()
        .regex(/^\d+$/, "limit must be a valid number")
        .transform((v) => Number(v))
        .refine((n) => n > 0, "limit must be positive")
        .optional(),
});

/**
 * Combined schema for question analytics queries
 * Combines pagination and sorting parameters
 *
 * @type {z.ZodObject}
 * @property {string} [page] - Page number for pagination
 * @property {string} [limit] - Items per page
 * @property {string} [sort_by] - Field to sort by
 * @property {string} [sort_order] - Sort order (asc/desc)
 */
const questionAnalyticsQuery = paginationQuery.merge(sortingQuery);

/**
 * Collection of analytics validation schemas
 * Export object containing all validation schemas for analytics operations
 *
 * @namespace analyticsValidator
 * @type {Object}
 * @property {z.ZodObject} questionIdParam - Validates question ID in URL parameters
 * @property {z.ZodObject} interactionBody - Validates interaction creation/update data
 * @property {z.ZodObject} paginationQuery - Validates pagination parameters
 * @property {z.ZodObject} sortingQuery - Validates sorting parameters
 * @property {z.ZodObject} topQuestionsQuery - Validates top questions query parameters
 * @property {z.ZodObject} questionAnalyticsQuery - Combined pagination and sorting schema
 */
export default {
    questionIdParam,
    interactionBody,
    paginationQuery,
    sortingQuery,
    topQuestionsQuery,
    questionAnalyticsQuery,
};
