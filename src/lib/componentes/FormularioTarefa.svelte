<script lang="ts">
  import { onMount, untrack } from "svelte";
  import type { NovaTarefa, Projeto, Status, Prioridade } from "../../tipos";
  import { listarProjetos } from "../servicos/api";
  import { ROTULOS_STATUS, ROTULOS_PRIORIDADE } from "../utils/rotulos";

  import { acessibilidadeFormulario } from "../utils/acessibilidadeFormulario";

  type Props = {
    // Valores de partida: vazio para criar, a tarefa atual para editar.
    // Na criação a partir de um projeto, passe só { projetoId }.
    valorInicial?: Partial<NovaTarefa>;
    textoEnvio?: string;
    enviando?: boolean;
    erro?: string | null;
    onenviar: (dados: NovaTarefa) => void;
  };

  let {
    valorInicial = {},
    textoEnvio = "Salvar",
    enviando = false,
    erro = null,
    onenviar
  }: Props = $props();

  // Os valores iniciais são lidos uma vez; depois o formulário é dono dos dados.
  let dados = $state<NovaTarefa>(
    untrack((): NovaTarefa => ({
      projetoId: "",
      titulo: "",
      descricao: "",
      status: "a-fazer",
      prioridade: "media",
      responsavel: "",
      prazo: "",
      ...valorInicial
    }))
  );

  const opcoesStatus = Object.keys(ROTULOS_STATUS) as Status[];
  const opcoesPrioridade = Object.keys(ROTULOS_PRIORIDADE) as Prioridade[];

  let projetos = $state<Projeto[]>([]);
  let carregandoProjetos = $state(true);
  let erroProjetos = $state<string | null>(null);

  // O seletor de projeto é carregado da API (só no navegador).
  onMount(async () => {
    try {
      projetos = await listarProjetos();
    } catch {
      erroProjetos = "Não foi possível carregar os projetos.";
    } finally {
      carregandoProjetos = false;
    }
  });

  function aoEnviar(evento: SubmitEvent) {
    evento.preventDefault();
    // Monta o objeto campo a campo para nunca enviar o id junto.
    onenviar({
      projetoId: dados.projetoId,
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      status: dados.status,
      prioridade: dados.prioridade,
      responsavel: dados.responsavel.trim(),
      prazo: dados.prazo
    });
  }
</script>

<form onsubmit={aoEnviar} use:acessibilidadeFormulario aria-busy={enviando}>
  <p>Os campos indicados como obrigatórios precisam ser preenchidos.</p>
  <div class="campo">
    <label for="tarefa-titulo">Título (obrigatório)</label>
    <input id="tarefa-titulo" type="text" bind:value={dados.titulo} required />
  </div>

  <div class="campo">
    <label for="tarefa-descricao">Descrição</label>
    <textarea id="tarefa-descricao" rows="4" bind:value={dados.descricao}></textarea>
  </div>

  <div class="campo">
    <label for="tarefa-projeto">Projeto (obrigatório)</label>
    <select
      id="tarefa-projeto"
      bind:value={dados.projetoId}
      required
      disabled={carregandoProjetos}
      aria-describedby={erroProjetos ? "tarefa-projetos-erro" : undefined}
    >
      {#if carregandoProjetos}
        <option value="">Carregando projetos...</option>
      {:else}
        <option value="">Selecione um projeto</option>
        {#each projetos as projeto (projeto.id)}
          <option value={projeto.id}>{projeto.nome}</option>
        {/each}
      {/if}
    </select>
    {#if erroProjetos}
      <p id="tarefa-projetos-erro" class="mensagem-erro" role="alert">{erroProjetos}</p>
    {/if}
  </div>

  <div class="linha">
    <div class="campo">
      <label for="tarefa-status">Status</label>
      <select id="tarefa-status" bind:value={dados.status}>
        {#each opcoesStatus as status (status)}
          <option value={status}>{ROTULOS_STATUS[status]}</option>
        {/each}
      </select>
    </div>

    <div class="campo">
      <label for="tarefa-prioridade">Prioridade</label>
      <select id="tarefa-prioridade" bind:value={dados.prioridade}>
        {#each opcoesPrioridade as prioridade (prioridade)}
          <option value={prioridade}>{ROTULOS_PRIORIDADE[prioridade]}</option>
        {/each}
      </select>
    </div>
  </div>

  <div class="linha">
    <div class="campo">
      <label for="tarefa-responsavel">Responsável (obrigatório)</label>
      <input
        id="tarefa-responsavel"
        type="text"
        bind:value={dados.responsavel}
        required
      />
    </div>

    <div class="campo">
      <label for="tarefa-prazo">Prazo (obrigatório)</label>
      <input id="tarefa-prazo" type="date" bind:value={dados.prazo} required />
    </div>
  </div>

  {#if erro}
    <p class="mensagem-erro" role="alert">{erro}</p>
  {/if}

  <button type="submit" disabled={enviando || carregandoProjetos}>
    {enviando ? "Salvando..." : textoEnvio}
  </button>
</form>

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 40rem;
  }
  .linha {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(14rem, 100%), 1fr));
    gap: 1rem;
  }
  .campo {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    min-width: 0;
  }
  label {
    font-size: 0.9rem;
    font-weight: 600;
  }
  input,
  select,
  textarea {
    width: 100%;
    padding: 0.55rem 0.7rem;
    border: 1px solid #8c959f;
    border-radius: 6px;
    background: #ffffff;
    color: #1f2328;
    font: inherit;
  }
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 1px;
  }
  button {
    align-self: flex-start;
    padding: 0.65rem 1.4rem;
    border: none;
    border-radius: 8px;
    background: #2563eb;
    color: #ffffff;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
  }
  button:disabled {
    background: #8c959f;
    cursor: not-allowed;
  }
  button:focus-visible {
    outline: 3px solid #1f2328;
    outline-offset: 2px;
  }
  form :global([data-erro-campo]),
  .mensagem-erro {
    margin: 0;
    color: #8b1e27;
    font-weight: 600;
  }
</style>
