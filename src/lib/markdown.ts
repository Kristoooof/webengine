import { Marked, type Tokens } from "marked";
import hljs from "highlight.js/lib/core";
import rust from "highlight.js/lib/languages/rust";
import toml from "highlight.js/lib/languages/ini";
import bash from "highlight.js/lib/languages/bash";
import powershell from "highlight.js/lib/languages/powershell";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import plaintext from "highlight.js/lib/languages/plaintext";
import diff from "highlight.js/lib/languages/diff";
import csharp from "highlight.js/lib/languages/csharp";
import cpp from "highlight.js/lib/languages/cpp";
import python from "highlight.js/lib/languages/python";
import { icon } from "./icons";
import { registerCard, state } from "./store";

hljs.registerLanguage("rust", rust);
hljs.registerLanguage("toml", toml);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("powershell", powershell);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("json", json);
hljs.registerLanguage("text", plaintext);
hljs.registerLanguage("diff", diff);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("python", python);

const LANG_LABEL: Record<string, string> = {
  rust: "Rust",
  toml: "TOML",
  bash: "Terminál",
  powershell: "PowerShell",
  html: "HTML",
  css: "CSS",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  text: "Kimenet",
  diff: "Változás",
  csharp: "C#",
  cpp: "C++",
  python: "Python",
};

// Ezeket nyugodtan lehet másolni: parancsok, konfiguráció, példaoldalak, előre megírt tesztek.
// A Rust-megoldásokat viszont be kell gépelni, mert attól marad meg.
const COPYABLE = new Set(["bash", "powershell", "toml", "json", "html", "css"]);

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export interface Heading {
  id: string;
  text: string;
}

function makeMarked(headings: Heading[]): Marked {
  const m = new Marked({ gfm: true, breaks: false });
  m.use({
    renderer: {
      code({ text, lang }: Tokens.Code): string {
        const info = (lang ?? "").trim().split(/[\s,]+/);
        let language = info[0] || "text";
        const isTest = info.includes("test");
        const title = info.slice(1).filter((x) => x !== "test").join(" ");
        if (!hljs.getLanguage(language)) language = "text";
        const html = hljs.highlight(text, { language, ignoreIllegals: true }).value;
        const copyable = COPYABLE.has(language) || isTest;
        const label = isTest ? "Teszt – ezt bemásolhatod" : title || LANG_LABEL[language] || language;
        const copyBtn = copyable
          ? `<button class="code-copy" type="button" aria-label="Másolás">${icon("copy", 14)}<span>Másolás</span></button>`
          : `<span class="code-type" title="A megoldás-kódot érdemes begépelni: így tanul a kezed is.">${icon("pen", 13)}gépeld be</span>`;
        return `<figure class="code ${isTest ? "code-test" : ""}" data-lang="${language}"><figcaption><span>${escapeHtml(label)}</span>${copyBtn}</figcaption><pre><code class="hljs language-${language}">${html}</code></pre></figure>`;
      },
      heading(this: { parser: { parseInline: (t: Tokens.Generic[]) => string } }, { tokens, depth }: Tokens.Heading): string {
        const inner = this.parser.parseInline(tokens);
        const id = slugify(inner);
        if (depth === 2) headings.push({ id, text: inner.replace(/<[^>]+>/g, "") });
        return `<h${depth} id="${id}">${inner}</h${depth}>`;
      },
      link({ href, title, tokens }: Tokens.Link): string {
        const text = this.parser.parseInline(tokens);
        const external = /^https?:/.test(href);
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        return external
          ? `<a href="${href}"${t} target="_blank" rel="noopener">${text}</a>`
          : `<a href="${href}"${t}>${text}</a>`;
      },
    },
  });
  return m;
}

interface Segment {
  kind: "md" | "block";
  type?: string;
  title?: string;
  body: string;
}

