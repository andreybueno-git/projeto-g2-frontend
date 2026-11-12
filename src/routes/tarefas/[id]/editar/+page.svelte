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
  import { mensagemFalha } from "../../../../lib/utils/mensagemFalha";

  let tarefa = $state<Tarefa | null>(null);
  let carregando = $state(true);
  let erro = $state<string | null>(null);
  let enviando = $state(false);
  let erroEnvio = $state<string | null>(null);
  let salva = $state(false);

  // Busca de novo sempre que o id da URL muda.
  let tentativa = $state(0);
  let podeTentar = $state(false);

  $effect(() => {
    void tentativa;
    const id = page.params.id;
    if (!id) return;

    let ativo = true;
    tarefa = null;
    erro = null;
    podeTentar = false;
    carregando = true;

    buscarTarefa(id)
      .then((dados) => {
        if (ativo) tarefa = dados;
      })
      .catch((e) => {
        if (!ativo) return;
        podeTentar = !(e instanceof ErroApi && e.status === 404);
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
    if (!tarefa || enviando || salva) return;
    const id = tarefa.id;

    enviando = true;
    erroEnvio = null;
    try {
      await atualizarTarefa(id, dados);
      salva = true;
    } catch (e) {
      // O formulário continua montado, então o que foi digitado é mantido.
      erroEnvio = mensagemFalha(e, "salvar as alterações", true);
    } finally {
      enviando = false;
    }

    // Se a navegação falhar depois de salvar, o link abaixo leva à tarefa
    // e não aparece um erro de "não salvou" para algo que já foi salvo.
    if (salva) {
      try { await goto(`/tarefas/${encodeURIComponent(id)}`); } catch { /* o link permite continuar */ }
    }
  }
</script>

<svelte:head><title>Editar tarefa | Mentalista</title></svelte:head>

<main>
  <h1>Editar tarefa</h1>

  {#if carregando}
    <p role="status">Carregando tarefa...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
    {#if podeTentar}
      <button type="button" onclick={() => tentativa++}>Tentar novamente</button>
    {/if}
    <a href="/">Voltar para as tarefas</a>
  {:else if salva && tarefa}
    <p role="status">Alterações salvas. <a href="/tarefas/{encodeURIComponent(tarefa.id)}">Ver tarefa</a></p>
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
