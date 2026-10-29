
<script lang="ts">
  import { tick } from "svelte";
  import type { Tarefa, Status } from "../../tipos";
  import { atualizarTarefa } from "../servicos/api";
  import {
    ROTULOS_STATUS,
    ROTULOS_PRIORIDADE,
    formatarPrazo
  } from "../utils/rotulos";

  let { tarefa, onstatusalterado }: {
    tarefa: Tarefa;
    onstatusalterado?: (tarefa: Tarefa) => void;
  } = $props();
  let salvando = $state(false);
  let erroStatus = $state("");
  let avisoStatus = $state("");

  async function mudarStatus(evento: Event) {
    const seletor = evento.currentTarget as HTMLSelectElement;
    const status = seletor.value as Status;
    if (salvando || status === tarefa.status) return;
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
    <select id={`status-tarefa-${tarefa.id}`} value={tarefa.status} onchange={mudarStatus} disabled={salvando} aria-busy={salvando}>
      {#each Object.entries(ROTULOS_STATUS) as [valor, rotulo] (valor)}
        <option value={valor}>{rotulo}</option>
      {/each}
    </select>
    <span role="status">{salvando ? "Salvando..." : avisoStatus}</span>
    {#if erroStatus}<p class="erro-status" role="alert">{erroStatus}</p>{/if}
  </div>
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
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
  @media (max-width: 640px) { .cartao { padding: 1.1rem; } }
</style>
