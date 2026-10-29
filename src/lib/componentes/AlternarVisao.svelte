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
  .visoes { display: inline-flex; margin: 0.5rem 0; border: 1px solid #64748b; border-radius: 0.4rem; overflow: hidden; }
  a { padding: 0.6rem 1.1rem; color: #1e293b; background: #fff; font-weight: 600; text-decoration: none; }
  a + a { border-left: 1px solid #64748b; }
  a:hover:not(.ativo) { background: #f1f5f9; }
  a.ativo { background: #1e293b; color: #fff; }
  a:focus-visible { outline: 3px solid #2563eb; outline-offset: -3px; }
</style>
