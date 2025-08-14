// src/controllers/questions.controller.ts
import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";

type QuestionBody = {
    question?: string;
    genre_ids?: number[]; // ✅ preferred
    question_geners?: number[]; // legacy/typo support
};

const toIdArray = (v: unknown): number[] =>
    Array.isArray(v)
        ? [
              ...new Set( // dedupe to avoid unique constraint errors on the join
                  v.map(Number).filter((n) => Number.isFinite(n) && n > 0)
              ),
          ]
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
                authorId,
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
