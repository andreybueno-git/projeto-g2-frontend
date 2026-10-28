<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Status, Tarefa } from "../../tipos";
  import CartaoTarefa from "../../lib/componentes/CartaoTarefa.svelte";
  import { listarTarefas } from "../../lib/servicos/api";
  import { ROTULOS_STATUS } from "../../lib/utils/rotulos";

  const statusDisponiveis = Object.keys(ROTULOS_STATUS) as Status[];
  let tarefas = $state<Tarefa[]>([]);
  let carregando = $state(true);
  let erro = $state<string | null>(null);
  let ativo = true;

  // Cada status mantém sua coluna, inclusive quando não há tarefas nela.
  let colunas = $derived(statusDisponiveis.map((status) => ({
    status,
    tarefas: tarefas.filter((tarefa) => tarefa.status === status),
  })));

  onMount(carregarTarefas);
  onDestroy(() => { ativo = false; });

  async function carregarTarefas() {
    carregando = true;
    erro = null;
    try {
      const dados = await listarTarefas();
      if (ativo) tarefas = dados;
    } catch {
      if (ativo) erro = "Não foi possível carregar o quadro. Tente novamente.";
    } finally {
      if (ativo) carregando = false;
    }
  }

</script>

<svelte:head>
  <title>Quadro de tarefas</title>
</svelte:head>

<main>
  <h1>Quadro de tarefas</h1>
  <p class="introducao">As tarefas estão organizadas por status.</p>
  <p><a href="/">Voltar para a lista de tarefas</a></p>

  {#if carregando}
    <p role="status">Carregando tarefas...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
    <button type="button" onclick={carregarTarefas}>Tentar novamente</button>
  {:else}
    <div class="quadro">
      {#each colunas as coluna (coluna.status)}
        <section class="coluna {coluna.status}" aria-labelledby={`titulo-${coluna.status}`}>
          <header>
            <h2 id={`titulo-${coluna.status}`}>{ROTULOS_STATUS[coluna.status]}</h2>
            <span class="contagem" aria-label={`${coluna.tarefas.length} ${coluna.tarefas.length === 1 ? 'tarefa' : 'tarefas'}`}>
              {coluna.tarefas.length}
            </span>
          </header>
          {#if coluna.tarefas.length === 0}
            <p class="vazia">Nenhuma tarefa neste status.</p>
          {:else}
            <ul>
              {#each coluna.tarefas as tarefa (tarefa.id)}
                <li>
                  <a class="link-cartao" href={`/tarefas/${encodeURIComponent(tarefa.id)}`}>
                    <CartaoTarefa {tarefa} />
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      {/each}
    </div>
  {/if}
</main>

<style>
  main {
    max-width: 88rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }

  h1 {
    margin: 0 0 0.5rem;
  }

  .introducao {
    margin: 0;
    color: #59636e;
  }

  .quadro {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 1rem;
    align-items: start;
  }

  .coluna {
    min-width: 0;
    padding: 0.75rem;
    border: 1px solid #c9ced6;
    border-top: 4px solid #64748b;
    border-radius: 10px;
    background: #f8fafc;
  }

  .coluna.em-andamento {
    border-top-color: #2563eb;
  }

  .coluna.em-revisao {
    border-top-color: #d97706;
  }

  .coluna.concluida {
    border-top-color: #16a34a;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
  }

  h2 {
    margin: 0;
    font-size: 1.1rem;
  }

  .contagem {
    min-width: 1.75rem;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    background: #e2e8f0;
    text-align: center;
    font-size: 0.85rem;
  }

  ul {
    display: grid;
    gap: 0.75rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  li {
    min-width: 0;
  }

  .link-cartao {
    display: block;
    color: inherit;
    text-decoration: none;
    border-radius: 10px;
  }

  .link-cartao:hover :global(.cartao) {
    border-color: #8c959f;
    box-shadow: 0 4px 12px rgba(31, 35, 40, 0.12);
  }

  .link-cartao:focus-visible {
    outline: 3px solid #0969da;
    outline-offset: 3px;
  }

  .vazia {
    margin: 0;
    padding: 1rem 0;
    color: #59636e;
    font-size: 0.9rem;
  }

  button {
    padding: 0.6rem 1rem;
    border: 1px solid #8c959f;
    border-radius: 6px;
    background: #ffffff;
    color: #1f2328;
    font: inherit;
    cursor: pointer;
  }

  button:focus-visible {
    outline: 3px solid #0969da;
    outline-offset: 3px;
  }

  @media (max-width: 1100px) {
    .quadro {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .quadro {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
