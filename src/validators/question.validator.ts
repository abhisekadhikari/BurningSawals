import { z } from "zod";

const questionSchemaValidator = {
    upsertQuestion: z.object({
        question: z.string().min(5),
        genre_ids: z.array(z.number()),
        prompt: z.string().min(3).optional(),
    }),
    updateQuestion: z.object({
        question: z.string().min(5).optional(),
        genre_ids: z.array(z.number()).optional(),
        prompt: z.string().min(3).optional().or(z.literal("")),
    }),
};

export default questionSchemaValidator;
