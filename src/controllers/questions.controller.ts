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

// ------------------------ CREATE ------------------------
export const createQuestion = asyncHandler(
    async (req: Request<{}, {}, QuestionBody>, res: Response) => {
        const { question, genre_ids } = req.body || {};

        if (!question || typeof question !== "string" || !question.trim()) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "question is required", null));
        }

        const ids = toIdArray(genre_ids);
        if (ids.length === 0) {
            return res
                .status(400)
                .json(
                    ApiResponse.success(
                        400,
                        "provide at least one genre id in genre_ids",
                        null
                    )
                );
        }

        // Create question
        const created = await prisma.questions.create({
            data: {
                question: question.trim(),
                question_genre_mappings: {
                    create: ids.map((gid) => ({
                        genres: { connect: { genre_id: gid } },
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
                    created
                )
            );
    }
);

// ------------------------ GET by GENRE ------------------------
export const getQuestionsByGenre = asyncHandler(
    async (req: Request<{ genre_id: string }>, res) => {
        const genreId = Number(req.params.genre_id);
        if (Number.isNaN(genreId)) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "invalid genre_id", null));
        }

        const questions = await prisma.questions.findMany({
            where: {
                question_genre_mappings: {
                    some: { genre_id: genreId },
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
                    ApiResponse.success(
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
                    questions
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
                .json(ApiResponse.success(400, "invalid question_id", null));
        }

        // Clean genre_ids
        const ids = toIdArray(genre_ids);

        // Update question text
        const updated = await prisma.questions.update({
            where: { question_id: qid },
            data: {
                ...(question ? { question: question.trim() } : {}),
                ...(ids.length
                    ? {
                          // Reset existing mappings, then add new ones
                          question_genre_mappings: {
                              deleteMany: {}, // remove all current mappings
                              create: ids.map((gid) => ({
                                  genres: { connect: { genre_id: gid } },
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
            ApiResponse.success(200, "question updated successfully", updated)
        );
    }
);
