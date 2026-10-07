// A kódolós feladatok "bírája". Nem azt nézi, hogy a kód ugyanaz-e, hanem hogy ugyanazt
// csinálja-e: a tanuló kódja és a mintamegoldás ugyanabba a programba kerül, ugyanazokat
// a bemeneteket kapják, az eredményüket összehasonlítjuk, és ugyanazon a gépen mérjük őket.
// Ez a fájl szándékosan nem függ semmitől, így Node-ból is tesztelhető (scripts/test-exercises.ts).

export interface ExerciseSpec {
  id: string;
  title: string;
  prompt: string; // markdown
  starter: string;
  reference: string;
  explanation: string; // markdown: miért optimális a minta
  given: string; // mindkét modul számára közös kód (típusok)
  cases: string[]; // kifejezések, pl. `strip_tags("<p>a</p>")`
  benchSetup: string;
  benchExpr: string;
  testWrong: string; // csak teszteléshez: egy hibás megoldás
  testSlow: string; // csak teszteléshez: egy lassú megoldás
}

export type Verdict = "correct" | "faster" | "slow-ok" | "too-slow" | "wrong" | "compile-error" | "timeout" | "error";

export interface CaseResult {
  index: number;
  ok: boolean;
  got?: string;
  expected?: string;
  panic?: string;
}

export interface JudgeResult {
  verdict: Verdict;
  cases: CaseResult[];
  userNs?: number;
  refNs?: number;
  ratio?: number;
  compilerOutput?: string;
  programOutput?: string;
}

export const MARK = "@@ROZSDA@@";

/** Ennyivel lehet lassabb a minta mérésénél úgy, hogy még „egyszerűen helyes”: a mérési zaj miatt. */
export const NOISE = 1.3;
/** Ennél lassabb megoldás már nem fogadható el. */
export const MAX_RATIO = 2.0;

function indent(code: string, n = 4): string {
  const pad = " ".repeat(n);
  return code
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
}

function moduleBody(code: string, spec: ExerciseSpec): string {
  const cases = spec.cases
    .map((c, i) => `            ${i} => format!("{:?}", { ${c} }),`)
    .join("\n");
  const bench = spec.benchExpr
    ? `    pub fn __rozsda_bench() -> Box<dyn FnMut()> {
${indent(spec.benchSetup, 8)}
        Box::new(move || {
            std::hint::black_box({ ${spec.benchExpr} });
        })
    }`
    : `    pub fn __rozsda_bench() -> Box<dyn FnMut()> {
        Box::new(|| {})
    }`;
  return `    #[allow(unused_imports)]
    use super::adott::*;

// ROZSDA_CODE_START
${code}
// ROZSDA_CODE_END

    pub fn __rozsda_case(i: usize) -> String {
        match i {
${cases}
            _ => unreachable!(),
        }
    }

${bench}`;
}

/** Az elkészült Rust-program, és hogy hányadik sorban kezdődik benne a tanuló kódja. */
export function buildProgram(spec: ExerciseSpec, userCode: string): { code: string; userLine: number } {
  const head = `#![allow(unused)]

mod adott {
${indent(spec.given)}
}

mod user {
`;
  const userLine = head.split("\n").length + 4; // a moduleBody első 4 sora után
  const program = `${head}${moduleBody(userCode, spec)}
}

mod reference {
${moduleBody(spec.reference, spec)}
}

use std::time::Instant;

fn esc(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    for c in s.chars() {
        match c {
            '"' => out.push_str("\\\\\\""),
            '\\\\' => out.push_str("\\\\\\\\"),
            '\\n' => out.push_str("\\\\n"),
            '\\r' => out.push_str("\\\\r"),
            '\\t' => out.push_str("\\\\t"),
            c if (c as u32) < 0x20 => out.push_str(&format!("\\\\u{:04x}", c as u32)),
            c => out.push(c),
        }
    }
    out
}

fn panic_message(p: Box<dyn std::any::Any + Send>) -> String {
    if let Some(s) = p.downcast_ref::<&str>() {
        s.to_string()
    } else if let Some(s) = p.downcast_ref::<String>() {
        s.clone()
    } else {
        String::from("pánik")
    }
}

fn measure(f: &mut Box<dyn FnMut()>) -> f64 {
    let mut iters: u64 = 1;
    loop {
        let t = Instant::now();
        for _ in 0..iters {
            f();
        }
        let e = t.elapsed();
        if e.as_micros() >= 3000 || e.as_millis() >= 200 || iters >= (1 << 30) {
            return e.as_nanos() as f64 / iters as f64;
        }
        iters *= 2;
    }
}

fn main() {
    std::panic::set_hook(Box::new(|_| {}));
    let n = ${spec.cases.length};
    let mut all_ok = true;
    for i in 0..n {
        let expected = reference::__rozsda_case(i);
        match std::panic::catch_unwind(|| user::__rozsda_case(i)) {
            Ok(got) => {
                let ok = got == expected;
                all_ok &= ok;
                println!("${MARK}{{\\"t\\":\\"case\\",\\"i\\":{},\\"ok\\":{},\\"got\\":\\"{}\\",\\"exp\\":\\"{}\\"}}", i, ok, esc(&got), esc(&expected));
            }
            Err(p) => {
                all_ok = false;
                println!("${MARK}{{\\"t\\":\\"case\\",\\"i\\":{},\\"ok\\":false,\\"panic\\":\\"{}\\",\\"exp\\":\\"{}\\"}}", i, esc(&panic_message(p)), esc(&expected));
            }
        }
    }
    if all_ok && ${spec.benchExpr ? "true" : "false"} {
        let mut u = user::__rozsda_bench();
        let mut r = reference::__rozsda_bench();
        let mut best_u = f64::MAX;
        let mut best_r = f64::MAX;
        let start = Instant::now();
        for round in 0..7 {
            if round % 2 == 0 {
                best_r = best_r.min(measure(&mut r));
                best_u = best_u.min(measure(&mut u));
            } else {
                best_u = best_u.min(measure(&mut u));
                best_r = best_r.min(measure(&mut r));
            }
            if start.elapsed().as_millis() > 2500 {
                break;
            }
        }
        println!("${MARK}{{\\"t\\":\\"bench\\",\\"user\\":{},\\"ref\\":{}}}", best_u, best_r);
    }
    println!("${MARK}{{\\"t\\":\\"done\\"}}");
}
`;
  return { code: program, userLine };
}

