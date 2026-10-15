<script lang="ts">
  import { Button } from '@arbre/ui';
  import { getGame } from '../lib/game/context';
  import { messages } from '../messages.fr';

  /** Tient la place de l'arbre pendant qu'il est en plein écran (un seul arbre monté). */
  const game = getGame();
  const m = messages.desk;
</script>

<div class="away">
  <p>{m.treeFullAway}</p>
  <Button iconName="expand" onclick={() => game.setTreeFull(false)}>{m.fullscreenExit}</Button>
</div>

<style>
  .away {
    display: grid;
    gap: var(--space-3);
    align-content: start;
    justify-items: start;
    padding: var(--space-6);
    color: var(--text-muted);
  }
  .away p {
    margin: 0;
  }
</style>
