<script lang="ts">
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// A posição do mouse define o deslocamento que o CSS vai animar.
	function moverBotao(evento: PointerEvent) {
		if (evento.pointerType !== 'mouse') return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const botao = evento.currentTarget as HTMLAnchorElement;
		const caixa = botao.getBoundingClientRect();
		const x = (evento.clientX - caixa.left - caixa.width / 2) * 0.18;
		const y = (evento.clientY - caixa.top - caixa.height / 2) * 0.3;

		botao.style.setProperty('--x', `${x}px`);
		botao.style.setProperty('--y', `${y}px`);
	}

	function soltarBotao(evento: Event) {
		const botao = evento.currentTarget as HTMLAnchorElement;
		botao.style.setProperty('--x', '0px');
		botao.style.setProperty('--y', '0px');
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<div class="barra">
	  <a class="marca" href="/">Gerenciador de tarefas</a>

	  <nav aria-label="Navegação principal">
		<a href="/" onpointermove={moverBotao} onpointerleave={soltarBotao} onblur={soltarBotao}>Tarefas</a>
		<a href="/projetos" onpointermove={moverBotao} onpointerleave={soltarBotao} onblur={soltarBotao}>Projetos</a>
	  </nav>
	</div>
  </header>

  {@render children()}



<style>
nav a {
  padding: 0.5rem 1rem;
  border: 1px solid currentColor;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
  translate: var(--x, 0px) var(--y, 0px);
  transition: translate 0.2s ease-out, background-color 0.2s, color 0.2s;
}

nav a:hover {
  background-color: rgba(0, 0, 0, 0.307);
}

header {
  border-bottom: 1px solid #888;
}

.barra {
  max-width: 72rem;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.marca {
  color: inherit;
  font-weight: 700;
  text-decoration: none;
}

nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

@media (prefers-reduced-motion: reduce) {
  nav a {
    translate: none;
    transition: none;
  }
}

	/* Estilo base de toda a aplicação: fonte do sistema e tema claro ou escuro conforme o aparelho. */
	:global(:root) {
		color-scheme: light light;
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
