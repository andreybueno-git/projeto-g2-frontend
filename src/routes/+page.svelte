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
</script>

<main>
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
            <a class="link-cartao" href="/tarefas/{tarefa.id}">
              <CartaoTarefa {tarefa} />
            </a>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</main>

<style>
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
    gap: 1rem;
  }
  /* O cartão inteiro é o link para o detalhe da tarefa. */
  .link-cartao {
    display: block;
    height: 100%;
    border-radius: 10px;
    color: inherit;
    text-decoration: none;
  }
  .link-cartao :global(.cartao) {
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .link-cartao:hover :global(.cartao) {
    border-color: #8c959f;
    box-shadow: 0 4px 12px rgba(31, 35, 40, 0.12);
  }
  .link-cartao:focus-visible {
    outline: 3px solid #0969da;
    outline-offset: 2px;
  }
</style>
