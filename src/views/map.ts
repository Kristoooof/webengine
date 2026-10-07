import { icon } from "../lib/icons";
import { ACTS, LESSONS, MODULES, moduleProgress, nextLesson, totals } from "../lib/content";
import { escapeHtml } from "../lib/markdown";
import { state } from "../lib/store";
import { ring } from "../lib/ui";

export function renderMap(el: HTMLElement, focus?: string): void {
  const t = totals();
  const next = nextLesson();
  const hours = Math.round(t.minutes / 60);
  const openId = focus || next?.module.id || "00";

  const acts = ACTS.map((act) => {
    const mods = MODULES.filter((m) => m.act === act.n)
      .map((m) => {
        const p = moduleProgress(m);
        const mins = m.lessons.reduce((a, l) => a + l.minutes, 0);
        const complete = p.done === p.total;
        const lessons = m.lessons
          .map((l, i) => {
            const L = LESSONS.find((x) => x.id === l.id)!;
            const done = Boolean(state.completed[l.id]);
            const cur = l.id === next?.id;
            return `<li><a class="lesson-row ${done ? "done" : ""} ${cur ? "current" : ""} ${L.available ? "" : "soon"}" href="#/lecke/${l.id}">
              <span class="lr-num">${done ? icon("check", 13) : i + 1}</span>
              <span class="lr-title">${escapeHtml(l.title)}</span>
              ${cur ? `<span class="chip chip-accent">Következő</span>` : ""}
              <span class="lr-min">${L.available ? `${icon("clock", 12)} ${l.minutes} perc` : "hamarosan"}</span>
            </a></li>`;
          })
          .join("");
        return `
          <details class="module ${complete ? "complete" : ""} ${p.available === 0 ? "upcoming" : ""}" id="m-${m.id}" ${m.id === openId ? "open" : ""}>
            <summary>
              <span class="module-num">${m.id === "00" ? icon("flag", 18) : Number(m.id)}</span>
              <span class="module-text">
                <strong>${escapeHtml(m.title)}</strong>
                <small>${escapeHtml(m.tagline)}</small>
              </span>
              <span class="module-meta">
                <small>${m.lessons.length} lecke · ~${Math.round(mins / 6) / 10} óra</small>
                ${p.available === 0 ? `<span class="chip chip-ghost">készül</span>` : ring(p.done / p.total, 34, 3.5)}
              </span>
              ${icon("down", 18, "module-chev")}
            </summary>
            <div class="module-body">
              <ul class="outcomes">${m.outcomes.map((o) => `<li>${icon("check", 14)}<span>${escapeHtml(o)}</span></li>`).join("")}</ul>
              <ol class="lesson-list">${lessons}</ol>
            </div>
          </details>`;
      })
      .join("");
    return `
      <section class="act">
        <header class="act-head">
          <span class="act-num">${["I", "II", "III", "IV", "V"][act.n - 1]}. felvonás</span>
          <h2>${escapeHtml(act.title)}</h2>
          <p class="muted">${escapeHtml(act.subtitle)}</p>
        </header>
        <div class="modules">${mods}</div>
      </section>`;
  }).join("");

  el.innerHTML = `
    <div class="page page-map">
      <header class="page-head">
        <p class="eyebrow">A teljes út</p>
        <h1>Nulláról a saját böngészőig</h1>
        <p class="lead">${MODULES.length} modul, ${t.total} lecke, nagyjából ${hours} óra tiszta munka. 15–25 perces darabokban ez heti 3–4 alkalommal is szépen halad. Senki nem várja, hogy egyben megcsináld.</p>
        <div class="map-summary">
          <span>${ring(t.done / t.total, 52, 5, `${Math.round((t.done / t.total) * 100)}%`)}</span>
          <span><strong>${t.done} / ${t.total}</strong> lecke kész<br/><small class="muted">${t.available} lecke már elérhető, a többi folyamatosan érkezik</small></span>
        </div>
      </header>
      ${acts}
    </div>`;

  if (focus) {
    requestAnimationFrame(() => document.getElementById(`m-${focus}`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
  }
}
