import { Router } from "express";
import questionSchemaValidator from "../validators/question.validator";
import { validator } from "../middlewares/validator.middleware";
import {
    createQuestion,
    getQuestionsByGenre,
    updateQuestion,
} from "../controllers/questions.controller";

const questionRouer = Router();

questionRouer
    .route("/")
    .post(validator(questionSchemaValidator.upsertQuestion), createQuestion);

questionRouer.route("/genre/:genre_id").get(getQuestionsByGenre);

questionRouer
    .route("/:question_id")
    .put(validator(questionSchemaValidator.updateQuestion), updateQuestion);

export default questionRouer;