function segments(src: string): Segment[] {
  const out: Segment[] = [];
  const lines = src.replace(/\r\n/g, "\n").split("\n");
  let buf: string[] = [];
  let fence: string | null = null;
  let block: Segment | null = null;

  const flushMd = () => {
    if (buf.length) out.push({ kind: "md", body: buf.join("\n") });
    buf = [];
  };

  for (const line of lines) {
    const fm = line.match(/^\s*(```+|~~~+)/);
    if (fm) {
      if (!fence) fence = fm[1];
      else if (line.trim().startsWith(fence) && line.trim().replace(/[`~]/g, "") === "") fence = null;
    }
    if (!fence && !fm) {
      const start = line.match(/^:::([a-z]+)\s*(.*)$/);
      if (!block && start) {
        flushMd();
        block = { kind: "block", type: start[1], title: start[2].trim(), body: "" };
        continue;
      }
      if (block && line.trim() === ":::") {
        out.push(block);
        block = null;
        continue;
      }
    }
    if (block) block.body += (block.body ? "\n" : "") + line;
    else buf.push(line);
  }
  if (block) out.push(block);
  flushMd();
  return out;
}

export interface Rendered {
  html: string;
  headings: Heading[];
  stepCount: number;
  quizCount: number;
}

const CALLOUTS: Record<string, { icon: string; label: string }> = {
  goal: { icon: "target", label: "A mai cél" },
  note: { icon: "info", label: "Jó tudni" },
  tip: { icon: "bulb", label: "Tipp" },
  warn: { icon: "alert", label: "Figyelem" },
  task: { icon: "code", label: "Te jössz" },
  checkpoint: { icon: "terminal", label: "Ellenőrzőpont" },
  win: { icon: "trophy", label: "Amit ma építettél" },
  next: { icon: "arrow", label: "Legközelebb" },
  adhd: { icon: "zap", label: "ADHD-trükk" },
  compare: { icon: "layers", label: "Ismerős nyelveken" },
};

