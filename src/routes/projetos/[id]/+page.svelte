<script lang="ts">
  import { page } from "$app/state";
  import { buscarProjetoComTarefas, ErroApi } from "../../../lib/servicos/api";
  import type { ProjetoComTarefas } from "../../../lib/servicos/api";
  import { formatarPrazo } from "../../../lib/utils/rotulos";
  import CartaoTarefa from "../../../lib/componentes/CartaoTarefa.svelte";

  let projeto = $state<ProjetoComTarefas | null>(null);
  let carregando = $state(true);
  let erro = $state<string | null>(null);

  // Busca de novo sempre que o id da URL muda (ex.: /projetos/1 -> /projetos/2).
  $effect(() => {
    const id = page.params.id;
    if (!id) return;

    let ativo = true;
    projeto = null;
    erro = null;
    carregando = true;

    buscarProjetoComTarefas(id)
      .then((dados) => {
        if (ativo) projeto = dados;
      })
      .catch((e) => {
        if (!ativo) return;
        erro =
          e instanceof ErroApi && e.status === 404
            ? "Projeto não encontrado."
            : "Não foi possível carregar o projeto.";
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
  <a class="voltar" href="/projetos">← Voltar para os projetos</a>

  {#if carregando}
    <p>Carregando projeto...</p>
  {:else if erro}
    <p role="alert">{erro}</p>
  {:else if projeto}
    <header>
      <h1>{projeto.nome}</h1>
      <p class="descricao">{projeto.descricao}</p>
      <p><a href={`/projetos/${encodeURIComponent(projeto.id)}/editar`}>Editar projeto</a></p>
      <dl>
        <div>
          <dt>Disciplina</dt>
          <dd>{projeto.disciplina}</dd>
        </div>
        <div>
          <dt>Criado em</dt>
          <dd>{formatarPrazo(projeto.criadoEm)}</dd>
        </div>
        <div>
          <dt>Tarefas</dt>
          <dd>{projeto.tarefas.length}</dd>
        </div>
      </dl>
    </header>

    <section aria-labelledby="titulo-tarefas">
      <h2 id="titulo-tarefas">Tarefas do projeto</h2>
      <p><a href={`/tarefas/nova?projetoId=${encodeURIComponent(projeto.id)}`}>Nova tarefa neste projeto</a></p>

      {#if projeto.tarefas.length === 0}
        <p>Este projeto ainda não tem tarefas.</p>
      {:else}
        <ul class="lista">
          {#each projeto.tarefas as tarefa (tarefa.id)}
            <li>
              <a class="link-cartao" href="/tarefas/{tarefa.id}">
                <CartaoTarefa {tarefa} />
              </a>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</main>

<style>
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }
  .voltar {
    display: inline-block;
    margin-bottom: 1rem;
  }
  h1 {
    margin: 0 0 0.25rem;
  }
  .descricao {
    margin: 0 0 1rem;
  }
  dl {
    margin: 0 0 2rem;
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  dt {
    font-size: 0.75rem;
    opacity: 0.7;
  }
  dd {
    margin: 0;
  }
  .lista {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(18rem, 100%), 1fr));
    gap: 1rem;
  }
  .link-cartao {
    display: block;
    height: 100%;
    color: inherit;
    text-decoration: none;
  }
</style>
