//! Shell Tauri de « L'Arbre aux absents ».
//!
//! Volontairement vide de logique : le jeu est une SPA web ; le natif n'apporte que le système
//! de fichiers (sauvegardes sous `$APPDATA/saves/`) et les boîtes de dialogue (export/import).
//! Les droits sont fixés par `capabilities/default.json`.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .run(tauri::generate_context!())
        .expect("échec du démarrage de L'Arbre aux absents");
}
