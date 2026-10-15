import type { PlatformKind } from '@arbre/contract';
import type { UpdateOffer, UpdateSource } from '../../platform/update';

/**
 * État de la mise à jour du jeu installé (D18, DESIGN §13.12).
 *
 * - vérification **silencieuse** au lancement : hors ligne ou en échec, rien n'est montré (journal
 *   seulement) ;
 * - « Rechercher une mise à jour » (Options › Données) : même vérification, résultat affiché ;
 * - l'invite n'apparaît que sur l'écran titre et n'interrompt jamais une partie ; « Plus tard » la
 *   masque jusqu'au prochain lancement.
 */
export type UpdateStatus =
  /** Pas encore vérifié, ou vérification silencieuse en échec. */
  | 'idle'
  | 'checking'
  /** Vérifié : rien de plus récent. */
  | 'current'
  | 'available'
  | 'downloading'
  /** Téléchargé, installation puis relance. */
  | 'installing';

/** Dernier échec visible (vérification manuelle, installation, ouverture du lien). */
export type UpdateError = 'check' | 'install' | 'open';

export class UpdateState {
  /** La plateforme sait se mettre à jour (desktop, Android) ; faux sur le web. */
  supported = $state(false);
  status = $state<UpdateStatus>('idle');
  offer = $state.raw<UpdateOffer | null>(null);
  /** Avancement du téléchargement (0 à 1), `null` si la taille est inconnue. */
  progress = $state<number | null>(null);
  /** « Plus tard » : l'invite de l'écran titre se tait jusqu'au prochain lancement. */
  dismissed = $state(false);
  error = $state<UpdateError | null>(null);

  #source: UpdateSource | null = null;
  #checking: Promise<void> | null = null;

  /** L'invite de l'écran titre est visible. */
  get prompt(): boolean {
    return this.offer !== null && !this.dismissed;
  }

  /** Une installation est en cours (boutons désactivés, retour bloqué). */
  get busy(): boolean {
    return this.status === 'downloading' || this.status === 'installing';
  }

  /** Branche la source (absente sur le web) puis vérifie en silence. Ne lève jamais. */
  async start(load: () => Promise<UpdateSource | null>): Promise<void> {
    try {
      this.#source = await load();
    } catch (err) {
      console.info('[update] source indisponible', err);
      this.#source = null;
    }
    this.supported = this.#source !== null;
    if (this.#source) await this.check(false);
  }

  /**
   * Vérifie. `manual` : demandé depuis Options (l'échec est affiché) ; sinon silencieux. Une
   * vérification déjà en cours est partagée ; aucune pendant une installation.
   */
  check(manual = true): Promise<void> {
    const source = this.#source;
    if (!source || this.busy) return Promise.resolve();
    if (manual) this.error = null;
    this.#checking ??= (async () => {
      this.status = 'checking';
      try {
        const offer = await source.check();
        this.offer = offer;
        this.status = offer ? 'available' : 'current';
        // Une version plus récente que celle écartée par « Plus tard » se montre de nouveau.
        if (manual) this.dismissed = false;
      } catch (err) {
        console.info('[update] vérification impossible', err);
        this.status = this.offer ? 'available' : 'idle';
        if (manual) this.error = 'check';
      } finally {
        this.#checking = null;
      }
    })();
    return this.#checking;
  }

  /**
   * « Mettre à jour » : `install` (desktop) télécharge, installe et relance ; `download` ouvre le
   * lien dans le navigateur. `beforeInstall` : dernière sauvegarde du profil avant la relance.
   */
  async apply(beforeInstall: () => Promise<void> = async () => {}): Promise<void> {
    const source = this.#source;
    const offer = this.offer;
    if (!source || !offer || this.busy) return;
    this.error = null;
    if (offer.action === 'download') {
      const ok = await source.openDownload(offer);
      if (!ok) this.error = 'open';
      return;
    }
    this.status = 'downloading';
    this.progress = 0;
    try {
      await beforeInstall();
      await source.install(({ downloaded, total }) => {
        if (total !== null && total > 0) {
          this.progress = Math.min(1, downloaded / total);
          if (downloaded >= total) this.status = 'installing';
        } else {
          this.progress = null;
        }
      });
      // Sans relance (cas rare) : l'installation est faite, la prochaine ouverture la lance.
      this.status = 'installing';
    } catch (err) {
      console.warn('[update] installation impossible', err);
      this.status = 'available';
      this.progress = null;
      this.error = 'install';
    }
  }

  /** « Plus tard ». */
  later(): void {
    if (this.busy) return;
    this.dismissed = true;
    this.error = null;
  }
}

/**
 * Source de la plateforme : jamais sur le web (branche éliminée du bundle web, les plugins Tauri
 * n'y entrent pas), sinon desktop ou Android.
 */
export async function loadUpdateSource(
  kind: PlatformKind,
  currentVersion: string,
): Promise<UpdateSource | null> {
  if (import.meta.env.VITE_TARGET === 'tauri' && kind !== 'web') {
    const { createTauriUpdateSource } = await import('../../platform/update-tauri');
    return createTauriUpdateSource(kind, currentVersion);
  }
  return null;
}
