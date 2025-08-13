/**
 * @fileoverview Controller for managing question types in the Burning Sawals application.
 * Handles CRUD operations for question types and their relationships with genres.
 * Supports bulk operations for linking/unlinking genres to question types.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { Prisma } from "@prisma/client";

/**
 * Type definition for question type request body
 * @typedef {Object} QTypeBody
 * @property {string} [type_name] - The name of the question type
 * @property {number[]} [genre_ids] - Array of genre IDs to associate with the question type
 */
type QTypeBody = { type_name?: string; genre_ids?: number[] };

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
 * @param {string} v - The value to clean
 * @returns {string} The cleaned name
 */
const cleanName = (v: string) => v.trim();

/**
 * Parses an array and extracts valid positive integer IDs
 * @param {unknown} arr - The array to parse
 * @returns {number[]} Array of valid positive integers
 */
const parseIdArray = (arr: unknown): number[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
};

/**
 * Creates a new question type with optional genre associations
 *
 * @route POST /api/question-types
 * @description Creates a new question type and optionally links it to specified genres using a database transaction.
 * @param {Request<{}, {}, QTypeBody>} req - Express request object with question type data in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with created question type and associated genres
 *
 * @example
 * // Request body:
 * {
 *   "type_name": "Multiple Choice",
 *   "genre_ids": [1, 2, 3]
 * }
 *
 * // Success response (201):
 * {
 *   "statusCode": 201,
 *   "message": "question type created successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "Multiple Choice",
 *     "questionTypeGenres": [
 *       {
 *         "genre": {
 *           "id": 1,
 *           "name": "Science Fiction"
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * @throws {400} When type_name is missing or invalid
 * @throws {409} When question type name already exists
 */
export const createQuestionType = asyncHandler(
    async (req: Request<{}, {}, QTypeBody>, res: Response) => {
        const { type_name, genre_ids } = req.body || {};

        if (!type_name || typeof type_name !== "string" || !type_name.trim()) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "type_name is required", null));
        }

        const genreIds = parseIdArray(genre_ids);

        try {
            const result = await prisma.$transaction(async (tx) => {
                const created = await tx.questionType.create({
                    data: { name: cleanName(type_name) },
                    select: { id: true, name: true },
                });

                if (genreIds.length > 0) {
                    await tx.questionTypeGenre.createMany({
                        data: genreIds.map((gid) => ({
                            questionTypeId: created.id,
                            genreId: gid,
                        })),
                        skipDuplicates: true,
                    });
                }

                const full = await tx.questionType.findUnique({
                    where: { id: created.id },
                    select: {
                        id: true,
                        name: true,
                        questionTypeGenres: {
                            select: {
                                genre: { select: { id: true, name: true } },
                            },
                        },
                    },
                });

                return full!;
            });

            return res
                .status(201)
                .json(
                    ApiResponse.success(
                        201,
                        "question type created successfully",
                        result
                    )
                );
        } catch (err: unknown) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
            ) {
                return res.status(409).json(
                    ApiResponse.success(409, "question type already exists", {
                        type_name: cleanName(type_name!),
                    })
                );
            }
            throw err;
        }
    }
);

/**
 * Updates/renames a question type
 *
 * @route PATCH /api/question-types/:id
 * @description Updates the name of an existing question type. Handles duplicate names and missing records.
 * @param {Request<{ id: string }, {}, QTypeBody>} req - Express request object with ID in params and new name in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated question type data or error
 *
 * @example
 * // Request body:
 * {
 *   "type_name": "True or False"
 * }
 *
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "question type renamed successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "True or False"
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid or type_name is missing
 * @throws {404} When question type with specified ID is not found
 * @throws {409} When the new question type name already exists
 */
