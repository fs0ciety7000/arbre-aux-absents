<script lang="ts">
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
</script>

<svelte:head><title>Erreur · L’Arbre aux absents</title></svelte:head>

<div class="container-narrow err">
  <p class="kicker">Erreur {page.status}</p>
  <h1>Ce document ne s’ouvre pas</h1>
  <p class="lede">Une erreur est survenue. <a href={resolve('/')}>Retour à l’accueil</a></p>
</div>

<style>
  .err {
    display: grid;
    gap: var(--space-4);
    padding-block: var(--space-24) var(--space-16);
  }
</style>
