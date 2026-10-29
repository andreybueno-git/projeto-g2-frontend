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
  let avisoStatus = $state("");
</script>

<main>
  <p role="status">{avisoStatus}</p>
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
              <CartaoTarefa {tarefa} onstatusalterado={(atualizada) => { avisoStatus = `${atualizada.titulo}: status atualizado.`; }} />
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  {/if}
</main>

<style>
main { max-width: 88rem; margin: 0 auto; padding: 2.75rem 2rem 4rem; }
  .voltar { display: inline-flex; margin-bottom: 1.5rem; font-size: .85rem; }
  header { margin-bottom: 2.5rem; padding-bottom: 1.75rem; border-bottom: 2px solid var(--tinta); }
  h1 { margin: .5rem 0 1rem; }
  .descricao { max-width: 44rem; margin: 0 0 1rem; color: var(--secundario); overflow-wrap: anywhere; }
  dl { margin: 1.75rem 0 0; display: flex; flex-wrap: wrap; gap: 1.25rem 3rem; }
  dl > div { min-width: 0; max-width: 100%; border-left: 3px solid var(--azul); padding-left: 1rem; overflow-wrap: anywhere; }
  dt { margin-bottom: .4rem; font-size: .7rem; color: var(--secundario); font-weight: 650; text-transform: uppercase; letter-spacing: .06em; }
  dd { margin: 0; font-size: .92rem; font-weight: 600; }
  h2 { font-size: 1.5rem; margin: 0 0 1rem; }
  section > p { margin-bottom: 1.5rem; }
  .lista { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(20rem, 100%), 1fr)); gap: 1.25rem; }
  .lista li { min-width: 0; }
  @media (max-width: 640px) { main { padding: 1.5rem 1rem 3rem; } }
</style>
