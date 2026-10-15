/**
 * Fenêtre détachée de la fiche des documents (DESIGN §5.3, retour de jeu : « la glisser sur un
 * deuxième écran ») : Document Picture-in-Picture là où il existe (Chromium, et la WebView qui le
 * propose), sinon une fenêtre surgissante `about:blank` (navigateur seulement). Les deux partagent
 * le même moteur JavaScript que le jeu : on y monte les panneaux avec le même magasin de partie,
 * donc tout reste synchronisé (document ouvert, surlignages, notes) sans aucun message.
 *
 * CSP : la fenêtre hérite de la politique de la page (`about:blank` et PiP héritent du créateur) ;
 * on n'y copie que les feuilles de style de la page (`<link>` du même domaine et `<style>` déjà
 * autorisés par leur empreinte) : aucune règle à ajouter (web, itch.io, Tauri).
 */

interface DocumentPictureInPicture {
  requestWindow(options?: { width?: number; height?: number }): Promise<Window>;
}

function pipApi(): DocumentPictureInPicture | null {
  const api = (globalThis as { documentPictureInPicture?: DocumentPictureInPicture })
    .documentPictureInPicture;
  return api && typeof api.requestWindow === 'function' ? api : null;
}

/** La fenêtre détachée est-elle possible ici ? (PiP, ou navigateur hors Tauri). */
export function canPopOut(platformKind: string | undefined): boolean {
  if (typeof window === 'undefined') return false;
  return pipApi() !== null || platformKind === 'web';
}

export interface PopOutOptions {
  width: number;
  height: number;
  title: string;
  platformKind: string | undefined;
}

/** Ouvre la fenêtre (PiP d'abord, surgissante ensuite) ; null si le navigateur refuse. */
export async function openPopOut(o: PopOutOptions): Promise<Window | null> {
  const size = { width: Math.round(o.width), height: Math.round(o.height) };
  let win: Window | null = null;
  const pip = pipApi();
  if (pip) {
    try {
      win = await pip.requestWindow(size);
    } catch {
      // Cadre imbriqué (itch.io), geste expiré… : on tente la fenêtre surgissante.
      win = null;
    }
  }
  if (!win && o.platformKind === 'web') {
    try {
      win = window.open('', 'arbre-documents', `popup,width=${size.width},height=${size.height}`);
    } catch {
      win = null;
    }
  }
  if (!win) return null;
  prepare(win, o.title);
  return win;
}

/** Styles, attributs de `<html>` (thème, contraste, taille du texte…) et titre de la fenêtre. */
function prepare(win: Window, title: string): void {
  const doc = win.document;
  // Fenêtre surgissante réutilisée (même nom) : on repart d'un document vide.
  doc.head.replaceChildren();
  doc.body.replaceChildren();
  doc.title = title;
  for (const node of document.head.querySelectorAll<HTMLElement>('link[rel="stylesheet"], style')) {
    const copy = node.cloneNode(true) as HTMLElement;
    // Adresse absolue : la base de `about:blank` n'est pas toujours celle du jeu.
    if (copy instanceof HTMLLinkElement) copy.href = (node as HTMLLinkElement).href;
    doc.head.append(doc.importNode(copy, true));
  }
  copyRootAttributes(doc);
  doc.body.style.margin = '0';
}

/** Recopie les attributs de `<html>` (réglages d'affichage) vers la fenêtre. */
export function copyRootAttributes(doc: Document): void {
  const from = document.documentElement;
  const to = doc.documentElement;
  for (const a of [...to.attributes]) if (!from.hasAttribute(a.name)) to.removeAttribute(a.name);
  for (const a of from.attributes) to.setAttribute(a.name, a.value);
}

/**
 * Suit la page : réglages d'affichage recopiés à chaque changement, feuilles de style chargées
 * plus tard (panneaux paresseux) ajoutées. Renvoie l'arrêt du suivi.
 */
export function mirrorPage(win: Window): () => void {
  const attrs = new MutationObserver(() => copyRootAttributes(win.document));
  attrs.observe(document.documentElement, { attributes: true });
  const head = new MutationObserver((records) => {
    for (const r of records) {
      for (const node of r.addedNodes) {
        if (
          node instanceof HTMLStyleElement ||
          (node instanceof HTMLLinkElement && node.rel === 'stylesheet')
        ) {
          const copy = node.cloneNode(true) as HTMLElement;
          if (copy instanceof HTMLLinkElement) copy.href = (node as HTMLLinkElement).href;
          win.document.head.append(win.document.importNode(copy, true));
        }
      }
    }
  });
  head.observe(document.head, { childList: true });
  return () => {
    attrs.disconnect();
    head.disconnect();
  };
}
