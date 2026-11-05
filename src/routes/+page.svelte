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
  onMount(carregarTarefas);

  async function carregarTarefas() {
    carregando = true;
    erro = null;
    try {
      tarefas = await listarTarefas();
    } catch {
      erro = "Não foi possível carregar as tarefas. Confira a conexão e tente novamente.";
    } finally {
      carregando = false;
    }
  }
  let avisoStatus = $state("");
  function removerTarefa(excluida: Tarefa) {
    tarefas = tarefas.filter((tarefa) => tarefa.id !== excluida.id);
    avisoStatus = `${excluida.titulo}: tarefa excluída.`;
  }
</script>

<svelte:head><title>Tarefas | Mentalista</title></svelte:head>

<main>
  <p role="status">{avisoStatus}</p>
  <h1>Tarefas</h1>

  <AlternarVisao />

  <p><a href="/tarefas/nova">Nova tarefa</a></p>

  {#if carregando}
    <p role="status">Carregando tarefas...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
    <button type="button" onclick={carregarTarefas}>Tentar novamente</button>
  {:else}
    <FiltrosTarefas total={tarefas.length} exibidas={visiveis.length} />

    {#if tarefas.length === 0}
      <p>Nenhuma tarefa cadastrada. Use “Nova tarefa” para começar.</p>
    {:else if visiveis.length === 0}
      <p>Nenhuma tarefa encontrada com esses filtros. Altere a busca ou limpe os filtros para ver outras tarefas.</p>
    {:else}
      <ul class="lista">
        {#each visiveis as tarefa (tarefa.id)}
          <li>
            <CartaoTarefa {tarefa} nivelTitulo="h2" onstatusalterado={(atualizada) => { avisoStatus = `${atualizada.titulo}: status atualizado.`; }} onexcluida={removerTarefa} />
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
