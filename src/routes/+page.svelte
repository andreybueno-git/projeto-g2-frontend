<script lang="ts">
  import { onMount } from "svelte";
  import type { Tarefa } from "../tipos";
  import { listarTarefas } from "../lib/api";
  import CartaoTarefa from "../lib/componentes/CartaoTarefa.svelte";

  let tarefas = $state<Tarefa[]>([]);
  let carregando = $state(true);
  let erro = $state<string | null>(null);

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

  {#if carregando}
    <p>Carregando tarefas...</p>
  {:else if erro}
    <p role="alert">Não foi possível carregar as tarefas: {erro}</p>
  {:else}
    <ul class="lista">
      {#each tarefas as tarefa (tarefa.id)}
        <li><CartaoTarefa {tarefa} /></li>
      {/each}
    </ul>
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
    grid-template-columns: repeat(auto-fill, minmax(18rem, 1fr));
    gap: 1rem;
  }
</style>
