<!--
  Onglets du volet des documents (Lecteur, Archives, Catalogue, Carnet, Journal, Aide) : volet
  latéral, fiche flottante et fenêtre détachée (DESIGN §5.3) les partagent. Un seul Lecteur monté :
  en plein écran, sa place est tenue par un renvoi.
-->
<script lang="ts">
  import { Tabs } from '@arbre/ui';
  import { unreadDocuments } from '@arbre/engine';
  import type { Component } from 'svelte';
  import { SIDE_PANELS, type GameStoreImpl } from '../lib/game/store.svelte';
  import type { PanelId } from '../lib/game/types';
  import { panelLabel } from '../lib/game/panel-label';
  import { messages } from '../messages.fr';
  import { PANEL_ICONS } from './panel-icons';
  import { PANELS } from './panels';
  import ReaderAway from './ReaderAway.svelte';

  interface Props {
    game: GameStoreImpl;
    /** Préfixe des identifiants (deux volets ne coexistent jamais dans un même document). */
    idPrefix?: string;
  }
  let { game, idPrefix = 'desk-side' }: Props = $props();
  const m = messages.desk;

  const unread = $derived(
    game.settings.hints.unreadBadges ? unreadDocuments(game.state, game.content).length : 0,
  );
  const items = $derived(
    SIDE_PANELS.map((id) => {
      const badge = id === 'archives' && unread > 0 ? unread : undefined;
      return {
        id,
        label: panelLabel(id, game.content),
        icon: PANEL_ICONS[id],
        ...(badge ? { badge, badgeLabel: m.unread(badge) } : {}),
      };
    }),
  );

  function panelOf(id: PanelId): Component {
    return id === 'reader' && game.readerFull ? ReaderAway : PANELS[id];
  }
</script>

<div class="side-tabs">
  <Tabs
    {items}
    value={game.ui.side ?? 'reader'}
    label={m.sideLabel}
    variant="line"
    {idPrefix}
    onchange={(id) => game.showPanel(id as PanelId)}
  >
    {#snippet children(id)}
      {@const SidePanel = panelOf(id as PanelId)}
      {#key id}
        <div class="panel-in"><SidePanel /></div>
      {/key}
    {/snippet}
  </Tabs>
</div>

<style>
  .side-tabs {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    min-height: 0;
  }
  .side-tabs > :global(.tabs) {
    flex: 1;
    min-height: 0;
  }
  .side-tabs :global([role='tablist']) {
    padding-inline: var(--space-2);
  }
  /* Libellés trop longs : la rangée défile à l'horizontale seulement. Sans `overflow-y: hidden`,
     les info-bulles (cachées sous les onglets), la pastille des non lus ou un onglet enfoncé
     faisaient déborder la rangée vers le bas et une barre de défilement verticale apparaissait
     sur la tête du volet (retour de jeu). En icônes seules, la rangée ne défile pas
     (`overflow: visible` du primitif) : les info-bulles peuvent sortir. */
  .side-tabs :global(.tabs:not(.icon-only) > [role='tablist']) {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: thin;
  }
  .side-tabs :global([role='tabpanel']) {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;
  }
  .side-tabs :global([role='tabpanel'] > *) {
    flex: 1;
    min-height: 0;
  }
  .side-tabs :global(.panel.desk) {
    background: transparent;
    box-shadow: none;
  }
  .side-tabs :global(.panel.desk::after) {
    display: none;
  }
  .panel-in {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    min-width: 0;
    animation:
      m-fade-in var(--dur-fade) var(--ease-out) backwards,
      m-deal var(--dur-deal) var(--ease-deal) backwards;
    --deal-x: 0px;
    --deal-distance: calc(var(--rise) * 2);
    --deal-rotate: 0.6deg;
  }
  .panel-in > :global(*) {
    flex: 1;
    min-height: 0;
  }
</style>
