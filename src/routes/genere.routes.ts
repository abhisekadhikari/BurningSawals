/**
 * @fileoverview Express routes for genre management endpoints.
 * Defines all HTTP routes for CRUD operations on genres with proper validation middleware.
 *
 * @author
 * @version 1.0.0
 */

// src/routes/genres.routes.ts
import { Router } from "express";
import genreSchemaValidator from "../validators/genere.validator";
import { validator } from "../middlewares/validator.middleware";
import {
    createGenre,
    renameGenre,
    deleteGenre,
    getGenreById,
    getGenres,
} from "../controllers/generes.controller";

/**
 * Express router instance for genre-related routes
 */
const router = Router();

/**
 * @route   GET /api/genres
 * @desc    Fetch all genres with their associated question types and questions
 */
router.get("/", getGenres);

/**
 * @route   POST /api/genres
 * @desc    Create a new genre
 */
router.post("/", validator(genreSchemaValidator.upsertGenere), createGenre);

/**
 * @route   GET /api/genres/:id
 * @desc    Fetch a single genre by its ID with associated data
 */
router.get(
    "/:id",
    validator(genreSchemaValidator.idParam, "params"),
    getGenreById
);

/**
 * @route   PATCH /api/genres/:id
 * @desc    Update/rename an existing genre
 */
router.patch(
    "/:id",
    validator(genreSchemaValidator.idParam, "params"),
    validator(genreSchemaValidator.upsertGenere),
    renameGenre
);

/**
 * @route   DELETE /api/genres/:id
 * @desc    Delete a genre by its ID
 */
router.delete(
    "/:id",
    validator(genreSchemaValidator.idParam, "params"),
    deleteGenre
);

export default router;
