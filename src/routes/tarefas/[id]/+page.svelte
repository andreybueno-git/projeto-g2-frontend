<script lang="ts">
    import { page } from '$app/state';
    import { buscarTarefa, ErroApi } from '../../../lib/servicos/api';
    import type { Tarefa } from '../../../tipos';
  
    let tarefa = $state<Tarefa | null>(null);
    let carregando = $state(true);
    let erro = $state<string | null>(null);
  
    $effect(() => {
      const id = page.params.id;
  
      let ativo = true;
      tarefa = null;
      erro = null;
      carregando = true;

      if (!id) {
        erro = 'Tarefa não encontrada.';
        carregando = false;
        return;
      }
  
      buscarTarefa(id)
        .then((dados) => {
          if (ativo) tarefa = dados;
        })
        .catch((e) => {
          if (!ativo) return;
          erro = e instanceof ErroApi && e.status === 404
            ? 'Tarefa não encontrada.'
            : 'Não foi possível carregar a tarefa.';
        })
        .finally(() => {
          if (ativo) carregando = false;
        });
  
      return () => {
        ativo = false;
      };
    });
  </script>
  
<main>
  {#if carregando}
    <p role="status">Carregando tarefa...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
  {:else if tarefa}
    <h1>{tarefa.titulo}</h1>
  
    <div class="detalhes">
    <p><strong>ID:</strong> {tarefa.id}</p>
    <p><strong>Projeto:</strong> {tarefa.projetoId}</p>
    <p><strong>Descrição:</strong> {tarefa.descricao}</p>
    <p><strong>Status:</strong> {tarefa.status}</p>
    <p><strong>Prioridade:</strong> {tarefa.prioridade}</p>
    <p><strong>Responsável:</strong> {tarefa.responsavel}</p>
    <p><strong>Prazo:</strong> {tarefa.prazo}</p>

    <p><a href={`/tarefas/${encodeURIComponent(tarefa.id)}/editar`}>Editar tarefa</a></p>
    </div>
  {:else}
    <p role="alert">Não foi possível carregar a tarefa.</p>
  {/if}
  
  <a class="voltar" href="/">Voltar para as tarefas</a>
</main>

<style>
  main { max-width: 72rem; margin: 0 auto; padding: 3rem 2rem; }
  main::before { content: none; }
  .detalhes { max-width: 52rem; }
  .detalhes p { padding: .7rem 1rem; margin: 0; background: var(--superficie); border-bottom: 1px solid var(--linha); overflow-wrap: anywhere; }
  .voltar { display: inline-flex; margin-top: 1.5rem; }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem; } }
</style>
