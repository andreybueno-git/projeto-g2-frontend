
<script lang="ts">
  import favicon from '#lib/assets/favicon.svg';
  import { page } from '$app/state';
  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();

  const navegacao = [
    { nome: 'Tarefas', href: '/' },
    { nome: 'Projetos', href: '/projetos' }
  ];

  function paginaAtiva(href: string): boolean {
    const caminho = page.url.pathname;

    if (href === '/') {
      return caminho === '/' || caminho.startsWith('/tarefas');
    }

    return caminho === href || caminho.startsWith(`${href}/`);
  }
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

<a class="pular-conteudo" href="#conteudo">
  Pular para o conteúdo principal
</a>

<header class="cabecalho">
  <div class="cabecalho-conteudo">
    <a class="marca" href="/" aria-label="Gerenciador de tarefas - Início">
      <span class="marca-icone" aria-hidden="true">✓</span>
      <span>Gerenciador de Tarefas</span>
    </a>

    <nav aria-label="Navegação principal">
      {#each navegacao as item}
        <a
          href={item.href}
          class:ativo={paginaAtiva(item.href)}
          aria-current={paginaAtiva(item.href) ? 'page' : undefined}
        >
          {item.nome}
        </a>
      {/each}
    </nav>
  </div>
</header>

<main id="conteudo" tabindex="-1">
  {@render children()}
</main>

<style>
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
    min-width: 280px;
  }

  :global(*) {
    box-sizing: border-box;
  }

  .pular-conteudo {
    position: absolute;
    top: -100px;
    left: 1rem;
    z-index: 100;
    padding: 0.75rem 1rem;
    background: #ffffff;
    color: #111827;
    border: 2px solid #2563eb;
    border-radius: 6px;
  }

  .pular-conteudo:focus {
    top: 0.5rem;
  }

  .cabecalho {
    background: #1e293b;
    color: #ffffff;
    border-bottom: 1px solid #475569;
  }

  .cabecalho-conteudo {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .marca {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    color: #ffffff;
    text-decoration: none;
    font-size: 1.1rem;
    font-weight: 700;
  }

  .marca-icone {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 32px;
    height: 32px;
    background: #2563eb;
    color: #ffffff;
    border-radius: 8px;
    font-size: 1.1rem;
  }

  nav {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  nav a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6rem 1rem;
    border-radius: 8px;
    color: #e2e8f0;
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }

  nav a:hover {
    background: #334155;
    color: #ffffff;
  }

  nav a.ativo {
    background: #2563eb;
    color: #ffffff;
    font-weight: 600;
  }

  :global(a:focus-visible) {
    outline: 3px solid #facc15;
    outline-offset: 3px;
  }

  main {
    width: 100%;
    min-height: calc(100vh - 75px);
  }

  @media (max-width: 600px) {
    .cabecalho-conteudo {
      flex-direction: column;
      align-items: stretch;
      padding: 1rem;
    }

    .marca {
      font-size: 1rem;
    }

    nav {
      width: 100%;
    }

    nav a {
      flex: 1;
      text-align: center;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    nav a {
      transition: none;
    }
  }
</style>
