//! Where the vault lives. The default is `<AppData>/vault`; users can point it at any
//! folder (for example one synced by Google Drive, Dropbox, iCloud Drive or OneDrive).
//! The choice is stored in `<AppConfig>/config.json`, outside the vault, and the folder is
//! added to the fs plugin scope at startup so the webview can read and write it.

use std::{
    fs,
    path::{Path, PathBuf},
    sync::Mutex,
};

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, Runtime, State};
use tauri_plugin_fs::FsExt;

const VAULT_MARKERS: [&str; 2] = ["profiles.json", "yorna.json"];

#[derive(Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AppConfig {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    vault_path: Option<PathBuf>,
}

pub struct VaultRoot(Mutex<PathBuf>);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct VaultInfo {
    path: String,
    default_path: String,
    is_default: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FolderInfo {
    path: String,
    exists: bool,
    is_vault: bool,
    is_empty: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SetMode {
    /// Use the folder as-is (an existing vault, or an empty folder to start fresh).
    Open,
    /// Copy the current vault into the folder first; the old folder is left as a backup.
    Copy,
}

fn err(e: impl std::fmt::Display) -> String {
    e.to_string()
}

fn config_file<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    Ok(app
        .path()
        .app_config_dir()
        .map_err(err)?
        .join("config.json"))
}

fn default_vault<R: Runtime>(app: &AppHandle<R>) -> Result<PathBuf, String> {
    Ok(app.path().app_data_dir().map_err(err)?.join("vault"))
}

fn read_config<R: Runtime>(app: &AppHandle<R>) -> AppConfig {
    config_file(app)
        .ok()
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn write_config<R: Runtime>(app: &AppHandle<R>, config: &AppConfig) -> Result<(), String> {
    let path = config_file(app)?;
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(err)?;
    }
    let tmp = path.with_extension("json.tmp");
    fs::write(&tmp, serde_json::to_string_pretty(config).map_err(err)?).map_err(err)?;
    fs::rename(tmp, path).map_err(err)
}

fn allow<R: Runtime>(app: &AppHandle<R>, dir: &Path) -> Result<(), String> {
    let scope = app.fs_scope();
    scope.allow_directory(dir, true).map_err(err)?;
    if let Ok(real) = dir.canonicalize() {
        scope.allow_directory(real, true).map_err(err)?;
    }
    Ok(())
}

fn is_vault(dir: &Path) -> bool {
    VAULT_MARKERS.iter().any(|m| dir.join(m).is_file())
}

fn same_or_nested(a: &Path, b: &Path) -> bool {
    match (a.canonicalize(), b.canonicalize()) {
        (Ok(a), Ok(b)) => a.starts_with(&b) || b.starts_with(&a),
        _ => false,
    }
}

fn copy_dir(from: &Path, to: &Path) -> std::io::Result<()> {
    fs::create_dir_all(to)?;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let name = entry.file_name();
        if name.to_string_lossy().ends_with(".tmp") {
            continue;
        }
        let target = to.join(&name);
        if entry.file_type()?.is_dir() {
            copy_dir(&entry.path(), &target)?;
        } else {
            fs::copy(entry.path(), target)?;
        }
    }
    Ok(())
}

fn info<R: Runtime>(app: &AppHandle<R>, path: &Path) -> Result<VaultInfo, String> {
    let default = default_vault(app)?;
    Ok(VaultInfo {
        path: path.to_string_lossy().into_owned(),
        default_path: default.to_string_lossy().into_owned(),
        is_default: path == default,
    })
}

/// Resolves the configured vault folder, makes sure it exists and is in scope.
pub fn setup<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let default = default_vault(app)?;
    let configured = read_config(app).vault_path.filter(|p| p.is_absolute());
    let root = match configured {
        Some(p) if fs::create_dir_all(&p).is_ok() => p,
        // A missing drive or unmounted sync folder must not lock the user out.
        _ => default,
    };
    fs::create_dir_all(&root)?;
    allow(app, &root)?;
    app.manage(VaultRoot(Mutex::new(root)));
    Ok(())
}

#[tauri::command]
pub fn vault_info<R: Runtime>(
    app: AppHandle<R>,
    root: State<'_, VaultRoot>,
) -> Result<VaultInfo, String> {
    let path = root.0.lock().map_err(err)?.clone();
    info(&app, &path)
}

