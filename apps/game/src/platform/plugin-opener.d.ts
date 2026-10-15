/**
 * Signature minimale de `@tauri-apps/plugin-opener` (v2), utilisée par `opener.ts`, pour que la
 * vérification de types passe avant que le lot devops n'ajoute la dépendance. Identique à l'API
 * du paquet : à supprimer une fois `@tauri-apps/plugin-opener` installé.
 */
declare module '@tauri-apps/plugin-opener' {
  export function openUrl(url: string | URL, openWith?: string): Promise<void>;
}
