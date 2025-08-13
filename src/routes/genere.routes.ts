/**
 * @fileoverview Express routes for genre management endpoints.
 * Defines all HTTP routes for CRUD operations on genres with proper validation middleware.
 *
 * @author abhisekadhikari
 * @version 1.0.0
 */

// src/routes/generes.routes.ts
import { Router } from "express";
import genereSchemaValidator from "../validators/genere.validator";
import { validator } from "../middlewares/validator.middleware";
import {
    createGenere,
    renameGenere,
    deleteGenere,
    getGeneres,
    getGenereById,
} from "../controllers/generes.controller";

/**
 * Express router instance for genre-related routes
 * @type {Router}
 */
const router = Router();

/**
 * @route   GET /api/genres
 * @desc    Fetch all genres with their associated question types and questions
 * @access  Public
 * @returns {Object[]} Array of genre objects with associations
 */
router.get("/", getGeneres);

/**
 * @route   POST /api/genres
 * @desc    Create a new genre
 * @access  Public
 * @body    {string} genre_name - The name of the genre to create
 * @validation Uses genereSchemaValidator.upsertGenere to validate request body
 * @returns {Object} Created genre object with id, name, createdAt, updatedAt
 */
router.post("/", validator(genereSchemaValidator.upsertGenere), createGenere);

/**
 * @route   GET /api/genres/:id
 * @desc    Fetch a single genre by its ID with associated data
 * @access  Public
 * @param   {string} id - Genre ID (must be a positive integer)
 * @validation Uses genereSchemaValidator.idParam to validate URL parameter
 * @returns {Object} Genre object with associations or 404 if not found
 */
router.get(
    "/:id",
    validator(genereSchemaValidator.idParam, "params"),
    getGenereById
);

/**
 * @route   PATCH /api/genres/:id
 * @desc    Update/rename an existing genre
 * @access  Public
 * @param   {string} id - Genre ID (must be a positive integer)
 * @body    {string} genre_name - The new name for the genre
 * @validation Validates both URL parameter and request body
 * @returns {Object} Updated genre object or error if not found/name conflict
 */
router.patch(
    "/:id",
    validator(genereSchemaValidator.idParam, "params"),
    validator(genereSchemaValidator.upsertGenere),
    renameGenere
);

/**
 * @route   DELETE /api/genres/:id
 * @desc    Delete a genre by its ID
 * @access  Public
 * @param   {string} id - Genre ID (must be a positive integer)
 * @validation Uses genereSchemaValidator.idParam to validate URL parameter
 * @returns {Object} Success confirmation with deleted genre ID
 * @note    Will fail if genre has existing references (foreign key constraints)
 */
router.delete(
    "/:id",
    validator(genereSchemaValidator.idParam, "params"),
    deleteGenere
);

/**
 * Export the router for use in the main application
 * @type {Router}
 */
export default router;
