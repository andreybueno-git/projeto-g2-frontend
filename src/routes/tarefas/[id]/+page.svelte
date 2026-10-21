<script lang="ts">
    import { page } from '$app/state';
    import { buscarTarefa } from '../../../lib/servicos/api';
    import type { Tarefa } from '../../../tipos';
  
    let tarefa = $state<Tarefa | null>(null);
    let erro = $state<string | null>(null);
  
    $effect(() => {
      const id = page.params.id;
      if (!id) return;
  
      let ativo = true;
      tarefa = null;
      erro = null;
  
      buscarTarefa(id)
        .then((dados) => {
          if (ativo) tarefa = dados;
        })
        .catch(() => {
          if (ativo) erro = 'Não foi possível carregar a tarefa.';
        });
  
      return () => {
        ativo = false;
      };
    });
  </script>
  
  {#if erro}
    <p role="alert">{erro}</p>
  {:else if tarefa}
    <h1>{tarefa.titulo}</h1>
  
    <p><strong>ID:</strong> {tarefa.id}</p>
    <p><strong>Projeto:</strong> {tarefa.projetoId}</p>
    <p><strong>Descrição:</strong> {tarefa.descricao}</p>
    <p><strong>Status:</strong> {tarefa.status}</p>
    <p><strong>Prioridade:</strong> {tarefa.prioridade}</p>
    <p><strong>Responsável:</strong> {tarefa.responsavel}</p>
    <p><strong>Prazo:</strong> {tarefa.prazo}</p>

    <p><a href="/tarefas/{tarefa.id}/editar">Editar tarefa</a></p>
  {:else}
    <p>Carregando tarefa...</p>
  {/if}
  
  <a href="/">Voltar para as tarefas</a>