<script lang="ts">
  import { filtros } from '../estado/filtros.svelte';
  import { ROTULOS_STATUS, ROTULOS_PRIORIDADE } from '../utils/rotulos';

  let { total, exibidas }: { total: number; exibidas: number } = $props();
</script>

<form
  class="filtros"
  role="search"
  aria-label="Buscar e filtrar tarefas"
  onsubmit={(evento) => evento.preventDefault()}
>
  <div class="campo busca">
    <label for="busca">Buscar por título</label>
    <input
      id="busca"
      type="search"
      bind:value={filtros.busca}
      placeholder="Digite parte do título"
      autocomplete="off"
    />
  </div>

  <div class="campo">
    <label for="filtro-status">Status</label>
    <select id="filtro-status" bind:value={filtros.status}>
      <option value="todos">Todos</option>
      {#each Object.entries(ROTULOS_STATUS) as [valor, rotulo] (valor)}
        <option value={valor}>{rotulo}</option>
      {/each}
    </select>
  </div>

  <div class="campo">
    <label for="filtro-prioridade">Prioridade</label>
    <select id="filtro-prioridade" bind:value={filtros.prioridade}>
      <option value="todas">Todas</option>
      {#each Object.entries(ROTULOS_PRIORIDADE) as [valor, rotulo] (valor)}
        <option value={valor}>{rotulo}</option>
      {/each}
    </select>
  </div>

  <button type="button" onclick={() => filtros.limpar()} disabled={!filtros.ativos}>
    Limpar filtros
  </button>
</form>

<p class="resumo" role="status">
  {#if filtros.ativos}
    Mostrando {exibidas} de {total} {total === 1 ? 'tarefa' : 'tarefas'}.
  {:else}
    {total} {total === 1 ? 'tarefa' : 'tarefas'}.
  {/if}
</p>

<style>
  .filtros { display: flex; flex-wrap: wrap; align-items: end; gap: 1rem; margin: 1rem 0 0.5rem; }
  .campo { display: flex; flex-direction: column; gap: 0.35rem; min-width: 10rem; }
  .campo.busca { flex: 1 1 16rem; }
  label { font-weight: 600; }
  input, select { min-height: 2.75rem; padding: 0.5rem 0.65rem; font: inherit; color: #0f172a; background: #fff; border: 1px solid #64748b; border-radius: 0.35rem; }
  button { min-height: 2.75rem; padding: 0.5rem 1rem; font: inherit; font-weight: 600; color: #1e293b; background: #fff; border: 1px solid #64748b; border-radius: 0.4rem; cursor: pointer; }
  button:hover:not(:disabled) { background: #f1f5f9; }
  button:disabled { cursor: not-allowed; opacity: 0.6; }
  :is(input, select, button):focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
  .resumo { margin: 0.5rem 0 1rem; }
  @media (max-width: 480px) { .campo { flex: 1 1 100%; } }
</style>
