/**
 * Ouverture d'une URL externe sous Tauri par `@tauri-apps/plugin-opener` (D11). Module séparé,
 * chargé seulement par `import()` depuis `tauri.ts` au premier `openExternal` : le plugin n'entre
 * ni dans le bundle web ni dans les tests qui ne l'utilisent pas.
 *
 * Tant que la dépendance n'est pas installée (lot devops), `plugin-opener.d.ts` en déclare la
 * signature pour que la vérification de types passe ; à l'exécution, l'échec d'import est rattrapé
 * par l'appelant (`openExternal` renvoie false).
 */
export async function tauriOpenUrl(url: string): Promise<void> {
  const { openUrl } = await import('@tauri-apps/plugin-opener');
  await openUrl(url);
}
