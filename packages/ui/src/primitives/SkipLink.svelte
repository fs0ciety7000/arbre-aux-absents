<!--
	Lien d'évitement (DESIGN.md §9.18) : premier élément focusable de chaque page du site
	et de l'écran titre du jeu. Style : .skip-link (base.css).
-->
<script lang="ts">
  interface Props {
    href?: string;
    label?: string;
  }
  let { href = '#contenu', label = 'Aller au contenu' }: Props = $props();
</script>

<a class="skip-link" {href}>{label}</a>