#[tauri::command]
pub fn vault_inspect(path: String) -> FolderInfo {
    let dir = PathBuf::from(&path);
    let exists = dir.is_dir();
    let is_empty = exists
        && fs::read_dir(&dir)
            .map(|mut it| {
                it.all(|e| {
                    e.map(|e| e.file_name().to_string_lossy().starts_with('.'))
                        .unwrap_or(false)
                })
            })
            .unwrap_or(false);
    FolderInfo {
        path,
        exists,
        is_vault: exists && is_vault(&dir),
        is_empty,
    }
}

#[tauri::command]
pub fn vault_set<R: Runtime>(
    app: AppHandle<R>,
    root: State<'_, VaultRoot>,
    path: String,
    mode: SetMode,
) -> Result<VaultInfo, String> {
    let target = PathBuf::from(&path);
    if !target.is_absolute() {
        return Err("Choose a full folder path.".into());
    }
    let current = root.0.lock().map_err(err)?.clone();
    match mode {
        SetMode::Copy => {
            if is_vault(&target) {
                return Err("That folder already has a Yorna vault. Open it instead.".into());
            }
            fs::create_dir_all(&target).map_err(err)?;
            if same_or_nested(&current, &target) {
                return Err(
                    "The new folder can't be inside the current vault (or contain it).".into(),
                );
            }
            copy_dir(&current, &target).map_err(|e| format!("Couldn't copy the vault: {e}"))?;
        }
        SetMode::Open => fs::create_dir_all(&target).map_err(err)?,
    }
    allow(&app, &target)?;
    let default = default_vault(&app)?;
    write_config(
        &app,
        &AppConfig {
            vault_path: (target != default).then(|| target.clone()),
        },
    )?;
    *root.0.lock().map_err(err)? = target.clone();
    info(&app, &target)
}

/// Files a sync client left next to ours when two computers changed the same file,
/// e.g. `yorna (1).json` (Google Drive), `yorna (Ana's conflicted copy).json` (Dropbox),
/// `yorna 2.json` (iCloud) or `*.sync-conflict-*` (Syncthing).
fn is_conflict_copy(name: &str) -> bool {
    let lower = name.to_lowercase();
    let Some((stem, ext)) = lower.rsplit_once('.') else {
        return false;
    };
    if !matches!(ext, "json" | "html") {
        return false;
    }
    if lower.contains("conflicted copy")
        || lower.contains(".sync-conflict-")
        || lower.contains("-conflict")
    {
        return true;
    }
    if ext == "json" {
        return ["yorna", "profiles"]
            .iter()
            .any(|base| stem != *base && stem.starts_with(base));
    }
    stem.contains(' ') || stem.contains('(')
}

fn scan(dir: &Path, root: &Path, depth: u8, out: &mut Vec<String>) {
    let Ok(entries) = fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().into_owned();
        if path.is_dir() {
            if depth < 4 && !name.starts_with('.') {
                scan(&path, root, depth + 1, out);
            }
        } else if is_conflict_copy(&name) {
            if let Ok(rel) = path.strip_prefix(root) {
                out.push(rel.to_string_lossy().replace('\\', "/"));
            }
        }
    }
}

#[tauri::command]
pub fn vault_conflicts(root: State<'_, VaultRoot>) -> Result<Vec<String>, String> {
    let root = root.0.lock().map_err(err)?.clone();
    let mut out = Vec::new();
    scan(&root, &root, 0, &mut out);
    out.sort();
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::is_conflict_copy;

    #[test]
    fn detects_sync_conflict_copies() {
        for name in [
            "yorna (1).json",
            "yorna (Ana's conflicted copy 2026-11-12).json",
            "yorna 2.json",
            "profiles (1).json",
            "3f1c2a7e-1111-4222-8333-944445555666 (1).html",
            "3f1c2a7e-1111-4222-8333-944445555666 2.html",
            "yorna.sync-conflict-20261112-101010-ABCDEF.json",
        ] {
            assert!(is_conflict_copy(name), "{name}");
        }
        for name in [
            "yorna.json",
            "profiles.json",
            "3f1c2a7e-1111-4222-8333-944445555666.html",
            "finish.mp3",
            "desktop.ini",
        ] {
            assert!(!is_conflict_copy(name), "{name}");
        }
    }
}
