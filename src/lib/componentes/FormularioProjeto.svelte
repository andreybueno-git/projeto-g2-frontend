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
form { margin-top: 1.75rem; }
  fieldset { min-width: 0; border: 1px solid var(--linha); border-top: 3px solid var(--azul); border-radius: 2px; padding: 1.25rem 1.75rem 1.75rem; background: var(--superficie); box-shadow: 4px 4px 0 #dedfd7; }
  legend { padding: 0 .6rem; color: var(--azul-escuro); font-size: .73rem; font-weight: 750; text-transform: uppercase; letter-spacing: .075em; }
  label { display: block; margin: 1.2rem 0 .5rem; color: var(--tinta); font-size: .82rem; font-weight: 650; }
  input, textarea { display: block; width: 100%; min-height: 46px; padding: .7rem .8rem; font: inherit; font-size: .92rem; color: var(--tinta); background: #fcfcf8; border: 1px solid #8c919a; border-radius: 2px; }
  textarea { resize: vertical; min-height: 7rem; }
  input[aria-invalid='true'], textarea[aria-invalid='true'] { border-color: var(--erro); border-width: 2px; }
  .acoes { display: flex; align-items: center; flex-wrap: wrap; gap: 1.5rem; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid var(--linha); }
  .acoes a { font-size: .88rem; }
  button { min-height: 46px; padding: .7rem 1.25rem; font: inherit; font-size: .88rem; font-weight: 650; background: var(--tinta); color: var(--superficie); border: 1px solid var(--tinta); border-radius: 2px; box-shadow: 3px 3px 0 var(--ocre); cursor: pointer; }
  button:hover:not(:disabled) { background: var(--azul-escuro); }
  button:disabled { cursor: wait; opacity: .65; }
  .erro { margin: .5rem 0 0; color: var(--erro); font-size: .85rem; font-weight: 600; }
  @media (max-width: 640px) { fieldset { padding: 1rem; } }
</style>
