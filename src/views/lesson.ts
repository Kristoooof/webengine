import { icon } from "../lib/icons";
import { LESSONS, lesson, lessonBody, neighbours } from "../lib/content";
import { escapeHtml, renderLesson } from "../lib/markdown";
import { bumpActivity, completeLesson, isDone, save, state, toggleStep, uncompleteLesson } from "../lib/store";
import { modal, ring, toast } from "../lib/ui";
import type { Cleanup } from "../main";

function claudePrompt(id: string, title: string): string {
  return `A "Rozsda – böngészőmotor Rustban" kurzus ${id} leckéjénél tartok ("${title}").
Elakadtam ennél a résznél: <ide írd, mit próbáltál>.
A hibaüzenet / a kódom: <ide másold>.
Kérlek, NE add meg a teljes megoldást. Adj egy kis tippet vagy egy kérdést, ami továbblendít, és magyarázd el, mit jelent a hibaüzenet.`;
}

async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function comingSoon(el: HTMLElement, id: string): void {
  const L = lesson(id)!;
  const { prev, next } = neighbours(id);
  const prompt = `Írd meg a Rozsda kurzus ${L.module.id}. moduljának („${L.module.title}”) leckéit a meglévő leckék stílusában, és told fel a repóba.`;
  el.innerHTML = `
    <div class="page page-lesson">
      <nav class="crumbs"><a href="#/terkep">Térkép</a>${icon("right", 14)}<a href="#/terkep/${L.module.id}">${escapeHtml(L.module.title)}</a></nav>
      <header class="lesson-head">
        <h1>${escapeHtml(L.title)}</h1>
        <div class="lesson-chips"><span class="chip chip-ghost">${icon("clock", 13)} kb. ${L.minutes} perc</span><span class="chip chip-ghost">${icon("lock", 13)} készül</span></div>
      </header>
      <section class="soon-card">
        <div class="soon-icon">${icon("sparkles", 28)}</div>
        <h2>Ez a lecke még készül</h2>
        <p>A kurzus modulonként bővül, hogy a tartalom mindig a te tempódhoz igazodjon. Ebben a modulban ezt fogod megtanulni:</p>
        <ul class="outcomes">${L.module.outcomes.map((o) => `<li>${icon("check", 14)}<span>${escapeHtml(o)}</span></li>`).join("")}</ul>
        <p class="muted small">Ha elérted ezt a pontot, kérd meg Claude-ot (Claude Code-ban, ebben a repóban), hogy írja meg a következő modult. Ezt a szöveget bemásolhatod neki:</p>
        <div class="prompt-box"><code>${escapeHtml(prompt)}</code><button type="button" class="btn btn-soft" id="copy-prompt">${icon("copy", 15)}<span>Másolás</span></button></div>
      </section>
      <nav class="lesson-nav">
        ${prev ? `<a class="nav-card" href="#/lecke/${prev.id}"><small>${icon("left", 13)} Előző</small><span>${escapeHtml(prev.title)}</span></a>` : "<span></span>"}
        ${next ? `<a class="nav-card right" href="#/lecke/${next.id}"><small>Következő ${icon("right", 13)}</small><span>${escapeHtml(next.title)}</span></a>` : "<span></span>"}
      </nav>
    </div>`;
  el.querySelector("#copy-prompt")?.addEventListener("click", async () => {
    if (await copy(prompt)) toast("Kimásolva", "ok");
  });
}

