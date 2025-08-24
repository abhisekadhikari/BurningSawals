// src/controllers/questions.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";

type QuestionBody = {
    question?: string;
    genre_ids?: number[];
    question_geners?: number[];
};

const toIdArray = (v: unknown): number[] =>
    Array.isArray(v)
        ? [...new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0))]
        : [];

export const createQuestion = asyncHandler(
    async (req: Request<{}, {}, QuestionBody>, res: Response) => {
        const { question, genre_ids, question_geners } = req.body || {};

        // Basic validations
        if (!question || typeof question !== "string" || !question.trim()) {
            return res
                .status(400)
                .json(ApiResponse.success(400, "question is required", null));
        }

        const ids = toIdArray(genre_ids ?? question_geners);
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

        // TODO: pull the authorId from your auth context (e.g., req.user.id)
        const authorId = 1;

        // Create question + link genres via explicit M2M (QuestionGenre)
        // Use nested `create` (not `createMany`) inside relation.
        const created = await prisma.question.create({
            data: {
                text: question.trim(),
                //authorId,
                questionGenres: {
                    create: ids.map((gid) => ({
                        genre: { connect: { id: gid } },
                    })),
                },
            },
            select: {
                id: true,
                text: true,
                authorId: true,
                createdAt: true,
                questionGenres: {
                    select: {
                        genre: { select: { id: true, name: true } },
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

export const getQuestionsByGenre = asyncHandler(
    async (req: Request<{ genre_id: string }>, res) => {
        const genreId = Number(req.params.genre_id);
        if (Number.isNaN(genreId)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Invalid genre_id",
                errors: ["genre_id must be a number"],
            });
        }

        const questions = await prisma.question.findMany({
            where: {
                questionGenres: {
                    some: { genreId },
                },
            },
        });

        if (!questions || questions.length === 0) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "No question is linked to this genre id",
                errors: [],
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Questions retrieved successfully",
            data: questions,
        });
    }
);

export const updateQuestion = asyncHandler(
    async (
        req: Request<{ question_id: string }, {}, QuestionBody>,
        res: Response
    ) => {
        const { question, question_geners } = req.body || {};
        const { question_id } = req.params;

        const result = await prisma.question.update({
            data: {
                text: question,
                // authorId: 1,
                questionGenres: {
                    update: {
                        data: {
                            genre: {
                                connect: {
                                    id: 1
                                }
                            }
                        }
                    }
                },
            },
            where: {
                id: Number(question_id),
            },
        });

        res.status(200).json(result);
    }
);
