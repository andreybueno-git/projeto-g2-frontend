<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { Status, Tarefa } from "../../tipos";
  import CartaoTarefa from "../../lib/componentes/CartaoTarefa.svelte";
  import FiltrosTarefas from "../../lib/componentes/FiltrosTarefas.svelte";
  import AlternarVisao from "../../lib/componentes/AlternarVisao.svelte";
  import { filtros } from "../../lib/estado/filtros.svelte";
  import { listarTarefas } from "../../lib/servicos/api";
  import { filtrarTarefas } from "../../lib/utils/filtrarTarefas";
  import { ROTULOS_STATUS } from "../../lib/utils/rotulos";

  const statusDisponiveis = Object.keys(ROTULOS_STATUS) as Status[];
  let tarefas = $state<Tarefa[]>([]);
  let carregando = $state(true);
  let erro = $state<string | null>(null);
  let ativo = true;

  // A lista e o quadro aplicam os mesmos critérios antes de exibir as tarefas.
  const visiveis = $derived(filtrarTarefas(tarefas, filtros));

  // Cada status mantém sua coluna, inclusive quando não há tarefas nela.
  let colunas = $derived(statusDisponiveis.map((status) => ({
    status,
    tarefas: visiveis.filter((tarefa) => tarefa.status === status),
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

  let avisoStatus = $state("");
</script>

<svelte:head>
  <title>Quadro de tarefas</title>
</svelte:head>

<main>
  <p role="status">{avisoStatus}</p>
  <h1>Quadro de tarefas</h1>
  <p class="introducao">As tarefas estão organizadas por status.</p>
  <AlternarVisao />

  {#if carregando}
    <p role="status">Carregando tarefas...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
    <button type="button" onclick={carregarTarefas}>Tentar novamente</button>
  {:else}
    <FiltrosTarefas total={tarefas.length} exibidas={visiveis.length} />

    {#if tarefas.length === 0}
      <p>Nenhuma tarefa cadastrada.</p>
    {:else if visiveis.length === 0}
      <p>Nenhuma tarefa encontrada com esses filtros.</p>
    {/if}

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
                  <CartaoTarefa {tarefa} onstatusalterado={(atualizada) => { avisoStatus = `${atualizada.titulo}: status atualizado.`; }} />
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
main { max-width: 88rem; margin: 0 auto; padding: 2.75rem 2rem 4rem; }
  h1 { margin-bottom: .7rem; }
  .introducao { margin: 0 0 1.1rem; color: var(--secundario); font-size: .92rem; }
  .quadro { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; align-items: start; }
  .coluna { min-width: 0; padding: .75rem; border: 1px solid var(--linha); border-top: 4px solid #666b77; border-radius: 2px; background: #e5e5de; }
  .coluna.em-andamento { border-top-color: var(--azul); background: #e2e6f1; }
  .coluna.em-revisao { border-top-color: #c49b45; background: #eeeadf; }
  .coluna.concluida { border-top-color: #698775; background: #e3e9e2; }
  header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; margin-bottom: 1rem; padding: .25rem .15rem .65rem; border-bottom: 1px solid #c4c7c6; }
  h2 { margin: 0; font-size: .76rem; font-weight: 750; letter-spacing: .045em; text-transform: uppercase; }
  .contagem { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; min-height: 26px; padding: .1rem .4rem; background: var(--superficie); border: 1px solid var(--linha); text-align: center; font-size: .75rem; font-weight: 650; }
  ul { display: grid; gap: 1rem; list-style: none; margin: 0; padding: 0; }
  li { min-width: 0; }
  .vazia { margin: 0; padding: 1.5rem .4rem; color: var(--secundario); font-size: .82rem; line-height: 1.6; }
  button { min-height: 44px; padding: .6rem 1rem; border: 1px solid var(--tinta); border-radius: 2px; background: var(--tinta); color: var(--superficie); font: inherit; cursor: pointer; }
  @media (max-width: 1150px) { .quadro { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; } }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem 3rem; } .quadro { grid-template-columns: minmax(0, 1fr); } }
</style>
