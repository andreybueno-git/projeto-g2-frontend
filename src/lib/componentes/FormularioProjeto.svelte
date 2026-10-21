<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import type { CamposProjeto } from '../utils/projetos';

  type Props = {
    inicial: CamposProjeto;
    rotuloSalvar: string;
    hrefCancelar: string;
    // Grava os dados e devolve o endereço para onde ir depois de salvar.
    aoSalvar: (dados: CamposProjeto) => Promise<string>;
  };

  let { inicial, rotuloSalvar, hrefCancelar, aoSalvar }: Props = $props();

  // A página que usa este formulário o recria (com {#key}) quando o projeto muda,
  // então copiar o valor inicial uma única vez é intencional.
  let dados = $state<CamposProjeto>(untrack(() => ({ ...inicial })));

  let erros = $state<Partial<Record<keyof CamposProjeto, string>>>({});
  let erroSalvar = $state<string | null>(null);
  let salvando = $state(false);
  let salvo = $state(false);
  let destino = $state('/projetos');
  let paginaAtiva = true;

  onDestroy(() => { paginaAtiva = false; });

  // Devolve os dados sem espaços nas pontas, ou null se algum campo estiver vazio.
  function validar(): CamposProjeto | null {
    const limpo: CamposProjeto = {
      nome: dados.nome.trim(),
      descricao: dados.descricao.trim(),
      disciplina: dados.disciplina.trim()
    };
    const novosErros: Partial<Record<keyof CamposProjeto, string>> = {};
    if (!limpo.nome) novosErros.nome = 'Informe o nome do projeto.';
    if (!limpo.descricao) novosErros.descricao = 'Informe a descrição do projeto.';
    if (!limpo.disciplina) novosErros.disciplina = 'Informe a disciplina.';
    erros = novosErros;
    return Object.keys(novosErros).length === 0 ? limpo : null;
  }

  async function enviar(evento: SubmitEvent) {
    evento.preventDefault();
    if (salvando || salvo) return;

    const limpo = validar();
    if (!limpo) return;

    salvando = true;
    erroSalvar = null;
    try {
      destino = await aoSalvar(limpo);
      salvo = true;
    } catch {
      erroSalvar = 'Não foi possível salvar o projeto. Seus dados foram mantidos. Tente novamente.';
    } finally {
      salvando = false;
    }

    // Se a navegação falhar depois de salvar, o link de sucesso leva ao projeto
    // e ninguém precisa salvar duas vezes.
    if (salvo && paginaAtiva) {
      try { await goto(destino); } catch { /* o link abaixo permite continuar */ }
    }
  }
</script>

{#if salvo}
  <p role="status">Projeto salvo com sucesso. <a href={destino}>Continuar</a></p>
{:else}
  <form onsubmit={enviar} novalidate aria-busy={salvando}>
    <fieldset disabled={salvando}>
      <legend>Dados do projeto</legend>

      <label for="nome">Nome</label>
      <input
        id="nome"
        bind:value={dados.nome}
        required
        aria-invalid={erros.nome ? 'true' : undefined}
        aria-describedby={erros.nome ? 'erro-nome' : undefined}
      />
      {#if erros.nome}<p class="erro" id="erro-nome" role="alert">{erros.nome}</p>{/if}

      <label for="descricao">Descrição</label>
      <textarea
        id="descricao"
        bind:value={dados.descricao}
        rows="4"
        required
        aria-invalid={erros.descricao ? 'true' : undefined}
        aria-describedby={erros.descricao ? 'erro-descricao' : undefined}
      ></textarea>
      {#if erros.descricao}<p class="erro" id="erro-descricao" role="alert">{erros.descricao}</p>{/if}

      <label for="disciplina">Disciplina</label>
      <input
        id="disciplina"
        bind:value={dados.disciplina}
        required
        aria-invalid={erros.disciplina ? 'true' : undefined}
        aria-describedby={erros.disciplina ? 'erro-disciplina' : undefined}
      />
      {#if erros.disciplina}<p class="erro" id="erro-disciplina" role="alert">{erros.disciplina}</p>{/if}

      {#if erroSalvar}<p class="erro" role="alert">{erroSalvar}</p>{/if}
      <div class="acoes">
        <button type="submit">{salvando ? 'Salvando...' : rotuloSalvar}</button>
        <a href={hrefCancelar}>Cancelar</a>
      </div>
      {#if salvando}<p role="status">Salvando projeto...</p>{/if}
    </fieldset>
  </form>
{/if}

<style>
  form { margin-top: 1.5rem; }
  fieldset { min-width: 0; border: 1px solid #cbd5e1; border-radius: 0.5rem; padding: 1.25rem; }
  legend { padding: 0 0.4rem; font-weight: 700; }
  label { display: block; margin: 1rem 0 0.35rem; font-weight: 600; }
  input, textarea { display: block; width: 100%; min-height: 2.75rem; padding: 0.65rem; font: inherit; color: #0f172a; background: #fff; border: 1px solid #64748b; border-radius: 0.35rem; }
  input[aria-invalid='true'], textarea[aria-invalid='true'] { border-color: #991b1b; border-width: 2px; }
  textarea { resize: vertical; }
  .acoes { display: flex; align-items: center; flex-wrap: wrap; gap: 1.25rem; margin-top: 1.5rem; }
  button { padding: 0.75rem 1rem; font: inherit; font-weight: 600; background: #2563eb; color: #fff; border: 0; border-radius: 0.4rem; cursor: pointer; }
  button:hover { background: #1d4ed8; }
  button:disabled { cursor: wait; opacity: 0.7; }
  :is(input, textarea, button):focus-visible { outline: 3px solid #2563eb; outline-offset: 3px; }
  .erro { margin: 0.35rem 0 0; color: #991b1b; }
  @media (max-width: 480px) { fieldset { padding: 1rem; } }
</style>
