import { describe, it, expect } from "vitest";
import {
  advance,
  answer,
  eliminated,
  roomCorrect,
  score,
  useHint,
} from "./game";
import { fallbackQuestions } from "./fallback";
import { originalStory } from "./story";
import { runSchema, type Run } from "./types";
function makeRun(): Run {
  return {
    version: 1,
    id: "test",
    startedAt: Date.now(),
    name: "Explorer",
    difficulty: "medium",
    questions: fallbackQuestions(),
    room: 0,
    answers: [],
    hints: [],
    retries: 0,
    finished: false,
    source: "offline",
    story: originalStory,
    ai: false,
  };
}
function fill(run: Run, count = 5) {
  let next = run;
  for (let i = 0; i < count; i++)
    next = answer(next, next.questions[next.answers.length].correct);
  return next;
}
describe("adventure rules", () => {
  it("has 15 unique questions, each with 4 unique choices and exactly one correct answer", () => {
    const run = makeRun();
    expect(new Set(run.questions.map((q) => q.id)).size).toBe(15);
    run.questions.forEach((q) => {
      expect(new Set(q.choices).size).toBe(4);
      expect(q.choices[q.correct]).toBeTruthy();
    });
  });
  it("unlocks exactly one room after three or more correct answers", () => {
    const run = fill(makeRun());
    expect(roomCorrect(run)).toBe(5);
    expect(advance(run).room).toBe(1);
    expect(advance(advance(run)).room).toBe(1);
  });
  it("requires 3 out of 5, and never advances early", () => {
    let run = makeRun();
    for (let i = 0; i < 5; i++)
      run = answer(
        run,
        i < 3 ? run.questions[i].correct : (run.questions[i].correct + 1) % 4,
      );
    expect(advance(run).room).toBe(1);
    expect(advance(fill(makeRun(), 3)).room).toBe(0);
  });
  it("resets the failed room score and hint, retaining cleared rooms and retries", () => {
    let run = advance(fill(makeRun()));
    const clearedScore = score(run);
    run = useHint(run);
    for (let i = 5; i < 10; i++)
      run = answer(run, (run.questions[i].correct + 1) % 4);
    const retry = advance(run);
    expect(retry.answers.length).toBe(5);
    expect(retry.room).toBe(1);
    expect(retry.retries).toBe(1);
    expect(retry.hints).toEqual([]);
    expect(score(retry)).toBe(clearedScore);
  });
  it("removes two wrong choices only, once per room", () => {
    let run = useHint(makeRun());
    expect(eliminated(run, 0)).toHaveLength(2);
    expect(eliminated(run, 0)).not.toContain(run.questions[0].correct);
    run = answer(run, run.questions[0].correct);
    expect(useHint(run)).toEqual(run);
  });
  it("calculates capped streaks, resets streak between rooms and charges clues", () => {
    const run = fill(useHint(makeRun()));
    expect(score(run)).toBe(655);
    expect(score(fill(advance(run)))).toBe(1335);
  });
  it("finishes only after all rooms have been cleared", () => {
    const run = advance(fill(advance(fill(advance(fill(makeRun()))))));
    expect(run.finished).toBe(true);
    expect(run.answers).toHaveLength(15);
    expect(score(run)).toBe(2040);
    expect(answer(run, 1)).toEqual(run);
    expect(useHint(run)).toEqual(run);
    expect(runSchema.safeParse(run).success).toBe(true);
  });
  it("rejects corrupted, out of range, or inconsistent saved progress", () => {
    expect(runSchema.safeParse({ ...makeRun(), room: 2 }).success).toBe(false);
    expect(runSchema.safeParse({ ...makeRun(), finished: true }).success).toBe(
      false,
    );
    expect(runSchema.safeParse({ ...makeRun(), hints: [0, 1] }).success).toBe(
      false,
    );
    expect(runSchema.safeParse({ ...makeRun(), answers: [6] }).success).toBe(
      false,
    );
  });
});
