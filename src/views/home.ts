import { icon } from "../lib/icons";
import { LESSONS, levelFor, moduleProgress, nextLesson, totals } from "../lib/content";
import { addDays, dueCards, save, state, streak, today } from "../lib/store";
import { start } from "../lib/timer";
import { escapeHtml } from "../lib/markdown";
import { ring } from "../lib/ui";

const STARTER_TIPS = [
  "Ne az egész leckét akard megcsinálni. Csak nyisd meg, és pipáld ki az első lépést. A többi magától jön.",
  "Az „5 perc” gomb nem trükk: tényleg abbahagyhatod 5 perc után. Általában nem fogod.",
  "Tedd el a telefont egy másik szobába. Nem kell elzárni, elég, ha macerás érte menni.",
  "Ha elkalandozik a figyelmed, írd az ötletet az Ötletparkolóba. Nem veszik el, és nem kell most foglalkozni vele.",
  "A tegnapi önmagad hagyott neked jegyzetet a lecke alján. Kezdd azzal.",
  "Body doubling: kapcsolj be egy „study with me” videót, vagy dolgozz valaki mellett. Nem kell beszélgetni.",
  "Ha elakadtál, az nem kudarc, hanem adat. Nyisd ki az első tippet, és próbáld újra.",
  "A sorozat (streak) a lényeg, nem a mennyiség. Egy kipipált lépés is aktív napnak számít.",
  "Zene? Próbálj ki szöveg nélküli zenét, lo-fit vagy barna zajt. Az ADHD-s agynak sokszor segít.",
  "A hiperfókusz jó dolog, de állíts be időzítőt. A 3 óra kódolás után ránk törő kimerültség miatt holnap nehezebb lesz elkezdeni.",
];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Szép éjszakát";
  if (h < 10) return "Jó reggelt";
  if (h < 18) return "Szia";
  return "Jó estét";
}

function heatmap(): string {
  const weeks = 16;
  const t = today();
  const now = new Date();
  const dow = (now.getDay() + 6) % 7; // hétfő = 0
  const startDay = addDays(t, -(weeks - 1) * 7 - dow);
  const cols: string[] = [];
  for (let w = 0; w < weeks; w++) {
    const cells: string[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(startDay, w * 7 + d);
      const future = day > t;
      const v = state.activity[day] ?? 0;
      const lvl = v === 0 ? 0 : v < 3 ? 1 : v < 6 ? 2 : v < 10 ? 3 : 4;
      cells.push(`<i class="hm l${lvl} ${future ? "future" : ""} ${day === t ? "today" : ""}" title="${day}: ${v} pont"></i>`);
    }
    cols.push(`<div class="hm-col">${cells.join("")}</div>`);
  }
  const days = ["H", "", "Sze", "", "P", "", "V"].map((d) => `<span>${d}</span>`).join("");
  return `<div class="heatmap-wrap"><div class="hm-days" aria-hidden="true">${days}</div><div class="heatmap">${cols.join("")}</div></div>`;
}

