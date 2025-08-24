// src/controllers/questionTypes.controller.ts
import { Request, Response } from "express";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { Prisma } from "@prisma/client";

type QTypeBody = { type_name?: string; genre_ids?: number[] };

const parseId = (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
};

const cleanName = (v: string) => v.trim();

const parseIdArray = (arr: unknown): number[] =>
    Array.isArray(arr)
        ? arr.map(Number).filter((n) => Number.isFinite(n) && n > 0)
        : [];

/** DTO helpers to fix BigInt serialization */
const toQuestionTypeDTO = (qt: any) => ({
    type_id: Number(qt.type_id),
    type_name: qt.type_name,
    created_at: qt.created_at,
    updated_at: qt.updated_at,
    genres: qt.genres
        ? qt.genres.map((g: any) => ({
              genre_id: Number(g.genre_id),
              name: g.name,
          }))
        : [],
});

// ------------------------ CREATE ------------------------
export const createQuestionType = asyncHandler(
    async (req: Request<{}, {}, QTypeBody>, res: Response) => {
        const { type_name, genre_ids } = req.body || {};

        if (!type_name || typeof type_name !== "string" || !type_name.trim()) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "type_name is required", null));
        }

        try {
            const created = await prisma.question_types.create({
                data: { type_name: cleanName(type_name) },
                select: {
                    type_id: true,
                    type_name: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            // reassign genres if provided
            const ids = parseIdArray(genre_ids);
            if (ids.length > 0) {
                await prisma.genres.updateMany({
                    where: { genre_id: { in: ids } },
                    data: { type_id: created.type_id },
                });
            }

            const full = await prisma.question_types.findUnique({
                where: { type_id: created.type_id },
                include: { genres: { select: { genre_id: true, name: true } } },
            });

            return res
                .status(201)
                .json(
                    ApiResponse.success(
                        201,
                        "question type created successfully",
                        toQuestionTypeDTO(full)
                    )
                );
        } catch (err: unknown) {
            if (
                err instanceof Prisma.PrismaClientKnownRequestError &&
                err.code === "P2002"
            ) {
                return res.status(409).json(
                    ApiResponse.error(409, "question type already exists", {
                        type_name: cleanName(type_name!),
                    })
                );
            }
            throw err;
        }
    }
);

// ------------------------ RENAME ------------------------
export const renameQuestionType = asyncHandler(
    async (req: Request<{ id: string }, {}, QTypeBody>, res: Response) => {
        const id = parseId(req.params.id);
        const { type_name } = req.body || {};

        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid id parameter", null));
        }
        if (!type_name || typeof type_name !== "string" || !type_name.trim()) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "type_name is required", null));
        }

        try {
            const updated = await prisma.question_types.update({
                where: { type_id: BigInt(id) },
                data: { type_name: cleanName(type_name) },
                select: {
                    type_id: true,
                    type_name: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "question type renamed successfully",
                        toQuestionTypeDTO(updated)
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2025") {
                    return res
                        .status(404)
                        .json(
                            ApiResponse.error(404, "question type not found", {
                                id,
                            })
                        );
                }
                if (err.code === "P2002") {
                    return res.status(409).json(
                        ApiResponse.error(
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

// ------------------------ DELETE ------------------------
export const deleteQuestionType = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid id parameter", null));
        }

        try {
            await prisma.question_types.delete({
                where: { type_id: BigInt(id) },
            });
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
                            ApiResponse.error(404, "question type not found", {
                                id,
                            })
                        );
                }
                if (err.code === "P2003") {
                    return res
                        .status(409)
                        .json(
                            ApiResponse.error(
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

// ------------------------ GET ALL ------------------------
export const getQuestionTypes = asyncHandler(
    async (_req: Request, res: Response) => {
        const rows = await prisma.question_types.findMany({
            orderBy: { type_name: "asc" },
            include: { genres: { select: { genre_id: true, name: true } } },
        });

        const data = rows.map(toQuestionTypeDTO);
        res.status(200).json(
            ApiResponse.success(
                200,
                "question types fetched successfully",
                data
            )
        );
    }
);

// ------------------------ GET ONE ------------------------
export const getQuestionTypeById = asyncHandler(
    async (req: Request<{ id: string }>, res: Response) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid id parameter", null));
        }

        const item = await prisma.question_types.findUnique({
            where: { type_id: BigInt(id) },
            include: { genres: { select: { genre_id: true, name: true } } },
        });

        if (!item) {
            return res
                .status(404)
                .json(
                    ApiResponse.error(404, "question type not found", { id })
                );
        }

        res.status(200).json(
            ApiResponse.success(
                200,
                "question type fetched successfully",
                toQuestionTypeDTO(item)
            )
        );
    }
);

// ------------------------ LINK GENRES ------------------------
export const addGenresToQuestionType = asyncHandler(
    async (
        req: Request<{ id: string }, {}, { genre_ids?: number[] }>,
        res: Response
    ) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid id parameter", null));
        }

        const ids = parseIdArray(req.body?.genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.error(
                        400,
                        "genre_ids must be a non-empty array",
                        null
                    )
                );
        }

        await prisma.genres.updateMany({
            where: { genre_id: { in: ids } },
            data: { type_id: BigInt(id) },
        });

        const item = await prisma.question_types.findUnique({
            where: { type_id: BigInt(id) },
            include: { genres: { select: { genre_id: true, name: true } } },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "genres linked to question type",
                    toQuestionTypeDTO(item)
                )
            );
    }
);

// ------------------------ UNLINK GENRES ------------------------
export const removeGenresFromQuestionType = asyncHandler(
    async (
        req: Request<{ id: string }, {}, { genre_ids?: number[] }>,
        res: Response
    ) => {
        const id = parseId(req.params.id);
        if (!id) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid id parameter", null));
        }

        const ids = parseIdArray(req.body?.genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.error(
                        400,
                        "genre_ids must be a non-empty array",
                        null
                    )
                );
        }

        await prisma.genres.updateMany({
            where: { genre_id: { in: ids }, type_id: BigInt(id) },
            data: { type_id: null },
        });

        const item = await prisma.question_types.findUnique({
            where: { type_id: BigInt(id) },
            include: { genres: { select: { genre_id: true, name: true } } },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "genres unlinked from question type",
                    toQuestionTypeDTO(item)
                )
            );
    }
);