export const renameQuestionType = asyncHandler(
    async (req: Request<{ id: string }, {}, QTypeBody>, res: Response) => {
        const id = parseId(req.params.id);
        const { type_name } = req.body || {};

        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }
        if (!type_name || typeof type_name !== "string" || !type_name.trim()) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "type_name is required", null));
        }

        try {
            const updated = await prisma.questionType.update({
                where: { id },
                data: { name: cleanName(type_name) },
                select: { id: true, name: true },
            });

            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "question type renamed successfully",
                        updated
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return res
                        .status(404)
                        .json(
                            ApiResponse.success(
                                404,
                                "question type not found",
                                { id }
                            )
                        );
                }
                if (err.code === "P2002") {
                    return res.status(409).json(
                        ApiResponse.success(
                            409,
                            "question type name already in use",
                            {
                                type_name: cleanName(type_name),
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
 * Deletes a question type by ID
 *
 * @route DELETE /api/question-types/:id
 * @description Deletes a question type by its ID. Handles foreign key constraints and missing records.
 * @param {Request<{ id: string }>} req - Express request object with question type ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response confirming deletion or error
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "question type deleted successfully",
 *   "data": {
 *     "id": 1
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid
 * @throws {404} When question type with specified ID is not found
 * @throws {409} When question type cannot be deleted due to existing references
 */
export const deleteQuestionType = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        try {
            await prisma.questionType.delete({ where: { id } });
            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "question type deleted successfully",
                        { id }
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return res
                        .status(404)
                        .json(
                            ApiResponse.success(
                                404,
                                "question type not found",
                                { id }
                            )
                        );
                }
                if (err.code === "P2003") {
                    // unlikely with explicit join & cascade, but mapped just in case
                    return res
                        .status(409)
                        .json(
                            ApiResponse.success(
                                409,
                                "cannot delete question type due to existing references",
                                { id }
                            )
                        );
                }
            }
            throw err;
        }
    }
);

/**
 * Retrieves all question types with their associated genres
 *
 * @route GET /api/question-types
 * @description Fetches all question types with their associated genres, ordered by name.
 * @param {Request} _req - Express request object (unused)
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with array of question types
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "question types fetched successfully",
 *   "data": [
 *     {
 *       "id": 1,
 *       "name": "Multiple Choice",
 *       "questionTypeGenres": [
 *         {
 *           "genre": {
 *             "id": 1,
 *             "name": "Science Fiction"
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
export const getQuestionTypes = asyncHandler(
    async (_req: Request, res: Response) => {
        const items = await prisma.questionType.findMany({
            orderBy: { name: "asc" },
            select: {
                id: true,
                name: true,
                questionTypeGenres: {
                    select: { genre: { select: { id: true, name: true } } },
                },
            },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "question types fetched successfully",
                    items
                )
            );
    }
);

/**
 * Retrieves a single question type by ID with associated genres
 *
 * @route GET /api/question-types/:id
 * @description Fetches a specific question type by its ID with associated genres.
 * @param {Request<{ id: string }>} req - Express request object with question type ID in params
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with question type data or error
 *
 * @example
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "question type fetched successfully",
 *   "data": {
 *     "id": 1,
 *     "name": "Multiple Choice",
 *     "questionTypeGenres": [
 *       {
 *         "genre": {
 *           "id": 1,
 *           "name": "Science Fiction"
 *         }
 *       }
 *     ]
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid
 * @throws {404} When question type with specified ID is not found
 */
export const getQuestionTypeById = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        const item = await prisma.questionType.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                questionTypeGenres: {
                    select: { genre: { select: { id: true, name: true } } },
                },
            },
        });

        if (!item) {
            return res
                .status(404)
                .json(
                    ApiResponse.success(404, "question type not found", { id })
                );
        }

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "question type fetched successfully",
                    item
                )
            );
    }
);

/**
 * Associates multiple genres with a question type
 *
 * @route POST /api/question-types/:id/genres
 * @description Bulk operation to attach multiple genres to a question type. Uses skipDuplicates to avoid conflicts.
 * @param {Request<{ id: string }, {}, { genre_ids?: number[] }>} req - Express request object with question type ID in params and genre IDs in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated question type and associated genres
 *
 * @example
 * // Request body:
 * {
 *   "genre_ids": [1, 2, 3]
 * }
 *
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genres linked to question type",
 *   "data": {
 *     "id": 1,
 *     "name": "Multiple Choice",
 *     "questionTypeGenres": [...]
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid or genre_ids is empty/invalid
 */
export const addGenresToQuestionType = asyncHandler(
    async (
        req: Request<{ id: string }, {}, { genre_ids?: number[] }>,
        res: Response
    ) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        const ids = parseIdArray(req.body?.genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.success(
                        400,
                        "genre_ids must be a non-empty number[]",
                        null
                    )
                );
        }

        await prisma.questionTypeGenre.createMany({
            data: ids.map((gid) => ({ questionTypeId: id, genreId: gid })),
            skipDuplicates: true,
        });

        const item = await prisma.questionType.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                questionTypeGenres: {
                    select: { genre: { select: { id: true, name: true } } },
                },
            },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(200, "genres linked to question type", item)
            );
    }
);

/**
 * Removes multiple genres from a question type
 *
 * @route DELETE /api/question-types/:id/genres
 * @description Bulk operation to detach multiple genres from a question type.
 * @param {Request<{ id: string }, {}, { genre_ids?: number[] }>} req - Express request object with question type ID in params and genre IDs in body
 * @param {Response} res - Express response object
 * @returns {Promise<Response>} JSON response with updated question type and remaining associated genres
 *
 * @example
 * // Request body:
 * {
 *   "genre_ids": [1, 2]
 * }
 *
 * // Success response (200):
 * {
 *   "statusCode": 200,
 *   "message": "genres unlinked from question type",
 *   "data": {
 *     "id": 1,
 *     "name": "Multiple Choice",
 *     "questionTypeGenres": [...]
 *   }
 * }
 *
 * @throws {400} When ID parameter is invalid or genre_ids is empty/invalid
 */
export const removeGenresFromQuestionType = asyncHandler(
    async (
        req: Request<{ id: string }, {}, { genre_ids?: number[] }>,
        res: Response
    ) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        const ids = parseIdArray(req.body?.genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.success(
                        400,
                        "genre_ids must be a non-empty number[]",
                        null
                    )
                );
        }

        await prisma.questionTypeGenre.deleteMany({
            where: { questionTypeId: id, genreId: { in: ids } },
        });

        const item = await prisma.questionType.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                questionTypeGenres: {
                    select: { genre: { select: { id: true, name: true } } },
                },
            },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "genres unlinked from question type",
                    item
                )
            );
    }
);
