import { marked } from "marked";
import { GLOSSARY } from "../../content/glossary";
import { icon } from "../lib/icons";
import { escapeHtml } from "../lib/markdown";

export function renderGlossary(el: HTMLElement): void {
  const tags = ["Mind", ...new Set(GLOSSARY.map((t) => t.tag))];
  let tag = "Mind";
  let q = "";

  el.innerHTML = `
    <div class="page page-glossary">
      <header class="page-head">
        <p class="eyebrow">Fogalomtár</p>
        <h1>Szavak, amiket ismerni fogsz</h1>
        <p class="lead">Ha egy leckében ismeretlen szóba botlasz, itt megtalálod. Nem kell bemagolni: a használat során rögzül.</p>
      </header>
      <div class="glossary-tools">
        <label class="search">${icon("search", 16)}<input type="search" id="gq" placeholder="Keresés… (pl. borrow, DOM, TLS)" autocomplete="off"/></label>
        <div class="segmented" id="gtags">${tags.map((t) => `<button type="button" class="seg ${t === tag ? "active" : ""}" data-tag="${t}">${t}</button>`).join("")}</div>
      </div>
      <dl class="glossary" id="glist"></dl>
    </div>`;

  const list = el.querySelector<HTMLElement>("#glist")!;
  const draw = () => {
    const needle = q.toLowerCase();
    const items = GLOSSARY.filter((t) => (tag === "Mind" || t.tag === tag) && (!needle || (t.term + " " + (t.en ?? "") + " " + t.def).toLowerCase().includes(needle))).sort((a, b) =>
      a.term.localeCompare(b.term, "hu"),
    );
    list.innerHTML = items.length
      ? items
          .map(
            (t) => `<div class="term"><dt><strong>${escapeHtml(t.term)}</strong>${t.en ? `<em>${escapeHtml(t.en)}</em>` : ""}<span class="chip chip-ghost">${t.tag}</span></dt><dd>${marked.parseInline(t.def, { async: false })}</dd></div>`,
          )
          .join("")
      : `<p class="muted">Nincs találat. Ha hiányzik egy fogalom, írd az Ötletparkolóba, és kérd meg Claude-ot, hogy tegye be.</p>`;
  };
  el.querySelector<HTMLInputElement>("#gq")!.addEventListener("input", (e) => {
    q = (e.target as HTMLInputElement).value;
    draw();
  });
  el.querySelector("#gtags")!.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>("[data-tag]");
    if (!b) return;
    tag = b.dataset.tag!;
    el.querySelectorAll("#gtags .seg").forEach((s) => s.classList.toggle("active", s === b));
    draw();
  });
  draw();
}
