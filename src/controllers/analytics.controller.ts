import { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { prisma } from "../utils/prisma";
import { ApiResponse } from "../utils/ApiResponse";
import { Prisma } from "@prisma/client";

type InteractionBody = {
    interaction_type: "like" | "super_like" | "dislike";
};

type QuestionAnalyticsQuery = {
    page?: string;
    limit?: string;
    sort_by?:
        | "likes"
        | "super_likes"
        | "dislikes"
        | "total_interactions"
        | "created_at";
    sort_order?: "asc" | "desc";
};

// Utility functions
const parseId = (raw: string): number | null => {
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
};

const parsePagination = (page?: string, limit?: string) => {
    const pageNum =
        Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const limitNum =
        Number.isFinite(Number(limit)) && Number(limit) > 0
            ? Number(limit)
            : 20;
    return { page: pageNum, limit: limitNum, skip: (pageNum - 1) * limitNum };
};

// DTO helpers
const toInteractionDTO = (interaction: any) => ({
    interaction_id: Number(interaction.interaction_id),
    user_id: Number(interaction.user_id),
    question_id: Number(interaction.question_id),
    interaction_type: interaction.interaction_type,
    created_at: interaction.created_at,
    updated_at: interaction.updated_at,
});

const toQuestionAnalyticsDTO = (question: any) => ({
    question_id: Number(question.question_id),
    question: question.question,
    prompt: question.prompt,
    created_at: question.created_at,
    updated_at: question.updated_at,
    analytics: question.question_analytics_summary
        ? {
              total_likes: question.question_analytics_summary.total_likes || 0,
              total_super_likes:
                  question.question_analytics_summary.total_super_likes || 0,
              total_dislikes:
                  question.question_analytics_summary.total_dislikes || 0,
              total_interactions:
                  question.question_analytics_summary.total_interactions || 0,
              last_updated: question.question_analytics_summary.last_updated,
          }
        : {
              total_likes: 0,
              total_super_likes: 0,
              total_dislikes: 0,
              total_interactions: 0,
              last_updated: null,
          },
    genres:
        question.question_genre_mappings?.map((m: any) => ({
            genre_id: Number(m.genres.genre_id),
            name: m.genres.name,
            type_id: Number(m.genres.question_types?.type_id ?? 0),
            type_name: m.genres.question_types?.type_name ?? null,
        })) ?? [],
});

// ------------------------ INTERACTION MANAGEMENT ------------------------

/**
 * Add or update user interaction with a question
 * POST /api/analytics/questions/:question_id/interact
 */
export const addQuestionInteraction = asyncHandler(
    async (
        req: Request<{ question_id: string }, {}, InteractionBody>,
        res: Response
    ) => {
        const questionId = parseId(req.params.question_id);
        const { interaction_type } = req.body || {};
        const userId = Number((req.user as any)?.sub); // From auth middleware

        if (!questionId) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid question_id", null));
        }

        if (
            !interaction_type ||
            !["like", "super_like", "dislike"].includes(interaction_type)
        ) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid interaction_type", null));
        }

        try {
            // Check if question exists
            const question = await prisma.questions.findUnique({
                where: { question_id: BigInt(questionId) },
            });

            if (!question) {
                return res
                    .status(404)
                    .json(ApiResponse.error(404, "Question not found", null));
            }

            // Upsert interaction (insert or update)
            const interaction = await prisma.question_interactions.upsert({
                where: {
                    user_id_question_id_interaction_type: {
                        user_id: BigInt(userId),
                        question_id: BigInt(questionId),
                        interaction_type: interaction_type as any,
                    },
                },
                update: {
                    interaction_type: interaction_type as any,
                    updated_at: new Date(),
                },
                create: {
                    user_id: BigInt(userId),
                    question_id: BigInt(questionId),
                    interaction_type: interaction_type as any,
                },
            });

            return res
                .status(200)
                .json(
                    ApiResponse.success(
                        200,
                        "Interaction added successfully",
                        toInteractionDTO(interaction)
                    )
                );
        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    return res
                        .status(409)
                        .json(
                            ApiResponse.error(
                                409,
                                "Interaction already exists",
                                null
                            )
                        );
                }
            }
            throw err;
        }
    }
);

