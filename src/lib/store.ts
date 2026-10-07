// Haladás tárolása. Minden a böngésző/app localStorage-ában él; exportálható JSON-ba,
// így a webes és az asztali verzió között is átvihető.

export type Theme = "system" | "light" | "dark";

export interface CardState {
  box: number; // Leitner-doboz 0..5
  due: string; // YYYY-MM-DD
  q: string;
  a: string;
  lesson: string;
}

export interface Settings {
  theme: Theme;
  focusMinutes: number;
  breakMinutes: number;
  reduceMotion: boolean;
  sound: boolean;
}

export interface TimerState {
  mode: "focus" | "break";
  endsAt: number; // ms epoch; 0 = nem fut
  pausedLeft: number; // ms, ha szüneteltetve
  totalMs: number;
}

export interface ExerciseState {
  code: string;
  verdict?: string;
  solvedAt?: string;
}

export interface State {
  version: 1;
  completed: Record<string, string>;
  steps: Record<string, number[]>;
  quiz: Record<string, number>; // kérdés-kulcs -> választott opció
  activity: Record<string, number>; // nap -> lépések/percek pontszám
  xp: number;
  lastLesson: string | null;
  notes: Record<string, string>;
  parking: string;
  cards: Record<string, CardState>;
  hintsUsed: Record<string, number>;
  exercises: Record<string, ExerciseState>;
  scroll: Record<string, number>;
  settings: Settings;
  timer: TimerState;
}

const KEY = "rozsda.v1";

function fresh(): State {
  return {
    version: 1,
    completed: {},
    steps: {},
    quiz: {},
    activity: {},
    xp: 0,
    lastLesson: null,
    notes: {},
    parking: "",
    cards: {},
    hintsUsed: {},
    exercises: {},
    scroll: {},
    settings: { theme: "system", focusMinutes: 25, breakMinutes: 5, reduceMotion: false, sound: true },
    timer: { mode: "focus", endsAt: 0, pausedLeft: 0, totalMs: 0 },
  };
}

function load(): State {
  const base = fresh();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw);
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
      timer: { ...base.timer, ...(parsed.timer ?? {}) },
    };
  } catch {
    return base;
  }
}

export const state: State = load();

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

let saveQueued = false;
export function save(notify = true): void {
  if (!saveQueued) {
    saveQueued = true;
    queueMicrotask(() => {
      saveQueued = false;
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch {
        /* privát mód vagy tele a tárhely: a haladás ebben a munkamenetben megmarad */
      }
    });
  }
  if (notify) listeners.forEach((l) => l());
}

export function today(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return today(new Date(y, m - 1, d + n));
}

export function bumpActivity(points = 1): void {
  const t = today();
  state.activity[t] = (state.activity[t] ?? 0) + points;
}

export function streak(): number {
  let n = 0;
  let day = today();
  // Ha ma még nem volt aktivitás, a tegnapi sorozat még él.
  if (!state.activity[day]) day = addDays(day, -1);
  while (state.activity[day]) {
    n++;
    day = addDays(day, -1);
  }
  return n;
}

export function isDone(lessonId: string): boolean {
  return Boolean(state.completed[lessonId]);
}

export function completeLesson(lessonId: string, xp: number): boolean {
  if (state.completed[lessonId]) return false;
  state.completed[lessonId] = new Date().toISOString();
  state.xp += xp;
  bumpActivity(3);
  save();
  return true;
}

export function uncompleteLesson(lessonId: string, xp: number): void {
  if (!state.completed[lessonId]) return;
  delete state.completed[lessonId];
  state.xp = Math.max(0, state.xp - xp);
  save();
}

export function toggleStep(lessonId: string, idx: number, on: boolean): void {
  const arr = new Set(state.steps[lessonId] ?? []);
  if (on) {
    if (!arr.has(idx)) bumpActivity(1);
    arr.add(idx);
  } else arr.delete(idx);
  state.steps[lessonId] = [...arr].sort((a, b) => a - b);
  save(false);
}

// ---- Ismétlőkártyák (Leitner) ----
const INTERVALS = [0, 1, 3, 7, 16, 35];

export function registerCard(id: string, q: string, a: string, lesson: string): void {
  const existing = state.cards[id];
  if (existing) {
    existing.q = q;
    existing.a = a;
    return;
  }
  state.cards[id] = { box: 0, due: today(), q, a, lesson };
}

export function dueCards(): [string, CardState][] {
  const t = today();
  return Object.entries(state.cards).filter(([, c]) => c.due <= t);
}

export function gradeCard(id: string, knew: boolean): void {
  const c = state.cards[id];
  if (!c) return;
  c.box = knew ? Math.min(c.box + 1, INTERVALS.length - 1) : 0;
  c.due = addDays(today(), knew ? INTERVALS[c.box] : 0);
  bumpActivity(1);
  save();
}

// ---- Export / import ----
export function exportJson(): string {
  return JSON.stringify(state, null, 2);
}

export function importJson(text: string): void {
  const parsed = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || parsed.version !== 1) {
    throw new Error("Ez nem egy Rozsda haladás-fájl.");
  }
  const base = fresh();
  Object.assign(state, base, parsed, {
    settings: { ...base.settings, ...parsed.settings },
    timer: base.timer,
  });
  save();
}

export function resetAll(): void {
  Object.assign(state, fresh());
  save();
}
