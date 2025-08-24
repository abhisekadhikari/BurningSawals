// src/controllers/genres.controller.ts
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { Prisma } from "@prisma/client";

/** Request body types */
type CreateGenreBody = { genre_name?: string; type_id?: number };
type UpdateGenreBody = { genre_name?: string };

/** Parse positive int -> number | null */
const parseId = (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
};

/** Trim helper */
const cleanName = (s: string) => s.trim();

/** BigInt-safe mapping for JSON */
const toGenreDTO = (g: {
    genre_id: bigint;
    type_id: bigint;
    name: string;
    created_at: Date | null;
    updated_at: Date | null;
}) => ({
    genre_id: Number(g.genre_id),
    type_id: Number(g.type_id),
    name: g.name,
    created_at: g.created_at,
    updated_at: g.updated_at,
});

const toGenreWithRelsDTO = (g: any) => ({
    genre_id: Number(g.genre_id),
    type_id: Number(g.type_id),
    name: g.name,
    created_at: g.created_at,
    updated_at: g.updated_at,
    // questions via mapping table
    questions:
        g.question_genre_mappings?.map((m: any) => ({
            question_id: Number(m.questions.question_id),
            question: m.questions.question,
        })) ?? [],
    // type info
    type: g.question_types
        ? {
              type_id: Number(g.question_types.type_id),
              type_name: g.question_types.type_name,
          }
        : null,
});

/**
 * POST /api/genres
 * Body: { genre_name: string, type_id: number }
 */
export const createGenre = asyncHandler(
    async (req: Request<{}, {}, CreateGenreBody>, res: Response) => {
        const { genre_name, type_id } = req.body || {};
        if (
            !genre_name ||
            typeof genre_name !== "string" ||
            !genre_name.trim()
        ) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "genre_name is required", null));
        }
        if (!type_id || !Number.isFinite(type_id) || type_id <= 0) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "type_id is required", null));
        }

        try {
            const created = await prisma.genres.create({
                data: {
                    name: cleanName(genre_name),
                    type_id: BigInt(type_id),
                },
                select: {
                    genre_id: true,
                    type_id: true,
                    name: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            return res
                .status(201)
                .json(
                    ApiResponse.success(
                        201,
                        "genre created successfully",
                        toGenreDTO(created)
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    // unique (type_id, name) conflict if you added that unique key
                    return res.status(409).json(
                        ApiResponse.success(409, "genre already exists", {
                            type_id,
                            genre_name: cleanName(genre_name),
                        })
                    );
                }
                if (err.code === "P2003") {
                    // FK to question_types failed
                    return res.status(400).json(
                        ApiResponse.success(
                            400,
                            "invalid type_id (FK failed)",
                            {
                                type_id,
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
 * DELETE /api/genres/:id
 */
export const deleteGenre = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid id parameter", null));
        }

        try {
            await prisma.genres.delete({ where: { genre_id: BigInt(id) } });
            return res
                .status(200)
                .json(
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
                    // if you *didn't* enable ON DELETE CASCADE and mappings exist
                    return res.status(409).json(
                        ApiResponse.success(
                            409,
                            "cannot delete genre due to existing references",
                            {
                                id,
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
 * PATCH /api/genres/:id
 * Body: { genre_name: string }
 */
export const renameGenre = asyncHandler(
    async (
        req: Request<{ id: string }, {}, UpdateGenreBody>,
        res: Response
    ) => {
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
            const updated = await prisma.genres.update({
                where: { genre_id: BigInt(id) },
                data: { name: cleanName(genre_name) },
                select: {
                    genre_id: true,
                    type_id: true,
                    name: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "genre renamed successfully",
                        toGenreDTO(updated)
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
 * GET /api/genres
 */
export const getGenres = asyncHandler(async (_req, res) => {
    const rows = await prisma.genres.findMany({
        orderBy: { name: "asc" },
        select: {
            genre_id: true,
            type_id: true,
            name: true,
            created_at: true,
            updated_at: true,
            question_types: {
                select: { type_id: true, type_name: true },
            },
            question_genre_mappings: {
                select: {
                    questions: {
                        select: { question_id: true, question: true },
                    },
                },
            },
        },
    });

    const data = rows.map(toGenreWithRelsDTO);
    res.status(200).json(
        ApiResponse.success(200, "genres fetched successfully", data)
    );
});

/**
 * GET /api/genres/:id
 */
export const getGenreById = asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
        return res
            .status(400)
            .json(ApiResponse.success(400, "invalid id parameter", null));
    }

    const g = await prisma.genres.findUnique({
        where: { genre_id: BigInt(id) },
        select: {
            genre_id: true,
            type_id: true,
            name: true,
            created_at: true,
            updated_at: true,
            question_types: {
                select: { type_id: true, type_name: true },
            },
            question_genre_mappings: {
                select: {
                    questions: {
                        select: { question_id: true, question: true },
                    },
                },
            },
        },
    });

    if (!g) {
        return res
            .status(404)
            .json(ApiResponse.success(404, "genre not found", { id }));
    }

    res.status(200).json(
        ApiResponse.success(
            200,
            "genre fetched successfully",
            toGenreWithRelsDTO(g)
        )
    );
});