/**
 * Remove user interaction with a question
 * DELETE /api/analytics/questions/:question_id/interact
 */
export const removeQuestionInteraction = asyncHandler(
    async (
        req: Request<{ question_id: string }, {}, InteractionBody>,
        res: Response
    ) => {
        const questionId = parseId(req.params.question_id);
        const { interaction_type } = req.body || {};
        const userId = Number((req.user as any)?.sub);

        if (!questionId) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid question_id", null));
        }

        if (
            !interaction_type ||
            !["like", "super_like", "dislike"].includes(interaction_type)
        ) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid interaction_type", null));
        }

        try {
            const deleted = await prisma.question_interactions.deleteMany({
                where: {
                    user_id: BigInt(userId),
                    question_id: BigInt(questionId),
                    interaction_type: interaction_type as any,
                },
            });

            if (deleted.count === 0) {
                return res
                    .status(404)
                    .json(
                        ApiResponse.error(404, "Interaction not found", null)
                    );
            }

            return res.status(200).json(
                ApiResponse.success(200, "Interaction removed successfully", {
                    question_id: questionId,
                    interaction_type,
                    removed: true,
                })
            );
        } catch (err: unknown) {
            throw err;
        }
    }
);

/**
 * Get user's interactions with a specific question
 * GET /api/analytics/questions/:question_id/interactions
 */
export const getQuestionUserInteractions = asyncHandler(
    async (req: Request<{ question_id: string }>, res: Response) => {
        const questionId = parseId(req.params.question_id);
        const userId = Number((req.user as any)?.sub);

        if (!questionId) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid question_id", null));
        }

        const interactions = await prisma.question_interactions.findMany({
            where: {
                user_id: BigInt(userId),
                question_id: BigInt(questionId),
            },
            orderBy: { created_at: "desc" },
        });

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "User interactions retrieved successfully",
                    interactions.map(toInteractionDTO)
                )
            );
    }
);

// ------------------------ QUESTION ANALYTICS ------------------------

/**
 * Get analytics for a specific question
 * GET /api/analytics/questions/:question_id
 */
