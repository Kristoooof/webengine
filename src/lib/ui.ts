import { icon } from "./icons";
import { state } from "./store";

export function h(html: string): HTMLElement {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

export function toast(text: string, kind: "ok" | "info" | "warn" = "info", ms = 3200): void {
  let host = document.querySelector<HTMLElement>(".toasts");
  if (!host) {
    host = h(`<div class="toasts" aria-live="polite"></div>`);
    document.body.append(host);
  }
  const ic = kind === "ok" ? "check" : kind === "warn" ? "alert" : "info";
  const el = h(`<div class="toast toast-${kind}">${icon(ic, 16)}<span></span></div>`);
  el.querySelector("span")!.textContent = text;
  host.append(el);
  requestAnimationFrame(() => el.classList.add("in"));
  setTimeout(() => {
    el.classList.remove("in");
    setTimeout(() => el.remove(), 300);
  }, ms);
}

export interface ModalAction {
  label: string;
  kind?: "primary" | "soft" | "ghost";
  icon?: string;
  run?: () => void;
}

export function modal(opts: { title: string; body: string; icon?: string; actions: ModalAction[]; celebrate?: boolean }): void {
  const el = h(`
    <div class="modal-wrap" role="dialog" aria-modal="true">
      <div class="modal ${opts.celebrate ? "modal-celebrate" : ""}">
        ${opts.icon ? `<div class="modal-icon">${icon(opts.icon, 28)}</div>` : ""}
        <h2></h2>
        <div class="modal-body">${opts.body}</div>
        <div class="modal-actions"></div>
      </div>
    </div>`);
  el.querySelector("h2")!.textContent = opts.title;
  const actions = el.querySelector(".modal-actions")!;
  const close = () => {
    el.classList.remove("in");
    document.removeEventListener("keydown", onKey);
    setTimeout(() => el.remove(), 220);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  for (const a of opts.actions) {
    const b = h(`<button type="button" class="btn btn-${a.kind ?? "soft"}">${a.icon ? icon(a.icon, 16) : ""}<span></span></button>`);
    b.querySelector("span")!.textContent = a.label;
    b.addEventListener("click", () => {
      close();
      a.run?.();
    });
    actions.append(b);
  }
  el.addEventListener("click", (e) => {
    if (e.target === el) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.append(el);
  requestAnimationFrame(() => el.classList.add("in"));
  if (opts.celebrate) confetti();
  (actions.querySelector(".btn-primary") as HTMLElement | null)?.focus();
}

export function prefersReducedMotion(): boolean {
  return state.settings.reduceMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function confetti(): void {
  if (prefersReducedMotion()) return;
  const colors = ["#f97316", "#fb923c", "#facc15", "#22c55e", "#3b82f6", "#a855f7"];
  const host = h(`<div class="confetti" aria-hidden="true"></div>`);
  for (let i = 0; i < 70; i++) {
    const p = document.createElement("i");
    p.style.left = Math.random() * 100 + "%";
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.25 + "s";
    p.style.animationDuration = 1.6 + Math.random() * 1.2 + "s";
    p.style.setProperty("--dx", (Math.random() - 0.5) * 240 + "px");
    p.style.setProperty("--rot", Math.random() * 720 + "deg");
    host.append(p);
  }
  document.body.append(host);
  setTimeout(() => host.remove(), 3200);
}

let audio: AudioContext | null = null;
export function chime(): void {
  if (!state.settings.sound) return;
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime;
    [660, 880, 1320].forEach((f, i) => {
      const o = audio!.createOscillator();
      const g = audio!.createGain();
      o.type = "sine";
      o.frequency.value = f;
      g.gain.setValueAtTime(0, now + i * 0.14);
      g.gain.linearRampToValueAtTime(0.12, now + i * 0.14 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.14 + 0.9);
      o.connect(g).connect(audio!.destination);
      o.start(now + i * 0.14);
      o.stop(now + i * 0.14 + 1);
    });
  } catch {
    /* nincs hang – nem baj */
  }
}

export function ring(pct: number, size = 44, stroke = 4, label = ""): string {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, pct)));
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--ring-track)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--accent)" stroke-width="${stroke}" stroke-linecap="round"
      stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${off.toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    ${label ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" class="ring-label">${label}</text>` : ""}
  </svg>`;
}
