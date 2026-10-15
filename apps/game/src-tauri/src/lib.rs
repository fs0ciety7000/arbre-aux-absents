//! Shell Tauri de « L'Arbre aux absents ».
//!
//! Volontairement vide de logique : le jeu est une SPA web ; le natif n'apporte que le système
//! de fichiers (sauvegardes sous `$APPDATA/saves/`), les boîtes de dialogue (export/import) et
//! l'ouverture de liens externes dans le navigateur (suivi des signalements, forum itch.io).
//! Les droits sont fixés par `capabilities/default.json` (opener limité à deux origines).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("échec du démarrage de L'Arbre aux absents");
}
