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
.filtros { clear: both; display: flex; flex-wrap: wrap; align-items: end; gap: 1rem; margin: 1rem 0 0; padding: 1.25rem; border: 1px solid var(--linha); border-top: 2px solid var(--tinta); background: #e8e8e2; }
  .campo { display: flex; flex-direction: column; gap: .5rem; min-width: 10rem; flex: 0 1 12rem; }
  .campo.busca { flex: 1 1 20rem; }
  label { font-size: .72rem; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }
  input, select { width: 100%; min-height: 46px; padding: .65rem .8rem; font: inherit; font-size: .9rem; color: var(--tinta); background: var(--superficie); border: 1px solid #888c96; border-radius: 2px; }
  input[type='search'] { border-left: 3px solid var(--azul); }
  button { min-height: 46px; padding: .6rem 1rem; font: inherit; font-size: .85rem; font-weight: 650; color: var(--tinta); background: transparent; border: 1px solid #737987; border-radius: 2px; cursor: pointer; }
  button:hover:not(:disabled) { background: var(--superficie); border-color: var(--tinta); }
  button:disabled { cursor: not-allowed; color: #6b6e76; border-color: #b6b8bc; }
  .resumo { margin: 0 0 1.5rem; padding: .7rem 0; border-bottom: 1px solid var(--linha); color: var(--secundario); font-size: .8rem; font-weight: 600; }
  @media (max-width: 640px) { .filtros { gap: .85rem; padding: 1rem; } .campo { flex: 1 1 calc(50% - .5rem); min-width: 0; } .campo.busca { flex-basis: 100%; } button { width: 100%; } }
  @media (max-width: 360px) { .campo { flex-basis: 100%; } }
</style>
