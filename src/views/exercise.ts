// Egy kódolós feladat a leckében: szerkesztő, futtatás, ítélet, mentés.
import { icon } from "../lib/icons";
import { escapeHtml } from "../lib/markdown";
import { buildProgram, caseLabel, formatNs, judge, MAX_RATIO, type ExerciseSpec, type JudgeResult } from "../lib/harness";
import { bumpActivity, save, state } from "../lib/store";
import { confetti, toast } from "../lib/ui";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";

const SOLVED = new Set(["correct", "faster", "slow-ok"]);
const XP_BONUS = 25;

function md(s: string): string {
  return marked.parse(s, { async: false }) as string;
}

function codeHtml(code: string): string {
  const html = hljs.getLanguage("rust") ? hljs.highlight(code, { language: "rust" }).value : escapeHtml(code);
  return `<figure class="code" data-lang="rust"><figcaption><span>Mintamegoldás</span></figcaption><pre><code class="hljs language-rust">${html}</code></pre></figure>`;
}

function perfRow(r: JudgeResult): string {
  if (r.userNs === undefined || r.refNs === undefined || r.ratio === undefined) return "";
  const max = Math.max(r.userNs, r.refNs);
  const bar = (ns: number, cls: string) => `<i class="${cls}" style="width:${Math.max(4, (ns / max) * 100).toFixed(1)}%"></i>`;
  return `<div class="ex-perf">
    <div class="ex-perf-row"><span>A te kódod</span><div class="ex-perf-bar">${bar(r.userNs, "you")}</div><strong>${formatNs(r.userNs)}</strong></div>
    <div class="ex-perf-row"><span>Minta</span><div class="ex-perf-bar">${bar(r.refNs, "ref")}</div><strong>${formatNs(r.refNs)}</strong></div>
    <p class="ex-perf-note">${r.ratio <= 1 ? "Ugyanolyan gyors vagy gyorsabb, mint a minta." : `${r.ratio.toFixed(2).replace(".", ",")}× a minta idejéhez képest (a határ ${MAX_RATIO}×).`} Ugyanazon a gépen, ugyanazzal a bemenettel mérve.</p>
  </div>`;
}

function casesList(spec: ExerciseSpec, r: JudgeResult, onlyFailed: boolean): string {
  const rows = r.cases
    .filter((c) => !onlyFailed || !c.ok)
    .slice(0, 4)
    .map(
      (c) => `<li class="${c.ok ? "ok" : "bad"}">
        <code class="ex-case">${escapeHtml(caseLabel(spec.cases[c.index] ?? ""))}</code>
        ${
          c.ok
            ? ""
            : `<div class="ex-diff"><span>Elvárt:</span><code>${escapeHtml(c.expected ?? "")}</code><span>${c.panic ? "Pánik:" : "A tiéd:"}</span><code>${escapeHtml(c.panic ?? c.got ?? "")}</code></div>`
        }
      </li>`,
    )
    .join("");
  return rows ? `<ul class="ex-cases">${rows}</ul>` : "";
}

function resultHtml(spec: ExerciseSpec, r: JudgeResult): string {
  const total = spec.cases.length;
  const passed = r.cases.filter((c) => c.ok).length;
  const output = r.programOutput ? `<details class="ex-output"><summary>A programod kimenete (println!)</summary><pre>${escapeHtml(r.programOutput)}</pre></details>` : "";
  switch (r.verdict) {
    case "correct":
      return `<div class="ex-verdict ok">${icon("check", 18)}<div><strong>Helyes megoldás!</strong><p>Mind a ${total} bemenetre ugyanazt adja, mint a minta, és ugyanolyan gyors.</p></div></div>${perfRow(r)}${output}`;
    case "faster":
      return `<div class="ex-verdict ok">${icon("zap", 18)}<div><strong>Helyes megoldás, és gyorsabb a mintánál!</strong><p>Mind a ${total} bemenetre ugyanazt adja. Ezt a mintát lekörözted.</p></div></div>${perfRow(r)}${output}`;
    case "slow-ok":
      return `<div class="ex-verdict good">${icon("sparkles", 18)}<div><strong>Helyes megoldás, de van ennél optimálisabb</strong><p>Mind a ${total} bemenetre jó eredményt ad, csak egy kicsit lassabb a mintánál. Nézd meg, mitől gyorsabb a minta.</p></div></div>${perfRow(r)}
        <div class="ex-explain"><p class="ex-explain-title">${icon("bulb", 15)} Miért gyorsabb a minta?</p>${md(spec.explanation)}${codeHtml(spec.reference)}</div>${output}`;
    case "too-slow":
      return `<div class="ex-verdict bad">${icon("clock", 18)}<div><strong>Nem jó megoldás: helyes eredményt ad, de túl lassú</strong><p>Mind a ${total} bemenetre jó a válasza, de több mint ${MAX_RATIO}× annyi ideig fut, mint a minta. Keresd meg, hol dolgozik fölöslegesen!</p></div></div>${perfRow(r)}
        <details class="ex-tip"><summary>${icon("bulb", 15)} Tipp a gyorsításhoz</summary>${md(spec.explanation)}</details>${output}`;
    case "wrong":
      return `<div class="ex-verdict bad">${icon("x", 18)}<div><strong>Nem jó megoldás</strong><p>${passed} / ${total} bemenetre jó. Itt tér el a mintától:</p></div></div>${casesList(spec, r, true)}${output}`;
    case "compile-error":
      return `<div class="ex-verdict bad">${icon("alert", 18)}<div><strong>Nem fordul le</strong><p>Olvasd el a hibaüzenetet az elejétől. A <code>kódod:sor:oszlop</code> megmutatja, hol a hiba.</p></div></div><pre class="ex-compiler">${escapeHtml(r.compilerOutput ?? "")}</pre>`;
    case "timeout":
      return `<div class="ex-verdict bad">${icon("clock", 18)}<div><strong>Időtúllépés</strong><p>A program nem állt meg időben. Lehet, hogy végtelen ciklus van benne (például egy <code>while</code>, ami sosem lesz hamis).</p></div></div>${output}`;
    default:
      return `<div class="ex-verdict bad">${icon("alert", 18)}<div><strong>Váratlan hiba futás közben</strong><p>A program idő előtt leállt.</p></div></div>${r.compilerOutput ? `<pre class="ex-compiler">${escapeHtml(r.compilerOutput)}</pre>` : ""}${output}`;
  }
}

