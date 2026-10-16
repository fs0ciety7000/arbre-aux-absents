/**
 * Nom d'un panneau du Bureau pour l'affaire ouverte : la Galerie s'intitule « Galerie » (onglets
 * Visages / Marques) quand l'affaire contient des marques (AFFAIRE-3 §1.4), « Galerie des
 * visages » sinon. Lu à chaque affichage (langue courante).
 */
import type { CompiledCase } from '@arbre/contract';
import { messages } from '../../messages.fr';
import type { PanelId } from './types';

export function panelLabel(id: PanelId, content: CompiledCase | null | undefined): string {
  if (id === 'faces' && content && Object.values(content.portraits).some((p) => p.kind === 'mark'))
    return messages.galleryWithMarks;
  return messages.panels[id];
}
