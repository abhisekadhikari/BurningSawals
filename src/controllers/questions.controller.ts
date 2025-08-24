// src/controllers/questions.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";

type QuestionBody = {
    question?: string;
    genre_ids?: number[];
};

// Utility: normalize to array of positive ints
const toIdArray = (v: unknown): number[] =>
    Array.isArray(v)
        ? [...new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
        : [];

/** DTO helpers for BigInt → Number */
const toQuestionDTO = (q: any) => ({
    question_id: Number(q.question_id),
    question: q.question,
    created_at: q.created_at,
    updated_at: q.updated_at,
    genres:
        q.question_genre_mappings?.map((m: any) => ({
            genre_id: Number(m.genres.genre_id),
            name: m.genres.name,
        })) ?? [],
});

// ------------------------ CREATE ------------------------
export const createQuestion = asyncHandler(
    async (req: Request<{}, {}, QuestionBody>, res: Response) => {
        const { question, genre_ids } = req.body || {};

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
        const { question, genre_ids } = req.body || {};

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
