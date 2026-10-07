import { marked } from "marked";
import { icon } from "../lib/icons";
import { lesson } from "../lib/content";
import { escapeHtml } from "../lib/markdown";
import { dueCards, gradeCard, state } from "../lib/store";
import { confetti } from "../lib/ui";

export function renderReview(el: HTMLElement): () => void {
  let queue = dueCards().map(([id]) => id);
  const total = queue.length;
  let knewCount = 0;
  let revealed = false;

  const draw = () => {
    if (!queue.length) {
      const all = Object.values(state.cards);
      const upcoming = all.map((c) => c.due).sort()[0];
      el.innerHTML = `
        <div class="page page-review">
          <header class="page-head">
            <p class="eyebrow">Ismétlés</p>
            <h1>${total ? "Mára kész vagy!" : all.length ? "Most nincs mit ismételni" : "Még nincsenek kártyáid"}</h1>
            <p class="lead">${
              total
                ? `${total} kártyát néztél át, ebből ${knewCount}-t tudtál. Az agyad most rögzíti őket.`
                : all.length
                  ? `${all.length} kártyád van. A következő ismétlés: <strong>${upcoming}</strong>.`
                  : "A leckékben lévő ismétlőkártyák automatikusan ide kerülnek, amint megnyitod a leckét."
            }</p>
          </header>
          <section class="panel explain">
            <h3>${icon("info", 16)} Hogyan működik?</h3>
            <p>Ez egy egyszerűsített <strong>Leitner-rendszer</strong>. Amit tudtál, az egyre ritkábban jön elő (1, 3, 7, 16, 35 nap múlva). Amit nem, az holnap újra. Így a Rust és a böngészők fogalmai hosszú távon megmaradnak, napi 2–3 perc ismétléssel.</p>
          </section>
          <div class="center-row"><a class="btn btn-primary" href="#/">${icon("home", 16)}<span>Vissza a kezdőlapra</span></a></div>
        </div>`;
      if (total) confetti();
      return;
    }
    const id = queue[0];
    const c = state.cards[id];
    const L = lesson(c.lesson);
    const done = total - queue.length;
    el.innerHTML = `
      <div class="page page-review">
        <header class="page-head">
          <p class="eyebrow">Ismétlés · ${done + 1} / ${total}</p>
          <div class="review-bar"><i style="transform:scaleX(${done / total})"></i></div>
        </header>
        <section class="review-card ${revealed ? "revealed" : ""}">
          <small class="muted">${L ? escapeHtml(L.title) : ""}</small>
          <div class="review-q">${marked.parseInline(c.q, { async: false })}</div>
          ${revealed ? `<div class="review-a">${marked.parse(c.a, { async: false })}</div>` : ""}
        </section>
        <div class="review-actions">
          ${
            revealed
              ? `<button type="button" class="btn btn-soft btn-lg" data-g="0">${icon("x", 16)}<span>Nem tudtam</span></button>
                 <button type="button" class="btn btn-primary btn-lg" data-g="1">${icon("check", 16)}<span>Tudtam</span></button>`
              : `<button type="button" class="btn btn-primary btn-lg" data-g="show">${icon("eye", 16)}<span>Mutasd a választ</span></button>`
          }
        </div>
        <p class="muted small center">Billentyűk: <kbd>Szóköz</kbd> válasz, <kbd>1</kbd> nem tudtam, <kbd>2</kbd> tudtam</p>
      </div>`;
  };

  const act = (g: string) => {
    if (g === "show") {
      revealed = true;
    } else if (revealed) {
      const id = queue.shift()!;
      const knew = g === "1";
      if (knew) knewCount++;
      gradeCard(id, knew);
      if (!knew) queue.push(id); // ma még egyszer előjön
      revealed = false;
    }
    draw();
  };

  el.addEventListener("click", (e) => {
    const g = (e.target as HTMLElement).closest<HTMLElement>("[data-g]")?.dataset.g;
    if (g) act(g);
  });
  const onKey = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).matches("input, textarea")) return;
    if (e.key === " " && !revealed && queue.length) {
      e.preventDefault();
      act("show");
    } else if (revealed && (e.key === "1" || e.key === "2")) act(e.key === "2" ? "1" : "0");
  };
  document.addEventListener("keydown", onKey);
  draw();
  return () => document.removeEventListener("keydown", onKey);
}