export function renderLessonView(el: HTMLElement, id: string): Cleanup {
  const L = lesson(id);
  if (!L) {
    el.innerHTML = `<div class="page"><h1>Nincs ilyen lecke</h1><p><a href="#/terkep">Vissza a térképre</a></p></div>`;
    return;
  }
  const body = lessonBody(id);
  if (!body) return comingSoon(el, id);

  state.lastLesson = id;
  save(false);

  const r = renderLesson(body, id);
  const { prev, next } = neighbours(id);
  const posInModule = L.module.lessons.findIndex((x) => x.id === id) + 1;
  const done = isDone(id);

  el.innerHTML = `
    <div class="progress-top"><i id="read-progress"></i></div>
    <div class="page page-lesson">
      <nav class="crumbs">
        <a href="#/terkep">Térkép</a>${icon("right", 14)}
        <a href="#/terkep/${L.module.id}">${escapeHtml(L.module.title)}</a>${icon("right", 14)}
        <span>${posInModule}/${L.module.lessons.length}</span>
      </nav>
      <div class="lesson-layout">
        <article class="lesson-main">
          <header class="lesson-head">
            <p class="eyebrow">${L.module.id === "00" ? "Indulás" : `${Number(L.module.id)}. modul`} · ${posInModule}. lecke</p>
            <h1>${escapeHtml(L.title)}</h1>
            <div class="lesson-chips">
              <span class="chip chip-ghost">${icon("clock", 13)} kb. ${L.minutes} perc</span>
              <span class="chip chip-ghost">${icon("star", 13)} ${L.xp} XP</span>
              ${r.stepCount ? `<span class="chip chip-ghost" id="step-chip">${icon("flag", 13)} <span>${(state.steps[id] ?? []).length}/${r.stepCount}</span> lépés</span>` : ""}
              ${done ? `<span class="chip chip-done">${icon("check", 13)} Kész</span>` : ""}
            </div>
          </header>
          <div class="prose" id="prose">${r.html}</div>

          <section class="lesson-end">
            <div class="note-block">
              <label for="note">${icon("pen", 15)} <strong>Üzenet a jövőbeli önmagadnak</strong></label>
              <p class="muted small">Hol tartasz, mi volt nehéz, mit akarsz legközelebb kipróbálni? Ezt a kezdőlapon is látni fogod.</p>
              <textarea id="note" rows="3" placeholder="pl. „A tokenizer működik, de a zárótageknél még összezavarodom.”">${escapeHtml(state.notes[id] ?? "")}</textarea>
            </div>
            <div class="complete-row">
              ${
                done
                  ? `<button type="button" class="btn btn-ghost" id="undo">${icon("review", 15)}<span>Mégsem kész</span></button>
                     ${next ? `<a class="btn btn-primary btn-lg" href="#/lecke/${next.id}"><span>Következő lecke</span>${icon("arrow", 16)}</a>` : ""}`
                  : `<button type="button" class="btn btn-primary btn-lg" id="complete">${icon("check", 16)}<span>Kész vagyok a leckével</span></button>`
              }
            </div>
          </section>

          <nav class="lesson-nav">
            ${prev ? `<a class="nav-card" href="#/lecke/${prev.id}"><small>${icon("left", 13)} Előző</small><span>${escapeHtml(prev.title)}</span></a>` : "<span></span>"}
            ${next ? `<a class="nav-card right" href="#/lecke/${next.id}"><small>Következő ${icon("right", 13)}</small><span>${escapeHtml(next.title)}</span></a>` : "<span></span>"}
          </nav>
        </article>

        <aside class="lesson-rail">
          <div class="rail-card">
            <div class="rail-progress">
              <span id="rail-ring">${ring(r.stepCount ? (state.steps[id] ?? []).length / r.stepCount : 0, 44, 4)}</span>
              <span><strong id="rail-count">${(state.steps[id] ?? []).length}/${r.stepCount}</strong><small>lépés kipipálva</small></span>
            </div>
            ${
              r.headings.length
                ? `<nav class="toc"><p class="toc-title">Ebben a leckében</p>${r.headings
                    .map((hd) => `<button type="button" data-target="${hd.id}">${escapeHtml(hd.text)}</button>`)
                    .join("")}</nav>`
                : ""
            }
          </div>
          <div class="rail-card stuck">
            <p class="toc-title">${icon("buoy", 14)} Elakadtál?</p>
            <ol class="stuck-list">
              <li>Olvasd el a hibaüzenetet <em>lassan</em>, az elejétől. A Rust fordító szinte mindig megmondja a megoldást.</li>
              <li>Nyisd ki a lecke tippjeit, mindig csak a következőt.</li>
              <li>Magyarázd el hangosan egy gumikacsának, mit csinál a kódod.</li>
              <li>Kérdezd meg Claude-ot, de tippet kérj, ne megoldást:</li>
            </ol>
            <button type="button" class="btn btn-soft btn-block" id="ask-claude">${icon("copy", 15)}<span>Kérdés-sablon másolása</span></button>
          </div>
        </aside>
      </div>
    </div>`;

  const prose = el.querySelector<HTMLElement>("#prose")!;

  const updateProgress = () => {
    const n = (state.steps[id] ?? []).length;
    const pct = r.stepCount ? n / r.stepCount : 0;
    el.querySelector("#rail-ring")!.innerHTML = ring(pct, 44, 4);
    el.querySelector("#rail-count")!.textContent = `${n}/${r.stepCount}`;
    const chip = el.querySelector("#step-chip span");
    if (chip) chip.textContent = `${n}/${r.stepCount}`;
  };

  // Lépések
  prose.querySelectorAll<HTMLInputElement>("input[data-step]").forEach((cb) => {
    cb.addEventListener("change", () => {
      toggleStep(id, Number(cb.dataset.step), cb.checked);
      updateProgress();
      if (cb.checked) cb.closest("li")?.classList.add("just-checked");
      const n = (state.steps[id] ?? []).length;
      if (cb.checked && n === r.stepCount && !isDone(id)) {
        toast("Minden lépés kipipálva! Ha megvan, jelöld késznek a leckét lent.", "ok", 4200);
      }
    });
  });

  // Kvízek
  prose.querySelectorAll<HTMLElement>(".quiz").forEach((q) => {
    q.querySelectorAll<HTMLButtonElement>(".quiz-opt").forEach((b) => {
      b.addEventListener("click", () => {
        const i = Number(b.dataset.i);
        state.quiz[q.dataset.qid!] = i;
        bumpActivity(1);
        save(false);
        q.classList.add("answered");
        q.querySelectorAll<HTMLButtonElement>(".quiz-opt").forEach((o) => {
          o.disabled = true;
          if (o.dataset.ok === "1") o.classList.add("ok");
        });
        if (b.dataset.ok !== "1") b.classList.add("bad");
        q.querySelector<HTMLElement>(".quiz-expl")!.hidden = false;
      });
    });
  });

  // Kártyák
  prose.querySelectorAll<HTMLElement>(".flash").forEach((f) => {
    const flip = () => f.classList.toggle("flipped");
    f.addEventListener("click", flip);
    f.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    });
  });
  save(false); // a renderelés során regisztrált kártyák mentése

  // Tippek
  prose.querySelectorAll<HTMLElement>(".hints").forEach((hs) => {
    const btn = hs.querySelector<HTMLButtonElement>(".hint-next")!;
    const items = [...hs.querySelectorAll<HTMLElement>(".hint-item")];
    let shown = 0;
    btn.addEventListener("click", () => {
      if (shown >= items.length) return;
      items[shown].hidden = false;
      shown++;
      const key = hs.dataset.hid!;
      state.hintsUsed[key] = Math.max(state.hintsUsed[key] ?? 0, shown);
      save(false);
      if (shown >= items.length) btn.remove();
      else btn.querySelector("span")!.textContent = `${shown + 1}. tipp mutatása`;
    });
  });

  // Megoldás
  prose.querySelectorAll<HTMLElement>(".solution").forEach((s) => {
    s.querySelector(".solution-open")?.addEventListener("click", () => {
      s.querySelector<HTMLElement>(".solution-gate")!.hidden = true;
      s.querySelector<HTMLElement>(".solution-body")!.hidden = false;
    });
  });

  // Fülek
  prose.querySelectorAll<HTMLElement>(".tabs").forEach((t) => {
    t.querySelectorAll<HTMLButtonElement>(".tab").forEach((b) => {
      b.addEventListener("click", () => {
        t.querySelectorAll(".tab").forEach((x) => x.classList.toggle("active", x === b));
        t.querySelectorAll<HTMLElement>(".tab-panel").forEach((p) => (p.hidden = p.dataset.i !== b.dataset.i));
      });
    });
  });

  // Kódmásolás
  prose.querySelectorAll<HTMLButtonElement>(".code-copy").forEach((b) => {
    b.addEventListener("click", async () => {
      const code = b.closest("figure")!.querySelector("code")!.innerText;
      if (await copy(code)) {
        b.classList.add("copied");
        b.querySelector("span")!.textContent = "Kimásolva";
        setTimeout(() => {
          b.classList.remove("copied");
          b.querySelector("span")!.textContent = "Másolás";
        }, 1600);
      }
    });
  });

  // Tartalomjegyzék
  el.querySelectorAll<HTMLButtonElement>(".toc button").forEach((b) => {
    b.addEventListener("click", () => document.getElementById(b.dataset.target!)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  });

  el.querySelector("#ask-claude")?.addEventListener("click", async () => {
    if (await copy(claudePrompt(id, L.title))) toast("Sablon kimásolva. Töltsd ki, és küldd el Claude-nak.", "ok");
  });

  // Jegyzet
  const note = el.querySelector<HTMLTextAreaElement>("#note")!;
  let nt = 0;
  note.addEventListener("input", () => {
    clearTimeout(nt);
    nt = window.setTimeout(() => {
      state.notes[id] = note.value;
      save(false);
    }, 300);
  });

  // Befejezés
  el.querySelector("#complete")?.addEventListener("click", () => {
    const left = r.stepCount - (state.steps[id] ?? []).length;
    const finish = () => {
      completeLesson(id, L.xp);
      const win = prose.querySelector(".callout-win .callout-body")?.innerHTML ?? "";
      const doneCount = Object.keys(state.completed).length;
      modal({
        celebrate: true,
        icon: "trophy",
        title: "Lecke kész!",
        body: `<p class="xp-pop">+${L.xp} XP</p>${win ? `<div class="win-recap">${win}</div>` : ""}<p class="muted">Ez volt a(z) ${doneCount}. elvégzett leckéd a ${LESSONS.length}-ból.${
          next ? ` Következő: <strong>${escapeHtml(next.title)}</strong> (${next.minutes} perc).` : ""
        }</p>`,
        actions: [
          ...(next ? [{ label: "Jöhet a következő", kind: "primary" as const, icon: "arrow", run: () => (location.hash = `#/lecke/${next.id}`) }] : []),
          { label: "Mára elég, büszke vagyok magamra", kind: "ghost" as const, run: () => (location.hash = "#/") },
        ],
      });
    };
    if (left > 0) {
      modal({
        icon: "flag",
        title: `Még ${left} lépés nincs kipipálva`,
        body: `<p>Semmi gond, ha kihagytál valamit. Szándékosan hagytad ki, vagy visszamész megnézni?</p>`,
        actions: [
          { label: "Késznek jelölöm", kind: "primary", icon: "check", run: finish },
          { label: "Visszamegyek", kind: "ghost" },
        ],
      });
    } else finish();
  });

  el.querySelector("#undo")?.addEventListener("click", () => {
    uncompleteLesson(id, L.xp);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });

  // Olvasási sáv
  const bar = el.querySelector<HTMLElement>("#read-progress")!;
  const onScroll = () => {
    const rect = prose.getBoundingClientRect();
    const total = rect.height - window.innerHeight * 0.6;
    const p = Math.max(0, Math.min(1, -rect.top / Math.max(1, total)));
    bar.style.transform = `scaleX(${p})`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}
