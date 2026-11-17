import { z } from "zod";
export const questionSchema = z.object({
  id: z.string().max(100),
  text: z.string().min(1).max(1500),
  choices: z.array(z.string().min(1).max(500)).length(4),
  correct: z.number().int().min(0).max(3),
  category: z.string().max(200),
});
export type Question = z.infer<typeof questionSchema>;
export const storySchema = z.object({
  intro: z.string().min(10).max(650),
  rooms: z.array(z.string().min(10).max(650)).length(3),
  ending: z.string().min(10).max(650),
});
export type Story = z.infer<typeof storySchema>;
export const runSchema = z
  .object({
    version: z.literal(1),
    id: z.string().max(100),
    startedAt: z.number(),
    name: z.string().min(1).max(24),
    difficulty: z.enum(["easy", "medium", "hard"]),
    questions: z.array(questionSchema).length(15),
    room: z.number().int().min(0).max(2),
    answers: z.array(z.number().int().min(0).max(3)).max(15),
    hints: z.array(z.number().int().min(0).max(14)).max(3),
    retries: z.number().int().min(0),
    finished: z.boolean(),
    source: z.enum(["live", "offline"]),
    story: storySchema,
    ai: z.boolean(),
  })
  .superRefine((run, ctx) => {
    const answered = run.answers.length;
    if (
      answered < run.room * 5 ||
      answered > (run.room + 1) * 5 ||
      run.hints.some((i) => i > answered) ||
      new Set(run.hints).size !== run.hints.length ||
      [0, 1, 2].some(
        (r) => run.hints.filter((i) => Math.floor(i / 5) === r).length > 1,
      ) ||
      Array.from({ length: run.room }, (_, r) => r).some(
        (r) =>
          run.answers
            .slice(r * 5, r * 5 + 5)
            .filter((a, i) => a === run.questions[r * 5 + i].correct).length <
          3,
      ) ||
      (run.finished &&
        (run.room !== 2 ||
          answered !== 15 ||
          run.answers
            .slice(10)
            .filter((a, i) => a === run.questions[10 + i].correct).length < 3))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid adventure progress",
      });
    }
  });
export type Run = z.infer<typeof runSchema>;
