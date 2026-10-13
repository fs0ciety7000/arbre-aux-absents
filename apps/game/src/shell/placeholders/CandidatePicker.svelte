<script lang="ts">
  import { Button, Dialog } from '@arbre/ui';
  import { getGame } from '../../lib/game/context';
  import { messages } from '../../messages.fr';

  /** Provisoire : le vrai sélecteur (P10) est livré dans `src/panels/CandidatePicker.svelte`. */
  const game = getGame();
  let open = $state(true);
</script>

<Dialog bind:open title={messages.candidatePicker} onclose={() => (game.ui.picking = null)}>
  <p>{messages.placeholder(messages.candidatePicker)}</p>
  {#snippet actions()}
    <Button onclick={() => (open = false)}>{messages.close}</Button>
  {/snippet}
</Dialog>
