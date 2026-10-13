/**
 * Import centralisé des panneaux du Bureau. Tant qu'un fichier `src/panels/<Name>.svelte`
 * n'existe pas, son emplacement provisoire (`./placeholders/`) est utilisé. Pour basculer,
 * remplacer `./placeholders/<Name>.svelte` par `../panels/<Name>.svelte` (une ligne par
 * panneau). Contrat des panneaux : aucune prop requise ; ils lisent `getGame()`.
 */
import type { Component } from 'svelte';
import type { PanelId } from '../lib/game/types';
import ArchivesPanel from './placeholders/ArchivesPanel.svelte';
import CandidatePickerComponent from './placeholders/CandidatePicker.svelte';
import CataloguePanel from './placeholders/CataloguePanel.svelte';
import FacesPanel from './placeholders/FacesPanel.svelte';
import HelpPanel from './placeholders/HelpPanel.svelte';
import JournalPanel from './placeholders/JournalPanel.svelte';
import MapPanel from './placeholders/MapPanel.svelte';
import NotebookPanel from './placeholders/NotebookPanel.svelte';
import PinboardPanel from './placeholders/PinboardPanel.svelte';
import ReaderPanel from './placeholders/ReaderPanel.svelte';
import TreePanel from './placeholders/TreePanel.svelte';

export const PANELS: Record<PanelId, Component> = {
  tree: TreePanel,
  archives: ArchivesPanel,
  reader: ReaderPanel,
  catalogue: CataloguePanel,
  notebook: NotebookPanel,
  map: MapPanel,
  pinboard: PinboardPanel,
  journal: JournalPanel,
  help: HelpPanel,
  faces: FacesPanel,
};

/** Sélecteur de candidat (P10), monté quand `ui.picking` n'est pas nul. */
export const CandidatePicker: Component = CandidatePickerComponent;
