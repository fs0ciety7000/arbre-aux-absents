/**
 * zod 4 sans compilation à la volée (`jitless`). Par défaut, chaque schéma d'objet sonde
 * `Function('')` (`allowsEval`) **dès sa construction**, donc dès le chargement des modules du
 * contrat : la CSP du jeu (`script-src 'self'`, sans `'unsafe-eval'`) le refuse et lève une
 * violation. Un `z.config()` dans le module de démarrage arriverait trop tard (les schémas sont
 * construits dans un morceau évalué avant lui) : la configuration est posée par le point
 * d'entrée (`main.ts`), avant tout import de zod, dans l'objet global que zod adopte à son
 * chargement (`globalThis.__zod_globalConfig`, partagé entre copies de zod). Sans import de zod :
 * le point d'entrée reste minuscule.
 */
interface ZodGlobal {
  __zod_globalConfig?: { jitless?: boolean };
}

export function configureZod(target: ZodGlobal = globalThis as ZodGlobal): void {
  // Même objet si zod est déjà chargé (tests) : il le lit à chaque construction de schéma.
  (target.__zod_globalConfig ??= {}).jitless = true;
}
