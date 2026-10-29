<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import {
    buscarTarefa,
    atualizarTarefa,
    ErroApi
  } from "../../../../lib/servicos/api";
  import type { Tarefa, NovaTarefa } from "../../../../tipos";
  import FormularioTarefa from "../../../../lib/componentes/FormularioTarefa.svelte";

  let tarefa = $state<Tarefa | null>(null);
  let carregando = $state(true);
  let erro = $state<string | null>(null);
  let enviando = $state(false);
  let erroEnvio = $state<string | null>(null);

  // Busca de novo sempre que o id da URL muda.
  $effect(() => {
    const id = page.params.id;
    if (!id) return;

    let ativo = true;
    tarefa = null;
    erro = null;
    carregando = true;

    buscarTarefa(id)
      .then((dados) => {
        if (ativo) tarefa = dados;
      })
      .catch((e) => {
        if (!ativo) return;
        erro =
          e instanceof ErroApi && e.status === 404
            ? "Tarefa não encontrada."
            : "Não foi possível carregar a tarefa.";
      })
      .finally(() => {
        if (ativo) carregando = false;
      });

    return () => {
      ativo = false;
    };
  });

  async function salvar(dados: NovaTarefa) {
    if (!tarefa) return;

    enviando = true;
    erroEnvio = null;
    try {
      await atualizarTarefa(tarefa.id, dados);
      await goto(`/tarefas/${tarefa.id}`);
    } catch {
      erroEnvio = "Não foi possível salvar as alterações. Tente de novo.";
    } finally {
      enviando = false;
    }
  }
</script>

<main>
  <h1>Editar tarefa</h1>

  {#if carregando}
    <p>Carregando tarefa...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
    <a href="/">Voltar para as tarefas</a>
  {:else if tarefa}
    <FormularioTarefa
      valorInicial={tarefa}
      textoEnvio="Salvar alterações"
      {enviando}
      erro={erroEnvio}
      onenviar={salvar}
    />
    <p><a href="/tarefas/{tarefa.id}">Cancelar</a></p>
  {/if}
</main>

<style>
main { max-width: 54rem; margin: 0 auto; padding: 2.75rem 2rem 4rem; }
  h1 { margin-bottom: 1rem; }
  main > p { max-width: 40rem; color: var(--secundario); }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem 3rem; } }
</style>
