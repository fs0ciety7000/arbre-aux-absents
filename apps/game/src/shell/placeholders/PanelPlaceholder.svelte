<script lang="ts">
  import { Icon, Panel, type IconName } from '@arbre/ui';
  import { messages } from '../../messages.fr';

  /** Emplacement provisoire d'un panneau (remplacé par `src/panels/<Name>.svelte`). */
  interface Props {
    title: string;
    icon: IconName;
    surface?: 'desk' | 'paper';
  }
  let { title, icon, surface = 'desk' }: Props = $props();
</script>

<Panel {title} {surface} class="placeholder-panel">
  <div class="empty">
    <Icon name={icon} size="2.5rem" />
    <p>{messages.placeholder(title)}</p>
  </div>
</Panel>

<style>
  :global(.placeholder-panel) {
    height: 100%;
  }
  .empty {
    display: grid;
    place-items: center;
    gap: var(--space-3);
    min-height: 12rem;
    padding: var(--space-6);
    color: var(--text-muted);
    text-align: center;
  }
</style>
