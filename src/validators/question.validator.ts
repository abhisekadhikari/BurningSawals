import { z } from "zod";

const questionSchemaValidator = {
    upsertQuestion: z.object({
        question: z.string().min(5),
        question_geners: z.array(z.number()),
    }),
};

export default questionSchemaValidator;
