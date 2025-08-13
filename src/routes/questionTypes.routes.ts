/**
 * @fileoverview Express routes for question type management endpoints.
 * Defines all HTTP routes for CRUD operations on question types and their genre associations.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

import { Router } from "express";
import { validator } from "../middlewares/validator.middleware";
import qtSchema from "../validators/questionTypes.validator";
import {
    createQuestionType,
    renameQuestionType,
    deleteQuestionType,
    getQuestionTypes,
    getQuestionTypeById,
    addGenresToQuestionType,
    removeGenresFromQuestionType,
} from "../controllers/questionTypes.controller";

/**
 * Express router instance for question type related routes
 * @type {Router}
 */
const router = Router();

/**
 * @route   GET /api/question-types
 * @desc    Fetch all question types with their associated genres
 * @access  Public
 * @returns {Object[]} Array of question type objects with genre associations
 */
router.get("/", getQuestionTypes);

/**
 * @route   POST /api/question-types
 * @desc    Create a new question type with optional genre associations
 * @access  Public
 * @body    {string} type_name - The name of the question type
 * @body    {number[]} [genre_ids] - Optional array of genre IDs to associate
 * @validation Uses qtSchema.create to validate request body
 * @returns {Object} Created question type with associated genres
 */
router.post("/", validator(qtSchema.create), createQuestionType);

/**
 * @route   GET /api/question-types/:id
 * @desc    Fetch a single question type by ID with associated genres
 * @access  Public
 * @param   {string} id - Question type ID (must be a positive integer)
 * @validation Uses qtSchema.idParam to validate URL parameter
 * @returns {Object} Question type object with genre associations or 404 if not found
 */
router.get("/:id", validator(qtSchema.idParam, "params"), getQuestionTypeById);

/**
 * @route   PATCH /api/question-types/:id
 * @desc    Update/rename an existing question type
 * @access  Public
 * @param   {string} id - Question type ID (must be a positive integer)
 * @body    {string} type_name - The new name for the question type
 * @validation Validates both URL parameter and request body
 * @returns {Object} Updated question type object or error if not found/name conflict
 */
router.patch(
    "/:id",
    validator(qtSchema.idParam, "params"),
    validator(qtSchema.rename),
    renameQuestionType
);

/**
 * @route   DELETE /api/question-types/:id
 * @desc    Delete a question type by its ID
 * @access  Public
 * @param   {string} id - Question type ID (must be a positive integer)
 * @validation Uses qtSchema.idParam to validate URL parameter
 * @returns {Object} Success confirmation with deleted question type ID
 */
router.delete(
    "/:id",
    validator(qtSchema.idParam, "params"),
    deleteQuestionType
);

/**
 * @route   POST /api/question-types/:id/genres
 * @desc    Associate multiple genres with a question type (bulk operation)
 * @access  Public
 * @param   {string} id - Question type ID (must be a positive integer)
 * @body    {number[]} genre_ids - Array of genre IDs to associate
 * @validation Validates both URL parameter and request body
 * @returns {Object} Updated question type with all associated genres
 * @note    Uses skipDuplicates to prevent conflicts with existing associations
 */
router.post(
    "/:id/genres",
    validator(qtSchema.idParam, "params"),
    validator(qtSchema.genreIdsBody),
    addGenresToQuestionType
);

/**
 * @route   DELETE /api/question-types/:id/genres
 * @desc    Remove multiple genres from a question type (bulk operation)
 * @access  Public
 * @param   {string} id - Question type ID (must be a positive integer)
 * @body    {number[]} genre_ids - Array of genre IDs to remove
 * @validation Validates both URL parameter and request body
 * @returns {Object} Updated question type with remaining associated genres
 */
router.delete(
    "/:id/genres",
    validator(qtSchema.idParam, "params"),
    validator(qtSchema.genreIdsBody),
    removeGenresFromQuestionType
);

/**
 * Export the router for use in the main application
 * @type {Router}
 */
export default router;
