<script lang="ts">
  import { onMount } from "svelte";
  import type { Tarefa } from "../tipos";
  import { listarTarefas } from "../lib/servicos/api";
  import { filtros } from "../lib/estado/filtros.svelte";
  import { filtrarTarefas } from "../lib/utils/filtrarTarefas";
  import CartaoTarefa from "../lib/componentes/CartaoTarefa.svelte";
  import FiltrosTarefas from "../lib/componentes/FiltrosTarefas.svelte";
  import AlternarVisao from "../lib/componentes/AlternarVisao.svelte";

  let tarefas = $state<Tarefa[]>([]);
  let carregando = $state(true);
  let erro = $state<string | null>(null);

  // Recalcula sozinho quando a lista, a busca ou os filtros mudam.
  const visiveis = $derived(filtrarTarefas(tarefas, filtros));

  // onMount roda só no navegador, então a busca não é repetida no servidor.
  onMount(async () => {
    try {
      tarefas = await listarTarefas();
    } catch (e) {
      erro = e instanceof Error ? e.message : "Erro desconhecido";
    } finally {
      carregando = false;
    }
  });
  let avisoStatus = $state("");
</script>

<main>
  <p role="status">{avisoStatus}</p>
  <h1>Tarefas</h1>

  <AlternarVisao />

  <p><a href="/tarefas/nova">Nova tarefa</a></p>

  {#if carregando}
    <p>Carregando tarefas...</p>
  {:else if erro}
    <p role="alert">Não foi possível carregar as tarefas: {erro}</p>
  {:else if tarefas.length === 0}
    <p>Nenhuma tarefa cadastrada.</p>
  {:else}
    <FiltrosTarefas total={tarefas.length} exibidas={visiveis.length} />

    {#if visiveis.length === 0}
      <p>Nenhuma tarefa encontrada com esses filtros.</p>
    {:else}
      <ul class="lista">
        {#each visiveis as tarefa (tarefa.id)}
          <li>
            <CartaoTarefa {tarefa} onstatusalterado={(atualizada) => { avisoStatus = `${atualizada.titulo}: status atualizado.`; }} />
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>

<style>
main { max-width: 88rem; margin: 0 auto; padding: 2.75rem 2rem 4rem; }
  main > p:has(a[href='/tarefas/nova']) { float: right; margin: .5rem 3px 1.1rem 1rem; }
  .lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }
  .lista li { min-width: 0; }
  @media (max-width: 1024px) { .lista { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem 3rem; } .lista { grid-template-columns: minmax(0, 1fr); } }
  @media (max-width: 360px) { main > p:has(a[href='/tarefas/nova']) { float: none; margin: .4rem 0 1rem; } }
</style>
