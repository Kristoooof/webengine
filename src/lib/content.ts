import { ACTS, MODULES, type LessonMeta, type ModuleMeta } from "../../content/curriculum";
import { isDone, state } from "./store";

const files = import.meta.glob("../../content/lessons/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const bodies = new Map<string, string>();
for (const [path, body] of Object.entries(files)) {
  const id = path.split("/").pop()!.replace(/\.md$/, "");
  bodies.set(id, body);
}

export interface Lesson extends LessonMeta {
  module: ModuleMeta;
  index: number; // globális sorszám
  available: boolean;
  xp: number;
}

export const LESSONS: Lesson[] = [];
for (const m of MODULES) {
  for (const l of m.lessons) {
    LESSONS.push({
      ...l,
      module: m,
      index: LESSONS.length,
      available: bodies.has(l.id),
      xp: l.minutes * 4,
    });
  }
}

const byId = new Map(LESSONS.map((l) => [l.id, l]));

export { ACTS, MODULES };
export type { ModuleMeta };

export function lesson(id: string): Lesson | undefined {
  return byId.get(id);
}

export function lessonBody(id: string): string | undefined {
  return bodies.get(id);
}

export function neighbours(id: string): { prev?: Lesson; next?: Lesson } {
  const l = byId.get(id);
  if (!l) return {};
  return { prev: LESSONS[l.index - 1], next: LESSONS[l.index + 1] };
}

/** A következő elvégzendő lecke: az első nem kész, elérhető lecke. */
export function nextLesson(): Lesson | undefined {
  if (state.lastLesson) {
    const last = byId.get(state.lastLesson);
    if (last && !isDone(last.id) && last.available) return last;
  }
  return LESSONS.find((l) => l.available && !isDone(l.id));
}

export function moduleProgress(m: ModuleMeta): { done: number; total: number; available: number } {
  let done = 0;
  let available = 0;
  for (const l of m.lessons) {
    if (isDone(l.id)) done++;
    if (bodies.has(l.id)) available++;
  }
  return { done, total: m.lessons.length, available };
}

export function totals(): { done: number; total: number; available: number; minutes: number } {
  let done = 0;
  let available = 0;
  let minutes = 0;
  for (const l of LESSONS) {
    if (isDone(l.id)) done++;
    if (l.available) available++;
    minutes += l.minutes;
  }
  return { done, total: LESSONS.length, available, minutes };
}

export function levelFor(xp: number): { level: number; into: number; need: number; title: string } {
  const titles = [
    "Kíváncsi kezdő",
    "Fordító-barát",
    "Borrow-szelídítő",
    "Tokenvadász",
    "DOM-kertész",
    "Kaszkád-mester",
    "Doboz-építész",
    "Pixelfestő",
    "Protokoll-suttogó",
    "Motorépítő",
    "Böngészőkovács",
  ];
  let level = 0;
  let need = 300;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level++;
    need = Math.round(need * 1.18);
  }
  return { level: level + 1, into: rest, need, title: titles[Math.min(level, titles.length - 1)] };
}
