// Leckék ellenőrzése: minden fájlhoz tartozik-e lecke a tanmenetben, le vannak-e zárva a
// blokkok és kódblokkok, és minden kvíznek pontosan egy helyes válasza van-e.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = new URL("../content/lessons/", import.meta.url).pathname;
const curriculum = readFileSync(new URL("../content/curriculum.ts", import.meta.url), "utf8");
const ids = new Set();
for (const m of curriculum.matchAll(/mod\("(\d\d)"[\s\S]*?\]\),/g)) {
  for (const l of m[0].matchAll(/\["(\d\d)", "/g)) ids.add(`${m[1]}-${l[1]}`);
}

const KNOWN = new Set(["goal", "note", "tip", "warn", "task", "checkpoint", "win", "next", "adhd", "compare", "steps", "quiz", "card", "hint", "solution", "why", "tabs"]);
let errors = 0;
const fail = (f, msg) => {
  errors++;
  console.error(`✗ ${f}: ${msg}`);
};

for (const f of readdirSync(dir).filter((x) => x.endsWith(".md")).sort()) {
  const id = f.replace(/\.md$/, "");
  if (!ids.has(id)) fail(f, "nincs ilyen lecke a curriculum.ts-ben");
  const lines = readFileSync(join(dir, f), "utf8").split("\n");
  let fence = null;
  let block = null;
  let blockLine = 0;
  let quiz = null;
  lines.forEach((line, i) => {
    const fm = line.match(/^\s*(```+|~~~+)/);
    if (fm) {
      if (!fence) fence = fm[1];
      else if (line.trim().replace(/[`~]/g, "") === "") fence = null;
      return;
    }
    if (fence) return;
    const start = line.match(/^:::([a-z]+)/);
    if (start && !block) {
      block = start[1];
      blockLine = i + 1;
      if (!KNOWN.has(block)) fail(f, `${i + 1}. sor: ismeretlen blokk: ${block}`);
      if (block === "quiz") quiz = { ok: 0, opts: 0 };
      return;
    }
    if (start && block) fail(f, `${i + 1}. sor: egymásba ágyazott blokk (${start[1]} a ${block}-ban)`);
    if (line.trim() === ":::" && block) {
      if (block === "quiz" && (quiz.ok !== 1 || quiz.opts < 2)) fail(f, `${blockLine}. sor: a kvíznek ${quiz.ok} helyes válasza van (${quiz.opts} opció)`);
      block = null;
      quiz = null;
      return;
    }
    if (quiz) {
      const o = line.match(/^- \[( |x)\] /);
      if (o) {
        quiz.opts++;
        if (o[1] === "x") quiz.ok++;
      }
    }
  });
  if (fence) fail(f, "lezáratlan kódblokk");
  if (block) fail(f, `lezáratlan blokk: ${block} (${blockLine}. sor)`);
}

if (errors) {
  console.error(`\n${errors} hiba`);
  process.exit(1);
}
console.log(`✓ ${readdirSync(dir).filter((x) => x.endsWith(".md")).length} lecke rendben`);
