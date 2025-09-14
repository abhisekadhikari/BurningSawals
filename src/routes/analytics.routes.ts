/**
 * @fileoverview Express routes for analytics and interaction management endpoints.
 * Defines all HTTP routes for question analytics, user interactions, and analytics summaries.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { Router } from "express";
import { validator } from "../middlewares/validator.middleware";
import { requireAuth } from "../middlewares/auth.middleware";
import analyticsValidator from "../validators/analytics.validator";
import {
    addQuestionInteraction,
    removeQuestionInteraction,
    getQuestionUserInteractions,
    getQuestionAnalytics,
    getQuestionsWithAnalytics,
    getUserAnalytics,
    getUserInteractionHistory,
    getTopQuestions,
} from "../controllers/analytics.controller";

/**
 * Express router instance for analytics-related routes
 * @type {Router}
 */
const router = Router();

// All analytics routes require authentication
router.use(requireAuth);

// ------------------------ QUESTION INTERACTIONS ------------------------

/**
 * @route   POST /api/analytics/questions/:question_id/interact
 * @desc    Add or update user interaction with a question (like, super_like, dislike)
 * @access  Private (requires authentication)
 * @param   {string} question_id - Question ID (must be a positive integer)
 * @body    {string} interaction_type - Type of interaction (like, super_like, dislike)
 * @validation Validates both URL parameter and request body
 * @returns {Object} Created/updated interaction object
 */
router.post(
    "/questions/:question_id/interact",
    validator(analyticsValidator.questionIdParam, "params"),
    validator(analyticsValidator.interactionBody),
    addQuestionInteraction
);

/**
 * @route   DELETE /api/analytics/questions/:question_id/interact
 * @desc    Remove user interaction with a question
 * @access  Private (requires authentication)
 * @param   {string} question_id - Question ID (must be a positive integer)
 * @body    {string} interaction_type - Type of interaction to remove
 * @validation Validates both URL parameter and request body
 * @returns {Object} Success confirmation with removed interaction details
 */
router.delete(
    "/questions/:question_id/interact",
    validator(analyticsValidator.questionIdParam, "params"),
    validator(analyticsValidator.interactionBody),
    removeQuestionInteraction
);

/**
 * @route   GET /api/analytics/questions/:question_id/interactions
 * @desc    Get all user's interactions with a specific question
 * @access  Private (requires authentication)
 * @param   {string} question_id - Question ID (must be a positive integer)
 * @validation Validates URL parameter
 * @returns {Object[]} Array of user's interactions with the question
 */
router.get(
    "/questions/:question_id/interactions",
    validator(analyticsValidator.questionIdParam, "params"),
    getQuestionUserInteractions
);

// ------------------------ QUESTION ANALYTICS ------------------------

/**
 * @route   GET /api/analytics/questions/:question_id
 * @desc    Get analytics summary for a specific question
 * @access  Private (requires authentication)
 * @param   {string} question_id - Question ID (must be a positive integer)
 * @validation Validates URL parameter
 * @returns {Object} Question object with analytics summary and genre information
 */
router.get(
    "/questions/:question_id",
    validator(analyticsValidator.questionIdParam, "params"),
    getQuestionAnalytics
);

/**
 * @route   GET /api/analytics/questions
 * @desc    Get all questions with their analytics (paginated and sortable)
 * @access  Private (requires authentication)
 * @query   {string} [page] - Page number for pagination (default: 1)
 * @query   {string} [limit] - Items per page (default: 20)
 * @query   {string} [sort_by] - Field to sort by (likes, super_likes, dislikes, total_interactions, created_at)
 * @query   {string} [sort_order] - Sort order (asc, desc)
 * @validation Validates query parameters
 * @returns {Object} Paginated list of questions with analytics and sorting metadata
 */
router.get(
    "/questions",
    validator(analyticsValidator.questionAnalyticsQuery, "query"),
    getQuestionsWithAnalytics
);

// ------------------------ USER ANALYTICS ------------------------

/**
 * @route   GET /api/analytics/users/me
 * @desc    Get current user's analytics summary
 * @access  Private (requires authentication)
 * @returns {Object} User's analytics summary with total interactions given
 */
router.get("/users/me", getUserAnalytics);

/**
 * @route   GET /api/analytics/users/me/interactions
 * @desc    Get current user's interaction history (paginated)
 * @access  Private (requires authentication)
 * @query   {string} [page] - Page number for pagination (default: 1)
 * @query   {string} [limit] - Items per page (default: 20)
 * @validation Validates query parameters
 * @returns {Object} Paginated list of user's interactions with question details
 */
router.get(
    "/users/me/interactions",
    validator(analyticsValidator.paginationQuery, "query"),
    getUserInteractionHistory
);

// ------------------------ TOP QUESTIONS ------------------------

/**
 * @route   GET /api/analytics/top-questions
 * @desc    Get top questions by interaction type
 * @access  Private (requires authentication)
 * @query   {string} [type] - Type of interaction to sort by (likes, super_likes, dislikes, total)
 * @query   {string} [limit] - Number of top questions to return (default: 10)
 * @validation Validates query parameters
 * @returns {Object} List of top questions with analytics and metadata
 */
router.get(
    "/top-questions",
    validator(analyticsValidator.topQuestionsQuery, "query"),
    getTopQuestions
);

/**
 * Export the router for use in the main application
 * @type {Router}
 */
export default router;
