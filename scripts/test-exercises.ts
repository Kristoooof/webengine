// A leckék összes kódolós feladatának ellenőrzése valódi rustc-vel:
// a mintamegoldás "helyes", a `teszt-rossz` "nem jó", a `teszt-lassú` "lassú" ítéletet kell kapjon.
// Futtatás: node --experimental-strip-types scripts/test-exercises.ts [szűrő]
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildProgram, judge, parseExercise, type ExerciseSpec, type Verdict } from "../src/lib/harness.ts";

const dir = new URL("../content/lessons/", import.meta.url).pathname;
const filter = process.argv[2] ?? "";

function exercises(file: string): ExerciseSpec[] {
  const lines = readFileSync(join(dir, file), "utf8").split("\n");
  const out: ExerciseSpec[] = [];
  let fence = false;
  let block: { title: string; body: string[] } | null = null;
  let n = 0;
  for (const line of lines) {
    if (/^\s*```/.test(line)) fence = !fence;
    if (!fence && !block) {
      const m = line.match(/^:::exercise\s*(.*)$/);
      if (m) {
        block = { title: m[1], body: [] };
        continue;
      }
    }
    if (!fence && block && line.trim() === ":::") {
      out.push(parseExercise(`${file.replace(/\.md$/, "")}#x${n++}`, block.title, block.body.join("\n")));
      block = null;
      continue;
    }
    if (block) block.body.push(line);
  }
  return out;
}

function run(spec: ExerciseSpec, code: string): Verdict {
  const work = mkdtempSync(join(tmpdir(), "rozsda-ex-"));
  try {
    const { code: program, userLine } = buildProgram(spec, code);
    writeFileSync(join(work, "main.rs"), program);
    const c = spawnSync("rustc", ["--edition", "2024", "-O", "-o", join(work, "prog"), join(work, "main.rs")], { encoding: "utf8" });
    if (c.status !== 0) {
      const r = judge(spec, code, { compiled: false, stdout: "", stderr: c.stderr, timedOut: false }, userLine);
      console.log(r.compilerOutput);
      return r.verdict;
    }
    const p = spawnSync(join(work, "prog"), [], { encoding: "utf8", timeout: 10_000 });
    const r = judge(spec, code, { compiled: true, stdout: p.stdout ?? "", stderr: p.stderr ?? "", timedOut: p.error !== undefined }, userLine);
    const perf = r.ratio !== undefined ? ` (${r.ratio.toFixed(2)}×, minta ${r.refNs?.toFixed(0)} ns)` : "";
    const bad = r.cases.filter((x) => !x.ok).map((x) => `#${x.index}: ${x.panic ?? x.got} ≠ ${x.expected}`);
    process.stdout.write(`${r.verdict}${perf}${bad.length ? "  " + bad.slice(0, 2).join("; ") : ""}\n`);
    return r.verdict;
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

execFileSync("rustc", ["--version"], { stdio: "inherit" });
let failures = 0;
let total = 0;
for (const file of readdirSync(dir).filter((f) => f.endsWith(".md")).sort()) {
  for (const ex of exercises(file)) {
    if (filter && !ex.id.includes(filter)) continue;
    total++;
    const checks: [string, string, Verdict[]][] = [
      ["minta", ex.reference, ["correct", "faster"]],
      ["kezdő kód", ex.starter, ["wrong", "compile-error"]],
    ];
    if (ex.testWrong) checks.push(["rossz", ex.testWrong, ["wrong"]]);
    if (ex.testSlow) checks.push(["lassú", ex.testSlow, ["slow-ok", "too-slow"]]);
    for (const [label, code, allowed] of checks) {
      process.stdout.write(`${ex.id} ${ex.title} – ${label}: `);
      const v = run(ex, code);
      if (!allowed.includes(v)) {
        failures++;
        console.log(`   ✗ várt: ${allowed.join(" / ")}`);
      }
    }
  }
}
console.log(`\n${total} feladat, ${failures} hiba`);
process.exit(failures ? 1 : 0);
