import { runSchema, type Run } from "./types";
export const SAVE_KEY = "plot-twist:adventure:v1";
export function loadRun(): Run | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? runSchema.parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function saveRun(run: Run): boolean {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(run));
    return true;
  } catch {
    return false;
  }
}
