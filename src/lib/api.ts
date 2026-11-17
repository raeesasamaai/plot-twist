import { z } from "zod";
import { shuffle, fallbackQuestions } from "./fallback";
import { originalStory } from "./story";
import { storySchema, type Question, type Run } from "./types";
export function decode(text: string) {
  const parsed = new DOMParser().parseFromString(text, "text/html");
  return parsed.documentElement.textContent ?? text;
}
const triviaSchema = z.object({
  response_code: z.literal(0),
  results: z
    .array(
      z.object({
        question: z.string().max(1500),
        correct_answer: z.string().max(500),
        incorrect_answers: z.array(z.string().max(500)).length(3),
        category: z.string().max(200),
      }),
    )
    .length(15),
});
export async function fetchQuestions(
  difficulty: Run["difficulty"],
  signal: AbortSignal,
): Promise<{ questions: Question[]; source: Run["source"] }> {
  try {
    const cooldown = Number(
      sessionStorage.getItem("plot-twist:trivia-at") ?? 0,
    );
    if (Date.now() - cooldown < 6000) throw new Error("API cooldown");
    sessionStorage.setItem("plot-twist:trivia-at", String(Date.now()));
    const response = await fetch(
      `https://opentdb.com/api.php?amount=15&type=multiple&difficulty=${difficulty}`,
      { signal: AbortSignal.any([signal, AbortSignal.timeout(9000)]) },
    );
    if (!response.ok) throw new Error("Trivia unavailable");
    const data = triviaSchema.parse(await response.json());
    const questions = data.results.map((q, i) => {
      const correct = decode(q.correct_answer);
      const choices = shuffle([correct, ...q.incorrect_answers.map(decode)]);
      if (new Set(choices).size !== 4) throw new Error("Duplicate answers");
      return {
        id: `live-${i}`,
        text: decode(q.question),
        choices,
        correct: choices.indexOf(correct),
        category: decode(q.category),
      };
    });
    if (new Set(questions.map((q) => q.text)).size !== 15)
      throw new Error("Duplicate questions");
    return { questions, source: "live" };
  } catch (error) {
    if (signal.aborted) throw error;
    return { questions: fallbackQuestions(), source: "offline" };
  }
}
export async function fetchStory(
  name: string,
  difficulty: string,
  signal: AbortSignal,
) {
  try {
    const response = await fetch("/api/narrate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, difficulty }),
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
    if (!response.ok) throw new Error("Narrator unavailable");
    const body = await response.json();
    return { story: storySchema.parse(body.story), ai: body.mode === "ai" };
  } catch (error) {
    if (signal.aborted) throw error;
    return { story: originalStory, ai: false };
  }
}
