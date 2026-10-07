// Rust-kód futtatása. Az asztali appban a tanuló saját gépén (rustc), a weben a hivatalos
// Rust Playgroundon. Ha az asztali appban nincs rustc, a Playgroundra esünk vissza.
import type { RunOutput } from "./harness";

export type RunnerKind = "local" | "playground";

export interface RunResponse extends RunOutput {
  runner: RunnerKind;
  note?: string;
}

export function isDesktop(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

interface LocalOutput {
  compiled: boolean;
  stdout: string;
  stderr: string;
  timed_out: boolean;
}

export async function runRust(code: string): Promise<RunResponse> {
  if (isDesktop()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const r = await invoke<LocalOutput>("run_rust", { code });
      return { compiled: r.compiled, stdout: r.stdout, stderr: r.stderr, timedOut: r.timed_out, runner: "local" };
    } catch (e) {
      const res = await playground(code);
      return { ...res, note: `A gépeden nem sikerült futtatni (${String(e)}), ezért a Rust Playgroundon futott.` };
    }
  }
  return playground(code);
}

async function playground(code: string): Promise<RunResponse> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  let res: Response;
  try {
    res = await fetch("https://play.rust-lang.org/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        channel: "stable",
        mode: "release",
        edition: "2024",
        crateType: "bin",
        tests: false,
        backtrace: false,
        code,
      }),
      signal: ctrl.signal,
    });
  } catch (e) {
    throw new Error(
      ctrl.signal.aborted
        ? "A Rust Playground nem válaszolt időben. Próbáld újra egy kicsit később."
        : "Nem sikerült elérni a Rust Playgroundot. Van internetkapcsolatod? (Az asztali appban a kód a saját gépeden fut, ott nem kell hozzá internet.)",
    );
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) throw new Error(`A Rust Playground hibát adott vissza (HTTP ${res.status}). Próbáld újra egy kicsit később.`);
  const j = (await res.json()) as { success: boolean; exitDetail?: string; stdout: string; stderr: string };
  const compiled = !/could not compile/.test(j.stderr);
  const timedOut = !j.success && /SIGKILL|timed out|timeout/i.test(`${j.exitDetail ?? ""} ${j.stderr}`);
  return { compiled, stdout: j.stdout, stderr: j.stderr, timedOut, runner: "playground" };
}
