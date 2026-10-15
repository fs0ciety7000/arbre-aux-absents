/**
 * Gestes communs des écrans de signalement : copier un texte, ouvrir un lien externe (suivi sur
 * le site, forum itch.io) par `Platform.openExternal` (liste blanche, D11). Si le lien ne peut
 * pas s'ouvrir, il est copié : le joueur n'est jamais sans issue.
 */
import { pushToast } from '@arbre/ui';
import { messages } from '../../i18n/index.svelte';
import type { GamePlatform } from '../../platform/index';

/** Presse-papiers ; false s'il est indisponible ou refusé. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return false;
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Ouvre une URL autorisée ; en cas de refus, la copie et le dit. */
export async function openLink(platform: GamePlatform | null, url: string): Promise<boolean> {
  let opened: boolean;
  try {
    opened = (await platform?.openExternal?.(url)) ?? false;
  } catch {
    opened = false;
  }
  if (opened) return true;
  if (await copyText(url)) {
    pushToast({ tone: 'info', title: messages.bugReport.linkCopied, message: url });
  } else {
    pushToast({ tone: 'warning', title: messages.bugReport.linkFailed, message: url });
  }
  return false;
}
