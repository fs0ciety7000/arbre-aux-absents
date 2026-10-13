<script lang="ts">
  import { resolve } from '$app/paths';
  import { Button } from '@arbre/ui';
  import TreeMark from '#lib/components/TreeMark.svelte';
</script>

<svelte:head>
  <title>Page introuvable · L’Arbre aux absents</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="container-narrow lost">
  <span class="mark"><TreeMark size="4rem" /></span>
  <p class="kicker">Erreur 404</p>
  <h1>Cette page est absente des registres</h1>
  <p class="lede">L’adresse demandée n’existe pas, ou plus. Le reste du dossier vous attend.</p>
  <Button variant="primary" href={resolve('/')} iconName="back">Retour à l’accueil</Button>
</div>

<style>
  .lost {
    display: grid;
    justify-items: start;
    gap: var(--space-4);
    padding-block: var(--space-24) var(--space-16);
  }
  .mark {
    color: var(--accent);
  }
</style>
