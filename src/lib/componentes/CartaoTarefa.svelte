
<script lang="ts">
  import { onDestroy, tick } from "svelte";
  import type { Tarefa, Status } from "../../tipos";
  import { atualizarTarefa, excluirTarefa } from "../servicos/api";
  import {
    ROTULOS_STATUS,
    ROTULOS_PRIORIDADE,
    formatarPrazo
  } from "../utils/rotulos";

  let { tarefa, onstatusalterado, onexcluida }: {
    tarefa: Tarefa;
    onstatusalterado?: (tarefa: Tarefa) => void;
    onexcluida?: (tarefa: Tarefa) => void;
  } = $props();
  let salvando = $state(false);
  let erroStatus = $state("");
  let avisoStatus = $state("");
  let dialogo = $state<HTMLDialogElement>();
  let botaoExcluir = $state<HTMLButtonElement>();
  let botaoCancelar = $state<HTMLButtonElement>();
  let confirmando = $state(false);
  let excluindo = $state(false);
  let erroExclusao = $state("");
  let ativo = true;
  onDestroy(() => { ativo = false; });

  function pedirExclusao() {
    if (salvando || confirmando || excluindo || !dialogo) return;
    erroExclusao = "";
    confirmando = true;
    dialogo.showModal();
    botaoCancelar?.focus();
  }

  function cancelarExclusao() {
    if (!excluindo) dialogo?.close();
  }

  async function aoFecharConfirmacao() {
    confirmando = false;
    if (!excluindo) {
      await tick();
      botaoExcluir?.focus();
    }
  }

  async function confirmarExclusao() {
    if (excluindo || salvando || !confirmando) return;
    excluindo = true;
    erroExclusao = "";
    const excluida = tarefa;
    try {
      await excluirTarefa(excluida.id);
    } catch {
      if (!ativo) return;
      erroExclusao = "Não foi possível excluir a tarefa. Tente novamente.";
      excluindo = false;
      return;
    }

    // O histórico do navegador pode desmontar o cartão durante o DELETE.
    if (!ativo) return;
    const main = dialogo?.closest("main");
    dialogo?.close();
    // Só remove da tela depois que a API confirma a exclusão.
    onexcluida?.(excluida);
    await tick();
    // O botão que abriu a confirmação deixou de existir; mantém o foco
    // na busca ou no link para cadastrar outra tarefa quando a lista esvazia.
    if (main?.isConnected) {
      const destino = main.querySelector<HTMLElement>("#busca")
        ?? main.querySelector<HTMLElement>("a[href^='/tarefas/nova']");
      destino?.focus();
    }
  }

  async function mudarStatus(evento: Event) {
    const seletor = evento.currentTarget as HTMLSelectElement;
    const status = seletor.value as Status;
    if (salvando || confirmando || excluindo || status === tarefa.status) return;
    salvando = true;
    erroStatus = "";
    avisoStatus = "";
    try {
      const atualizada = await atualizarTarefa(tarefa.id, { status });
      // A tarefa vem do $state da tela. Atualiza o mesmo objeto para que
      // filtros e colunas sejam recalculados após a confirmação da API.
      Object.assign(tarefa, atualizada);
      avisoStatus = "Status salvo.";
      onstatusalterado?.(atualizada);
      await tick();
      // O quadro recria o cartão na coluna de destino. Conserva o foco;
      // se o filtro ocultar a tarefa, retorna à busca.
      const destino = document.getElementById(`status-tarefa-${tarefa.id}`)
        ?? document.getElementById("busca");
      destino?.focus();
    } catch {
      seletor.value = tarefa.status;
      erroStatus = "Não foi possível salvar o status. Tente novamente.";
    } finally {
      salvando = false;
    }
  }

  // Identifica o status pelo rótulo definido no projeto
  const classeStatus = (status: Tarefa["status"]) => {
    const rotulo = ROTULOS_STATUS[status]
      .toLowerCase()
      .trim();

    if (rotulo === "a fazer") return "afazer";
    if (rotulo === "em andamento") return "andamento";
    if (rotulo === "em revisão" || rotulo === "em revisao") {
      return "revisao";
    }
    if (rotulo === "concluída" || rotulo === "concluida") {
      return "concluida";
    }

    return "padrao";
  };
