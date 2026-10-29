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
      return caminho === '/' || caminho === '/quadro' || caminho.startsWith('/tarefas');
    }

    return caminho === href || caminho.startsWith(`${href}/`);
  }

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
          onpointermove={moverBotao}
          onpointerleave={soltarBotao}
          onblur={soltarBotao}
        >
          {item.nome}
        </a>
      {/each}
    </nav>
  </div>
</header>

<div id="conteudo" tabindex="-1">
  {@render children()}
</div>

<style>
  @font-face {
    font-family: 'Barlow Condensed';
    src: url('/fonts/BarlowCondensed-ExtraBold.ttf') format('truetype');
    font-weight: 800;
    font-style: normal;
    font-display: swap;
  }

/* Title-sequence palette: paper, ink, periwinkle and a restrained ochre accent. */
  :global(:root) {
    color-scheme: light;
    --papel: #f1efe7;
    --superficie: #fffef9;
    --tinta: #1a1c21;
    --secundario: #5b5e68;
    --linha: #c7c8c2;
    --azul: #6d7fbe;
    --azul-escuro: #354b89;
    --azul-claro: #e8ecf7;
    --ocre: #e7bd60;
    --erro: #922d35;
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Arial, sans-serif;
    font-size: 16px;
    line-height: 1.5;
    color: var(--tinta);
    background: var(--papel);
    font-synthesis: none;
  }
  :global(*) { box-sizing: border-box; }
  :global(body) { margin: 0; min-width: 280px; }
  :global(::selection) { color: var(--tinta); background: var(--ocre); }
  :global(a) { color: var(--azul-escuro); text-underline-offset: 4px; }
  :global(a:hover) { text-decoration-thickness: 2px; }
  :global(button), :global(input), :global(select), :global(textarea) { font: inherit; }
  :global(button), :global(select) { min-height: 44px; }
  :global(input), :global(select), :global(textarea) { accent-color: var(--azul-escuro); }
  :global(input::placeholder), :global(textarea::placeholder) { color: #696d76; opacity: 1; }
  :global(:is(a, button, input, select, textarea):focus-visible) {
    outline: 3px solid var(--azul-escuro);
    outline-offset: 4px;
  }
  :global(h1) {
    margin: 0 0 1.6rem;
    max-width: 78%;
    font-family: 'Barlow Condensed', Impact, 'Arial Narrow', 'Liberation Sans Narrow', sans-serif;
    font-size: clamp(2.25rem, 4.4vw, 3.75rem);
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.035em;
    text-transform: uppercase;
    overflow-wrap: anywhere;
  }
  :global(h2) { line-height: 1.3; letter-spacing: -0.025em; }
  :global(main) { position: relative; isolation: isolate; }
  :global(main::before) {
    content: '';
    position: absolute;
    z-index: -1;
    top: 2.75rem;
    right: 2rem;
    width: clamp(8rem, 20vw, 16rem);
    height: 3.9rem;
    background: linear-gradient(90deg, var(--azul) 0 49%, var(--tinta) 49% 57%, var(--superficie) 57% 72%, var(--ocre) 72% 82%, var(--tinta) 82% 86%, var(--azul) 86%);
    clip-path: polygon(5% 0, 100% 0, 95% 100%, 0 100%);
    pointer-events: none;
  }
  :global(main > p[role='status']:empty) { margin: 0; }
  :global(main > p[role='alert']) {
    border-left: 4px solid var(--erro);
    background: #fff0ed;
    padding: 1rem;
    color: #6f242b;
  }
  :global(main > a:first-of-type:not(:last-child)) { display: inline-flex; margin-bottom: 1.25rem; }
  :global(main > p > a[href='/tarefas/nova']),
  :global(main > p > a[href='/projetos/novo']),
  :global(main > section > p > a[href^='/tarefas/nova']) {
    display: inline-flex;
    align-items: center;
    gap: .7rem;
    min-height: 44px;
    padding: .65rem 1.1rem;
    background: var(--tinta);
    border: 1px solid var(--tinta);
    box-shadow: 3px 3px 0 var(--ocre);
    color: var(--superficie);
    font-weight: 650;
    text-decoration: none;
    transition: background .15s ease, box-shadow .15s ease;
  }
  :global(main > p > a[href='/tarefas/nova']::before),
  :global(main > p > a[href='/projetos/novo']::before),
  :global(main > section > p > a[href^='/tarefas/nova']::before) {
    content: ''; width: 12px; height: 12px;
    background: linear-gradient(currentColor,currentColor) center/2px 100% no-repeat, linear-gradient(currentColor,currentColor) center/100% 2px no-repeat;
  }
  :global(main > p > a[href='/tarefas/nova']:hover),
  :global(main > p > a[href='/projetos/novo']:hover),
  :global(main > section > p > a[href^='/tarefas/nova']:hover) { background: var(--azul-escuro); box-shadow: 4px 4px 0 var(--ocre); }
  .pular-conteudo { position: absolute; top: -100px; left: 1rem; z-index: 100; padding: .75rem 1rem; background: var(--superficie); color: var(--tinta); border: 2px solid var(--azul-escuro); }
  .pular-conteudo:focus { top: .5rem; }
  .cabecalho { position: relative; background: var(--tinta); color: var(--superficie); border-bottom: 1px solid var(--tinta); }
  .cabecalho::after { content: ''; display: block; height: 5px; background: linear-gradient(90deg, var(--azul) 0 72%, var(--superficie) 72% 83%, var(--ocre) 83% 92%, var(--azul) 92%); }
  .cabecalho-conteudo { max-width: 88rem; min-height: 84px; margin: 0 auto; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; gap: 1.5rem; flex-wrap: wrap; }
  .marca { display: inline-flex; align-items: center; gap: .85rem; color: var(--superficie); text-decoration: none; font-size: .98rem; font-weight: 700; letter-spacing: -.02em; }
  .marca-icone { display: inline-flex; justify-content: center; align-items: center; width: 34px; height: 38px; flex-shrink: 0; background: var(--azul); color: var(--tinta); border-right: 4px solid var(--ocre); font-size: 1.3rem; font-weight: 800; transform: skew(-4deg); }
  nav { display: flex; align-items: center; flex-wrap: wrap; gap: .4rem; }
  nav a { position: relative; display: inline-flex; min-height: 44px; align-items: center; justify-content: center; padding: .6rem 1.1rem; color: #d9dce6; text-decoration: none; font-size: .9rem; font-weight: 600; transition: background .15s ease, color .15s ease; }
  nav a:hover { background: #30343d; color: var(--superficie); }
  nav a.ativo { background: #2d3343; color: var(--superficie); }
  nav a.ativo::after { content: ''; position: absolute; right: 1.1rem; left: 1.1rem; bottom: 4px; height: 2px; background: var(--ocre); }
  .cabecalho a:focus-visible { outline-color: var(--ocre); }
  #conteudo { width: 100%; min-height: calc(100vh - 90px); }
  /* Detail/error routes have no main wrapper in the existing markup. */
  #conteudo:has(> :global(h1)) { max-width: 72rem; margin: 0 auto; padding: 3rem 2rem; }
  #conteudo:has(> :global(h1)) > :global(p) { max-width: 52rem; padding: .7rem 1rem; margin: 0; background: var(--superficie); border-bottom: 1px solid var(--linha); overflow-wrap: anywhere; }
  #conteudo:has(> :global(h1)) > :global(a:last-child) { display: inline-flex; margin-top: 1.5rem; }
  @media (max-width: 640px) {
    .cabecalho-conteudo { padding: 1rem; gap: 1rem; }
    .marca { font-size: .9rem; }
    nav { width: 100%; gap: .5rem; }
    nav a { flex: 1; }
    :global(h1) { max-width: 100%; margin-bottom: 1.25rem; padding-top: 1.2rem; font-size: clamp(2rem, 8vw, 2.8rem); }
    :global(main::before) { top: 1.2rem; right: 1rem; width: 5rem; height: .4rem; }
    #conteudo:has(> :global(h1)) { padding: 1.5rem 1rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    :global(*), :global(*::before), :global(*::after) { scroll-behavior: auto !important; animation: none !important; transition: none !important; }
  }
</style>