/** A fordító kimenetének rendbetétele: a sorszámok a tanuló kódjára mutassanak, a zaj tűnjön el. */
export function cleanCompilerOutput(stderr: string, userLine: number, userLines: number): string {
  return stderr
    .split("\n")
    .filter((l) => !/^\s*(Compiling|Finished|Running|Updating|Downloading|Downloaded|Blocking)\b/.test(l))
    .filter((l) => !/^error: could not compile/.test(l))
    .map((l) =>
      l
        .replace(/(?:[^\s:]*[\\/])?main\.rs:(\d+):(\d+)/g, (m, line, col) => {
          const n = Number(line) - userLine + 1;
          return n >= 1 && n <= userLines ? `kódod:${n}:${col}` : m;
        })
        .replace(/^(\s*)(\d+)( \|)/, (m, sp, line, bar) => {
          const n = Number(line) - userLine + 1;
          return n >= 1 && n <= userLines ? `${sp}${String(n).padStart(line.length)}${bar}` : m;
        }),
    )
    .join("\n")
    .trim();
}

export interface RunOutput {
  compiled: boolean;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function judge(spec: ExerciseSpec, userCode: string, out: RunOutput, userLine: number): JudgeResult {
  const userLines = userCode.split("\n").length;
  if (!out.compiled) {
    return { verdict: "compile-error", cases: [], compilerOutput: cleanCompilerOutput(out.stderr, userLine, userLines) };
  }
  const cases: CaseResult[] = [];
  let bench: { user: number; ref: number } | undefined;
  let done = false;
  const programLines: string[] = [];
  for (const line of out.stdout.split("\n")) {
    const at = line.indexOf(MARK);
    if (at < 0) {
      if (line.trim()) programLines.push(line);
      continue;
    }
    if (at > 0) programLines.push(line.slice(0, at));
    try {
      const msg = JSON.parse(line.slice(at + MARK.length));
      if (msg.t === "case") cases.push({ index: msg.i, ok: msg.ok, got: msg.got, expected: msg.exp, panic: msg.panic });
      if (msg.t === "bench") bench = { user: msg.user, ref: msg.ref };
      if (msg.t === "done") done = true;
    } catch {
      /* hibás sor: figyelmen kívül */
    }
  }
  const programOutput = programLines.join("\n").slice(0, 4000);
  if (out.timedOut) return { verdict: "timeout", cases, programOutput };
  if (!done && cases.length < spec.cases.length) {
    return { verdict: "error", cases, programOutput, compilerOutput: cleanCompilerOutput(out.stderr, userLine, userLines) };
  }
  if (cases.some((c) => !c.ok)) return { verdict: "wrong", cases, programOutput };
  if (!bench) return { verdict: "correct", cases, programOutput };
  const ratio = bench.user / Math.max(bench.ref, 1e-3);
  const base = { cases, userNs: bench.user, refNs: bench.ref, ratio, programOutput };
  if (ratio > MAX_RATIO) return { verdict: "too-slow", ...base };
  if (ratio > NOISE) return { verdict: "slow-ok", ...base };
  if (ratio < 0.8) return { verdict: "faster", ...base };
  return { verdict: "correct", ...base };
}

/** Egy `:::exercise` blokk szövegéből feladatleírás. */
export function parseExercise(id: string, title: string, body: string): ExerciseSpec {
  const sections = new Map<string, string>();
  let current = "";
  let buf: string[] = [];
  let fence = false;
  const flush = () => {
    if (current) sections.set(current, buf.join("\n").trim());
    buf = [];
  };
  for (const line of body.split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && line.match(/^@@\s+(.+)$/);
    if (m) {
      flush();
      current = m[1].trim().toLowerCase();
      continue;
    }
    buf.push(line);
  }
  flush();
  const code = (name: string) => {
    const s = sections.get(name) ?? "";
    const m = s.match(/```[a-z]*\n([\s\S]*?)\n```/);
    return m ? m[1] : s;
  };
  const bench = code("mérés");
  const [benchSetup, benchExpr] = bench.includes("\n---\n") ? bench.split("\n---\n") : ["", bench];
  return {
    id,
    title,
    prompt: sections.get("feladat") ?? "",
    starter: code("kód"),
    reference: code("megoldás"),
    explanation: sections.get("magyarázat") ?? "",
    given: code("adott"),
    cases: code("esetek")
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("//")),
    benchSetup: benchSetup.trim(),
    benchExpr: benchExpr.trim(),
    testWrong: code("teszt-rossz"),
    testSlow: code("teszt-lassú"),
  };
}

/** Egy eset kifejezésének barátságos megjelenítése. */
export function caseLabel(expr: string): string {
  return expr.length > 120 ? expr.slice(0, 117) + "…" : expr;
}

export function formatNs(ns: number): string {
  if (ns < 1000) return `${ns.toFixed(0)} ns`;
  if (ns < 1_000_000) return `${(ns / 1000).toFixed(1).replace(".", ",")} µs`;
  return `${(ns / 1_000_000).toFixed(2).replace(".", ",")} ms`;
}