export function renderLesson(src: string, lessonId: string): Rendered {
  const headings: Heading[] = [];
  const md = makeMarked(headings);
  const parse = (s: string) => md.parse(s, { async: false }) as string;
  const inline = (s: string) => md.parseInline(s, { async: false }) as string;

  let step = 0;
  let quiz = 0;
  let card = 0;
  let hint = 0;
  let tabs = 0;
  const parts: string[] = [];

  for (const seg of segments(src)) {
    if (seg.kind === "md") {
      parts.push(parse(seg.body));
      continue;
    }
    const type = seg.type!;
    const title = seg.title ?? "";

    if (type === "steps") {
      const items: string[] = [];
      for (const line of seg.body.split("\n")) {
        if (/^- /.test(line)) items.push(line.slice(2));
        else if (items.length && line.trim()) items[items.length - 1] += " " + line.trim();
      }
      const done = new Set(state.steps[lessonId] ?? []);
      const lis = items
        .map((t) => {
          const i = step++;
          return `<li><label class="step"><input type="checkbox" data-step="${i}" ${done.has(i) ? "checked" : ""}/><span class="step-box">${icon("check", 14)}</span><span class="step-text">${inline(t)}</span></label></li>`;
        })
        .join("");
      parts.push(`<section class="steps"><header>${icon("flag", 16)}<span>${escapeHtml(title || "Lépések")}</span></header><ol>${lis}</ol></section>`);
      continue;
    }

    if (type === "quiz") {
      const qid = `${lessonId}#q${quiz++}`;
      const lines = seg.body.split("\n");
      const q: string[] = [];
      const opts: { text: string; ok: boolean }[] = [];
      const expl: string[] = [];
      for (const line of lines) {
        const o = line.match(/^- \[( |x)\] (.*)$/);
        if (o) opts.push({ ok: o[1] === "x", text: o[2] });
        else if (/^> ?/.test(line)) expl.push(line.replace(/^> ?/, ""));
        else if (!opts.length) q.push(line);
      }
      const chosen = state.quiz[qid];
      const answered = chosen !== undefined;
      const buttons = opts
        .map((o, i) => {
          const cls = answered ? (o.ok ? "ok" : i === chosen ? "bad" : "") : "";
          return `<button type="button" class="quiz-opt ${cls}" data-i="${i}" data-ok="${o.ok ? 1 : 0}" ${answered ? "disabled" : ""}><span class="quiz-mark">${String.fromCharCode(65 + i)}</span><span>${inline(o.text)}</span></button>`;
        })
        .join("");
      parts.push(
        `<section class="quiz ${answered ? "answered" : ""}" data-qid="${qid}"><header>${icon("help", 16)}<span>Gyors kérdés</span></header><div class="quiz-q">${parse(q.join("\n"))}</div><div class="quiz-opts">${buttons}</div><div class="quiz-expl" ${answered ? "" : "hidden"}>${parse(expl.join("\n"))}</div></section>`,
      );
      continue;
    }

    if (type === "card") {
      const cid = `${lessonId}#c${card++}`;
      const qm = seg.body.match(/^K:\s*([\s\S]*?)\nV:\s*([\s\S]*)$/m);
      const qText = qm ? qm[1].trim() : seg.body;
      const aText = qm ? qm[2].trim() : "";
      registerCard(cid, qText, aText, lessonId);
      parts.push(
        `<section class="flash" tabindex="0" role="button" aria-label="Kártya megfordítása"><header>${icon("review", 16)}<span>Ismétlőkártya</span><small>Kattints a megfordításhoz – bekerül az Ismétlésbe</small></header><div class="flash-inner"><div class="flash-face flash-q">${inline(qText)}</div><div class="flash-face flash-a">${parse(aText)}</div></div></section>`,
      );
      continue;
    }

    if (type === "hint") {
      const hints = seg.body.split(/\n---\n/).map((h) => parse(h));
      const id = `${lessonId}#h${hint++}`;
      const items = hints.map((h, i) => `<div class="hint-item" data-n="${i}" hidden><span class="hint-num">${i + 1}.</span><div>${h}</div></div>`).join("");
      parts.push(
        `<section class="hints" data-hid="${id}" data-count="${hints.length}"><header>${icon("buoy", 16)}<span>${escapeHtml(title || "Elakadtál?")}</span></header><p class="hints-lead">A tippek egyre többet árulnak el. Mindig csak egyet nyiss ki, aztán próbáld újra.</p>${items}<button type="button" class="btn btn-soft hint-next">${icon("bulb", 15)}<span>1. tipp mutatása</span></button></section>`,
      );
      continue;
    }

    if (type === "solution") {
      parts.push(
        `<section class="solution"><header>${icon("eye", 16)}<span>${escapeHtml(title || "Egy lehetséges megoldás")}</span></header><div class="solution-gate"><p>Megnézni nem csalás, de akkor ér a legtöbbet, ha előtte <strong>legalább 10 percig próbálkoztál</strong>, és a tippeket is megnézted. Ha megnézed, utána <strong>csukd be, és írd meg fejből</strong>.</p><button type="button" class="btn btn-soft solution-open">${icon("eye", 15)}<span>Megmutatom</span></button></div><div class="solution-body" hidden>${parse(seg.body)}</div></section>`,
      );
      continue;
    }

    if (type === "why") {
      parts.push(
        `<details class="deep"><summary>${icon("waves", 16)}<span><strong>Mélyvíz</strong>${title ? " – " + escapeHtml(title) : ""}</span><small>opcionális</small>${icon("down", 16, "deep-chev")}</summary><div class="deep-body">${parse(seg.body)}</div></details>`,
      );
      continue;
    }

    if (type === "tabs" || type === "compare") {
      const t = tabs++;
      const chunks = seg.body.split(/^@@ /m).filter((c) => c.trim());
      const labels = chunks.map((c) => c.split("\n")[0].trim());
      const bodies = chunks.map((c) => parse(c.split("\n").slice(1).join("\n")));
      const head = type === "compare" ? `<header>${icon("layers", 16)}<span>${escapeHtml(title || "Ismerős nyelveken")}</span></header>` : "";
      parts.push(
        `<section class="tabs ${type}" data-tabs="${t}">${head}<div class="tab-list" role="tablist">${labels
          .map((l, i) => `<button type="button" role="tab" class="tab ${i === 0 ? "active" : ""}" data-i="${i}">${escapeHtml(l)}</button>`)
          .join("")}</div>${bodies.map((b, i) => `<div class="tab-panel" data-i="${i}" ${i ? "hidden" : ""}>${b}</div>`).join("")}</section>`,
      );
      continue;
    }

    const c = CALLOUTS[type] ?? CALLOUTS.note;
    parts.push(
      `<section class="callout callout-${type}"><header>${icon(c.icon, 16)}<span>${escapeHtml(title || c.label)}</span></header><div class="callout-body">${parse(seg.body)}</div></section>`,
    );
  }

  return { html: parts.join("\n"), headings, stepCount: step, quizCount: quiz };
}