export function renderHome(el: HTMLElement): void {
  const next = nextLesson();
  const t = totals();
  const lv = levelFor(state.xp);
  const s = streak();
  const due = dueCards().length;
  let tipIndex = Math.floor(Date.now() / 86_400_000) % STARTER_TIPS.length;
  const tip = STARTER_TIPS[tipIndex];
  const firstTime = Object.keys(state.completed).length === 0 && Object.keys(state.steps).length === 0;

  let hero: string;
  if (next) {
    const steps = state.steps[next.id]?.length ?? 0;
    const started = steps > 0;
    const mp = moduleProgress(next.module);
    hero = `
      <section class="continue card-glow">
        <div class="continue-meta">
          <span class="chip">${next.module.id === "00" ? "" : `${Number(next.module.id)}. modul · `}${escapeHtml(next.module.title)}</span>
          <span class="chip chip-ghost">${icon("clock", 13)} ${next.minutes} perc</span>
          <span class="chip chip-ghost">${icon("star", 13)} +${next.xp} XP</span>
        </div>
        <h2>${escapeHtml(next.title)}</h2>
        <p class="muted">${
          firstTime
            ? "Itt kezdődik minden. Az első lecke rövid, és elmagyarázza, hogyan hozod ki a legtöbbet a kurzusból."
            : started
              ? `Már ${steps} lépést kipipáltál. Ott folytatod, ahol abbahagytad.`
              : `A modulban ${mp.done}/${mp.total} lecke kész.`
        }</p>
        ${state.notes[next.id] ? `<blockquote class="note-peek">${icon("pen", 14)}<span><strong>Ezt írtad magadnak:</strong> ${escapeHtml(state.notes[next.id].slice(0, 220))}</span></blockquote>` : ""}
        <div class="continue-actions">
          <a class="btn btn-primary btn-lg" href="#/lecke/${next.id}">${icon("play", 16)}<span>${firstTime ? "Kezdjük" : "Folytatom"}</span></a>
          <button type="button" class="btn btn-soft btn-lg" id="five">${icon("zap", 16)}<span>Csak 5 perc</span></button>
        </div>
        <p class="five-explain">Az „5 perc” egy rövid időzítőt indít. Ha lejár, nyugodtan abbahagyhatod, az is győzelem.</p>
      </section>`;
  } else {
    hero = `
      <section class="continue card-glow">
        <div class="continue-meta"><span class="chip">${icon("trophy", 13)} Minden elérhető lecke kész</span></div>
        <h2>Utolérted a kurzust!</h2>
        <p class="muted">Mind a ${t.available} elérhető leckét elvégezted. A következő modul készül; addig ismételj, vagy fejleszd tovább a Rozsdát a saját ötleteid szerint.</p>
        <div class="continue-actions"><a class="btn btn-primary btn-lg" href="#/ismetles">${icon("review", 16)}<span>Ismétlés</span></a></div>
      </section>`;
  }

  const current = next?.module;
  const moduleList = current
    ? current.lessons
        .map((l) => {
          const L = LESSONS.find((x) => x.id === l.id)!;
          const done = Boolean(state.completed[l.id]);
          return `<a class="mini-lesson ${done ? "done" : ""} ${l.id === next?.id ? "current" : ""} ${L.available ? "" : "soon"}" href="#/lecke/${l.id}">
            <span class="mini-dot">${done ? icon("check", 12) : ""}</span>
            <span class="mini-title">${escapeHtml(l.title)}</span>
            <span class="mini-min">${L.available ? `${l.minutes}′` : "hamarosan"}</span></a>`;
        })
        .join("")
    : "";

  el.innerHTML = `
    <div class="page page-home">
      <header class="page-head">
        <p class="eyebrow">${cap(new Date().toLocaleDateString("hu-HU", { weekday: "long", month: "long", day: "numeric" }))}</p>
        <h1>${greeting()}! <span class="muted">Mi lesz a mai egy lépés?</span></h1>
      </header>

      ${hero}

      <section class="stats">
        <div class="stat">
          <span class="stat-ic flame">${icon("flame", 18)}</span>
          <strong>${s}</strong><small>nap sorozat</small>
        </div>
        <div class="stat">
          <span class="stat-ic">${icon("book", 18)}</span>
          <strong>${t.done}<span class="muted">/${t.total}</span></strong><small>lecke kész</small>
        </div>
        <div class="stat">
          ${ring(lv.into / lv.need, 34, 4)}
          <strong>${lv.level}. szint</strong><small>${escapeHtml(lv.title)}</small>
        </div>
        <a class="stat" href="#/ismetles">
          <span class="stat-ic">${icon("review", 18)}</span>
          <strong>${due}</strong><small>kártya ismétlésre</small>
        </a>
      </section>

      <div class="home-grid">
        <section class="panel">
          <header class="panel-head"><h3>Aktivitás</h3><span class="muted small">Az utolsó 16 hét</span></header>
          ${heatmap()}
          <p class="muted small">Minden kipipált lépés, lecke és ismétlés számít. Egy kis lépés is zöld nap.</p>
        </section>

        <section class="panel tip-panel">
          <header class="panel-head"><h3>${icon("zap", 16)} Ha nehéz elkezdeni</h3></header>
          <p id="tip-text">${tip}</p>
          <button type="button" class="btn btn-ghost tip-next" id="tip-next">${icon("review", 15)}<span>Másik tipp</span></button>
        </section>

        ${
          current
            ? `<section class="panel span-2">
          <header class="panel-head"><h3>${escapeHtml(current.title)}</h3><a class="link" href="#/terkep/${current.id}">Térkép ${icon("right", 14)}</a></header>
          <div class="mini-lessons">${moduleList}</div>
        </section>`
            : ""
        }

        <section class="panel span-2">
          <header class="panel-head"><h3>${icon("pen", 16)} Ötletparkoló</h3><span class="muted small">Ide mehet minden, ami közben eszedbe jut</span></header>
          <textarea id="parking" class="parking" rows="4" placeholder="pl. „meg kéne nézni, hogyan csinálja a Firefox a tabokat” vagy „venni kell kávét”">${escapeHtml(state.parking)}</textarea>
        </section>
      </div>
    </div>`;

  el.querySelector("#five")?.addEventListener("click", () => {
    start("focus", 5);
    if (next) location.hash = `#/lecke/${next.id}`;
  });
  el.querySelector("#tip-next")?.addEventListener("click", () => {
    tipIndex = (tipIndex + 1) % STARTER_TIPS.length;
    el.querySelector("#tip-text")!.textContent = STARTER_TIPS[tipIndex];
  });
  const ta = el.querySelector<HTMLTextAreaElement>("#parking")!;
  let tmr = 0;
  ta.addEventListener("input", () => {
    clearTimeout(tmr);
    tmr = window.setTimeout(() => {
      state.parking = ta.value;
      save(false);
    }, 300);
  });
}