export function mountExercise(section: HTMLElement, spec: ExerciseSpec): void {
  const editorHost = section.querySelector<HTMLElement>(".ex-editor")!;
  const result = section.querySelector<HTMLElement>(".ex-result")!;
  const runBtn = section.querySelector<HTMLButtonElement>(".ex-run")!;
  const resetBtn = section.querySelector<HTMLButtonElement>(".ex-reset")!;
  const status = section.querySelector<HTMLElement>(".ex-status")!;
  let code = state.exercises[spec.id]?.code ?? spec.starter;
  let editor: { getValue(): string; setValue(c: string): void } | null = null;
  let saveTimer = 0;

  const persist = () => {
    const prev = state.exercises[spec.id] ?? { code };
    state.exercises[spec.id] = { ...prev, code };
    save(false);
  };

  const run = async () => {
    if (runBtn.disabled) return;
    code = editor?.getValue() ?? code;
    persist();
    runBtn.disabled = true;
    runBtn.classList.add("busy");
    result.hidden = false;
    result.innerHTML = `<div class="ex-running"><span class="spinner"></span><span>Fordítás és futtatás…</span></div>`;
    try {
      const { runRust } = await import("../lib/runner");
      const { code: program, userLine } = buildProgram(spec, code);
      const out = await runRust(program);
      const r = judge(spec, code, out, userLine);
      const where = out.runner === "local" ? "a gépeden (rustc)" : "a Rust Playgroundon";
      result.innerHTML = resultHtml(spec, r) + `<p class="ex-where">${icon("terminal", 13)} Futott: ${where}${out.note ? ` · ${escapeHtml(out.note)}` : ""}</p>`;
      const ex = state.exercises[spec.id] ?? { code };
      const firstSolve = SOLVED.has(r.verdict) && !ex.solvedAt;
      state.exercises[spec.id] = {
        ...ex,
        code,
        verdict: r.verdict,
        solvedAt: SOLVED.has(r.verdict) ? (ex.solvedAt ?? new Date().toISOString()) : ex.solvedAt,
      };
      bumpActivity(1);
      if (firstSolve) {
        state.xp += XP_BONUS;
        confetti();
        toast(`+${XP_BONUS} XP a megoldott feladatért`, "ok");
      }
      save();
      if (SOLVED.has(r.verdict)) status.innerHTML = `${icon("check", 13)}<span>Megoldva</span>`;
      status.classList.toggle("solved", Boolean(state.exercises[spec.id].solvedAt));
    } catch (e) {
      result.innerHTML = `<div class="ex-verdict bad">${icon("alert", 18)}<div><strong>Nem sikerült futtatni</strong><p>${escapeHtml(e instanceof Error ? e.message : String(e))}</p></div></div>`;
    } finally {
      runBtn.disabled = false;
      runBtn.classList.remove("busy");
      result.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  };

  runBtn.addEventListener("click", run);
  resetBtn.addEventListener("click", () => {
    if (!confirm("Visszaállítod a kezdő kódot? A mostani kódod elvész.")) return;
    code = spec.starter;
    editor?.setValue(code);
    persist();
    result.hidden = true;
  });

  import("../lib/editor")
    .then(({ createEditor }) => {
      editorHost.innerHTML = "";
      editor = createEditor(
        editorHost,
        code,
        (c) => {
          code = c;
          clearTimeout(saveTimer);
          saveTimer = window.setTimeout(persist, 400);
        },
        run,
      );
    })
    .catch(() => {
      /* ha a szerkesztő nem töltődik be, a sima <pre> marad, és a futtatás a mentett kóddal megy */
    });
}
