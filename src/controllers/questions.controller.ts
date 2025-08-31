import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";

type QuestionBody = {
    question?: string;
    prompt?: string;
    genre_ids?: number[];
};

// Utility: normalize to array of positive ints
const toIdArray = (v: unknown): number[] =>
    Array.isArray(v)
        ? [...new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
        : [];

/** DTO helpers for BigInt → Number (now with types) */
const toQuestionDTO = (q: any) => {
    const genres =
        q.question_genre_mappings?.map((m: any) => ({
            genre_id: Number(m.genres.genre_id),
            name: m.genres.name,
            type_id: Number(m.genres.question_types?.type_id ?? 0),
            type_name: m.genres.question_types?.type_name ?? null,
        })) ?? [];

    // Dedupe types across genres
    const typeMap = new Map<number, string | null>();
    for (const g of genres) {
        if (g.type_id) typeMap.set(g.type_id, g.type_name ?? null);
    }
    const types = [...typeMap.entries()].map(([type_id, type_name]) => ({
        type_id,
        type_name,
    }));

    return {
        question_id: Number(q.question_id),
        question: q.question,
        prompt: q.prompt,
        created_at: q.created_at,
        updated_at: q.updated_at,
        genres,
        types,
    };
};

// ------------------------ CREATE ------------------------
export const createQuestion = asyncHandler(
    async (req: Request<{}, {}, QuestionBody>, res: Response) => {
        const { question, genre_ids, prompt } = req.body || {};

        if (!question || typeof question !== "string" || !question.trim()) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "question is required", null));
        }

        const ids = toIdArray(genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.error(
                        400,
                        "provide at least one genre id in genre_ids",
                        null
                    )
                );
        }

        const created = await prisma.questions.create({
            data: {
                question: question.trim(),
                ...(prompt && typeof prompt === "string"
                    ? { prompt: prompt.trim() }
                    : {}),
                question_genre_mappings: {
                    create: ids.map((gid) => ({
                        genres: { connect: { genre_id: BigInt(gid) } },
                    })),
                },
            },
            include: {
                question_genre_mappings: {
                    include: {
                        genres: { select: { genre_id: true, name: true } },
                    },
                },
            },
        });

        return res
            .status(201)
            .json(
                ApiResponse.success(
                    201,
                    "question created successfully",
                    toQuestionDTO(created)
                )
            );
    }
);

// ------------------------ GET by GENRE ------------------------
export const getQuestionsByGenre = asyncHandler(
    async (req: Request<{ genre_id: string }>, res: Response) => {
        const genreId = Number(req.params.genre_id);
        if (Number.isNaN(genreId)) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid genre_id", null));
        }

        const questions = await prisma.questions.findMany({
            where: {
                question_genre_mappings: {
                    some: { genre_id: BigInt(genreId) },
                },
            },
            include: {
                question_genre_mappings: {
                    include: {
                        genres: { select: { genre_id: true, name: true } },
                    },
                },
            },
        });

        if (!questions.length) {
            return res
                .status(404)
                .json(
                    ApiResponse.error(
                        404,
                        "no questions linked to this genre",
                        []
                    )
                );
        }

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "questions retrieved successfully",
                    questions.map(toQuestionDTO)
                )
            );
    }
);

// ------------------------ UPDATE ------------------------
export const updateQuestion = asyncHandler(
    async (
        req: Request<{ question_id: string }, {}, QuestionBody>,
        res: Response
    ) => {
        const qid = Number(req.params.question_id);
        const { question, genre_ids, prompt } = req.body || {};

        if (Number.isNaN(qid)) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "invalid question_id", null));
        }

        const ids = toIdArray(genre_ids);

        const updated = await prisma.questions.update({
            where: { question_id: BigInt(qid) },
            data: {
                ...(question ? { question: question.trim() } : {}),
                ...(prompt !== undefined
                    ? { prompt: prompt ? prompt.trim() : null }
                    : {}),
                ...(ids.length
                    ? {
                          question_genre_mappings: {
                              deleteMany: {}, // remove all current mappings
                              create: ids.map((gid) => ({
                                  genres: {
                                      connect: { genre_id: BigInt(gid) },
                                  },
                              })),
                          },
                      }
                    : {}),
            },
            include: {
                question_genre_mappings: {
                    include: {
                        genres: { select: { genre_id: true, name: true } },
                    },
                },
            },
        });

        res.status(200).json(
            ApiResponse.success(
                200,
                "question updated successfully",
                toQuestionDTO(updated)
            )
        );
    }
);

// ------------------------ GET ALL (paginated) ------------------------
export const getAllQuestions = asyncHandler(
    async (req: Request, res: Response) => {
        // Parse pagination
        const pageRaw =
            typeof req.query.page === "string" ? Number(req.query.page) : NaN;
        const limitRaw =
            typeof req.query.limit === "string" ? Number(req.query.limit) : NaN;

        const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
        const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20;
        const skip = (page - 1) * limit;

        // Count for meta
        const total = await prisma.questions.count();

        // Fetch with nested types
        const rows = await prisma.questions.findMany({
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                question_genre_mappings: {
                    include: {
                        genres: {
                            select: {
                                genre_id: true,
                                name: true,
                                question_types: {
                                    select: { type_id: true, type_name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const items = rows.map(toQuestionDTO);

        return res.status(200).json(
            ApiResponse.success(200, "questions retrieved successfully", {
                items,
                page,
                limit,
                total,
                total_pages: Math.ceil(total / limit),
            })
        );
    }
);
