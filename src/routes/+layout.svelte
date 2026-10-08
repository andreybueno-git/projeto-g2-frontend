<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}

<style>
	/* Estilo base de toda a aplicação: fonte do sistema e tema claro ou escuro conforme o aparelho. */
	:global(:root) {
		color-scheme: light dark;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			sans-serif;
		line-height: 1.5;
	}

	:global(body) {
		margin: 0;
	}
</style>
