//! Shell Tauri de « L'Arbre aux absents ».
//!
//! Volontairement vide de logique : le jeu est une SPA web ; le natif n'apporte que le système
//! de fichiers (sauvegardes sous `$APPDATA/saves/`), les boîtes de dialogue (export/import) et
//! l'ouverture de liens externes dans le navigateur (suivi des signalements, forum itch.io, APK
//! Android d'une nouvelle version) et, sur desktop, la mise à jour automatique (`updater`, signée
//! minisign, puis `process` pour relancer). Les droits sont fixés par `capabilities/` (opener
//! limité à trois origines, updater et process sur desktop seulement).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init());
    // Mise à jour : Windows (NSIS), macOS et AppImage. Android n'a pas de mise à jour silencieuse
    // hors Play Store : le jeu y propose l'APK signé de la dernière release (navigateur).
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init());
    builder
        .run(tauri::generate_context!())
        .expect("échec du démarrage de L'Arbre aux absents");
}
