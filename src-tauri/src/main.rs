// Release módban ne nyíljon mellé konzolablak Windowson.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::PathBuf;
use tauri::{WebviewUrl, WebviewWindowBuilder};

/// Ha az exe nevében szerepel a "portable", a haladás az exe melletti mappába kerül,
/// így az app pendrive-ról is használható, és nem hagy nyomot a gépen.
fn portable_data_dir() -> Option<PathBuf> {
    let exe = std::env::current_exe().ok()?;
    let name = exe.file_stem()?.to_string_lossy().to_lowercase();
    if !name.contains("portable") {
        return None;
    }
    Some(exe.parent()?.join("Rozsda-adatok"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let mut window = WebviewWindowBuilder::new(app, "main", WebviewUrl::default())
                .title("Rozsda – böngészőmotor Rustban")
                .inner_size(1320.0, 860.0)
                .min_inner_size(400.0, 560.0)
                .center();
            if let Some(dir) = portable_data_dir() {
                window = window.data_directory(dir);
            }
            window.build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("nem sikerült elindítani az alkalmazást");
}
