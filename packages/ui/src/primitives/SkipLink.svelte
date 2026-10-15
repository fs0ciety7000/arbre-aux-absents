<!--
	Lien d'évitement (DESIGN.md §9.18) : premier élément focusable de chaque page du site
	et de l'écran titre du jeu. Style : .skip-link (base.css).
-->
<script lang="ts">
  import { getUiStrings } from '../i18n';
  interface Props {
    href?: string;
    label?: string;
  }
  let { href = '#contenu', label: labelProp }: Props = $props();
  const ui = getUiStrings();
  const label = $derived(labelProp ?? ui.skipLink.label);
</script>

<a class="skip-link" {href}>{label}</a>