</script>

<article class="cartao">
  <h3><a href={`/tarefas/${encodeURIComponent(tarefa.id)}`}>{tarefa.titulo}</a></h3>

  <div class="selos">
    <!-- Status da tarefa -->
    <span class="selo status {classeStatus(tarefa.status)}">
      {ROTULOS_STATUS[tarefa.status]}
    </span>

    <!-- Prioridade da tarefa -->
    <span class="selo prioridade {tarefa.prioridade}">
      Prioridade {ROTULOS_PRIORIDADE[tarefa.prioridade].toLowerCase()}
    </span>
  </div>

  <dl>
    <div class="informacao">
      <dt>Responsável</dt>
      <dd>{tarefa.responsavel}</dd>
    </div>

    <div class="informacao">
      <dt>Prazo</dt>
      <dd>{formatarPrazo(tarefa.prazo)}</dd>
    </div>
  </dl>
  <div class="campo-status">
    <label for={`status-tarefa-${tarefa.id}`}>Mudar status<span class="sr-only"> de {tarefa.titulo}</span></label>
    <select id={`status-tarefa-${tarefa.id}`} value={tarefa.status} onchange={mudarStatus} disabled={salvando || confirmando || excluindo} aria-busy={salvando}>
      {#each Object.entries(ROTULOS_STATUS) as [valor, rotulo] (valor)}
        <option value={valor}>{rotulo}</option>
      {/each}
    </select>
    <span role="status">{salvando ? "Salvando..." : avisoStatus}</span>
    {#if erroStatus}<p class="erro-status" role="alert">{erroStatus}</p>{/if}
  </div>
  {#if onexcluida}
    <button bind:this={botaoExcluir} class="excluir" type="button" onclick={pedirExclusao} disabled={salvando || confirmando || excluindo}>
      Excluir tarefa<span class="sr-only"> {tarefa.titulo}</span>
    </button>
    <dialog
      bind:this={dialogo}
      aria-labelledby={`excluir-titulo-${tarefa.id}`}
      aria-describedby={`excluir-descricao-${tarefa.id}`}
      oncancel={(evento) => { if (excluindo) evento.preventDefault(); }}
      onclose={aoFecharConfirmacao}
    >
      <h2 id={`excluir-titulo-${tarefa.id}`}>Excluir tarefa?</h2>
      <p id={`excluir-descricao-${tarefa.id}`}>A tarefa <strong>{tarefa.titulo}</strong> será excluída. Esta ação não pode ser desfeita.</p>
      {#if erroExclusao}<p class="erro-status" role="alert">{erroExclusao}</p>{/if}
      <p class="andamento-exclusao" role="status">{excluindo ? "Excluindo tarefa..." : ""}</p>
      <div class="acoes-exclusao">
        <button bind:this={botaoCancelar} type="button" onclick={cancelarExclusao} disabled={excluindo}>Cancelar</button>
        <button class="confirmar-exclusao" type="button" onclick={confirmarExclusao} disabled={excluindo}>
          {excluindo ? "Excluindo..." : "Excluir tarefa"}
        </button>
      </div>
    </dialog>
  {/if}
</article>

<style>
.cartao { position: relative; display: flex; flex-direction: column; height: 100%; min-width: 0; border: 1px solid var(--linha); border-radius: 2px; padding: 1.25rem; background: var(--superficie); color: var(--tinta); box-shadow: 3px 3px 0 #dedfd7; overflow-wrap: anywhere; transition: border-color .15s ease, box-shadow .15s ease; }
  .cartao:hover { border-color: #858b9b; box-shadow: 3px 3px 0 #cbd2e5; }
  .cartao::before { content: ''; position: absolute; top: -1px; left: -1px; width: 38px; height: 3px; background: var(--azul); }
  h3 { margin: 0 0 1rem; font-size: 1.02rem; font-weight: 700; line-height: 1.45; letter-spacing: -.015em; }
  h3 a { color: inherit; text-decoration: none; }
  h3 a:hover { color: var(--azul-escuro); text-decoration: underline; }
  .selos { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem; margin-bottom: 1.25rem; }
  .selo { display: inline-flex; align-items: center; gap: .35rem; max-width: 100%; padding: .2rem .5rem; border: 1px solid var(--linha); border-radius: 2px; font-size: .69rem; font-weight: 650; line-height: 1.5; overflow-wrap: anywhere; }
  .status::before { content: ''; flex-shrink: 0; width: 5px; height: 5px; background: currentColor; border-radius: 50%; }
  .status.afazer, .status.padrao { background: #edede8; border-color: #bcbeb8; color: #50535b; }
  .status.andamento { background: var(--azul-claro); border-color: #a9b6db; color: #354b89; }
  .status.revisao { background: #f7edcf; border-color: #d7bd79; color: #725517; }
  .status.concluida { background: #e8eeea; border-color: #a4bbad; color: #345b45; }
  .prioridade { background: transparent; }
  .prioridade.alta { border-color: #d7b0ac; color: #8a3834; }
  .prioridade.media { border-color: #d2bd86; color: #70571e; }
  .prioridade.baixa { border-color: #b7c6bc; color: #45634f; }
  dl { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: .8rem; margin: 0 0 1.1rem; }
  .informacao { min-width: 0; }
  dt { margin-bottom: .35rem; font-size: .65rem; color: var(--secundario); letter-spacing: .06em; text-transform: uppercase; font-weight: 650; }
  dd { margin: 0; font-size: .82rem; line-height: 1.5; }
  .campo-status { display: grid; gap: .45rem; margin-top: auto; padding-top: .9rem; border-top: 1px solid #e1e2dc; }
  .campo-status label { font-size: .72rem; color: var(--secundario); font-weight: 600; }
  select { width: 100%; min-height: 44px; padding: .55rem .65rem; font: inherit; font-size: .82rem; background: #f8f8f3; color: var(--tinta); border: 1px solid #8c919a; border-radius: 2px; }
  select:disabled { cursor: wait; opacity: .65; }
  .campo-status span[role='status'] { font-size: .75rem; color: #345b45; }
  .erro-status { color: var(--erro); margin: 0; font-size: .8rem; }
  button { min-height: 44px; padding: .55rem .8rem; border: 1px solid var(--linha); border-radius: 2px; background: var(--superficie); color: var(--tinta); font: inherit; font-size: .82rem; cursor: pointer; }
  button:disabled { cursor: wait; opacity: .65; }
  button:not(:disabled):hover { background: var(--papel); }
  .excluir { margin-top: .75rem; color: var(--erro); border-color: #d7b0ac; }
  dialog { width: min(28rem, calc(100% - 2rem)); max-height: calc(100% - 2rem); padding: 1.5rem; border: 1px solid var(--tinta); border-top: 4px solid var(--erro); border-radius: 2px; background: var(--superficie); color: var(--tinta); box-shadow: 6px 6px 0 #1a1c2133; overflow-wrap: anywhere; }
  dialog::backdrop { background: #1a1c2199; }
  dialog h2 { margin: 0 0 1rem; font-size: 1.4rem; }
  dialog p { font-size: .92rem; }
  .andamento-exclusao:empty { margin: 0; }
  .acoes-exclusao { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .75rem; margin-top: 1.5rem; }
  .confirmar-exclusao { background: var(--erro); color: var(--superficie); border-color: var(--erro); }
  .confirmar-exclusao:not(:disabled):hover { background: #6f242b; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 640px) { .cartao { padding: 1.1rem; } }
</style>
