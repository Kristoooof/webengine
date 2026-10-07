// Fókusz-időzítő. Az állapot a store-ban van, így újratöltés után is fut tovább.
import { icon } from "./icons";
import { bumpActivity, save, state, subscribe } from "./store";
import { chime, modal } from "./ui";

export function remainingMs(): number {
  const t = state.timer;
  if (t.pausedLeft > 0) return t.pausedLeft;
  if (!t.endsAt) return 0;
  return Math.max(0, t.endsAt - Date.now());
}

export function running(): boolean {
  return state.timer.endsAt > 0 && state.timer.pausedLeft === 0;
}

export function active(): boolean {
  return state.timer.endsAt > 0 || state.timer.pausedLeft > 0;
}

export function start(mode: "focus" | "break", minutes?: number): void {
  const m = minutes ?? (mode === "focus" ? state.settings.focusMinutes : state.settings.breakMinutes);
  const ms = m * 60_000;
  state.timer = { mode, endsAt: Date.now() + ms, pausedLeft: 0, totalMs: ms };
  save();
}

export function pause(): void {
  if (!running()) return;
  state.timer.pausedLeft = remainingMs();
  save();
}

export function resume(): void {
  if (state.timer.pausedLeft <= 0) return;
  state.timer.endsAt = Date.now() + state.timer.pausedLeft;
  state.timer.pausedLeft = 0;
  save();
}

export function stop(): void {
  state.timer = { mode: "focus", endsAt: 0, pausedLeft: 0, totalMs: 0 };
  save();
}

function fmt(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function finish(): void {
  const mode = state.timer.mode;
  const mins = Math.round(state.timer.totalMs / 60_000);
  stop();
  chime();
  if (mode === "focus") {
    bumpActivity(Math.max(1, Math.round(mins / 5)));
    save();
    modal({
      icon: "coffee",
      title: "Szép munka! Jöhet egy szünet.",
      body: `<p>${mins} percig fókuszáltál. Állj fel, igyál egy pohár vizet, nézz ki az ablakon. A képernyőt most hagyd.</p><p class="muted">Tipp: mielőtt felállsz, írj egy mondatot a lecke jegyzetébe arról, hol tartasz. Így visszatérni is könnyű lesz.</p>`,
      actions: [
        { label: `${state.settings.breakMinutes} perc szünet`, kind: "primary", icon: "coffee", run: () => start("break") },
        { label: "Mára ennyi", kind: "ghost" },
      ],
    });
  } else {
    modal({
      icon: "zap",
      title: "Vége a szünetnek",
      body: `<p>Kezdjünk egy új kört? Elég csak a következő egy lépést megcsinálni.</p>`,
      actions: [
        { label: "Új fókuszkör", kind: "primary", icon: "play", run: () => start("focus") },
        { label: "Most nem", kind: "ghost" },
      ],
    });
  }
}

/** A sidebarban/fejlécben megjelenő vezérlő. */
export function mountTimer(host: HTMLElement): void {
  const render = () => {
    const left = remainingMs();
    const on = active();
    const t = state.timer;
    const pct = on && t.totalMs ? 1 - left / t.totalMs : 0;
    host.classList.toggle("timer-on", on);
    host.classList.toggle("timer-break", on && t.mode === "break");
    host.innerHTML = on
      ? `<div class="timer-bar" style="--p:${pct}"></div>
         <div class="timer-row">
           <span class="timer-label">${t.mode === "focus" ? "Fókusz" : "Szünet"}</span>
           <span class="timer-time">${fmt(left)}</span>
           <button type="button" class="icon-btn" data-act="${running() ? "pause" : "resume"}" aria-label="${running() ? "Szünet" : "Folytatás"}">${icon(running() ? "pause" : "play", 15)}</button>
           <button type="button" class="icon-btn" data-act="stop" aria-label="Leállítás">${icon("x", 15)}</button>
         </div>`
      : `<button type="button" class="timer-start" data-act="start">${icon("clock", 16)}<span>Fókusz ${state.settings.focusMinutes} perc</span></button>`;
  };
  host.addEventListener("click", (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
    if (act === "start") start("focus");
    if (act === "pause") pause();
    if (act === "resume") resume();
    if (act === "stop") stop();
    render();
  });
  render();
  setInterval(() => {
    if (running() && remainingMs() <= 0) finish();
    if (active()) render();
  }, 1000);
  subscribe(render);
}
