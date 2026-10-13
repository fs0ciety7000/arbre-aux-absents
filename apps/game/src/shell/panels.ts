/**
 * Import centralisé des panneaux du Bureau (`src/panels/`, lot B1b). Contrat des panneaux :
 * aucune prop requise ; ils lisent `getGame()`.
 */
import type { Component } from 'svelte';
import type { PanelId } from '../lib/game/types';
import ArchivesPanel from '../panels/ArchivesPanel.svelte';
import CandidatePickerComponent from '../panels/CandidatePicker.svelte';
import CataloguePanel from '../panels/CataloguePanel.svelte';
import FacesPanel from '../panels/FacesPanel.svelte';
import HelpPanel from '../panels/HelpPanel.svelte';
import JournalPanel from '../panels/JournalPanel.svelte';
import MapPanel from '../panels/MapPanel.svelte';
import NotebookPanel from '../panels/NotebookPanel.svelte';
import PinboardPanel from '../panels/PinboardPanel.svelte';
import ReaderPanel from '../panels/ReaderPanel.svelte';
import TreePanel from '../panels/TreePanel.svelte';

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
