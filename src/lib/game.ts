import type { Run } from "./types";
export function roomCorrect(run: Run, room = run.room) {
  return run.answers
    .slice(room * 5, room * 5 + 5)
    .filter((a, i) => a === run.questions[room * 5 + i].correct).length;
}
export function score(run: Run) {
  let total = 0,
    streak = 0;
  run.answers.forEach((a, i) => {
    if (i % 5 === 0) streak = 0;
    if (a === run.questions[i].correct) {
      total += 100 + Math.min(streak, 3) * 20;
      streak++;
    } else streak = 0;
  });
  return Math.max(0, total - run.hints.length * 25);
}
export function answer(run: Run, choice: number): Run {
  const index = run.answers.length;
  if (run.finished || index >= (run.room + 1) * 5 || choice < 0 || choice > 3)
    return run;
  return { ...run, answers: [...run.answers, choice] };
}
export function useHint(run: Run): Run {
  const index = run.answers.length;
  if (
    run.finished ||
    index >= (run.room + 1) * 5 ||
    run.hints.some((i) => Math.floor(i / 5) === run.room)
  )
    return run;
  return { ...run, hints: [...run.hints, index] };
}
export function eliminated(run: Run, index: number) {
  if (!run.hints.includes(index)) return [];
  return run.questions[index].choices
    .map((_, i) => i)
    .filter((i) => i !== run.questions[index].correct)
    .slice(0, 2);
}
export function advance(run: Run): Run {
  if (run.answers.length !== (run.room + 1) * 5) return run;
  if (roomCorrect(run) < 3)
    return {
      ...run,
      answers: run.answers.slice(0, run.room * 5),
      hints: run.hints.filter((i) => i < run.room * 5),
      retries: run.retries + 1,
    };
  return run.room === 2
    ? { ...run, finished: true }
    : { ...run, room: run.room + 1 };
}
