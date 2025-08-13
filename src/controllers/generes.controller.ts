/**
 * @fileoverview Controller for managing genres in the Burning Sawals application.
 * Handles CRUD operations for genres including creation, retrieval, updating, and deletion.
 * All endpoints support proper error handling and return standardized API responses.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

// src/controllers/generes.controller.ts
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { Prisma } from "@prisma/client";

/**
 * Type definition for genre request body
 * @typedef {Object} GenereBody
 * @property {string} [genre_name] - The name of the genre
 */
type GenereBody = { genre_name?: string };

/**
 * Parses a string to a positive integer ID
 * @param {string} raw - The raw string to parse
 * @returns {number | null} The parsed ID or null if invalid
 */
const parseId = (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
};

/**
 * Cleans and trims a name string
 * @param {string} name - The name to clean
 * @returns {string} The cleaned name
 */
const cleanName = (name: string) => name.trim();

/**
 * Creates a new genre
 *
 * @route POST /api/genres
 * @description Creates a new genre with the provided name. Handles duplicate name conflicts.
 * @param {Request<{}, {}, GenereBody>} req - Express request object with genre data in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created genre data or error
 *
 * @example
 * // Request body:
 * {
 *   "genre_name": "Science Fiction"
 * }
 *
 * // Success response (201):
 * {
 *   "statusCode": 201,
 *   "message": "genre created successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "Science Fiction",
 *     "createdAt": "2025-01-01T00:00:00.000Z",
 *     "updatedAt": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 */
export const createGenere = asyncHandler(
    async (req: Request<{}, {}, GenereBody>, res: Response) => {
        const { genre_name } = req.body || {};
        if (
            !genre_name ||
            typeof genre_name !== "string" ||
            !genre_name.trim()
        ) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "genre_name is required", null));
        }

        try {
            const created = await prisma.genre.create({
                data: { name: cleanName(genre_name) },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return res
                .status(201)
                .json(
                    ApiResponse.success(
                        201,
                        "genre created successfully",
                        created
                    )
                );
        } catch (err: unknown) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
            ) {
                return res.status(409).json(
                    ApiResponse.success(409, "genre already exists", {
                        genre_name: cleanName(genre_name),
                    })
                );
            }
            throw err;
        }
    }
);

/**
 * Deletes a genre by ID
 *
 * @route DELETE /api/genres/:id
 * @description Deletes a genre by its ID. Handles foreign key constraints and missing records.
 * @param {Request<{ id: string }>} req - Express request object with genre ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming deletion or error
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genre deleted successfully",
 *   "data": {
 *     "id": 1
 *   }
 * }
 *
 * @throws {404} When genre with specified ID is not found
 * @throws {409} When genre cannot be deleted due to existing references
 */
export const deleteGenere = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        try {
            await prisma.genre.delete({ where: { id } });
            return res.status(200).json(
                ApiResponse.success(200, "genre deleted successfully", {
                    id,
                })
            );
            // or 204 No Content if you prefer
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return res
                        .status(404)
                        .json(
                            ApiResponse.success(404, "genre not found", { id })
                        );
                }
                if (err.code === "P2003") {
                    return res.status(409).json(
                        ApiResponse.success(
                            409,
                            "cannot delete genre due to existing references",
                            {
                                id,
                                hint: "detach this genre from questions/question types first, or enable cascading in the DB",
                            }
                        )
                    );
                }
            }
            throw err;
        }
    }
);

/**
 * Updates/renames a genre
 *
 * @route PATCH /api/genres/:id
 * @description Updates the name of an existing genre. Handles duplicate names and missing records.
 * @param {Request<{ id: string }, {}, GenereBody>} req - Express request object with ID in params and new name in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated genre data or error
 *
 * @example
 * // Request body:
 * {
 *   "genre_name": "Updated Genre Name"
 * }
 *
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genre renamed successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "Updated Genre Name",
 *     "createdAt": "2025-01-01T00:00:00.000Z",
 *     "updatedAt": "2025-01-01T00:00:00.000Z"
 *   }
 * }
 *
 * @throws {404} When genre with specified ID is not found
 * @throws {409} When the new genre name already exists
 */
export const renameGenere = asyncHandler(
    async (req: Request<{ id: string }, {}, GenereBody>, res: Response) => {
        const id = parseId(req.params.id);
        const { genre_name } = req.body || {};

        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }
        if (
            !genre_name ||
            typeof genre_name !== "string" ||
            !genre_name.trim()
        ) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "genre_name is required", null));
        }

        try {
            const updated = await prisma.genre.update({
                where: { id },
                data: { name: cleanName(genre_name) },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "genre renamed successfully",
                        updated
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return res
                        .status(404)
                        .json(
                            ApiResponse.success(404, "genre not found", { id })
                        );
                }
                if (err.code === "P2002") {
                    return res.status(409).json(
                        ApiResponse.success(409, "genre name already in use", {
                            genre_name: cleanName(genre_name),
                        })
                    );
                }
            }
            throw err;
        }
    }
);

/**
 * Retrieves all genres
 *
 * @route GET /api/genres
 * @description Fetches all genres with their associated question types and questions, ordered by name.
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {Promise<void>} JSON response with array of genres
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genres fetched successfully",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Science Fiction",
 *       "createdAt": "2025-01-01T00:00:00.000Z",
 *       "updatedAt": "2025-01-01T00:00:00.000Z",
 *       "questionTypeGenres": [...],
 *       "questionGenres": [...]
 *     }
 *   ]
 * }
 */
export const getGeneres = asyncHandler(async (_req, res) => {
    const genres = await prisma.genre.findMany({
        orderBy: { name: "asc" },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            questionTypeGenres: {
                select: { questionType: { select: { id: true, name: true } } },
            },
            // ⬇️ add this here
            questionGenres: {
                select: {
                    question: { select: { id: true, text: true } },
                },
            },
        },
    });

    res.status(200).json(
        ApiResponse.success(200, "genres fetched successfully", genres)
    );
});

/**
 * Retrieves a single genre by ID
 *
 * @route GET /api/genres/:id
 * @description Fetches a specific genre by its ID with associated question types and questions.
 * @param {Request} req - Express request object with genre ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with genre data or error
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genre fetched successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "Science Fiction",
 *     "createdAt": "2025-01-01T00:00:00.000Z",
 *     "updatedAt": "2025-01-01T00:00:00.000Z",
 *     "questionTypeGenres": [...],
 *     "questionGenres": [...]
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid
 * @throws {404} When genre with specified ID is not found
 */
export const getGenereById = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id)
        return res
            .status(400)
            .json(ApiResponse.success(400, "invalid id parameter", null));

    const genre = await prisma.genre.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            createdAt: true,
            updatedAt: true,
            questionTypeGenres: {
                select: { questionType: { select: { id: true, name: true } } },
            },
            // ⬇️ add this here
            questionGenres: {
                select: {
                    question: { select: { id: true, text: true } },
                },
            },
        },
    });

    if (!genre)
        return res
            .status(404)
            .json(ApiResponse.success(404, "genre not found", { id }));
    res.status(200).json(
        ApiResponse.success(200, "genre fetched successfully", genre)
    );
});
