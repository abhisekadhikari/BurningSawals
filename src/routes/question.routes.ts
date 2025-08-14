import { Router } from "express";
import questionSchemaValidator from "../validators/question.validator";
import { validator } from "../middlewares/validator.middleware";
import { createQuestion } from "../controllers/questions.controller";

const questionRouer = Router();

questionRouer
    .route("/")
    .post(validator(questionSchemaValidator.upsertQuestion), createQuestion);

export default questionRouer;
