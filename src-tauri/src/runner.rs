//! A kurzus kódolós feladatainak futtatása a tanuló saját gépén, a telepített rustc-vel.

use serde::Serialize;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::time::{Duration, Instant};

const RUN_TIMEOUT: Duration = Duration::from_secs(10);
const COMPILE_TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Serialize)]
pub struct RunOutput {
    compiled: bool,
    stdout: String,
    stderr: String,
    timed_out: bool,
}

/// Windowson ne villanjon fel konzolablak a gyerekfolyamatoknál.
fn no_window(cmd: &mut Command) -> &mut Command {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW
    }
    cmd
}

fn find_rustc() -> Option<PathBuf> {
    let exe = if cfg!(windows) { "rustc.exe" } else { "rustc" };
    let mut candidates = vec![PathBuf::from(exe)];
    if let Some(home) = std::env::var_os("USERPROFILE").or_else(|| std::env::var_os("HOME")) {
        candidates.push(Path::new(&home).join(".cargo").join("bin").join(exe));
    }
    candidates.into_iter().find(|c| {
        no_window(Command::new(c).arg("--version"))
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
    })
}

/// Lefuttat egy parancsot időkorláttal, és begyűjti a kimenetét.
fn run_with_timeout(mut child: Child, timeout: Duration) -> (bool, String, String, bool) {
    let mut out = child.stdout.take();
    let mut err = child.stderr.take();
    let out_thread = std::thread::spawn(move || {
        let mut s = String::new();
        if let Some(o) = out.as_mut() {
            let _ = o.read_to_string(&mut s);
        }
        s
    });
    let err_thread = std::thread::spawn(move || {
        let mut s = String::new();
        if let Some(e) = err.as_mut() {
            let _ = e.read_to_string(&mut s);
        }
        s
    });
    let start = Instant::now();
    let mut timed_out = false;
    let success = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status.success(),
            Ok(None) if start.elapsed() > timeout => {
                let _ = child.kill();
                let _ = child.wait();
                timed_out = true;
                break false;
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(15)),
            Err(_) => break false,
        }
    };
    let stdout = out_thread.join().unwrap_or_default();
    let stderr = err_thread.join().unwrap_or_default();
    (success, stdout, stderr, timed_out)
}

fn run_blocking(code: String) -> Result<RunOutput, String> {
    let rustc = find_rustc().ok_or("nincs telepítve a rustc")?;
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let dir = std::env::temp_dir().join("rozsda-kurzus").join(format!("{nanos}"));
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let src = dir.join("main.rs");
    let prog = dir.join(if cfg!(windows) { "prog.exe" } else { "prog" });
    std::fs::write(&src, code).map_err(|e| e.to_string())?;

    let compile = no_window(
        Command::new(&rustc)
            .args(["--edition", "2024", "-O", "--color", "never", "-o"])
            .arg(&prog)
            .arg(&src),
    )
    .stdout(Stdio::piped())
    .stderr(Stdio::piped())
    .spawn()
    .map_err(|e| e.to_string())?;
    let (ok, _, compile_err, compile_timeout) = run_with_timeout(compile, COMPILE_TIMEOUT);
    if !ok {
        let _ = std::fs::remove_dir_all(&dir);
        return Ok(RunOutput { compiled: false, stdout: String::new(), stderr: compile_err, timed_out: compile_timeout });
    }

    let child = no_window(&mut Command::new(&prog))
        .current_dir(&dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;
    let (_, stdout, stderr, timed_out) = run_with_timeout(child, RUN_TIMEOUT);
    let _ = std::fs::remove_dir_all(&dir);
    Ok(RunOutput { compiled: true, stdout, stderr, timed_out })
}

#[tauri::command]
pub async fn run_rust(code: String) -> Result<RunOutput, String> {
    tauri::async_runtime::spawn_blocking(move || run_blocking(code))
        .await
        .map_err(|e| e.to_string())?
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compiles_and_runs() {
        let out = run_blocking("fn main() { println!(\"szia\"); }".into()).unwrap();
        assert!(out.compiled);
        assert_eq!(out.stdout.trim(), "szia");
        assert!(!out.timed_out);
    }

    #[test]
    fn reports_compile_errors() {
        let out = run_blocking("fn main() { let x = }".into()).unwrap();
        assert!(!out.compiled);
        assert!(out.stderr.contains("error"));
    }

    #[test]
    fn stops_infinite_loops() {
        let start = Instant::now();
        let out = run_blocking("fn main() { loop { std::hint::black_box(1); } }".into()).unwrap();
        assert!(out.timed_out);
        assert!(start.elapsed() < RUN_TIMEOUT + Duration::from_secs(20));
    }
}
