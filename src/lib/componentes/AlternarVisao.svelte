<script lang="ts">
  import { page } from '$app/state';

  // A busca e os filtros ficam em $lib/estado/filtros.svelte, que não é
  // recriado ao trocar de página: por isso continuam aplicados nas duas visões.
  const visoes = [
    { nome: 'Lista', href: '/' },
    { nome: 'Quadro', href: '/quadro' }
  ];
</script>

<nav class="visoes" aria-label="Visão das tarefas">
  {#each visoes as visao (visao.href)}
    <a
      href={visao.href}
      class:ativo={page.url.pathname === visao.href}
      aria-current={page.url.pathname === visao.href ? 'page' : undefined}
    >
      {visao.nome}
    </a>
  {/each}
</nav>

<style>
.visoes { display: inline-flex; margin: .5rem 0 1.1rem; padding: 4px; border: 1px solid var(--linha); background: #e4e4de; }
  a { display: inline-flex; align-items: center; gap: .55rem; min-height: 40px; padding: .45rem 1rem; color: var(--secundario); font-size: .85rem; font-weight: 650; text-decoration: none; transition: background .15s ease, color .15s ease; }
  a::before { content: ''; width: 12px; height: 12px; background: repeating-linear-gradient(0deg, currentColor 0 2px, transparent 2px 5px); }
  a + a::before { background: repeating-linear-gradient(90deg, currentColor 0 3px, transparent 3px 5px); }
  a:hover:not(.ativo) { background: var(--superficie); color: var(--tinta); }
  a.ativo { background: var(--tinta); color: var(--superficie); }
  a:focus-visible { outline: 3px solid var(--azul-escuro); outline-offset: 2px; z-index: 1; }
</style>