export const getQuestionAnalytics = asyncHandler(
    async (req: Request<{ question_id: string }>, res: Response) => {
        const questionId = parseId(req.params.question_id);

        if (!questionId) {
            return res
                .status(400)
                .json(ApiResponse.error(400, "Invalid question_id", null));
        }

        const question = await prisma.questions.findUnique({
            where: { question_id: BigInt(questionId) },
            include: {
                question_analytics_summary: true,
                question_genre_mappings: {
                    include: {
                        genres: {
                            include: {
                                question_types: {
                                    select: { type_id: true, type_name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        if (!question) {
            return res
                .status(404)
                .json(ApiResponse.error(404, "Question not found", null));
        }

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "Question analytics retrieved successfully",
                    toQuestionAnalyticsDTO(question)
                )
            );
    }
);

/**
 * Get questions with analytics (paginated and sortable)
 * GET /api/analytics/questions
 */
export const getQuestionsWithAnalytics = asyncHandler(
    async (req: Request<{}, {}, {}, QuestionAnalyticsQuery>, res: Response) => {
        const { page, limit, skip } = parsePagination(
            req.query.page,
            req.query.limit
        );
        const sortBy = req.query.sort_by || "total_interactions";
        const sortOrder = req.query.sort_order || "desc";

        // Build orderBy object
        let orderBy: any = {};
        if (sortBy === "created_at") {
            orderBy = { created_at: sortOrder };
        } else {
            orderBy = {
                question_analytics_summary: {
                    [sortBy]: sortOrder,
                },
            };
        }

        // Count total questions
        const total = await prisma.questions.count();

        // Fetch questions with analytics
        const questions = await prisma.questions.findMany({
            skip,
            take: limit,
            orderBy,
            include: {
                question_analytics_summary: true,
                question_genre_mappings: {
                    include: {
                        genres: {
                            include: {
                                question_types: {
                                    select: { type_id: true, type_name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const items = questions.map(toQuestionAnalyticsDTO);

        return res.status(200).json(
            ApiResponse.success(
                200,
                "Questions with analytics retrieved successfully",
                {
                    items,
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                    sort_by: sortBy,
                    sort_order: sortOrder,
                }
            )
        );
    }
);

// ------------------------ USER ANALYTICS ------------------------

/**
 * Get user's analytics summary
 * GET /api/analytics/users/me
 */
export const getUserAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = Number((req.user as any)?.sub);

        const userAnalytics = await prisma.user_analytics_summary.findUnique({
            where: { user_id: BigInt(userId) },
        });

        const analytics = userAnalytics
            ? {
                  user_id: Number(userAnalytics.user_id),
                  total_likes_given: userAnalytics.total_likes_given || 0,
                  total_super_likes_given:
                      userAnalytics.total_super_likes_given || 0,
                  total_dislikes_given: userAnalytics.total_dislikes_given || 0,
                  total_interactions_given:
                      userAnalytics.total_interactions_given || 0,
                  last_updated: userAnalytics.last_updated,
              }
            : {
                  user_id: userId,
                  total_likes_given: 0,
                  total_super_likes_given: 0,
                  total_dislikes_given: 0,
                  total_interactions_given: 0,
                  last_updated: null,
              };

        return res
            .status(200)
            .json(
                ApiResponse.success(
                    200,
                    "User analytics retrieved successfully",
                    analytics
                )
            );
    }
);

/**
 * Get user's interaction history
 * GET /api/analytics/users/me/interactions
 */
export const getUserInteractionHistory = asyncHandler(
    async (
        req: Request<{}, {}, {}, { page?: string; limit?: string }>,
        res: Response
    ) => {
        const userId = Number((req.user as any)?.sub);
        const { page, limit, skip } = parsePagination(
            req.query.page,
            req.query.limit
        );

        // Count total interactions
        const total = await prisma.question_interactions.count({
            where: { user_id: BigInt(userId) },
        });

        // Fetch interactions with question details
        const interactions = await prisma.question_interactions.findMany({
            where: { user_id: BigInt(userId) },
            skip,
            take: limit,
            orderBy: { created_at: "desc" },
            include: {
                questions: {
                    select: {
                        question_id: true,
                        question: true,
                        prompt: true,
                    },
                },
            },
        });

        const items = interactions.map((interaction) => ({
            interaction_id: Number(interaction.interaction_id),
            user_id: Number(interaction.user_id),
            question_id: Number(interaction.question_id),
            interaction_type: interaction.interaction_type,
            created_at: interaction.created_at,
            updated_at: interaction.updated_at,
            question: {
                question_id: Number(interaction.questions.question_id),
                question: interaction.questions.question,
                prompt: interaction.questions.prompt,
            },
        }));

        return res.status(200).json(
            ApiResponse.success(
                200,
                "User interaction history retrieved successfully",
                {
                    items,
                    page,
                    limit,
                    total,
                    total_pages: Math.ceil(total / limit),
                }
            )
        );
    }
);

// ------------------------ TOP QUESTIONS ------------------------

/**
 * Get top questions by interaction type
 * GET /api/analytics/top-questions
 */
export const getTopQuestions = asyncHandler(
    async (
        req: Request<
            {},
            {},
            {},
            {
                type?: "likes" | "super_likes" | "dislikes" | "total";
                limit?: string;
            }
        >,
        res: Response
    ) => {
        const type = req.query.type || "total";
        const limit =
            Number.isFinite(Number(req.query.limit)) &&
            Number(req.query.limit) > 0
                ? Number(req.query.limit)
                : 10;

        let orderBy: any = {};
        if (type === "total") {
            orderBy = {
                question_analytics_summary: { total_interactions: "desc" },
            };
        } else {
            orderBy = { question_analytics_summary: { [type]: "desc" } };
        }

        const questions = await prisma.questions.findMany({
            take: limit,
            orderBy,
            include: {
                question_analytics_summary: true,
                question_genre_mappings: {
                    include: {
                        genres: {
                            include: {
                                question_types: {
                                    select: { type_id: true, type_name: true },
                                },
                            },
                        },
                    },
                },
            },
        });

        const items = questions.map(toQuestionAnalyticsDTO);

        return res.status(200).json(
            ApiResponse.success(200, "Top questions retrieved successfully", {
                items,
                type,
                limit,
            })
        );
    }
);
